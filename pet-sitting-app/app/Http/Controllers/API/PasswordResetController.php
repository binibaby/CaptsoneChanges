<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\SemaphoreService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class PasswordResetController extends Controller
{
    protected $semaphoreService;

    public function __construct(SemaphoreService $semaphoreService)
    {
        $this->semaphoreService = $semaphoreService;
    }

    /**
     * Lookup user email by mobile number
     */
    public function lookupEmail($mobileNumber, Request $request = null)
    {
        try {
            // Remove any non-digit characters and ensure proper format
            $cleanNumber = preg_replace('/\D/', '', $mobileNumber);
            
            // Format the phone number to match database format (+63XXXXXXXXXX)
            $formattedPhone = $this->formatPhoneNumber($cleanNumber);
            
            \Log::info('🔍 Looking up email for phone:', [
                'original' => $mobileNumber,
                'clean' => $cleanNumber,
                'formatted' => $formattedPhone
            ]);
            
            // Log all users with similar phone numbers for debugging
            $similarUsers = User::where('phone', 'LIKE', '%' . substr($cleanNumber, -8) . '%')->get();
            \Log::info('🔍 Users with similar phone numbers:', [
                'search_pattern' => '%' . substr($cleanNumber, -8) . '%',
                'users' => $similarUsers->map(function($u) {
                    return ['id' => $u->id, 'email' => $u->email, 'phone' => $u->phone];
                })->toArray()
            ]);
            
            // Find ALL users with this phone number in any format
            $users = collect();
            
            // Try all possible phone number formats
            $phoneFormats = [
                $formattedPhone,                    // +639639283365
                '+63' . $cleanNumber,              // +639639283365
                '0' . $cleanNumber,                // 09639283365
                $cleanNumber,                      // 9639283365
            ];
            
            foreach ($phoneFormats as $format) {
                $foundUsers = User::where('phone', $format)->get();
                $users = $users->merge($foundUsers);
            }
            
            // Remove duplicates
            $users = $users->unique('id');
            
            \Log::info('🔍 All users found with this phone number:', [
                'users' => $users->map(function($u) {
                    return ['id' => $u->id, 'email' => $u->email, 'phone' => $u->phone];
                })->toArray()
            ]);
            
            if ($users->isEmpty()) {
                \Log::info('❌ No user found for phone:', $formattedPhone);
                return response()->json([
                    'success' => false,
                    'message' => 'No account found with this mobile number'
                ], 404);
            }
            
            // If multiple users found, prioritize by email match first, then active status
            $user = null;
            
            // Get the expected email from request if provided
            $expectedEmail = $request ? $request->get('email') : null;
            
            if ($expectedEmail && $users->count() > 1) {
                // Prioritize user whose email matches the expected email
                $emailMatch = $users->where('email', $expectedEmail)->first();
                if ($emailMatch) {
                    $user = $emailMatch;
                    \Log::info('🎯 Selected user by email match:', [
                        'expected_email' => $expectedEmail,
                        'selected_user' => $user->email
                    ]);
                }
            }
            
            // If no email match or no expected email, prioritize active users
            if (!$user) {
                $activeUsers = $users->where('status', 'active');
                if ($activeUsers->isNotEmpty()) {
                    $user = $activeUsers->first();
                    \Log::info('🎯 Selected user by active status:', [
                        'selected_user' => $user->email,
                        'status' => $user->status
                    ]);
                } else {
                    $user = $users->first();
                    \Log::info('🎯 Selected first available user:', [
                        'selected_user' => $user->email
                    ]);
                }
            }

            \Log::info('✅ User selected:', [
                'id' => $user->id,
                'email' => $user->email,
                'phone' => $user->phone,
                'status' => $user->status,
                'total_users_found' => $users->count()
            ]);

            return response()->json([
                'success' => true,
                'email' => $user->email,
                'message' => 'Account found'
            ]);

        } catch (\Exception $e) {
            \Log::error('❌ Error looking up email:', [
                'error' => $e->getMessage(),
                'mobile' => $mobileNumber
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Error looking up account: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Send OTP for password reset
     */
    public function sendOTP(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'mobile_number' => 'required|string',
                'email' => 'required|email',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid input data',
                    'errors' => $validator->errors()
                ], 400);
            }

            $mobileNumber = preg_replace('/\D/', '', $request->mobile_number);
            $email = $request->email;

            // Format the phone number to match database format
            $formattedPhone = $this->formatPhoneNumber($mobileNumber);

            \Log::info('📱 Sending OTP for password reset:', [
                'original' => $request->mobile_number,
                'clean' => $mobileNumber,
                'formatted' => $formattedPhone,
                'email' => $email
            ]);

            // Find user by mobile number and email - MUST match both email AND phone
            $user = null;
            
            // Try all possible phone number formats but ONLY for the specific email
            $phoneFormats = [
                $formattedPhone,                    // +639639283365
                '+63' . $mobileNumber,              // +639639283365
                '0' . $mobileNumber,                // 09639283365
                $mobileNumber,                      // 9639283365
            ];
            
            foreach ($phoneFormats as $format) {
                $user = User::where('email', $email)->where('phone', $format)->first();
                if ($user) {
                    \Log::info('🎯 Found user with exact email and phone match:', [
                        'email' => $user->email,
                        'phone' => $user->phone,
                        'format_used' => $format
                    ]);
                    break;
                }
            }

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'No account found with this mobile number and email combination'
                ], 404);
            }

            // Generate 6-digit OTP
            $otp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
            
            // Store OTP in cache for 10 minutes - specific to this email-phone combination
            $cacheKey = "password_reset_otp_{$mobileNumber}_{$email}";
            Cache::put($cacheKey, $otp, 600); // 10 minutes
            
            \Log::info('📱 OTP generated for specific user:', [
                'email' => $email,
                'phone' => $mobileNumber,
                'formatted_phone' => $formattedPhone,
                'cache_key' => $cacheKey,
                'otp' => $otp
            ]);

            // Send OTP via Semaphore SMS
            $message = "Your Petsit Connect password reset code is: {$otp}. This code will expire in 10 minutes. Do not share this code with anyone.";
            
            $smsResult = $this->semaphoreService->sendSMS($mobileNumber, $message);

            if ($smsResult['success']) {
                return response()->json([
                    'success' => true,
                    'message' => 'Verification code sent to your mobile number'
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to send verification code. Please try again.'
                ], 500);
            }

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error sending verification code: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Verify OTP for password reset
     */
    public function verifyOTP(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'mobile_number' => 'required|string',
                'email' => 'required|email',
                'otp' => 'required|string|size:6',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid input data',
                    'errors' => $validator->errors()
                ], 400);
            }

            $mobileNumber = preg_replace('/\D/', '', $request->mobile_number);
            $email = $request->email;
            $otp = $request->otp;

            // Format the phone number to match database format
            $formattedPhone = $this->formatPhoneNumber($mobileNumber);

            \Log::info('🔍 Verifying OTP for password reset:', [
                'original' => $request->mobile_number,
                'clean' => $mobileNumber,
                'formatted' => $formattedPhone,
                'email' => $email
            ]);

            // Check OTP from cache - use specific email-phone combination
            $cacheKey = "password_reset_otp_{$mobileNumber}_{$email}";
            $storedOTP = Cache::get($cacheKey);
            
            \Log::info('🔍 Verifying OTP for specific user:', [
                'email' => $email,
                'phone' => $mobileNumber,
                'cache_key' => $cacheKey,
                'otp_provided' => $otp
            ]);

            if (!$storedOTP || $storedOTP !== $otp) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid or expired verification code'
                ], 400);
            }

            // OTP is valid, mark as verified
            $verificationKey = "password_reset_verified_{$mobileNumber}_{$email}";
            Cache::put($verificationKey, true, 300); // 5 minutes to complete password reset

            return response()->json([
                'success' => true,
                'message' => 'Verification code verified successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error verifying code: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reset password
     */
    public function resetPassword(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'mobile_number' => 'required|string',
                'email' => 'required|email',
                'otp' => 'required|string|size:6',
                'new_password' => 'required|string|min:8|regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/',
            ], [
                'new_password.regex' => 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid input data',
                    'errors' => $validator->errors()
                ], 400);
            }

            $mobileNumber = preg_replace('/\D/', '', $request->mobile_number);
            $email = $request->email;
            $otp = $request->otp;
            $newPassword = $request->new_password;

            // Format the phone number to match database format
            $formattedPhone = $this->formatPhoneNumber($mobileNumber);

            \Log::info('🔐 Resetting password:', [
                'original' => $request->mobile_number,
                'clean' => $mobileNumber,
                'formatted' => $formattedPhone,
                'email' => $email
            ]);

            // Verify OTP again for security - must be for this specific email-phone combination
            $cacheKey = "password_reset_otp_{$mobileNumber}_{$email}";
            $storedOTP = Cache::get($cacheKey);

            \Log::info('🔐 Verifying OTP for password reset:', [
                'email' => $email,
                'phone' => $mobileNumber,
                'cache_key' => $cacheKey,
                'otp_provided' => $otp,
                'otp_stored' => $storedOTP ? '***' : 'null'
            ]);

            if (!$storedOTP || $storedOTP !== $otp) {
                \Log::warning('❌ Invalid OTP for password reset:', [
                    'email' => $email,
                    'phone' => $mobileNumber,
                    'provided_otp' => $otp,
                    'stored_otp' => $storedOTP ? 'exists' : 'null'
                ]);
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid or expired verification code'
                ], 400);
            }

            // Check if verification is still valid
            $verificationKey = "password_reset_verified_{$mobileNumber}_{$email}";
            if (!Cache::has($verificationKey)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Verification session expired. Please start the process again.'
                ], 400);
            }

            // Find user - MUST match both email AND phone exactly
            $user = null;
            
            // Try all possible phone number formats but ONLY for the specific email
            $phoneFormats = [
                $formattedPhone,                    // +639639283365
                '+63' . $mobileNumber,              // +639639283365
                '0' . $mobileNumber,                // 09639283365
                $mobileNumber,                      // 9639283365
            ];
            
            foreach ($phoneFormats as $format) {
                $user = User::where('email', $email)->where('phone', $format)->first();
                if ($user) {
                    \Log::info('🎯 Found user for password reset with exact email and phone match:', [
                        'email' => $user->email,
                        'phone' => $user->phone,
                        'format_used' => $format
                    ]);
                    break;
                }
            }

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found'
                ], 404);
            }

            // Update password
            $user->password = Hash::make($newPassword);
            $user->save();

            // Clear OTP and verification cache
            Cache::forget($cacheKey);
            Cache::forget($verificationKey);

            // Log password reset activity with detailed information
            \Log::info("🔐 Password reset completed for specific user:", [
                'user_id' => $user->id,
                'email' => $user->email,
                'phone' => $user->phone,
                'phone_format_used' => $formattedPhone,
                'reset_at' => now()->toISOString(),
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Password reset successfully. You can now login with your new password.',
                'data' => [
                    'user_id' => $user->id,
                    'email' => $user->email,
                    'reset_at' => now()->toISOString()
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error resetting password: ' . $e->getMessage()
            ], 500);
        }
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
        } elseif (strlen($phone) === 10 && !str_starts_with($phone, '+')) {
            // Handle 10-digit numbers without leading 0 (like 9123456789)
            return '+63' . $phone;
        }
        
        // Ensure it starts with + if not already
        if (!str_starts_with($phone, '+')) {
            $phone = '+' . $phone;
        }
        
        return $phone;
    }
}
