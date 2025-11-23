<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Verification;
use App\Services\SemaphoreService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        try {
            $request->validate([
                'name' => 'required|string|max:255',
                'first_name' => 'nullable|string|max:255',
                'last_name' => 'nullable|string|max:255',
                'email' => 'required|string|email|max:255|unique:users',
                'password' => 'required|string|min:8|confirmed',
                'role' => 'required|in:pet_owner,pet_sitter',
                'phone' => ['required', 'string', 'max:20', 'regex:/^(\+63|63|0)?[0-9]{10}$/'],
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

            // Format phone number to standard format
            $formattedPhone = $this->formatPhoneNumber($request->phone);

            // Generate phone verification code only
            $phoneVerificationCode = str_pad(random_int(0, 9999), 4, '0', STR_PAD_LEFT);

            // Debug: Log the exact data being passed to User::create
            // Only include fields that exist in the database to avoid column errors
            $userData = [
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'email_verified_at' => now(),
            ];
            
            // Only add fields if the columns exist in the database
            if (Schema::hasColumn('users', 'role')) {
                $userData['role'] = $request->role;
            }
            if (Schema::hasColumn('users', 'status')) {
                $userData['status'] = $request->role === 'pet_sitter' ? 'pending_verification' : 'pending';
            }
            if (Schema::hasColumn('users', 'phone')) {
                $userData['phone'] = $formattedPhone;
            }
            if (Schema::hasColumn('users', 'phone_verification_code')) {
                $userData['phone_verification_code'] = $phoneVerificationCode;
            }
            if (Schema::hasColumn('users', 'phone_verified_at')) {
                $userData['phone_verified_at'] = null;
            }
            
            // Only add fields if the columns exist in the database
            if (Schema::hasColumn('users', 'first_name')) {
                $userData['first_name'] = $request->first_name;
            }
            if (Schema::hasColumn('users', 'last_name')) {
                $userData['last_name'] = $request->last_name;
            }
            if (Schema::hasColumn('users', 'address')) {
                $userData['address'] = $request->address;
            }
            if (Schema::hasColumn('users', 'gender')) {
                $userData['gender'] = $request->gender;
            }
            if (Schema::hasColumn('users', 'age')) {
                $userData['age'] = $request->age;
            }
            if (Schema::hasColumn('users', 'experience')) {
                $userData['experience'] = $request->experience;
            }
            if (Schema::hasColumn('users', 'hourly_rate')) {
                $userData['hourly_rate'] = $request->hourly_rate;
            }
            if (Schema::hasColumn('users', 'pet_breeds')) {
                $userData['pet_breeds'] = $request->pet_breeds;
            }
            if (Schema::hasColumn('users', 'specialties')) {
                $userData['specialties'] = $request->specialties;
            }
            if (Schema::hasColumn('users', 'selected_pet_types')) {
                $userData['selected_pet_types'] = $request->selected_pet_types;
            }
            if (Schema::hasColumn('users', 'bio')) {
                $userData['bio'] = $request->bio;
            }

            $user = User::create($userData);

            // Handle ID verification for pet sitters
            // Only create verification record if verifications table exists
            if (Schema::hasTable('verifications')) {
                if ($request->role === 'pet_sitter' && $request->filled(['id_type', 'id_number']) && $request->hasFile('id_image')) {
                    $this->submitIdVerification($request, $user);
                } else {
                    // Create verification record for all users
                    $documentType = $request->role === 'pet_sitter' ? 'skipped' : 'not_required';
                    $verificationStatus = $request->role === 'pet_sitter' ? 'pending' : 'approved';
                    $status = $request->role === 'pet_sitter' ? 'skipped' : 'approved';
                    $verificationMethod = $request->role === 'pet_sitter' ? 'manual_skip' : 'not_required';
                    $notes = $request->role === 'pet_sitter' 
                        ? 'User needs to complete ID verification to become active.'
                        : 'Pet owner - ID verification not required.';
                    
                    try {
                        Verification::create([
                    'user_id' => $user->id,
                    'document_type' => $documentType,
                    'document_number' => null,
                    'document_image' => null,
                    'status' => $status,
                    'verification_status' => $verificationStatus,
                    'is_philippine_id' => false,
                    'verification_method' => $verificationMethod,
                    'verification_score' => null,
                    'extracted_data' => json_encode([
                        'created_at' => now()->toISOString(),
                        'reason' => $request->role === 'pet_sitter' 
                            ? 'User needs to complete ID verification' 
                            : 'Pet owners do not require ID verification',
                        'can_complete_later' => $request->role === 'pet_sitter'
                    ]),
                    'notes' => $notes
                        ]);
                    } catch (\Exception $e) {
                        // Continue without verification record - migrations will create table later
                    }
                }
            }

            // Phone verification is handled separately in the new flow
            // No need to send verification code automatically during registration

            // Create token only if personal_access_tokens table exists
            $token = null;
            if (Schema::hasTable('personal_access_tokens')) {
                try {
                    $token = $user->createToken('mobile-app')->plainTextToken;
                } catch (\Exception $e) {
                    // Continue without token - user can login later to get token
                }
            }

            $response = [
                'success' => true,
                'message' => $request->role === 'pet_sitter' 
                    ? 'Registration successful! Please verify your phone number, then complete ID verification to start accepting bookings.'
                    : 'Registration successful! Please verify your phone number to complete your account setup.',
                'user' => $this->buildUserProfile($user),
            ];
            
            // Only include token if it was created successfully
            if ($token) {
                $response['token'] = $token;
            } else {
                $response['warning'] = 'Authentication token will be available after login. Please log in to get your access token.';
            }
            
            $response['verification_required'] = [
                'email' => false, // Email is auto-verified
                'phone' => !empty($user->phone),
                'id_verification' => $request->role === 'pet_sitter',
            ];

            // Registration successful - don't log (might fail due to permissions)
            return response()->json($response, 201);

        } catch (ValidationException $e) {
            // Don't try to log - just return error response
            $errors = $e->errors();
            $errorMessage = 'Validation failed.';
            
            // Check for duplicate email error
            if (isset($errors['email']) && in_array('The email has already been taken.', $errors['email'])) {
                $errorMessage = 'This email is already registered. Please use a different email or try logging in.';
            }
            
            return response()->json([
                'success' => false,
                'message' => $errorMessage,
                'errors' => $errors
            ], 422);
        } catch (\Illuminate\Database\QueryException $e) {
            // Handle duplicate email or other database errors
            $errorMessage = $e->getMessage();
            $userMessage = 'Registration failed. Please try again.';
            
            if (strpos($errorMessage, 'duplicate key') !== false || strpos($errorMessage, 'unique constraint') !== false) {
                if (strpos($errorMessage, 'email') !== false) {
                    $userMessage = 'This email is already registered. Please use a different email or try logging in.';
                } elseif (strpos($errorMessage, 'phone') !== false) {
                    $userMessage = 'This phone number is already registered. Please use a different phone number.';
                }
            }
            
            // Don't log - just return error response
            return response()->json([
                'success' => false,
                'message' => $userMessage,
            ], 400);
        } catch (\Exception $e) {
            // Don't log - just return error response
            return response()->json([
                'success' => false,
                'message' => 'Registration failed. Please try again.',
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

        // Store current pet data before update
        $currentPetBreeds = $user->pet_breeds;
        $currentSelectedPetTypes = $user->selected_pet_types;
        
        \Log::info('🔍 BEFORE PHONE VERIFY UPDATE - Pet data:', [
            'user_id' => $user->id,
            'pet_breeds' => $currentPetBreeds,
            'selected_pet_types' => $currentSelectedPetTypes,
        ]);
        
        $user->update([
            'phone_verified_at' => now(),
            'phone_verification_code' => null,
            // Preserve existing pet data
            'pet_breeds' => $currentPetBreeds,
            'selected_pet_types' => $currentSelectedPetTypes,
        ]);
        
        \Log::info('🔍 AFTER PHONE VERIFY UPDATE - Pet data preserved:', [
            'user_id' => $user->id,
            'pet_breeds' => $user->fresh()->pet_breeds,
            'selected_pet_types' => $user->fresh()->selected_pet_types,
        ]);

        // Check if user can be activated
        $this->checkAndUpdateUserStatus($user);

        $user = $user->fresh();
        $isFullyVerified = $user->verification_status === 'verified';
        
        return response()->json([
            'success' => true,
            'message' => $isFullyVerified ? 'Congratulations! You are now fully verified and can use all features!' : 'Phone number verified successfully!',
            'is_fully_verified' => $isFullyVerified,
            'user' => [
                'id' => $user->id,
                'phone_verified' => true,
                'status' => $user->status,
                'verification_status' => $user->verification_status,
                'role' => $user->role,
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
                // Preserve pet data during status update
                $currentPetBreeds = $user->pet_breeds;
                $currentSelectedPetTypes = $user->selected_pet_types;
                
                $user->update([
                    'status' => 'active',
                    'verification_status' => 'verified',
                    'pet_breeds' => $currentPetBreeds,
                    'selected_pet_types' => $currentSelectedPetTypes,
                ]);
                
                \Log::info('🔍 Pet owner status updated - Pet data preserved:', [
                    'user_id' => $user->id,
                    'pet_breeds' => $currentPetBreeds,
                    'selected_pet_types' => $currentSelectedPetTypes,
                ]);
                
                // Broadcast admin dashboard update for pet owner verification
                try {
                    broadcast(new \App\Events\AdminUserVerificationUpdated(
                        $user,
                        'verified',
                        'Pet owner phone verification completed'
                    ));
                    \Log::info("📡 REAL-TIME EVENT - AdminUserVerificationUpdated dispatched for pet owner: {$user->id}");
                } catch (\Exception $e) {
                    \Log::error('Failed to broadcast admin update for pet owner verification', [
                        'user_id' => $user->id,
                        'error' => $e->getMessage()
                    ]);
                }
            }
        } elseif ($user->role === 'pet_sitter') {
            // Pet sitters need phone + ID verification (email is auto-verified)
            $hasPhoneVerified = $user->phone_verified_at !== null || empty($user->phone);
            
            $idVerification = Verification::where('user_id', $user->id)
                ->where('verification_status', 'approved')
                ->first();
            
            if ($hasPhoneVerified && $idVerification) {
                // Preserve pet data during status update
                $currentPetBreeds = $user->pet_breeds;
                $currentSelectedPetTypes = $user->selected_pet_types;
                
                $user->update([
                    'status' => 'active',
                    'pet_breeds' => $currentPetBreeds,
                    'selected_pet_types' => $currentSelectedPetTypes,
                ]);
                
                \Log::info('🔍 Pet sitter status updated to active - Pet data preserved:', [
                    'user_id' => $user->id,
                    'pet_breeds' => $currentPetBreeds,
                    'selected_pet_types' => $currentSelectedPetTypes,
                ]);
                
                // Award verification badges
                $this->awardVerificationBadges($idVerification);
            } elseif ($hasPhoneVerified) {
                // Preserve pet data during status update
                $currentPetBreeds = $user->pet_breeds;
                $currentSelectedPetTypes = $user->selected_pet_types;
                
                $user->update([
                    'status' => 'pending_id_verification',
                    'pet_breeds' => $currentPetBreeds,
                    'selected_pet_types' => $currentSelectedPetTypes,
                ]);
                
                \Log::info('🔍 Pet sitter status updated to pending_id_verification - Pet data preserved:', [
                    'user_id' => $user->id,
                    'pet_breeds' => $currentPetBreeds,
                    'selected_pet_types' => $currentSelectedPetTypes,
                ]);
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

        // Check if user account is banned
        if ($user->status === 'banned') {
            $adminEmail = 'petsitconnectph@gmail.com';
            return response()->json([
                'success' => false,
                'message' => "Your account has been permanently banned. You will not be able to use the platform anymore. Please contact the admin at {$adminEmail} if you have any questions.",
                'status' => 'banned',
                'admin_email' => $adminEmail,
            ], 403);
        }

        // Check if user account is suspended
        if ($user->status === 'suspended') {
            $adminEmail = 'petsitconnectph@gmail.com';
            $suspensionEnd = $user->suspension_ends_at;
            $message = "You have been suspended for 72 hours by the admin. Please email the admin at {$adminEmail} for assistance.";
            
            if ($suspensionEnd && now()->lt($suspensionEnd)) {
                $hoursRemaining = now()->diffInHours($suspensionEnd);
                $message .= " Your suspension will end in approximately {$hoursRemaining} hours.";
            } elseif ($suspensionEnd && now()->gte($suspensionEnd)) {
                // Suspension period has ended, reactivate user
                $user->update([
                    'status' => 'active',
                    'suspended_at' => null,
                    'suspended_by' => null,
                    'suspension_reason' => null,
                    'suspension_ends_at' => null,
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => $message,
                    'status' => 'suspended',
                    'admin_email' => $adminEmail,
                ], 403);
            }
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
        // Ensure first_name and last_name are populated from name if they're empty
        $firstName = $user->first_name;
        $lastName = $user->last_name;
        
        if (empty($firstName) && empty($lastName) && !empty($user->name)) {
            $nameParts = explode(' ', trim($user->name));
            $firstName = $nameParts[0] ?? '';
            $lastName = count($nameParts) > 1 ? implode(' ', array_slice($nameParts, 1)) : '';
        }
        
        // Base profile fields for all users
        $profile = [
            'id' => $user->id,
            'name' => $user->name,
            'first_name' => $firstName,
            'last_name' => $lastName,
            'email' => $user->email,
            'role' => $user->role,
            'status' => $user->status,
            'phone' => $user->phone,
            'address' => $user->address,
            'gender' => $user->gender,
            'age' => $user->age,
            'bio' => $user->bio,
            'profile_image' => $user->profile_image,
            'profile_image_url' => $user->profile_image ? (
                str_starts_with($user->profile_image, 'http') 
                    ? $user->profile_image 
                    : asset('storage/' . $user->profile_image)
            ) : null,
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
            $profile['pet_breeds'] = $this->formatBreedNames($user->pet_breeds);
            
            \Log::info('🔍 buildUserProfile - Pet sitter fields:', [
                'user_id' => $user->id,
                'experience' => $user->experience,
                'hourly_rate' => $user->hourly_rate,
                'hourly_rate_type' => gettype($user->hourly_rate),
                'specialties' => $user->specialties,
                'raw_pet_breeds' => $user->pet_breeds,
                'raw_selected_pet_types' => $user->selected_pet_types,
            ]);
        } else {
            // Pet owner specific fields (no sitter-specific fields)
            $profile['pet_breeds'] = $this->formatBreedNames($user->pet_breeds); // Pet owners can have pet breeds they own
        }

        \Log::info('🔍 buildUserProfile - Final profile:', $profile);
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
        try {
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
            'phone' => ['required', 'string', 'max:20', 'regex:/^(\+63|63|0)?[0-9]{10}$/'],
        ]);

        $phone = $this->formatPhoneNumber($request->phone);
        
        // Verify the phone number matches the user's registered phone
        $user = $request->user();
        if ($user && $user->phone !== $phone) {
            return response()->json([
                'success' => false,
                'message' => 'Phone number does not match your registered phone number.',
            ], 400);
        }
        
        // If no authenticated user, find the most recent user with this phone (for registration flow)
        if (!$user) {
                // Check if phone column exists before querying
                if (Schema::hasColumn('users', 'phone')) {
                    try {
            $user = User::where('phone', $phone)->orderBy('created_at', 'desc')->first();
                    } catch (\Exception $e) {
                        $user = null;
                    }
                } else {
                    // Phone column doesn't exist yet - migration hasn't run
                    $user = null;
        }
            }
            
        $timestamp = now()->format('Y-m-d H:i:s');

        // Generate a 6-digit verification code
        $verificationCode = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        
        // Create cache key with original phone number
        $cacheKey = "phone_verification_{$phone}";
        
        // Store the code in cache for verification (expires in 10 minutes)
        \Cache::put($cacheKey, $verificationCode, 600);

        // Format phone number for display
        $formattedPhone = $this->formatPhoneForSMS($phone);
        
        // Check if simulation mode is enabled
        $simulationMode = $this->isSimulationMode();
        
        if ($simulationMode) {
            return $this->simulateSMS($phone, $verificationCode, $timestamp);
        }

        // Send SMS using Semaphore service
        try {
            $semaphoreService = new SemaphoreService();
            $message = $verificationCode; // Send only the 6-digit code
            
            $smsResult = $semaphoreService->sendSMS($phone, $message);
            
            if ($smsResult['success']) {
                return response()->json([
                    'success' => true,
                    'message' => 'Verification code sent successfully via SMS!',
                    'provider' => 'semaphore',
                    'timestamp' => $timestamp,
                ]);
            } else {
                // Fallback to simulation mode if Semaphore fails
                return $this->simulateSMS($phone, $verificationCode, $timestamp);
            }
        } catch (\Exception $e) {
            // Fallback to simulation mode if Semaphore fails
                try {
            return $this->simulateSMS($phone, $verificationCode, $timestamp);
                } catch (\Exception $simError) {
                    // If everything fails, return error response
                    return response()->json([
                        'success' => false,
                        'message' => 'An error occurred while sending verification code. Please try again.',
                    ], 500);
                }
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while sending verification code. Please try again.',
            ], 500);
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
            'phone' => ['required', 'string', 'max:20', 'regex:/^(\+63|63|0)?[0-9]{10}$/'],
            'code' => 'required|string|size:6',
        ]);

        $phone = $this->formatPhoneNumber($request->phone);
        $code = $request->code;
        
        // Check if user is authenticated (for logged-in users) or find user by phone (for registration)
        $user = $request->user();
        \Log::info("🔍 USER AUTHENTICATION - User from request: " . ($user ? "Found (ID: {$user->id})" : "NULL"));
        \Log::info("🔍 USER AUTHENTICATION - User phone: " . ($user ? $user->phone : "N/A"));
        \Log::info("🔍 USER AUTHENTICATION - Requested phone: {$phone}");
        
        // If no authenticated user, try to find user by phone (for registration flow)
        if (!$user) {
            // Find the most recent user with this phone number (for registration flow)
            $user = User::where('phone', $phone)->orderBy('created_at', 'desc')->first();
            \Log::info("🔍 USER LOOKUP - Found user by phone: " . ($user ? "Found (ID: {$user->id}, Created: {$user->created_at})" : "NULL"));
        } else {
            // For authenticated users, verify phone matches
            if ($user->phone !== $phone) {
                \Log::warning("📱 PHONE MISMATCH - User phone: {$user->phone}, Requested phone: {$phone}");
                return response()->json([
                    'success' => false,
                    'message' => 'Phone number does not match your registered phone number.',
                ], 400);
            }
        }
        
        if (!$user) {
            \Log::error("❌ USER NOT FOUND - No user found for phone: {$phone}");
            return response()->json([
                'success' => false,
                'message' => 'No user found with this phone number.',
            ], 404);
        }
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
            
            // In simulation mode, provide helpful debugging info
            if ($this->isSimulationMode()) {
                \Log::info("🎭 SIMULATION MODE - Check the logs above for the generated code");
                \Log::info("🎭 SIMULATION MODE - Make sure you're using the correct phone number format");
            }
            
            return response()->json([
                'success' => false,
                'message' => 'Verification code expired or not found.',
                'simulation_mode' => $this->isSimulationMode(),
                'timestamp' => $timestamp,
            ], 400);
        }

        if ($storedCode !== $code) {
            \Log::error("❌ VERIFY SMS - Code mismatch. Expected: {$storedCode}, Received: {$code}");
            \Log::error("🔍 Verification failed - codes do not match");
            
            // In simulation mode, provide helpful debugging info
            if ($this->isSimulationMode()) {
                \Log::info("🎭 SIMULATION MODE - Expected code: {$storedCode}");
                \Log::info("🎭 SIMULATION MODE - Received code: {$code}");
                \Log::info("🎭 SIMULATION MODE - Check the logs above for the correct code");
            }
            
            return response()->json([
                'success' => false,
                'message' => 'Invalid verification code.',
                'simulation_mode' => $this->isSimulationMode(),
                'timestamp' => $timestamp,
            ], 400);
        }

        // Clear the stored code
        \Cache::forget($cacheKey);
        \Log::info("✅ VERIFY SMS - Code verified successfully for phone: {$phone}");
        \Log::info("🧹 Cache cleared for key: {$cacheKey}");
        
        // Update user verification status
        if ($user) {
            $hasIdVerification = $user->verifications()->where('status', 'approved')->exists();
            
            // For pet sitters: need both phone and ID verification to be fully verified
            // For pet owners: only need phone verification
            $shouldBeVerified = false;
            if ($user->role === 'pet_sitter') {
                $shouldBeVerified = $hasIdVerification; // Phone verification is being completed now
            } elseif ($user->role === 'pet_owner') {
                $shouldBeVerified = true; // Pet owners only need phone verification
            } else {
                $shouldBeVerified = true; // Other roles follow same logic
            }
            
            $user->update([
                'phone_verified_at' => now(),
                'verification_status' => $shouldBeVerified ? 'verified' : 'pending_verification',
                'status' => 'active', // Change from 'pending' to 'active' when phone is verified
                'can_accept_bookings' => $shouldBeVerified
            ]);
            
            \Log::info("✅ USER UPDATE - Phone verification status updated to verified");
            \Log::info("✅ USER UPDATE - User status changed to active");
            \Log::info("✅ USER UPDATE - Phone verified at: " . now()->format('Y-m-d H:i:s'));
            
            // Dispatch real-time event for admin panel updates
            event(new \App\Events\UserVerificationUpdated($user, 'phone', 'verified'));
            \Log::info("📡 REAL-TIME EVENT - UserVerificationUpdated dispatched for user: {$user->id}");
            
            // Check if user can be activated
            $this->checkAndUpdateUserStatus($user);
            
            // Broadcast admin dashboard update
            try {
                broadcast(new \App\Events\AdminUserVerificationUpdated(
                    $user,
                    $shouldBeVerified ? 'verified' : 'pending_verification',
                    'User verification status updated after phone verification'
                ));
                \Log::info("📡 ADMIN DASHBOARD UPDATE - AdminUserVerificationUpdated broadcasted for user: {$user->id}");
            } catch (\Exception $broadcastError) {
                \Log::warning("⚠️ ADMIN DASHBOARD UPDATE - Failed to broadcast admin dashboard update", [
                    'user_id' => $user->id,
                    'error' => $broadcastError->getMessage()
                ]);
            }
            
            // Refresh user data after updates
            $user = $user->fresh();
            $isFullyVerified = $user->verification_status === 'verified';
        } else {
            \Log::error("❌ USER UPDATE - No authenticated user found to update verification status");
            return response()->json([
                'success' => false,
                'message' => 'User not authenticated. Please log in again.',
            ], 401);
        }
        
        \Log::info("🎉 PHONE VERIFICATION COMPLETED SUCCESSFULLY");
        
        $responseData = [
            'success' => true,
            'message' => $isFullyVerified ? 'Congratulations! You are now fully verified and can use all features!' : 'Phone number verified successfully!',
            'is_fully_verified' => $isFullyVerified,
            'user' => [
                'id' => $user->id,
                'phone_verified' => true,
                'status' => $user->status,
                'verification_status' => $user->verification_status,
                'role' => $user->role,
            ]
        ];
        
        \Log::info("📤 API RESPONSE - Sending response data:", $responseData);
        
        return response()->json($responseData);
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

    /**
     * Check if simulation mode is enabled
     */
    private function isSimulationMode(): bool
    {
        // Check environment variable or config for simulation mode
        $simulationMode = env('SMS_SIMULATION_MODE', false); // Default to false for production
        $semaphoreEnabled = env('SEMAPHORE_ENABLED', true); // Default to true since API is approved
        
        // Convert string values to boolean properly
        $simulationMode = filter_var($simulationMode, FILTER_VALIDATE_BOOLEAN);
        $semaphoreEnabled = filter_var($semaphoreEnabled, FILTER_VALIDATE_BOOLEAN);
        
        // Enable simulation if explicitly set to true or if Semaphore is not enabled
        return $simulationMode || !$semaphoreEnabled;
    }

    /**
     * Simulate SMS sending for development/testing
     */
    private function simulateSMS($phone, $verificationCode, $timestamp)
    {
        \Log::info("🎭 SMS SIMULATION MODE ENABLED");
        \Log::info("📱 SIMULATION - Phone: {$phone}");
        \Log::info("🔢 SIMULATION - Code: {$verificationCode}");
        \Log::info("⏰ SIMULATION - Timestamp: {$timestamp}");
        
        // Make the verification code very visible in simulation logs
        \Log::info("🎭 ========================================");
        \Log::info("🎭 SMS SIMULATION - VERIFICATION CODE");
        \Log::info("🎭 ========================================");
        \Log::info("🎭 Phone: {$phone}");
        \Log::info("🎭 Code: {$verificationCode}");
        \Log::info("🎭 Code: {$verificationCode}");
        \Log::info("🎭 Code: {$verificationCode}");
        \Log::info("🎭 Message: {$verificationCode} (6-digit code only)");
        \Log::info("🎭 ========================================");
        \Log::info("🎭 COPY THIS CODE: {$verificationCode}");
        \Log::info("🎭 ========================================");
        
        // Log to dedicated verification codes file
        \Log::channel('verification')->info("🎭 SIMULATION SMS FOR {$phone}: {$verificationCode}");
        \Log::channel('verification')->info("⏰ Generated at: {$timestamp}");
        \Log::channel('verification')->info("📱 Phone: {$phone}");
        \Log::channel('verification')->info("🎭 Mode: SIMULATION");
        \Log::channel('verification')->info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        
        return response()->json([
            'success' => true,
            'message' => '🎭 SIMULATION: Verification code generated successfully! Check the logs for the code.',
            'provider' => 'simulation',
            'simulation_mode' => true,
            'verification_code' => $verificationCode, // Include code in response for testing
            'timestamp' => $timestamp,
        ]);
    }

    /**
     * Format phone number to standard +63XXXXXXXXXX format
     */
    private function formatPhoneNumber($phone)
    {
        // Remove any non-digit characters except +
        $phone = preg_replace('/[^0-9+]/', '', $phone);
        
        // For Philippine numbers, ensure proper format
        if (str_starts_with($phone, '+63')) {
            // Already properly formatted
            return $phone;
        } elseif (str_starts_with($phone, '63')) {
            // Add + prefix
            return '+' . $phone;
        } elseif (str_starts_with($phone, '0')) {
            // Remove leading 0 and add +63
            $phone = substr($phone, 1);
            return '+63' . $phone;
        } elseif (str_starts_with($phone, '+0')) {
            // Handle +0 prefix (like +09639283365)
            $phone = substr($phone, 2); // Remove +0
            return '+63' . $phone;
        }
        
        // Ensure it starts with + if not already
        if (!str_starts_with($phone, '+')) {
            $phone = '+' . $phone;
        }
        
        return $phone;
    }

    /**
     * Convert breed IDs to readable names
     */
    private function formatBreedNames($breeds)
    {
        if (!$breeds || !is_array($breeds)) {
            return $breeds;
        }

        $breedMapping = [
            // Dog breeds
            'labrador' => 'Labrador Retriever',
            'golden' => 'Golden Retriever',
            'german-shepherd' => 'German Shepherd',
            'bulldog' => 'Bulldog',
            'beagle' => 'Beagle',
            'poodle' => 'Poodle',
            'rottweiler' => 'Rottweiler',
            'yorkshire' => 'Yorkshire Terrier',
            'boxer' => 'Boxer',
            'dachshund' => 'Dachshund',
            // Cat breeds
            'persian' => 'Persian',
            'siamese' => 'Siamese',
            'maine-coon' => 'Maine Coon',
            'ragdoll' => 'Ragdoll',
            'british-shorthair' => 'British Shorthair',
            'abyssinian' => 'Abyssinian',
            'russian-blue' => 'Russian Blue',
            'bengal' => 'Bengal',
            'sphynx' => 'Sphynx',
            'scottish-fold' => 'Scottish Fold',
        ];

        return array_map(function($breed) use ($breedMapping) {
            // If we have a mapping for this ID, use the readable name
            if (isset($breedMapping[$breed])) {
                return $breedMapping[$breed];
            }
            // Otherwise, return the original value (it might already be a readable name)
            return $breed;
        }, $breeds);
    }

    /**
     * Refresh user token
     */
    public function refreshToken(Request $request)
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
        
        try {
        $request->validate([
            'email' => 'required|email',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not found.',
            ], 404);
        }

        // Check if user account is active
        if ($user->status === 'banned') {
            return response()->json([
                'success' => false,
                'message' => 'Your account has been suspended. Please contact support.',
            ], 403);
        }

            // Check if personal_access_tokens table exists
            if (!Schema::hasTable('personal_access_tokens')) {
                \Log::warning('personal_access_tokens table does not exist');
                return response()->json([
                    'success' => false,
                    'message' => 'Token system not available. Please run migrations.',
                ], 503);
            }

        // Revoke all existing tokens for this user
            try {
        $user->tokens()->delete();
            } catch (\Exception $e) {
                \Log::warning('Could not delete existing tokens: ' . $e->getMessage());
            }

        // Create a new token
            try {
        $token = $user->createToken('mobile-app')->plainTextToken;
            } catch (\Exception $e) {
                \Log::error('Could not create token: ' . $e->getMessage());
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to generate token. Please try again.',
                ], 500);
            }

        return response()->json([
            'success' => true,
            'message' => 'Token refreshed successfully!',
            'token' => $token,
        ]);
        } catch (\Exception $e) {
            \Log::error('refreshToken error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'An error occurred. Please try again.',
            ], 500);
        }
    }

    /**
     * Generate new token for user
     */
    public function generateToken(Request $request)
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
        
        try {
        $request->validate([
            'email' => 'required|email',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not found.',
            ], 404);
        }

        // Check if user account is active
        if ($user->status === 'banned') {
            return response()->json([
                'success' => false,
                'message' => 'Your account has been suspended. Please contact support.',
            ], 403);
        }

            // Check if personal_access_tokens table exists
            if (!Schema::hasTable('personal_access_tokens')) {
                \Log::warning('personal_access_tokens table does not exist');
                return response()->json([
                    'success' => false,
                    'message' => 'Token system not available. Please run migrations.',
                ], 503);
            }

        // Revoke all existing tokens for this user
            try {
        $user->tokens()->delete();
            } catch (\Exception $e) {
                \Log::warning('Could not delete existing tokens: ' . $e->getMessage());
            }

        // Create a new token
            try {
        $token = $user->createToken('mobile-app')->plainTextToken;
            } catch (\Exception $e) {
                \Log::error('Could not create token: ' . $e->getMessage());
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to generate token. Please try again.',
                ], 500);
            }

        return response()->json([
            'success' => true,
            'message' => 'New token generated successfully!',
            'token' => $token,
        ]);
        } catch (\Exception $e) {
            \Log::error('generateToken error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'An error occurred. Please try again.',
            ], 500);
        }
    }
} 