<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Verification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        // Add debugging
        \Log::info('🔔 USER REGISTRATION REQUEST RECEIVED');
        \Log::info('📝 Request data:', $request->all());
        \Log::info('🌐 Request IP: ' . $request->ip());
        \Log::info('👤 User Agent: ' . $request->userAgent());

        try {
            $request->validate([
                'name' => 'required|string|max:255',
                'first_name' => 'nullable|string|max:255',
                'last_name' => 'nullable|string|max:255',
                'email' => 'required|string|email|max:255|unique:users',
                'password' => 'required|string|min:8|confirmed',
                'role' => 'required|in:pet_owner,pet_sitter',
                'phone' => 'nullable|string|max:20',
                'address' => 'nullable|string|max:500',
                'gender' => 'nullable|in:male,female,other',
                'age' => 'nullable|integer|min:1|max:120',
                'experience' => 'nullable|string|max:500',
                'hourly_rate' => 'nullable|numeric|min:0|max:999999.99',
                'pet_breeds' => 'nullable|array',
                'specialties' => 'nullable|array',
                'selected_pet_types' => 'nullable|array',
                'bio' => 'nullable|string|max:1000',
                // ID verification fields (required for pet sitters)
                'id_type' => 'nullable|string',
                'id_number' => 'nullable|string',
                'id_image' => 'nullable|image|mimes:jpeg,png,jpg|max:5120',
            ]);

            \Log::info('✅ Validation passed successfully');

            // Generate phone verification code only
            $phoneVerificationCode = str_pad(random_int(0, 9999), 4, '0', STR_PAD_LEFT);

            $user = User::create([
                'name' => $request->name,
                'first_name' => $request->first_name,
                'last_name' => $request->last_name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'role' => $request->role,
                'status' => $request->role === 'pet_sitter' ? 'pending_verification' : 'pending',
                'phone' => $request->phone,
                'address' => $request->address,
                'gender' => $request->gender,
                'age' => $request->age,
                'experience' => $request->experience,
                'hourly_rate' => $request->hourly_rate,
                'pet_breeds' => $request->pet_breeds,
                'specialties' => $request->specialties,
                'selected_pet_types' => $request->selected_pet_types,
                'bio' => $request->bio,
                'phone_verification_code' => $phoneVerificationCode,
                'email_verified_at' => now(), // Auto-verify email
                'phone_verified_at' => null,
            ]);

            \Log::info('✅ User created successfully - ID: ' . $user->id);

            // Handle ID verification for pet sitters
            if ($request->role === 'pet_sitter' && $request->filled(['id_type', 'id_number']) && $request->hasFile('id_image')) {
                $this->submitIdVerification($request, $user);
            }

            // Phone verification is handled separately in the new flow
            // No need to send verification code automatically during registration

            $token = $user->createToken('mobile-app')->plainTextToken;

            $response = [
                'success' => true,
                'message' => $request->role === 'pet_sitter' 
                    ? 'Registration successful! Please verify your phone number, then complete ID verification to start accepting bookings.'
                    : 'Registration successful! Please verify your phone number to complete your account setup.',
                'user' => $this->buildUserProfile($user),
                'token' => $token,
                'verification_required' => [
                    'email' => false, // Email is auto-verified
                    'phone' => !empty($user->phone),
                    'id_verification' => $request->role === 'pet_sitter',
                ]
            ];

            \Log::info('✅ Registration response prepared:', $response);
            \Log::info('🎉 USER REGISTRATION COMPLETED SUCCESSFULLY');

            return response()->json($response, 201);

        } catch (ValidationException $e) {
            \Log::error('❌ Validation failed:', $e->errors());
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('❌ Registration error:', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Registration failed: ' . $e->getMessage()
            ], 500);
        }
    }

    private function submitIdVerification(Request $request, User $user)
    {
        // Validate Philippine ID patterns
        $philippineIdPatterns = [
            'ph_national_id' => '/^\d{4}-\d{7}-\d{1}$/',
            'ph_drivers_license' => '/^[A-Z]\d{2}-\d{2}-\d{6}$/',
            'sss_id' => '/^\d{2}-\d{7}-\d{1}$/',
            'tin_id' => '/^\d{3}-\d{3}-\d{3}-\d{3}$/',
            'philhealth_id' => '/^\d{2}-\d{9}-\d{1}$/',
            'voters_id' => '/^\d{4}-\d{4}-\d{4}-\d{4}$/',
            'postal_id' => '/^[A-Z]{3}\d{7}$/',
            'prc_id' => '/^\d{7}$/',
            'umid' => '/^\d{4}-\d{7}-\d{1}$/',
            'owwa_id' => '/^[A-Z]{2}\d{8}$/',
        ];

        $idType = $request->id_type;
        $idNumber = $request->id_number;

        // Validate ID format if it's a Philippine ID
        if (array_key_exists($idType, $philippineIdPatterns)) {
            $pattern = $philippineIdPatterns[$idType];
            if (!preg_match($pattern, $idNumber)) {
                throw ValidationException::withMessages([
                    'id_number' => ['Invalid ID number format for the selected document type.'],
                ]);
            }
        }

        // Handle file upload
        $documentImage = null;
        if ($request->hasFile('id_image')) {
            $file = $request->file('id_image');
            $filename = 'verification_' . $user->id . '_' . time() . '.' . $file->getClientOriginalExtension();
            $path = $file->storeAs('public/verifications', $filename);
            $documentImage = asset('storage/verifications/' . basename($path));
        }

        $isPhilippineId = array_key_exists($idType, $philippineIdPatterns);

        // Create verification record
        Verification::create([
            'user_id' => $user->id,
            'document_type' => $idType,
            'document_number' => $idNumber,
            'document_image' => $documentImage,
            'status' => 'pending',
            'is_philippine_id' => $isPhilippineId,
            'verification_method' => 'mobile_upload',
        ]);
    }



    public function verifyPhone(Request $request)
    {
        $request->validate([
            'verification_code' => 'required|string|size:4',
        ]);

        $user = $request->user();

        if ($user->phone_verification_code !== $request->verification_code) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid verification code.',
            ], 400);
        }

        $user->update([
            'phone_verified_at' => now(),
            'phone_verification_code' => null,
        ]);

        // Check if user can be activated
        $this->checkAndUpdateUserStatus($user);

        return response()->json([
            'success' => true,
            'message' => 'Phone number verified successfully!',
            'user' => [
                'id' => $user->id,
                'phone_verified' => true,
                'status' => $user->fresh()->status,
            ]
        ]);
    }

    public function resendVerificationCode(Request $request)
    {
        $request->validate([
            'type' => 'required|in:phone',
        ]);

        $user = $request->user();
        
        if ($request->type === 'phone' && $user->phone_verified_at) {
            return response()->json([
                'success' => false,
                'message' => 'Phone number is already verified.',
            ], 400);
        }

        // Generate new phone verification code
        $code = str_pad(random_int(0, 9999), 4, '0', STR_PAD_LEFT);
        $user->update(['phone_verification_code' => $code]);
        \Log::info("📱 RESEND PHONE VERIFICATION CODE: {$code}");
        \Log::info("📱 RESEND PHONE VERIFICATION CODE: {$code}");
        \Log::info("📱 RESEND PHONE VERIFICATION CODE: {$code}");
        \Log::info("📱 Use this code to verify phone: {$user->phone}");
        
        // Log to dedicated verification codes file
        $timestamp = now()->format('Y-m-d H:i:s');
        \Log::channel('verification')->info("🔢 RESEND VERIFICATION CODE FOR {$user->phone}: {$code}");
        \Log::channel('verification')->info("⏰ Generated at: {$timestamp}");
        \Log::channel('verification')->info("📱 Phone: {$user->phone}");
        \Log::channel('verification')->info("🔄 Type: Resend Code");
        \Log::channel('verification')->info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

        // Simulate SMS sending
        \Log::info("🎭 SMS SIMULATION (resend) to {$user->phone}: Your Petsit Connect verification code is: {$code}");
        \Log::info("✅ SMS SIMULATION COMPLETED SUCCESSFULLY");

        return response()->json([
            'success' => true,
            'message' => 'Verification code sent successfully!',
            'debug_code' => $code,
            'note' => 'Using simulation mode for development',
            'simulation_mode' => true,
        ]);
    }

    private function checkAndUpdateUserStatus(User $user)
    {
        $user = $user->fresh();
        
        if ($user->role === 'pet_owner') {
            // Pet owners only need phone verification (email is auto-verified)
            $hasPhoneVerified = $user->phone_verified_at !== null || empty($user->phone);
            if ($hasPhoneVerified) {
                $user->update(['status' => 'active']);
            }
        } elseif ($user->role === 'pet_sitter') {
            // Pet sitters need phone + ID verification (email is auto-verified)
            $hasPhoneVerified = $user->phone_verified_at !== null || empty($user->phone);
            
            $idVerification = Verification::where('user_id', $user->id)
                ->where('status', 'approved')
                ->first();
            
            if ($hasPhoneVerified && $idVerification) {
                $user->update(['status' => 'active']);
                
                // Award verification badges
                $this->awardVerificationBadges($idVerification);
            } elseif ($hasPhoneVerified) {
                $user->update(['status' => 'pending_id_verification']);
            }
        }
    }

    private function awardVerificationBadges(Verification $verification)
    {
        $badges = [];
        
        if ($verification->is_philippine_id && $verification->status === 'approved') {
            $badges[] = [
                'id' => 'verified_filipino',
                'name' => 'Verified Filipino',
                'description' => 'Verified with Philippine government ID',
                'icon' => 'flag',
                'color' => '#0038A8',
                'earned_at' => now()->toISOString(),
            ];
        }

        $badges[] = [
            'id' => 'identity_verified',
            'name' => 'Identity Verified',
            'description' => 'Government-issued ID verified',
            'icon' => 'shield-checkmark',
            'color' => '#10B981',
            'earned_at' => now()->toISOString(),
        ];

        if (!empty($badges)) {
            $verification->update(['badges_earned' => json_encode($badges)]);
        }
    }

    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid credentials.',
            ], 401);
        }

        // Check if user account is active
        if ($user->status === 'banned') {
            return response()->json([
                'success' => false,
                'message' => 'Your account has been suspended. Please contact support.',
            ], 403);
        }

        $token = $user->createToken('mobile-app')->plainTextToken;

        // Get verification status
        $verificationStatus = $this->getVerificationStatus($user);

        return response()->json([
            'success' => true,
            'message' => 'Login successful!',
            'user' => $this->buildUserProfile($user),
            'token' => $token,
            'verification_status' => $verificationStatus,
        ]);
    }

    private function buildUserProfile(User $user)
    {
        // Base profile fields for all users
        $profile = [
            'id' => $user->id,
            'name' => $user->name,
            'first_name' => $user->first_name,
            'last_name' => $user->last_name,
            'email' => $user->email,
            'role' => $user->role,
            'status' => $user->status,
            'phone' => $user->phone,
            'address' => $user->address,
            'gender' => $user->gender,
            'age' => $user->age,
            'bio' => $user->bio,
            'profile_image' => $user->profile_image,
            'email_verified' => $user->email_verified_at !== null,
            'phone_verified' => $user->phone_verified_at !== null,
        ];

        // Add role-specific fields
        if ($user->role === 'pet_sitter') {
            // Pet sitter specific fields
            $profile['experience'] = $user->experience;
            $profile['hourly_rate'] = $user->hourly_rate;
            $profile['specialties'] = $user->specialties;
            $profile['selected_pet_types'] = $user->selected_pet_types;
            $profile['pet_breeds'] = $user->pet_breeds;
        } else {
            // Pet owner specific fields (no sitter-specific fields)
            $profile['pet_breeds'] = $user->pet_breeds; // Pet owners can have pet breeds they own
        }

        return $profile;
    }

    private function getVerificationStatus(User $user)
    {
        $status = [
            'email_verified' => $user->email_verified_at !== null,
            'phone_verified' => $user->phone_verified_at !== null,
            'id_verification_status' => 'not_required',
            'can_accept_bookings' => $user->status === 'active',
            'next_steps' => [],
        ];

        if ($user->role === 'pet_sitter') {
            $idVerification = Verification::where('user_id', $user->id)
                ->orderBy('created_at', 'desc')
                ->first();

            if ($idVerification) {
                $status['id_verification_status'] = $idVerification->status;
            } else {
                $status['id_verification_status'] = 'not_submitted';
            }

            // Determine next steps (email is auto-verified)
            if (!$status['phone_verified'] && !empty($user->phone)) {
                $status['next_steps'][] = 'Verify your phone number';
            }
            if ($status['id_verification_status'] === 'not_submitted') {
                $status['next_steps'][] = 'Submit ID verification';
            } elseif ($status['id_verification_status'] === 'pending') {
                $status['next_steps'][] = 'Wait for ID verification approval';
            } elseif ($status['id_verification_status'] === 'rejected') {
                $status['next_steps'][] = 'Resubmit ID verification';
            }
        }

        return $status;
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully!',
        ]);
    }

    public function user(Request $request)
    {
        $user = $request->user();
        $verificationStatus = $this->getVerificationStatus($user);

        return response()->json([
            'success' => true,
            'user' => $this->buildUserProfile($user),
            'verification_status' => $verificationStatus,
        ]);
    }

    public function sendPhoneVerificationCode(Request $request)
    {
        // Add CORS headers
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
        header('Access-Control-Allow-Credentials: true');
        
        // Handle preflight OPTIONS request
        if ($request->isMethod('OPTIONS')) {
            return response()->json(['success' => true], 200);
        }
        
        $request->validate([
            'phone' => 'required|string|max:20',
        ]);

        $phone = $request->phone;
        $timestamp = now()->format('Y-m-d H:i:s');
        
        // Enhanced logging for phone verification simulation
        \Log::info("🔔 PHONE VERIFICATION SIMULATION STARTED");
        \Log::info("📱 SEND SMS - Received phone verification request for: " . $phone);
        \Log::info("⏰ Timestamp: " . $timestamp);
        \Log::info("🌐 Request IP: " . $request->ip());
        \Log::info("👤 User Agent: " . $request->userAgent());

        // Generate a 6-digit verification code
        $verificationCode = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        
        // Create cache key with original phone number
        $cacheKey = "phone_verification_{$phone}";
        
        // Store the code in cache for verification (expires in 10 minutes)
        \Cache::put($cacheKey, $verificationCode, 600);
        
        \Log::info("📱 SEND SMS - Stored code in cache with key: {$cacheKey}");
        \Log::info("📱 SEND SMS - Generated code: {$verificationCode}");
        \Log::info("⏳ Cache expiration: 10 minutes from now");
        
        // Make the verification code very visible in logs
        \Log::info("🔢 PHONE VERIFICATION CODE: {$verificationCode}");
        \Log::info("🔢 PHONE VERIFICATION CODE: {$verificationCode}");
        \Log::info("🔢 PHONE VERIFICATION CODE: {$verificationCode}");
        \Log::info("📱 Use this code to verify phone: {$phone}");
        
        // Log to dedicated verification codes file
        \Log::channel('verification')->info("🔢 VERIFICATION CODE FOR {$phone}: {$verificationCode}");
        \Log::channel('verification')->info("⏰ Generated at: {$timestamp}");
        \Log::channel('verification')->info("📱 Phone: {$phone}");
        \Log::channel('verification')->info("🔑 Cache Key: {$cacheKey}");
        \Log::channel('verification')->info("⏳ Expires in: 10 minutes");
        \Log::channel('verification')->info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

        // Format phone number for display
        $formattedPhone = $this->formatPhoneForSMS($phone);
        \Log::info("📞 Original phone: {$phone}");
        \Log::info("📞 Formatted phone: {$formattedPhone}");
        
        // Send SMS using simulation mode only
        try {
            // Simulate SMS sending with a small delay
            usleep(500000); // 0.5 second delay to simulate SMS processing
            
            \Log::info("🎭 SMS SIMULATION to {$phone}: Your Petsit Connect verification code is: {$verificationCode}");
            \Log::info("✅ SMS SIMULATION COMPLETED SUCCESSFULLY");
            
            return response()->json([
                'success' => true,
                'message' => 'Verification code sent successfully!',
                'debug_code' => $verificationCode,
                'note' => 'Using simulation mode for development',
                'simulation_mode' => true,
                'timestamp' => $timestamp,
            ]);
        } catch (\Exception $e) {
            \Log::info("🎭 SMS SIMULATION (fallback) to {$phone}: Your Petsit Connect verification code is: {$verificationCode}");
            \Log::info("✅ SMS SIMULATION COMPLETED SUCCESSFULLY");
            
            // Return success with simulation mode
            return response()->json([
                'success' => true,
                'message' => 'Verification code sent successfully! (Development mode)',
                'debug_code' => $verificationCode,
                'note' => 'SMS service unavailable - using simulation mode',
                'simulation_mode' => true,
                'timestamp' => $timestamp,
            ]);
        }
    }

    public function verifyPhoneCode(Request $request)
    {
        // Add CORS headers
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
        header('Access-Control-Allow-Credentials: true');
        
        // Handle preflight OPTIONS request
        if ($request->isMethod('OPTIONS')) {
            return response()->json(['success' => true], 200);
        }
        
        $request->validate([
            'phone' => 'required|string|max:20',
            'code' => 'required|string|size:6',
        ]);

        $phone = $request->phone;
        $code = $request->code;
        $timestamp = now()->format('Y-m-d H:i:s');
        
        // Enhanced logging for phone verification simulation
        \Log::info("🔔 PHONE VERIFICATION CODE VERIFICATION STARTED");
        \Log::info("📱 VERIFY SMS - Received verification request for phone: {$phone}");
        \Log::info("📱 VERIFY SMS - Received code: {$code}");
        \Log::info("⏰ Timestamp: " . $timestamp);
        \Log::info("🌐 Request IP: " . $request->ip());
        \Log::info("👤 User Agent: " . $request->userAgent());

        // Get the stored verification code using the same cache key format
        $cacheKey = "phone_verification_{$phone}";
        $storedCode = \Cache::get($cacheKey);
        
        \Log::info("📱 VERIFY SMS - Cache key used: {$cacheKey}");
        \Log::info("📱 VERIFY SMS - Stored code found: " . ($storedCode ? $storedCode : 'NULL'));
        \Log::info("🔍 Code comparison: Expected='{$storedCode}' vs Received='{$code}'");
        
        if (!$storedCode) {
            \Log::error("❌ VERIFY SMS - No stored code found for phone: {$phone}");
            \Log::error("🔍 Possible reasons: Code expired, wrong phone number, or cache cleared");
            return response()->json([
                'success' => false,
                'message' => 'Verification code expired or not found.',
                'simulation_mode' => true,
                'timestamp' => $timestamp,
            ], 400);
        }

        if ($storedCode !== $code) {
            \Log::error("❌ VERIFY SMS - Code mismatch. Expected: {$storedCode}, Received: {$code}");
            \Log::error("🔍 Verification failed - codes do not match");
            return response()->json([
                'success' => false,
                'message' => 'Invalid verification code.',
                'simulation_mode' => true,
                'timestamp' => $timestamp,
            ], 400);
        }

        // Clear the stored code
        \Cache::forget($cacheKey);
        \Log::info("✅ VERIFY SMS - Code verified successfully for phone: {$phone}");
        \Log::info("🧹 Cache cleared for key: {$cacheKey}");
        \Log::info("🎉 PHONE VERIFICATION COMPLETED SUCCESSFULLY");

        return response()->json([
            'success' => true,
            'message' => 'Phone number verified successfully!',
        ]);
    }

    private function formatPhoneForSMS($phone)
    {
        // Remove any non-digit characters except +
        $phone = preg_replace('/[^0-9+]/', '', $phone);
        
        // Ensure it starts with +
        if (!str_starts_with($phone, '+')) {
            $phone = '+' . $phone;
        }
        
        return $phone;
    }
} 