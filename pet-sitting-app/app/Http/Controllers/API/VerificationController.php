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
        // Add CORS headers
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
        header('Access-Control-Allow-Credentials: true');
        
        // Handle preflight OPTIONS request
        if ($request->isMethod('OPTIONS')) {
            return response()->json(['success' => true], 200);
        }

        // Enhanced logging for Veriff simulation
        \Log::info('🔔 VERIFF ID VERIFICATION SIMULATION STARTED');
        \Log::info('📄 ID VERIFICATION - Received verification request');
        \Log::info('⏰ Timestamp: ' . now()->format('Y-m-d H:i:s'));
        \Log::info('🌐 Request IP: ' . $request->ip());
        \Log::info('👤 User Agent: ' . $request->userAgent());

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
        
        \Log::info('👤 User ID: ' . $user->id);
        \Log::info('📄 Document Type: ' . $request->document_type);
        \Log::info('🏳️ Is Philippine ID: ' . ($isPhilippineId ? 'Yes' : 'No'));
        
        // Validate Philippine ID number format if provided
        if ($isPhilippineId && $request->filled('document_number')) {
            if (!$this->validatePhilippineId($request->document_type, $request->document_number)) {
                \Log::error('❌ INVALID ID FORMAT - Document type: ' . $request->document_type . ', Number: ' . $request->document_number);
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
            \Log::warning('⚠️ DUPLICATE VERIFICATION - User already has verification with status: ' . $existingVerification->status);
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

            \Log::info('📸 IMAGE UPLOADED - File: ' . $filename);
            \Log::info('📁 Storage Path: ' . $path);

            // --- Blurriness Detection ---
            $python = '/usr/bin/python3'; // Adjust if needed
            $script = base_path('blur_detector.py');
            $output = null;
            $return_var = null;
            exec("$python $script " . escapeshellarg(storage_path('app/' . $path)), $output, $return_var);
            if (isset($output[0]) && $output[0] === 'blurry') {
                \Log::error('❌ BLURRY IMAGE DETECTED - File: ' . $filename);
                Storage::delete($path);
                return response()->json([
                    'success' => false,
                    'message' => 'The uploaded ID image is too blurry. Please upload a clearer photo.',
                    'error_code' => 'BLURRY_IMAGE'
                ], 400);
            }
            \Log::info('✅ IMAGE QUALITY CHECK PASSED - File: ' . $filename);
        }

        // Simulate Veriff API call
        $veriffApiKey = env('VERIFF_API_KEY');
        \Log::info('🔑 VERIFF API KEY: ' . ($veriffApiKey ? 'Present' : 'Missing'));
        
        // Simulate Veriff session creation
        \Log::info('🎭 VERIFF SIMULATION - Creating session...');
        sleep(2); // Simulate API delay
        
        // Simulate Veriff response (90% success rate for demo)
        $veriffSuccess = rand(1, 100) <= 90;
        
        if (!$veriffSuccess) {
            \Log::error('❌ VERIFF SIMULATION FAILED - Document verification rejected');
            return response()->json([
                'success' => false,
                'message' => 'ID verification failed. Please ensure your document is clear and valid.',
                'error_code' => 'VERIFF_REJECTED',
                'simulation_mode' => true,
                'timestamp' => now()->format('Y-m-d H:i:s'),
                'document_type' => $request->document_type,
                'is_philippine_id' => $isPhilippineId
            ], 400);
        }

        \Log::info('✅ VERIFF SIMULATION SUCCESS - Document verified successfully');

        // Create verification record
        $verification = Verification::create([
            'user_id' => $user->id,
            'document_type' => $request->document_type,
            'document_number' => $request->document_number,
            'document_image' => $documentImage,
            'status' => 'approved',
            'is_philippine_id' => $isPhilippineId,
            'verification_method' => 'veriff_simulation',
            'verification_score' => rand(85, 100), // Random score between 85-100
            'verified_at' => now(),
        ]);

        \Log::info('💾 VERIFICATION RECORD CREATED - ID: ' . $verification->id);
        \Log::info('📊 Verification Score: ' . $verification->verification_score);

        // Create notification for admin
        $this->notifyAdminNewVerification($verification);

        // Award badges
        $this->awardBadges($verification);

        \Log::info('🎉 ID VERIFICATION COMPLETED SUCCESSFULLY');

        return response()->json([
            'success' => true,
            'message' => 'ID and face verified successfully!',
            'verification' => [
                'id' => $verification->id,
                'status' => $verification->status,
                'document_type' => $verification->document_type,
                'is_philippine_id' => $verification->is_philippine_id,
                'verification_score' => $verification->verification_score,
                'submitted_at' => $verification->created_at->format('Y-m-d H:i:s')
            ],
            'simulation_mode' => true,
            'timestamp' => now()->format('Y-m-d H:i:s'),
            'veriff_api_key_present' => !empty($veriffApiKey)
        ], 201);
    }

    public function submitVerificationSimple(Request $request)
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

        // Enhanced logging for Veriff simulation
        \Log::info('🔔 VERIFF ID VERIFICATION SIMULATION STARTED');
        \Log::info('📄 ID VERIFICATION - Received verification request');
        \Log::info('⏰ Timestamp: ' . now()->format('Y-m-d H:i:s'));
        \Log::info('🌐 Request IP: ' . $request->ip());
        \Log::info('👤 User Agent: ' . $request->userAgent());

        $request->validate([
            'document_type' => 'required|string',
            'document_image' => 'required|string', // Base64 or URL
            'first_name' => 'required|string',
            'last_name' => 'required|string',
            'email' => 'required|email',
            'phone' => 'required|string',
        ]);

        \Log::info('📄 Document Type: ' . $request->document_type);
        \Log::info('📸 Image provided: ' . ($request->document_image ? 'Yes' : 'No'));
        \Log::info('👤 User: ' . $request->first_name . ' ' . $request->last_name);
        \Log::info('📧 Email: ' . $request->email);
        \Log::info('📱 Phone: ' . $request->phone);

        // Simulate Veriff API call
        \Log::info('🎭 VERIFF SIMULATION - Creating session...');
        sleep(2); // Simulate API delay
        
        // Simulate Veriff response (90% success rate for demo)
        $veriffSuccess = rand(1, 100) <= 90;
        
        if (!$veriffSuccess) {
            \Log::error('❌ VERIFF SIMULATION FAILED - Document verification rejected');
            return response()->json([
                'success' => false,
                'message' => 'ID verification failed. Please ensure your document is clear and valid.',
                'error_code' => 'VERIFF_REJECTED',
                'simulation_mode' => true,
                'timestamp' => now()->format('Y-m-d H:i:s'),
                'document_type' => $request->document_type
            ], 400);
        }

        \Log::info('✅ VERIFF SIMULATION SUCCESS - Document verified successfully');

        // Create a mock verification record
        $verificationId = time();
        $verificationScore = rand(85, 100);

        \Log::info('💾 VERIFICATION RECORD CREATED - ID: ' . $verificationId);
        \Log::info('📊 Verification Score: ' . $verificationScore);
        \Log::info('🎉 ID VERIFICATION COMPLETED SUCCESSFULLY');

        return response()->json([
            'success' => true,
            'message' => 'ID and face verified successfully!',
            'verification' => [
                'id' => $verificationId,
                'status' => 'approved',
                'document_type' => $request->document_type,
                'is_philippine_id' => strpos($request->document_type, 'ph_') === 0,
                'verification_score' => $verificationScore,
                'submitted_at' => now()->format('Y-m-d H:i:s')
            ],
            'user' => [
                'first_name' => $request->first_name,
                'last_name' => $request->last_name,
                'email' => $request->email,
                'phone' => $request->phone,
                'age' => $request->age ?? '',
                'gender' => $request->gender ?? '',
                'address' => $request->address ?? '',
            ],
            'simulation_mode' => true,
            'timestamp' => now()->format('Y-m-d H:i:s'),
            'veriff_api_key_present' => false
        ], 201);
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