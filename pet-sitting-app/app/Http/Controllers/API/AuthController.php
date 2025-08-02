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
            'pet_breeds' => 'nullable|array',
            'bio' => 'nullable|string|max:1000',
            // ID verification fields (required for pet sitters)
            'id_type' => 'nullable|string',
            'id_number' => 'nullable|string',
            'id_image' => 'nullable|image|mimes:jpeg,png,jpg|max:5120',
        ]);

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
            'pet_breeds' => $request->pet_breeds,
            'bio' => $request->bio,
            'phone_verification_code' => $phoneVerificationCode,
            'email_verified_at' => now(), // Auto-verify email
            'phone_verified_at' => null,
        ]);

        // Handle ID verification for pet sitters
        if ($request->role === 'pet_sitter' && $request->filled(['id_type', 'id_number']) && $request->hasFile('id_image')) {
            $this->submitIdVerification($request, $user);
        }

        // Send phone verification SMS only
        if ($user->phone) {
            $this->sendVerificationCode($user, 'phone');
        }

        $token = $user->createToken('mobile-app')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => $request->role === 'pet_sitter' 
                ? 'Registration successful! Please verify your phone number, then complete ID verification to start accepting bookings.'
                : 'Registration successful! Please verify your phone number to complete your account setup.',
            'user' => [
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
                'pet_breeds' => $user->pet_breeds,
                'bio' => $user->bio,
                'email_verified' => $user->email_verified_at !== null,
                'phone_verified' => $user->phone_verified_at !== null,
                'requires_id_verification' => $request->role === 'pet_sitter',
            ],
            'token' => $token,
            'verification_required' => [
                'email' => false, // Email is auto-verified
                'phone' => !empty($user->phone),
                'id_verification' => $request->role === 'pet_sitter',
            ]
        ], 201);
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

        $this->sendVerificationCode($user, $request->type);

        return response()->json([
            'success' => true,
            'message' => 'Verification code sent successfully!',
        ]);
    }

    private function sendVerificationCode(User $user, string $type)
    {
        if ($type === 'phone') {
            // Send SMS using the SMS service
            try {
                $this->sendSMS($user->phone, "Your Petsit Connect verification code is: {$user->phone_verification_code}");
            } catch (\Exception $e) {
                \Log::error("SMS sending failed: " . $e->getMessage());
                \Log::info("📱 PHONE VERIFICATION CODE: {$user->phone_verification_code}");
                \Log::info("📱 PHONE VERIFICATION CODE: {$user->phone_verification_code}");
                \Log::info("📱 PHONE VERIFICATION CODE: {$user->phone_verification_code}");
                \Log::info("📱 Use this code to verify phone: {$user->phone}");
            }
        }
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
            'user' => [
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
                'pet_breeds' => $user->pet_breeds,
                'bio' => $user->bio,
                'email_verified' => $user->email_verified_at !== null,
                'phone_verified' => $user->phone_verified_at !== null,
            ],
            'token' => $token,
            'verification_status' => $verificationStatus,
        ]);
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
            'user' => [
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
                'pet_breeds' => $user->pet_breeds,
                'bio' => $user->bio,
                'email_verified' => $user->email_verified_at !== null,
                'phone_verified' => $user->phone_verified_at !== null,
            ],
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

        // Format phone number for international SMS
        $formattedPhone = $this->formatPhoneForSMS($phone);
        \Log::info("📞 Original phone: {$phone}");
        \Log::info("📞 Formatted phone: {$formattedPhone}");
        
        // Send SMS using MessageBird or simulation
        try {
            $smsResult = $this->sendSMS($formattedPhone, "Your Petsit Connect verification code is: {$verificationCode}");
            
            \Log::info("✅ SMS SIMULATION COMPLETED SUCCESSFULLY");
            \Log::info("📱 SMS Result: " . json_encode($smsResult));
            
            return response()->json([
                'success' => true,
                'message' => 'Verification code sent successfully!',
                'debug_code' => $smsResult['debug_code'] ?? null,
                'note' => $smsResult['note'] ?? null,
                'simulation_mode' => true,
                'timestamp' => $timestamp,
            ]);
        } catch (\Exception $e) {
            \Log::error("❌ SMS sending failed: " . $e->getMessage());
            \Log::error("🔧 Stack trace: " . $e->getTraceAsString());
            
            // Fallback for development
            return response()->json([
                'success' => true,
                'message' => 'Verification code sent successfully! (Development mode)',
                'debug_code' => $verificationCode,
                'note' => 'SMS service unavailable - using development mode',
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
        $cleanPhone = preg_replace('/[^0-9+]/', '', $phone);
        
        // If it starts with 09, convert to +639
        if (preg_match('/^09/', $cleanPhone)) {
            $cleanPhone = '+63' . substr($cleanPhone, 1);
        }
        
        // If it starts with 9 and doesn't have +, add +63
        if (preg_match('/^9/', $cleanPhone) && !preg_match('/^\+/', $cleanPhone)) {
            $cleanPhone = '+63' . $cleanPhone;
        }
        
        // If it doesn't start with +, add +63
        if (!preg_match('/^\+/', $cleanPhone)) {
            $cleanPhone = '+63' . $cleanPhone;
        }
        
        return $cleanPhone;
    }

    private function sendSMS($phoneNumber, $message)
    {
        try {
            // Check if MessageBird credentials are configured
            $accessKey = config('services.messagebird.access_key');
            $originator = config('services.messagebird.originator');
            
            if (!$accessKey || $accessKey === 'your_access_key_here') {
                // Enhanced simulation mode logging
                \Log::info("🎭 SMS SIMULATION MODE ACTIVATED");
                \Log::info("📱 SMS SIMULATION to {$phoneNumber}: {$message}");
                \Log::info("💡 Add MessageBird credentials to .env file for real SMS");
                \Log::info("🔧 To enable real SMS, add to .env:");
                \Log::info("   MESSAGEBIRD_ACCESS_KEY=your_access_key_here");
                \Log::info("   MESSAGEBIRD_ORIGINATOR=your_originator_here");
                \Log::info("💰 Add funds to your MessageBird wallet for real SMS");
                
                return [
                    'success' => true,
                    'message' => 'Verification code sent successfully! (Simulation mode)',
                    'debug_code' => substr($message, -6),
                    'note' => 'Add MessageBird credentials to .env for real SMS',
                    'simulation_mode' => true,
                    'phone_number' => $phoneNumber,
                    'message_length' => strlen($message),
                    'timestamp' => now()->format('Y-m-d H:i:s'),
                ];
            }
            
            // Initialize MessageBird client
            $messageBird = new \MessageBird\Client($accessKey);
            
            // Create message object
            $messageObj = new \MessageBird\Objects\Message();
            $messageObj->originator = $originator;
            $messageObj->recipients = [$phoneNumber];
            $messageObj->body = $message;
            
            // Send the message
            $response = $messageBird->messages->create($messageObj);
            
            \Log::info("📱 SMS SENT via MessageBird to {$phoneNumber}: {$message}");
            \Log::info("📱 MessageBird Response ID: " . $response->getId());
            
            return [
                'success' => true,
                'message' => 'Verification code sent successfully!',
                'message_id' => $response->getId(),
                'simulation_mode' => false,
                'phone_number' => $phoneNumber,
                'message_length' => strlen($message),
                'timestamp' => now()->format('Y-m-d H:i:s'),
            ];
            
        } catch (\Exception $e) {
            \Log::error("❌ MessageBird SMS sending failed: " . $e->getMessage());
            \Log::error("🔧 Error details: " . $e->getTraceAsString());
            
            // Enhanced fallback simulation mode
            \Log::info("🎭 SMS SIMULATION (fallback) to {$phoneNumber}: {$message}");
            \Log::info("⚠️  MessageBird service unavailable - using simulation mode");
            \Log::info("🔧 Check MessageBird credentials and wallet balance");
            
            return [
                'success' => true,
                'message' => 'Verification code sent successfully! (Fallback mode)',
                'debug_code' => substr($message, -6),
                'note' => 'MessageBird failed - using simulation mode',
                'simulation_mode' => true,
                'phone_number' => $phoneNumber,
                'message_length' => strlen($message),
                'timestamp' => now()->format('Y-m-d H:i:s'),
                'error' => $e->getMessage(),
            ];
        }
    }
} 