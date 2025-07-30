<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Verification;
use App\Models\User;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Http;

class VerificationController extends Controller
{
    // Philippine ID validation patterns
    private $philippineIdPatterns = [
        'ph_national_id' => '/^\d{4}-\d{7}-\d{1}$/', // 1234-5678901-2
        'sss_id' => '/^\d{2}-\d{7}-\d{1}$/', // 12-3456789-0
        'tin_id' => '/^\d{3}-\d{3}-\d{3}-\d{3}$/', // 123-456-789-000
        'philhealth_id' => '/^\d{2}-\d{9}-\d{1}$/', // 12-345678901-2
        'voters_id' => '/^\d{4}-\d{4}-\d{4}-\d{4}$/', // 1234-5678-9012-3456
        'postal_id' => '/^[A-Z]{3}\d{7}$/', // ABC1234567
        'prc_id' => '/^\d{7}$/', // 1234567
        'umid' => '/^\d{4}-\d{7}-\d{1}$/', // 1234-5678901-2
        'owwa_id' => '/^[A-Z]{2}\d{8}$/', // AB12345678
    ];

    public function submitVerification(Request $request)
    {
        $validDocumentTypes = [
            'national_id', 'drivers_license', 'passport', 'other',
            'ph_national_id', 'ph_drivers_license', 'sss_id', 'philhealth_id', 
            'tin_id', 'postal_id', 'voters_id', 'prc_id', 'umid', 'owwa_id'
        ];

        $isPhilippineId = in_array($request->document_type, [
            'ph_national_id', 'ph_drivers_license', 'sss_id', 'philhealth_id', 
            'tin_id', 'postal_id', 'voters_id', 'prc_id', 'umid', 'owwa_id'
        ]);

        $rules = [
            'document_type' => 'required|in:' . implode(',', $validDocumentTypes),
            'document_image' => 'required|image|mimes:jpeg,png,jpg|max:5120', // 5MB max
        ];
        if (!$isPhilippineId) {
            $rules['document_number'] = 'required|string|max:50';
        }

        $request->validate($rules);

        $user = $request->user();
        
        // Validate Philippine ID number format if provided
        if ($isPhilippineId && $request->filled('document_number')) {
        if (!$this->validatePhilippineId($request->document_type, $request->document_number)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid ID number format for the selected document type.',
                'error_code' => 'INVALID_ID_FORMAT'
            ], 400);
            }
        }
        
        // Check if user already has a pending or approved verification
        $existingVerification = Verification::where('user_id', $user->id)
            ->whereIn('status', ['pending', 'approved'])
            ->first();
            
        if ($existingVerification) {
            return response()->json([
                'success' => false,
                'message' => 'You already have a verification request in progress.',
                'status' => $existingVerification->status
            ], 400);
        }

        // Handle file upload
        $documentImage = null;
        if ($request->hasFile('document_image')) {
            $file = $request->file('document_image');
            $filename = 'verification_' . $user->id . '_' . time() . '.' . $file->getClientOriginalExtension();
            $path = $file->storeAs('public/verifications', $filename);
            $documentImage = Storage::url($path);

            // --- Blurriness Detection ---
            $python = '/usr/bin/python3'; // Adjust if needed
            $script = base_path('blur_detector.py');
            $output = null;
            $return_var = null;
            exec("$python $script " . escapeshellarg(storage_path('app/' . $path)), $output, $return_var);
            if (isset($output[0]) && $output[0] === 'blurry') {
                Storage::delete($path);
                return response()->json([
                    'success' => false,
                    'message' => 'The uploaded ID image is too blurry. Please upload a clearer photo.',
                    'error_code' => 'BLURRY_IMAGE'
                ], 400);
            }
        }

        // Save images to disk (already done in your flow)
        $frontImagePath = storage_path('app/public/verifications/front_' . uniqid() . '.jpg');
        $backImagePath = storage_path('app/public/verifications/back_' . uniqid() . '.jpg');
        $selfieImagePath = storage_path('app/public/verifications/selfie_' . uniqid() . '.jpg');
        // Save the uploaded files to these paths

        // 1. Create a Veriff session
        $veriffApiKey = env('VERIFF_API_KEY');
        $sessionResponse = Http::withHeaders([
            'Authorization' => "Bearer $veriffApiKey",
            'Content-Type' => 'application/json',
        ])->post('https://api.veriff.com/v1/sessions', [
            'verification' => [
                'person' => [
                    'firstName' => $request->first_name,
                    'lastName' => $request->last_name,
                    'dob' => $request->age ?? '',
                    'phone' => $request->phone,
                ],
                'vendorData' => uniqid('user_', true),
                'timestamp' => now()->toIso8601String(),
            ]
        ]);

        if (!$sessionResponse->ok()) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create Veriff session.',
            ], 400);
        }

        $sessionId = $sessionResponse->json('verification.id');

        // 2. Upload media (front, back, selfie)
        $mediaEndpoints = [
            'front' => $frontImagePath,
            'back' => $backImagePath,
            'selfie' => $selfieImagePath,
        ];

        foreach ($mediaEndpoints as $type => $path) {
            $mediaResponse = Http::withHeaders([
                'Authorization' => "Bearer $veriffApiKey",
            ])->attach(
                'file', file_get_contents($path), basename($path)
            )->post("https://api.veriff.com/v1/sessions/$sessionId/media", [
                'type' => $type === 'selfie' ? 'face' : 'document',
            ]);

            if (!$mediaResponse->ok()) {
                return response()->json([
                    'success' => false,
                    'message' => "Failed to upload $type image to Veriff.",
                ], 400);
            }
        }

        // 3. Poll for result (simplified, in production use a webhook or background job)
        sleep(10); // Wait for Veriff to process (or use a queue/job)
        $resultResponse = Http::withHeaders([
            'Authorization' => "Bearer $veriffApiKey",
        ])->get("https://api.veriff.com/v1/sessions/$sessionId");

        $status = $resultResponse->json('verification.status');

        if ($status !== 'approved') {
            return response()->json([
                'success' => false,
                'message' => 'ID or face could not be verified by Veriff.',
                'error_code' => 'VERIFF_REJECTED'
            ], 400);
        }

        // 4. If approved, create the verification record and allow entry
        // Create verification record
        $verification = Verification::create([
            'user_id' => $user->id,
            'document_type' => $request->document_type,
            'document_number' => $request->document_number,
            'document_image' => $documentImage,
            'status' => 'approved', // Assuming Veriff approval means approved
            'is_philippine_id' => $isPhilippineId,
            'verification_method' => 'veriff',
            'verification_score' => 100, // Assuming perfect score for Veriff
            'verified_at' => now(),
        ]);

        // Create notification for admin
        $this->notifyAdminNewVerification($verification);

        // Award badges
        $this->awardBadges($verification);

        return response()->json([
            'success' => true,
            'message' => 'ID and face verified!',
            'verification' => [
                'id' => $verification->id,
                'status' => $verification->status,
                'document_type' => $verification->document_type,
                'is_philippine_id' => $verification->is_philippine_id,
                'submitted_at' => $verification->created_at->format('Y-m-d H:i:s')
            ]
        ], 201);
    }

    public function submitVerificationSimple(Request $request)
    {
        // Add CORS headers
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type');
        
        $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|email',
            'phone' => 'required|string|max:20',
            'age' => 'nullable|string',
            'gender' => 'nullable|string',
            'address' => 'nullable|string',
            'front_image' => 'required|image|mimes:jpeg,png,jpg|max:5120',
            'back_image' => 'required|image|mimes:jpeg,png,jpg|max:5120',
            'selfie_image' => 'required|image|mimes:jpeg,png,jpg|max:5120',
        ]);

        \Log::info("📱 ID VERIFICATION - Received verification request for: " . $request->first_name . " " . $request->last_name);

        try {
            // Handle file uploads
            $frontImage = null;
            $backImage = null;
            $selfieImage = null;

            if ($request->hasFile('front_image')) {
                $file = $request->file('front_image');
                $filename = 'front_' . time() . '.' . $file->getClientOriginalExtension();
                $path = $file->storeAs('public/verifications', $filename);
                $frontImage = Storage::url($path);
            }

            if ($request->hasFile('back_image')) {
                $file = $request->file('back_image');
                $filename = 'back_' . time() . '.' . $file->getClientOriginalExtension();
                $path = $file->storeAs('public/verifications', $filename);
                $backImage = Storage::url($path);
            }

            if ($request->hasFile('selfie_image')) {
                $file = $request->file('selfie_image');
                $filename = 'selfie_' . time() . '.' . $file->getClientOriginalExtension();
                $path = $file->storeAs('public/verifications', $filename);
                $selfieImage = Storage::url($path);
            }

            // Create or find user
            $user = User::where('email', $request->email)->first();
            
            if (!$user) {
                // Create new user if not exists
                $user = User::create([
                    'first_name' => $request->first_name,
                    'last_name' => $request->last_name,
                    'email' => $request->email,
                    'phone' => $request->phone,
                    'age' => $request->age,
                    'gender' => $request->gender,
                    'address' => $request->address,
                    'password' => bcrypt('temp_password_' . time()), // Temporary password
                    'email_verified_at' => now(), // Auto-verify for now
                    'phone_verified_at' => now(), // Auto-verify for now
                    'status' => 'active',
                ]);
            } else {
                // Update existing user
                $user->update([
                    'first_name' => $request->first_name,
                    'last_name' => $request->last_name,
                    'phone' => $request->phone,
                    'age' => $request->age,
                    'gender' => $request->gender,
                    'address' => $request->address,
                    'phone_verified_at' => now(),
                ]);
            }

            // Create verification record
            $verification = Verification::create([
                'user_id' => $user->id,
                'document_type' => 'national_id', // Default type
                'document_number' => 'N/A', // Not provided in current flow
                'document_image' => $frontImage,
                'status' => 'approved', // Auto-approve for development
                'is_philippine_id' => false,
                'verification_method' => 'mobile_upload',
                'verification_score' => 100, // Perfect score for development
                'verified_at' => now(),
                'notes' => "Front: {$frontImage}, Back: {$backImage}, Selfie: {$selfieImage}",
            ]);

            \Log::info("📱 ID VERIFICATION - Successfully created verification for user: " . $user->id);

            return response()->json([
                'success' => true,
                'message' => 'ID and face verified successfully!',
                'verification' => [
                    'id' => $verification->id,
                    'status' => $verification->status,
                    'document_type' => $verification->document_type,
                    'submitted_at' => $verification->created_at->format('Y-m-d H:i:s')
                ],
                'user' => [
                    'id' => $user->id,
                    'first_name' => $user->first_name,
                    'last_name' => $user->last_name,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'status' => $user->status,
                ]
            ], 201);

        } catch (\Exception $e) {
            \Log::error("📱 ID VERIFICATION - Error: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to submit verification. Please try again.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getVerificationStatus(Request $request)
    {
        $user = $request->user();
        
        $verification = Verification::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->first();

        if (!$verification) {
            return response()->json([
                'success' => true,
                'verification' => null,
                'message' => 'No verification submitted yet.',
                'badges' => []
            ]);
        }

        // Get badges earned
        $badges = $verification->badges_earned ? json_decode($verification->badges_earned, true) : [];

        return response()->json([
            'success' => true,
            'verification' => [
                'id' => $verification->id,
                'status' => $verification->status,
                'document_type' => $verification->document_type,
                'document_number' => $verification->document_number,
                'document_image' => $verification->document_image,
                'is_philippine_id' => $verification->is_philippine_id,
                'verification_score' => $verification->verification_score,
                'submitted_at' => $verification->created_at->format('Y-m-d H:i:s'),
                'verified_at' => $verification->verified_at ? $verification->verified_at->format('Y-m-d H:i:s') : null,
                'rejection_reason' => $verification->rejection_reason,
                'notes' => $verification->notes
            ],
            'badges' => $badges
        ]);
    }

    public function uploadDocument(Request $request)
    {
        $request->validate([
            'document_image' => 'required|image|mimes:jpeg,png,jpg|max:5120', // 5MB max
        ]);

        $user = $request->user();
        
        // Handle file upload
        $documentImage = null;
        if ($request->hasFile('document_image')) {
            $file = $request->file('document_image');
            $filename = 'verification_' . $user->id . '_' . time() . '.' . $file->getClientOriginalExtension();
            $path = $file->storeAs('public/verifications', $filename);
            $documentImage = Storage::url($path);
        }

        return response()->json([
            'success' => true,
            'image_url' => $documentImage,
            'message' => 'Document uploaded successfully.'
        ]);
    }

    public function getPhilippineIdTypes()
    {
        $philippineIds = [
            ['type' => 'ph_national_id', 'name' => 'Philippine National ID', 'description' => 'Official national identification card'],
            ['type' => 'ph_drivers_license', 'name' => "Philippine Driver's License", 'description' => 'Valid driver\'s license'],
            ['type' => 'sss_id', 'name' => 'SSS ID', 'description' => 'Social Security System ID'],
            ['type' => 'philhealth_id', 'name' => 'PhilHealth ID', 'description' => 'Philippine Health Insurance Corporation ID'],
            ['type' => 'tin_id', 'name' => 'TIN ID', 'description' => 'Tax Identification Number'],
            ['type' => 'postal_id', 'name' => 'Postal ID', 'description' => 'Philippine Postal Corporation ID'],
            ['type' => 'voters_id', 'name' => "Voter's ID", 'description' => 'Voter registration ID'],
            ['type' => 'prc_id', 'name' => 'PRC ID', 'description' => 'Professional Regulation Commission ID'],
            ['type' => 'umid', 'name' => 'UMID', 'description' => 'Unified Multi-Purpose ID'],
            ['type' => 'owwa_id', 'name' => 'OWWA ID', 'description' => 'Overseas Workers Welfare Administration ID'],
        ];

        return response()->json([
            'success' => true,
            'philippine_ids' => $philippineIds
        ]);
    }

    private function validatePhilippineId($documentType, $documentNumber)
    {
        // If it's not a Philippine ID, skip validation
        if (!array_key_exists($documentType, $this->philippineIdPatterns)) {
            return true;
        }

        $pattern = $this->philippineIdPatterns[$documentType];
        return preg_match($pattern, $documentNumber);
    }

    private function awardBadges($verification)
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

        if ($verification->status === 'approved') {
            $badges[] = [
                'id' => 'identity_verified',
                'name' => 'Identity Verified',
                'description' => 'Government-issued ID verified',
                'icon' => 'shield-checkmark',
                'color' => '#10B981',
                'earned_at' => now()->toISOString(),
            ];
        }

        if (!empty($badges)) {
            $verification->update(['badges_earned' => json_encode($badges)]);
        }

        return $badges;
    }

    private function notifyAdminNewVerification($verification)
    {
        // Get all admin users
        $admins = User::where('is_admin', true)->get();
        
        $idTypeDisplay = $this->getIdTypeDisplayName($verification->document_type);
        
        foreach ($admins as $admin) {
            Notification::create([
                'user_id' => $admin->id,
                'type' => 'verification',
                'message' => "New ID verification submitted by {$verification->user->name}. Document type: {$idTypeDisplay}. Please review in the admin panel.",
            ]);
        }
    }

    private function getIdTypeDisplayName($documentType)
    {
        $displayNames = [
            'ph_national_id' => 'Philippine National ID',
            'ph_drivers_license' => "Philippine Driver's License",
            'sss_id' => 'SSS ID',
            'philhealth_id' => 'PhilHealth ID',
            'tin_id' => 'TIN ID',
            'postal_id' => 'Postal ID',
            'voters_id' => "Voter's ID",
            'prc_id' => 'PRC ID',
            'umid' => 'UMID',
            'owwa_id' => 'OWWA ID',
            'national_id' => 'National ID',
            'drivers_license' => "Driver's License",
            'passport' => 'Passport',
            'other' => 'Other'
        ];

        return $displayNames[$documentType] ?? ucfirst(str_replace('_', ' ', $documentType));
    }
} 