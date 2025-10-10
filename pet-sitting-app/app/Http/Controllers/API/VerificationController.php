<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Verification;
use App\Models\User;
use App\Models\Notification;
use App\Services\VeriffService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Http;

class VerificationController extends Controller
{
    private $veriffService;

    public function __construct(VeriffService $veriffService)
    {
        $this->veriffService = $veriffService;
    }

    public function submitEnhancedVerification(Request $request)
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
        
        \Log::info('🔔 ENHANCED ID VERIFICATION SUBMISSION STARTED');
        
        // Debug authentication
        $user = $request->user();
        $authHeader = $request->header('Authorization');
        $bearerToken = $request->bearerToken();
        
        \Log::info('🔐 AUTH DEBUG - User from request:', ['user' => $user ? $user->toArray() : null]);
        \Log::info('🔐 AUTH DEBUG - Authorization header:', ['header' => $authHeader]);
        \Log::info('🔐 AUTH DEBUG - Bearer token present:', ['present' => $bearerToken ? 'YES' : 'NO']);
        \Log::info('🔐 AUTH DEBUG - Bearer token (first 10 chars):', ['token' => $bearerToken ? substr($bearerToken, 0, 10) . '...' : 'NONE']);
        \Log::info('🔐 AUTH DEBUG - All headers:', ['headers' => $request->headers->all()]);
        
        if (!$user) {
            \Log::error('❌ AUTH ERROR - No authenticated user found');
            return response()->json([
                'success' => false,
                'message' => 'Authentication required. Please log in and try again.',
                'error' => 'unauthenticated'
            ], 401);
        }
        \Log::info('📄 ENHANCED VERIFICATION - Received enhanced verification request');
        \Log::info('⏰ Timestamp: ' . now()->format('Y-m-d H:i:s'));
        \Log::info('🌐 Request IP: ' . $request->ip());

        $validDocumentTypes = [
            'national_id', 'drivers_license', 'passport', 'other',
            'ph_national_id', 'ph_drivers_license', 'sss_id', 'philhealth_id', 
            'tin_id', 'postal_id', 'voters_id', 'prc_id', 'umid', 'owwa_id'
        ];

        $rules = [
            'front_id_image' => 'required|string',
            'back_id_image' => 'required|string',
            'selfie_image' => 'required|string',
            'selfie_latitude' => 'required|numeric|between:-90,90',
            'selfie_longitude' => 'required|numeric|between:-180,180',
            'selfie_address' => 'required|string|max:500',
            'location_accuracy' => 'required|numeric|min:0',
            'document_type' => 'required|string|in:' . implode(',', $validDocumentTypes),
        ];

        $request->validate($rules);

        $user = $request->user();
        
        \Log::info('👤 User ID: ' . $user->id);
        \Log::info('📄 Document Type: ' . $request->document_type);
        \Log::info('📍 Location: ' . $request->selfie_address);
        
        // Check if user already has a pending verification (allow resubmission if approved or skipped)
        $existingVerification = Verification::where('user_id', $user->id)
            ->where(function($query) {
                $query->whereIn('verification_status', ['pending', 'under_review'])
                      ->orWhere('status', 'pending');
            })
            ->where('status', '!=', 'skipped') // Allow resubmission if previously skipped
            ->first();
            
        if ($existingVerification) {
            \Log::warning('⚠️ DUPLICATE ENHANCED VERIFICATION - User already has verification with status: ' . $existingVerification->verification_status);
            return response()->json([
                'success' => false,
                'message' => 'You already have a verification request in progress.',
                'status' => $existingVerification->verification_status
            ], 400);
        }

        // Check if user has a skipped verification that we can update instead of creating new one
        $skippedVerification = Verification::where('user_id', $user->id)
            ->where('status', 'skipped')
            ->where('document_type', 'skipped')
            ->first();

        // Check if this is a resubmission
        $isResubmission = $request->input('is_resubmission', false);
        $rejectedVerification = null;
        
        if ($isResubmission) {
            $rejectedVerification = Verification::where('user_id', $user->id)
                ->where('status', 'rejected')
                ->where('allow_resubmission', true)
                ->orderBy('created_at', 'desc')
                ->first();
                
            if (!$rejectedVerification) {
                return response()->json([
                    'success' => false,
                    'message' => 'No rejected verification found that allows resubmission.',
                    'error_code' => 'NO_RESUBMISSION_ALLOWED'
                ], 400);
            }
        }

        // Handle file uploads (convert base64 to files)
        $frontIdPath = $this->saveBase64Image($request->front_id_image, 'front_id_' . $user->id);
        $backIdPath = $this->saveBase64Image($request->back_id_image, 'back_id_' . $user->id);
        $selfiePath = $this->saveBase64Image($request->selfie_image, 'selfie_' . $user->id);

        if (!$frontIdPath || !$backIdPath || !$selfiePath) {
            \Log::error('❌ IMAGE SAVE FAILED - Could not save verification images');
            return response()->json([
                'success' => false,
                'message' => 'Failed to save verification images. Please try again.',
                'error_code' => 'IMAGE_SAVE_FAILED'
            ], 500);
        }

        // Calculate review deadline (24 hours from now)
        $reviewDeadline = now()->addHours(24);

        // Create or update verification record
        if ($isResubmission && $rejectedVerification) {
            // Update existing rejected verification for resubmission
            \Log::info('🔄 RESUBMISSION - Updating rejected verification for resubmission');
            $verification = $rejectedVerification;
            $verification->update([
                'document_type' => $request->document_type,
                'front_id_image' => $frontIdPath,
                'back_id_image' => $backIdPath,
                'selfie_image' => $selfiePath,
                'selfie_latitude' => $request->selfie_latitude,
                'selfie_longitude' => $request->selfie_longitude,
                'selfie_address' => $request->selfie_address,
                'location_accuracy' => $request->location_accuracy,
                'verification_status' => 'pending',
                'review_deadline' => $reviewDeadline,
                'status' => 'pending',
                'is_philippine_id' => in_array($request->document_type, [
                    'ph_national_id', 'ph_drivers_license', 'sss_id', 'philhealth_id', 
                    'tin_id', 'postal_id', 'voters_id', 'prc_id', 'umid', 'owwa_id'
                ]),
                'verification_method' => 'enhanced_manual',
                'notes' => 'Resubmission: Enhanced verification with front ID, back ID, selfie, and location verification',
                'rejection_reason' => null, // Clear previous rejection reason
                'rejection_category' => null, // Clear previous rejection category
                'allow_resubmission' => null, // Clear resubmission flag
            ]);
        } elseif ($skippedVerification) {
            // Update existing skipped verification instead of creating new one
            \Log::info('🔄 UPDATING SKIPPED VERIFICATION - Converting skipped verification to real submission');
            $verification = $skippedVerification;
            $verification->update([
                'document_type' => $request->document_type,
                'front_id_image' => $frontIdPath,
                'back_id_image' => $backIdPath,
                'selfie_image' => $selfiePath,
                'selfie_latitude' => $request->selfie_latitude,
                'selfie_longitude' => $request->selfie_longitude,
                'selfie_address' => $request->selfie_address,
                'location_accuracy' => $request->location_accuracy,
                'verification_status' => 'pending',
                'review_deadline' => $reviewDeadline,
                'status' => 'pending',
                'is_philippine_id' => in_array($request->document_type, [
                    'ph_national_id', 'ph_drivers_license', 'sss_id', 'philhealth_id', 
                    'tin_id', 'postal_id', 'voters_id', 'prc_id', 'umid', 'owwa_id'
                ]),
                'verification_method' => 'enhanced_manual',
                'notes' => 'Enhanced verification with front ID, back ID, selfie, and location verification',
            ]);
        } else {
            // Create new verification record
            $verification = Verification::create([
                'user_id' => $user->id,
                'document_type' => $request->document_type,
                'front_id_image' => $frontIdPath,
                'back_id_image' => $backIdPath,
                'selfie_image' => $selfiePath,
                'selfie_latitude' => $request->selfie_latitude,
                'selfie_longitude' => $request->selfie_longitude,
                'selfie_address' => $request->selfie_address,
                'location_accuracy' => $request->location_accuracy,
                'verification_status' => 'pending',
                'review_deadline' => $reviewDeadline,
                'status' => 'pending',
                'is_philippine_id' => in_array($request->document_type, [
                    'ph_national_id', 'ph_drivers_license', 'sss_id', 'philhealth_id', 
                    'tin_id', 'postal_id', 'voters_id', 'prc_id', 'umid', 'owwa_id'
                ]),
                'verification_method' => 'enhanced_manual',
                'notes' => 'Enhanced verification with front ID, back ID, selfie, and location verification',
            ]);
        }

        // Create notification for user
        $notificationMessage = $isResubmission 
            ? 'Your ID verification resubmission has been submitted and is under review. You will be notified within 24 hours of the admin\'s decision.'
            : 'Your enhanced ID verification has been submitted and is under review. You will be notified within 24 hours of the admin\'s decision. You cannot start jobs until your verification is approved.';
            
        Notification::create([
            'user_id' => $user->id,
            'type' => 'verification',
            'title' => 'Verification Submitted',
            'message' => $notificationMessage,
        ]);

        // Notify all admins
        $adminMessage = $isResubmission 
            ? "ID verification resubmission by {$user->name} ({$user->email}). Review deadline: {$reviewDeadline->format('M d, Y H:i')}"
            : "New enhanced verification submitted by {$user->name} ({$user->email}). Review deadline: {$reviewDeadline->format('M d, Y H:i')}";
            
        $admins = User::where('is_admin', true)->get();
        foreach ($admins as $admin) {
            Notification::create([
                'user_id' => $admin->id,
                'type' => 'admin',
                'title' => 'New Verification Request',
                'message' => $adminMessage,
            ]);
        }

        \Log::info('✅ ENHANCED VERIFICATION CREATED - ID: ' . $verification->id);
        \Log::info('⏰ Review Deadline: ' . $reviewDeadline->format('Y-m-d H:i:s'));

        $responseMessage = $isResubmission 
            ? 'ID verification resubmission submitted successfully. You will be notified within 24 hours of the admin\'s decision.'
            : 'Enhanced verification submitted successfully. You will be notified within 24 hours of the admin\'s decision.';
            
        return response()->json([
            'success' => true,
            'message' => $responseMessage,
            'verification' => [
                'id' => $verification->id,
                'status' => $verification->verification_status,
                'review_deadline' => $reviewDeadline->format('Y-m-d H:i:s'),
            ],
            'review_deadline' => $reviewDeadline->format('Y-m-d H:i:s'),
        ]);
    }

    private function saveBase64Image($base64String, $filename)
    {
        try {
            // Remove data URL prefix if present
            if (strpos($base64String, 'data:image') === 0) {
                $base64String = substr($base64String, strpos($base64String, ',') + 1);
            }

            // Decode base64
            $imageData = base64_decode($base64String);
            if ($imageData === false) {
                \Log::error('❌ BASE64 DECODE FAILED for ' . $filename);
                return null;
            }

            // Generate unique filename
            $extension = 'jpg'; // Default to jpg
            $fullFilename = $filename . '_' . time() . '.' . $extension;
            $path = 'verifications/' . $fullFilename;

            // Save to public storage
            if (Storage::disk('public')->put($path, $imageData)) {
                \Log::info('✅ IMAGE SAVED: ' . $path);
                return $path;
            } else {
                \Log::error('❌ STORAGE PUT FAILED for ' . $path);
                return null;
            }
        } catch (\Exception $e) {
            \Log::error('❌ IMAGE SAVE EXCEPTION: ' . $e->getMessage());
            return null;
        }
    }

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
            if (!$this->veriffService->validatePhilippineId($request->document_type, $request->document_number)) {
                \Log::error('❌ INVALID ID FORMAT - Document type: ' . $request->document_type . ', Number: ' . $request->document_number);
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid ID number format for the selected document type.',
                    'error_code' => 'INVALID_ID_FORMAT'
                ], 400);
            }
        }
        
        // Check if user already has a pending verification (allow resubmission if approved or skipped)
        $existingVerification = Verification::where('user_id', $user->id)
            ->whereIn('status', ['pending'])
            ->where('status', '!=', 'skipped') // Allow resubmission if previously skipped
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

        // Use Veriff for ID verification
        $veriffConfigured = $this->veriffService->isConfigured();
        \Log::info('🔑 VERIFF CONFIGURATION: ' . ($veriffConfigured ? 'Configured' : 'Not Configured'));
        
        if ($veriffConfigured) {
            // Create Veriff session
            $userData = [
                'user_id' => $user->id,
                'first_name' => $user->first_name ?? $user->name,
                'last_name' => $user->last_name ?? '',
                'document_type' => $request->document_type,
                'id_number' => $request->document_number,
            ];
            
            $veriffSession = $this->veriffService->createSession($userData);
            
            if (!$veriffSession) {
                \Log::error('❌ VERIFF SESSION CREATION FAILED');
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to create verification session. Please try again.',
                    'error_code' => 'VERIFF_SESSION_FAILED'
                ], 500);
            }
            
            \Log::info('✅ VERIFF SESSION CREATED - Session ID: ' . $veriffSession['verification']['id']);
            
            // Store session ID for later verification
            $sessionId = $veriffSession['verification']['id'];
            $verificationUrl = $veriffSession['verification']['url'] ?? null;
            
            // Create verification record with pending status
            $verification = Verification::create([
                'user_id' => $user->id,
                'document_type' => $request->document_type,
                'document_number' => $request->document_number,
                'document_image' => $documentImage,
                'status' => 'pending',
                'is_philippine_id' => $isPhilippineId,
                'verification_method' => 'veriff',
                'verification_score' => null,
                'extracted_data' => json_encode([
                    'veriff_session_id' => $sessionId,
                    'verification_url' => $verificationUrl
                ])
            ]);
            
            \Log::info('💾 VERIFICATION RECORD CREATED - ID: ' . $verification->id);
            
            return response()->json([
                'success' => true,
                'message' => 'Verification session created. Please complete the verification process.',
                'verification' => [
                    'id' => $verification->id,
                    'status' => $verification->status,
                    'document_type' => $verification->document_type,
                    'is_philippine_id' => $verification->is_philippine_id,
                    'veriff_session_id' => $sessionId,
                    'verification_url' => $verificationUrl,
                    'submitted_at' => $verification->created_at->format('Y-m-d H:i:s')
                ],
                'veriff_enabled' => true,
                'timestamp' => now()->format('Y-m-d H:i:s')
            ], 201);
        } else {
            // Fallback to simulation mode
            \Log::info('🎭 VERIFF SIMULATION MODE - Creating session...');
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
        }

        // Create Veriff session ID for tracking
        $veriffSessionId = 'veriff_' . uniqid() . '_' . time();
        
        // Create verification record with pending status
        $verification = Verification::create([
            'user_id' => $user->id,
            'document_type' => $request->document_type,
            'document_number' => $request->document_number,
            'document_image' => $documentImage,
            'status' => 'pending', // Start as pending, will be updated by Veriff webhook
            'is_philippine_id' => $isPhilippineId,
            'verification_method' => 'veriff_ai',
            'extracted_data' => json_encode([
                'veriff_session_id' => $veriffSessionId,
                'submitted_at' => now()->toISOString(),
                'verification_url' => 'https://veriff.me/session/' . $veriffSessionId,
                'status' => 'processing'
            ])
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
            'message' => 'ID verification submitted successfully! Veriff is processing your document.',
            'verification' => [
                'id' => $verification->id,
                'status' => $verification->status,
                'document_type' => $verification->document_type,
                'is_philippine_id' => $verification->is_philippine_id,
                'veriff_session_id' => $veriffSessionId,
                'verification_url' => 'https://veriff.me/session/' . $veriffSessionId,
                'submitted_at' => $verification->created_at->format('Y-m-d H:i:s')
            ],
            'veriff_enabled' => true,
            'verification_url' => 'https://veriff.me/session/' . $veriffSessionId,
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

        \Log::info('🔔 SIMPLE VERIFICATION SUBMISSION STARTED');
        \Log::info('📄 SIMPLE VERIFICATION - Received verification request');
        \Log::info('⏰ Timestamp: ' . now()->format('Y-m-d H:i:s'));
        \Log::info('🌐 Request IP: ' . $request->ip());
        \Log::info('👤 User Agent: ' . $request->userAgent());
        
        // Debug authentication
        $user = $request->user();
        \Log::info('🔐 AUTH DEBUG - User from request:', ['user' => $user ? $user->toArray() : null]);
        \Log::info('🔐 AUTH DEBUG - Authorization header:', ['header' => $request->header('Authorization')]);
        \Log::info('🔐 AUTH DEBUG - Bearer token present:', ['present' => $request->bearerToken() ? 'YES' : 'NO']);
        
        if (!$user) {
            \Log::error('❌ AUTH ERROR - No authenticated user found');
            return response()->json([
                'success' => false,
                'message' => 'Authentication required. Please log in and try again.',
                'error' => 'unauthenticated'
            ], 401);
        }

        $request->validate([
            'document_type' => 'required|string',
            'document_image' => 'nullable|string', // Base64 image - made optional
            'first_name' => 'required|string',
            'last_name' => 'required|string',
            'phone' => 'required|string',
            'front_image' => 'required|string', // Base64 image - made required (this is the main document)
            'back_image' => 'required|string', // Base64 image - made required
            'selfie_image' => 'required|string', // Base64 image - made required
            'selfie_latitude' => 'nullable|numeric|between:-90,90',
            'selfie_longitude' => 'nullable|numeric|between:-180,180',
            'selfie_address' => 'nullable|string|max:500',
            'location_accuracy' => 'nullable|numeric|min:0',
        ]);

        \Log::info('📄 Document Type: ' . $request->document_type);
        \Log::info('📸 Document Image provided: ' . ($request->document_image ? 'Yes' : 'No'));
        \Log::info('📸 Front Image provided: ' . ($request->front_image ? 'Yes' : 'No'));
        \Log::info('📸 Back Image provided: ' . ($request->back_image ? 'Yes' : 'No'));
        \Log::info('📸 Selfie Image provided: ' . ($request->selfie_image ? 'Yes' : 'No'));
        \Log::info('📍 Location provided: ' . ($request->selfie_address ? 'Yes' : 'No'));
        \Log::info('👤 User: ' . $request->first_name . ' ' . $request->last_name);
        \Log::info('📱 Phone: ' . $request->phone);

        // Check if user already has a pending verification (allow resubmission if approved or skipped)
        $existingVerification = Verification::where('user_id', $user->id)
            ->where(function($query) {
                $query->whereIn('verification_status', ['pending', 'under_review'])
                      ->orWhere('status', 'pending');
            })
            ->where('status', '!=', 'skipped') // Allow resubmission if previously skipped
            ->first();
            
        if ($existingVerification) {
            \Log::warning('⚠️ DUPLICATE VERIFICATION - User already has verification with status: ' . $existingVerification->verification_status);
            return response()->json([
                'success' => false,
                'message' => 'You already have a verification request in progress.',
                'status' => $existingVerification->verification_status
            ], 400);
        }

        // Handle file uploads (convert base64 to files)
        $documentImagePath = null;
        $frontIdPath = null;
        $backIdPath = null;
        $selfiePath = null;

        // Save document image (use front_image as document if no separate document_image provided)
        $documentImagePath = null;
        if ($request->document_image) {
            $documentImagePath = $this->saveBase64Image($request->document_image, 'document_' . $user->id);
            if (!$documentImagePath) {
                \Log::error('❌ DOCUMENT IMAGE SAVE FAILED');
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to save document image. Please try again.',
                    'error_code' => 'DOCUMENT_IMAGE_SAVE_FAILED'
                ], 500);
            }
        } else {
            // Use front_image as the document image
            \Log::info('📸 Using front_image as document_image');
        }

        // Save front ID image
        if ($request->front_image) {
            $frontIdPath = $this->saveBase64Image($request->front_image, 'front_id_' . $user->id);
            if (!$frontIdPath) {
                \Log::error('❌ FRONT ID IMAGE SAVE FAILED');
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to save front ID image. Please try again.',
                    'error_code' => 'FRONT_ID_IMAGE_SAVE_FAILED'
                ], 500);
            }
        }

        // Save back ID image
        if ($request->back_image) {
            $backIdPath = $this->saveBase64Image($request->back_image, 'back_id_' . $user->id);
            if (!$backIdPath) {
                \Log::error('❌ BACK ID IMAGE SAVE FAILED');
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to save back ID image. Please try again.',
                    'error_code' => 'BACK_ID_IMAGE_SAVE_FAILED'
                ], 500);
            }
        }

        // Save selfie image
        if ($request->selfie_image) {
            $selfiePath = $this->saveBase64Image($request->selfie_image, 'selfie_' . $user->id);
            if (!$selfiePath) {
                \Log::error('❌ SELFIE IMAGE SAVE FAILED');
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to save selfie image. Please try again.',
                    'error_code' => 'SELFIE_IMAGE_SAVE_FAILED'
                ], 500);
            }
        }

        // Calculate review deadline (24 hours from now)
        $reviewDeadline = now()->addHours(24);

        // Create verification record with all data
        $verification = Verification::create([
            'user_id' => $user->id,
            'document_type' => $request->document_type,
            'document_number' => $request->document_number ?? null,
            'document_image' => $documentImagePath ?: $frontIdPath, // Use front_image as document if no separate document
            'front_id_image' => $frontIdPath,
            'back_id_image' => $backIdPath,
            'selfie_image' => $selfiePath,
            'selfie_latitude' => $request->selfie_latitude,
            'selfie_longitude' => $request->selfie_longitude,
            'selfie_address' => $request->selfie_address,
            'location_accuracy' => $request->location_accuracy,
            'verification_status' => 'pending',
            'review_deadline' => $reviewDeadline,
            'status' => 'pending',
            'is_philippine_id' => strpos($request->document_type, 'ph_') === 0,
            'verification_method' => 'simple_manual',
            'notes' => 'Simple verification with document, front ID, back ID, selfie, and location data',
        ]);

        \Log::info('✅ VERIFICATION RECORD CREATED - ID: ' . $verification->id);
        \Log::info('📸 Images saved - Document: ' . ($documentImagePath ? 'Yes' : 'No') . 
                   ', Front: ' . ($frontIdPath ? 'Yes' : 'No') . 
                   ', Back: ' . ($backIdPath ? 'Yes' : 'No') . 
                   ', Selfie: ' . ($selfiePath ? 'Yes' : 'No'));
        \Log::info('📍 Location saved - Address: ' . ($request->selfie_address ? 'Yes' : 'No') . 
                   ', Lat/Lng: ' . ($request->selfie_latitude ? 'Yes' : 'No'));

        return response()->json([
            'success' => true,
            'message' => 'Verification submitted successfully! An admin will review it within 24 hours.',
            'verification' => [
                'id' => $verification->id,
                'status' => 'pending',
                'verification_status' => 'pending',
                'document_type' => $request->document_type,
                'is_philippine_id' => strpos($request->document_type, 'ph_') === 0,
                'submitted_at' => now()->format('Y-m-d H:i:s'),
                'review_deadline' => $reviewDeadline->format('Y-m-d H:i:s'),
                'has_images' => [
                    'document' => !is_null($documentImagePath),
                    'front_id' => !is_null($frontIdPath),
                    'back_id' => !is_null($backIdPath),
                    'selfie' => !is_null($selfiePath),
                ],
                'has_location' => !is_null($request->selfie_address),
            ],
            'user' => [
                'first_name' => $request->first_name,
                'last_name' => $request->last_name,
                'phone' => $request->phone,
            ],
            'timestamp' => now()->format('Y-m-d H:i:s')
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
                'verification_status' => $verification->verification_status,
                'document_type' => $verification->document_type,
                'document_number' => $verification->document_number,
                'document_image' => $verification->document_image,
                'is_philippine_id' => $verification->is_philippine_id,
                'is_legit_sitter' => $verification->is_legit_sitter,
                'verification_score' => $verification->verification_score,
                'submitted_at' => $verification->created_at->format('Y-m-d H:i:s'),
                'verified_at' => $verification->verified_at ? $verification->verified_at->format('Y-m-d H:i:s') : null,
                'review_deadline' => $verification->review_deadline ? $verification->review_deadline->format('Y-m-d H:i:s') : null,
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
        $philippineIds = $this->veriffService->getPhilippineIdPatterns();
        
        $formattedIds = [];
        foreach ($philippineIds as $type => $data) {
            $formattedIds[] = [
                'type' => $type,
                'name' => $data['description'],
                'description' => $data['description'],
                'pattern' => $data['pattern'],
                'placeholder' => $data['placeholder']
            ];
        }

        return response()->json([
            'success' => true,
            'philippine_ids' => $formattedIds
        ]);
    }

    /**
     * Handle Veriff webhook callbacks
     */
    public function handleVeriffWebhook(Request $request)
    {
        \Log::info('🔔 VERIFF WEBHOOK RECEIVED', [
            'headers' => $request->headers->all(),
            'body' => $request->all()
        ]);

        // Validate webhook signature
        $signature = $request->header('X-HMAC-SIGNATURE');
        $payload = $request->getContent();
        
        if (!$this->veriffService->validateWebhookSignature($payload, $signature)) {
            \Log::error('❌ VERIFF WEBHOOK SIGNATURE INVALID');
            return response()->json(['error' => 'Invalid signature'], 401);
        }

        // Process webhook data
        $webhookData = $this->veriffService->processWebhook($request->all());
        
        // Find verification by session ID
        $verification = Verification::where('extracted_data->veriff_session_id', $webhookData['session_id'])->first();
        
        if (!$verification) {
            \Log::error('❌ VERIFICATION NOT FOUND - Session ID: ' . $webhookData['session_id']);
            return response()->json(['error' => 'Verification not found'], 404);
        }

        // Update verification status based on Veriff decision
        $status = 'rejected';
        $verificationScore = null;
        $rejectionReason = null;
        $verifiedBy = null;

        if ($webhookData['status'] === 'approved') {
            $status = 'approved';
            $verificationScore = $webhookData['verification_score'] ?? rand(85, 100);
            $verifiedBy = 'veriff_ai';
        } else {
            $rejectionReason = $webhookData['reason'] ?? 'Verification failed';
        }

        // Get detected document information from Veriff
        $detectedDocumentType = $webhookData['detected_document_type'] ?? $verification->document_type;
        $detectedDocumentName = $webhookData['detected_document_name'] ?? $this->getIdTypeDisplayName($verification->document_type);
        $documentCountry = $webhookData['document_country'] ?? 'PHL';

        // Update verification record with detected information
        $verification->update([
            'status' => $status,
            'verification_score' => $verificationScore,
            'rejection_reason' => $rejectionReason,
            'verified_at' => $status === 'approved' ? now() : null,
            'verified_by' => $verifiedBy,
            'document_type' => $detectedDocumentType, // Update with detected type
            'extracted_data' => json_encode(array_merge(
                json_decode($verification->extracted_data, true) ?? [],
                [
                    'veriff_decision' => $webhookData,
                    'detected_document_type' => $detectedDocumentType,
                    'detected_document_name' => $detectedDocumentName,
                    'document_country' => $documentCountry,
                    'processed_at' => now()->toISOString(),
                    'verification_method' => 'veriff_ai'
                ]
            ))
        ]);

        // Update user verification status
        $user = $verification->user;
        if ($status === 'approved') {
            $user->update([
                'id_verified' => true,
                'id_verified_at' => now(),
                'verification_status' => 'verified',
                'can_accept_bookings' => true, // Enable booking acceptance
            ]);
        } else {
            $user->update([
                'verification_status' => 'rejected',
                'can_accept_bookings' => false,
            ]);
        }

        // Award badges if approved
        if ($status === 'approved') {
            $this->awardBadges($verification);
        }

        // Create comprehensive admin notifications
        $this->notifyAdminVerificationCompleted($verification, $webhookData);

        // Create audit log entry
        $this->createVerificationAuditLog($verification, $webhookData);

        \Log::info('✅ VERIFF WEBHOOK PROCESSED', [
            'session_id' => $webhookData['session_id'],
            'status' => $status,
            'verification_id' => $verification->id,
            'user_id' => $user->id,
            'verification_score' => $verificationScore,
            'detected_document_type' => $detectedDocumentType,
            'detected_document_name' => $detectedDocumentName
        ]);

        return response()->json(['success' => true]);
    }

    /**
     * Get verification session status
     */
    public function getVerificationSessionStatus(Request $request)
    {
        $user = $request->user();
        
        $verification = Verification::where('user_id', $user->id)
            ->where('verification_method', 'veriff')
            ->orderBy('created_at', 'desc')
            ->first();

        if (!$verification) {
            return response()->json([
                'success' => false,
                'message' => 'No Veriff verification session found'
            ], 404);
        }

        $extractedData = json_decode($verification->extracted_data, true);
        $sessionId = $extractedData['veriff_session_id'] ?? null;

        if (!$sessionId) {
            return response()->json([
                'success' => false,
                'message' => 'No Veriff session ID found'
            ], 404);
        }

        // Get status from Veriff
        $sessionStatus = $this->veriffService->getSessionStatus($sessionId);
        
        if (!$sessionStatus) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get session status from Veriff'
            ], 500);
        }

        return response()->json([
            'success' => true,
            'session_status' => $sessionStatus,
            'verification' => [
                'id' => $verification->id,
                'status' => $verification->status,
                'document_type' => $verification->document_type,
                'submitted_at' => $verification->created_at->format('Y-m-d H:i:s')
            ]
        ]);
    }

    public function skipVerification(Request $request)
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

        \Log::info('🔔 ID VERIFICATION SKIP REQUEST');
        \Log::info('📄 ID VERIFICATION - User chose to skip verification');
        \Log::info('⏰ Timestamp: ' . now()->format('Y-m-d H:i:s'));
        \Log::info('🌐 Request IP: ' . $request->ip());

        $user = $request->user();
        
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not authenticated'
            ], 401);
        }

        \Log::info('👤 User ID: ' . $user->id);
        \Log::info('👤 User Email: ' . $user->email);

        // Check if user already has a verification record
        $existingVerification = Verification::where('user_id', $user->id)->first();
        
        if ($existingVerification) {
            \Log::info('⚠️ User already has verification record - ID: ' . $existingVerification->id);
            return response()->json([
                'success' => true,
                'message' => 'Verification status already recorded',
                'verification' => [
                    'id' => $existingVerification->id,
                    'status' => $existingVerification->status,
                    'document_type' => $existingVerification->document_type,
                    'submitted_at' => $existingVerification->created_at->format('Y-m-d H:i:s')
                ]
            ]);
        }

        // Create a verification record with 'skipped' status
        $verification = Verification::create([
            'user_id' => $user->id,
            'document_type' => 'skipped',
            'document_number' => null,
            'document_image' => null,
            'status' => 'skipped',
            'is_philippine_id' => false,
            'verification_method' => 'manual_skip',
            'verification_score' => null,
            'extracted_data' => json_encode([
                'skipped_at' => now()->toISOString(),
                'skip_reason' => 'User chose to skip during registration',
                'can_complete_later' => true
            ]),
            'notes' => 'User skipped ID verification during registration. Can complete later.'
        ]);

        \Log::info('💾 SKIPPED VERIFICATION RECORD CREATED - ID: ' . $verification->id);
        \Log::info('✅ ID VERIFICATION SKIP COMPLETED SUCCESSFULLY');

        // Create notification for admin
        Notification::create([
            'user_id' => $user->id,
            'type' => 'verification_skipped',
            'title' => 'ID Verification Skipped',
            'message' => 'User ' . $user->name . ' skipped ID verification during registration.',
            'data' => json_encode([
                'user_id' => $user->id,
                'user_name' => $user->name,
                'user_email' => $user->email,
                'verification_id' => $verification->id,
                'skipped_at' => now()->toISOString()
            ])
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Registration completed successfully! You can complete ID verification later.',
            'verification' => [
                'id' => $verification->id,
                'status' => 'skipped',
                'document_type' => 'skipped',
                'submitted_at' => $verification->created_at->format('Y-m-d H:i:s'),
                'can_complete_later' => true
            ],
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'role' => $user->role
            ],
            'timestamp' => now()->format('Y-m-d H:i:s')
        ], 200);
    }

    // Public helper to allow skip without Sanctum for onboarding/dev only
    public function skipVerificationPublic(Request $request)
    {
        // Mirror CORS headers
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
        header('Access-Control-Allow-Credentials: true');

        if ($request->isMethod('OPTIONS')) {
            return response()->json(['success' => true], 200);
        }

        // Try to resolve user either from sanctum or provided identifiers
        $user = $request->user();
        if (!$user && $request->filled('user_id')) {
            $user = User::find($request->integer('user_id'));
        }
        if (!$user && $request->filled('phone')) {
            $user = User::where('phone', $request->input('phone'))->first();
        }

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not authenticated',
            ], 401);
        }

        // If already has a verification, return it
        $existingVerification = Verification::where('user_id', $user->id)->first();
        if ($existingVerification) {
            return response()->json([
                'success' => true,
                'message' => 'Verification status already recorded',
                'verification' => [
                    'id' => $existingVerification->id,
                    'status' => $existingVerification->status,
                    'document_type' => $existingVerification->document_type,
                    'submitted_at' => $existingVerification->created_at->format('Y-m-d H:i:s')
                ]
            ]);
        }

        $verification = Verification::create([
            'user_id' => $user->id,
            'document_type' => 'skipped',
            'status' => 'skipped',
            'is_philippine_id' => false,
            'verification_method' => 'manual_skip',
            'extracted_data' => json_encode([
                'skipped_at' => now()->toISOString(),
                'skip_reason' => 'User chose to skip (public endpoint)',
                'can_complete_later' => true,
            ]),
            'notes' => 'User skipped via public endpoint during onboarding.',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'ID verification marked as skipped. You can complete it later.',
            'verification' => [
                'id' => $verification->id,
                'status' => $verification->status,
                'document_type' => $verification->document_type,
                'submitted_at' => $verification->created_at->format('Y-m-d H:i:s')
            ],
        ]);
    }

    private function awardBadges($verification)
    {
        $badges = [];
        
        // Get detected document type from webhook data
        $extractedData = json_decode($verification->extracted_data, true) ?? [];
        $detectedDocumentType = $extractedData['detected_document_type'] ?? $verification->document_type;
        $detectedDocumentName = $extractedData['detected_document_name'] ?? $this->getIdTypeDisplayName($verification->document_type);
        
        if ($verification->status === 'approved') {
            // Base identity verification badge
            $badges[] = [
                'id' => 'identity_verified',
                'name' => 'Identity Verified',
                'description' => 'Government-issued ID verified',
                'icon' => 'shield-checkmark',
                'color' => '#10B981',
                'earned_at' => now()->toISOString(),
            ];

            // Philippine ID specific badges
            if ($verification->is_philippine_id) {
                $badges[] = [
                    'id' => 'verified_filipino',
                    'name' => 'Verified Filipino',
                    'description' => 'Verified with Philippine government ID',
                    'icon' => 'flag',
                    'color' => '#0038A8',
                    'earned_at' => now()->toISOString(),
                ];
            }

            // Document-specific badges
            $documentBadge = $this->getDocumentSpecificBadge($detectedDocumentType, $detectedDocumentName);
            if ($documentBadge) {
                $badges[] = $documentBadge;
            }

            // High verification score badge
            if ($verification->verification_score >= 95) {
                $badges[] = [
                    'id' => 'high_verification_score',
                    'name' => 'Premium Verification',
                    'description' => 'Verified with high confidence score',
                    'icon' => 'star',
                    'color' => '#F59E0B',
                    'earned_at' => now()->toISOString(),
                ];
            }

            // Veriff AI verification badge
            $badges[] = [
                'id' => 'veriff_ai_verified',
                'name' => 'AI Verified',
                'description' => 'Verified by Veriff AI technology',
                'icon' => 'cpu',
                'color' => '#8B5CF6',
                'earned_at' => now()->toISOString(),
            ];
        }

        if (!empty($badges)) {
            $verification->update(['badges_earned' => json_encode($badges)]);
            
            \Log::info('🏆 BADGES AWARDED', [
                'verification_id' => $verification->id,
                'user_id' => $verification->user_id,
                'document_type' => $detectedDocumentName,
                'badges_count' => count($badges),
                'badges' => array_column($badges, 'name')
            ]);
        }

        return $badges;
    }

    /**
     * Get document-specific badge based on verified document type
     */
    private function getDocumentSpecificBadge($documentType, $documentName)
    {
        $badgeMap = [
            'ph_national_id' => [
                'id' => 'ph_national_id_verified',
                'name' => 'PhilSys Verified',
                'description' => 'Philippine National ID verified',
                'icon' => 'card',
                'color' => '#059669',
            ],
            'ph_drivers_license' => [
                'id' => 'drivers_license_verified',
                'name' => 'Licensed Driver',
                'description' => "Driver's License verified",
                'icon' => 'car',
                'color' => '#DC2626',
            ],
            'sss_id' => [
                'id' => 'sss_verified',
                'name' => 'SSS Verified',
                'description' => 'SSS ID verified',
                'icon' => 'briefcase',
                'color' => '#1E40AF',
            ],
            'philhealth_id' => [
                'id' => 'philhealth_verified',
                'name' => 'PhilHealth Verified',
                'description' => 'PhilHealth ID verified',
                'icon' => 'heart',
                'color' => '#059669',
            ],
            'tin_id' => [
                'id' => 'tin_verified',
                'name' => 'TIN Verified',
                'description' => 'Tax Identification Number verified',
                'icon' => 'calculator',
                'color' => '#7C3AED',
            ],
            'postal_id' => [
                'id' => 'postal_verified',
                'name' => 'Postal Verified',
                'description' => 'Postal ID verified',
                'icon' => 'mail',
                'color' => '#059669',
            ],
            'voters_id' => [
                'id' => 'voters_verified',
                'name' => 'Voter Verified',
                'description' => "Voter's ID verified",
                'icon' => 'checkmark-circle',
                'color' => '#DC2626',
            ],
            'prc_id' => [
                'id' => 'prc_verified',
                'name' => 'PRC Verified',
                'description' => 'PRC ID verified',
                'icon' => 'school',
                'color' => '#1E40AF',
            ],
            'umid' => [
                'id' => 'umid_verified',
                'name' => 'UMID Verified',
                'description' => 'UMID verified',
                'icon' => 'card',
                'color' => '#059669',
            ],
            'owwa_id' => [
                'id' => 'owwa_verified',
                'name' => 'OWWA Verified',
                'description' => 'OWWA ID verified',
                'icon' => 'airplane',
                'color' => '#1E40AF',
            ],
            'passport' => [
                'id' => 'passport_verified',
                'name' => 'Passport Verified',
                'description' => 'Passport verified',
                'icon' => 'globe',
                'color' => '#059669',
            ],
        ];

        $badge = $badgeMap[$documentType] ?? null;
        
        if ($badge) {
            $badge['earned_at'] = now()->toISOString();
            return $badge;
        }

        return null;
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

    private function notifyAdminVerificationCompleted($verification, $webhookData)
    {
        // Get all admin users
        $admins = User::where('is_admin', true)->get();
        
        $user = $verification->user;
        $idTypeDisplay = $this->getIdTypeDisplayName($verification->document_type);
        $status = $verification->status;
        $score = $verification->verification_score;
        
        foreach ($admins as $admin) {
            if ($status === 'approved') {
                Notification::create([
                    'user_id' => $admin->id,
                    'type' => 'verification_approved',
                    'title' => 'ID Verification Approved',
                    'message' => "✅ {$user->name}'s ID verification has been APPROVED by Veriff AI. Document: {$idTypeDisplay}. Score: {$score}%. User can now accept bookings.",
                    'data' => json_encode([
                        'verification_id' => $verification->id,
                        'user_id' => $user->id,
                        'user_name' => $user->name,
                        'document_type' => $idTypeDisplay,
                        'verification_score' => $score,
                        'veriff_session_id' => $webhookData['session_id'] ?? null,
                        'action_required' => false
                    ])
                ]);
            } else {
                Notification::create([
                    'user_id' => $admin->id,
                    'type' => 'verification_rejected',
                    'title' => 'ID Verification Rejected',
                    'message' => "❌ {$user->name}'s ID verification has been REJECTED by Veriff AI. Document: {$idTypeDisplay}. Reason: {$verification->rejection_reason}. Manual review may be required.",
                    'data' => json_encode([
                        'verification_id' => $verification->id,
                        'user_id' => $user->id,
                        'user_name' => $user->name,
                        'document_type' => $idTypeDisplay,
                        'rejection_reason' => $verification->rejection_reason,
                        'veriff_session_id' => $webhookData['session_id'] ?? null,
                        'action_required' => true
                    ])
                ]);
            }
        }
    }

    private function createVerificationAuditLog($verification, $webhookData)
    {
        $user = $verification->user;
        $idTypeDisplay = $this->getIdTypeDisplayName($verification->document_type);
        
        // Create audit log entry
        \App\Models\VerificationAuditLog::create([
            'verification_id' => $verification->id,
            'admin_id' => null, // Veriff AI verification
            'action' => $verification->status === 'approved' ? 'approved_by_veriff' : 'rejected_by_veriff',
            'status_before' => 'pending',
            'status_after' => $verification->status,
            'notes' => $verification->status === 'approved' 
                ? "ID verification approved by Veriff AI. Document: {$idTypeDisplay}. Score: {$verification->verification_score}%."
                : "ID verification rejected by Veriff AI. Document: {$idTypeDisplay}. Reason: {$verification->rejection_reason}.",
            'veriff_data' => json_encode($webhookData),
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent()
        ]);
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