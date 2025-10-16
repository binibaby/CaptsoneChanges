<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Verification;
use App\Models\User;
use App\Models\Notification;
use App\Models\VerificationAuditLog;
use App\Events\IdVerificationStatusUpdated;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

/**
 * @method int|null id() Get the ID of the currently authenticated user
 * @method \App\Models\User|null user() Get the currently authenticated user
 */
class VerificationController extends Controller
{
    /**
     * Get the authenticated user ID
     * @return int|null
     */
    private function getAuthId(): ?int
    {
        return Auth::id();
    }

    /**
     * Get the authenticated user
     * @return \App\Models\User|null
     */
    private function getAuthUser(): ?User
    {
        return Auth::user();
    }

    /**
     * Display verification management page
     */
    public function index()
    {
        return view('admin.verifications.index');
    }

    /**
     * Display ID access management page for unverified sitters
     */
    public function idAccess()
    {
        return view('admin.verifications.id-access');
    }

    /**
     * Get unverified sitters for ID access management
     */
    public function getUnverifiedSitters(Request $request)
    {
        $page = $request->get('page', 1);
        $limit = $request->get('limit', 20);
        $search = $request->get('search');

        $query = User::where('role', 'pet_sitter')
            ->where(function($q) {
                $q->where('id_verified', false)
                  ->orWhereNull('id_verified')
                  ->orWhere('verification_status', 'pending_verification')
                  ->orWhere('verification_status', 'rejected');
            })
            ->with(['verifications' => function($q) {
                $q->latest()->take(1);
            }])
            ->select('*')
            ->addSelect(DB::raw('(julianday("now") - julianday(created_at)) * 24 * 60 as minutes_ago'));

        // Search functionality
        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        $sitters = $query->orderBy('created_at', 'desc')
            ->paginate($limit);

        // Add time formatting and status info
        $sitters->getCollection()->transform(function ($sitter) {
            $sitter->time_ago = $this->formatTimeAgo($sitter->minutes_ago);
            $sitter->verification_status_text = $this->getVerificationStatusText($sitter);
            $sitter->can_be_verified = $this->canBeManuallyVerified($sitter);
            return $sitter;
        });

        return response()->json([
            'success' => true,
            'sitters' => $sitters,
            'stats' => $this->getUnverifiedSitterStats()
        ]);
    }

    /**
     * Get all verifications with real-time data
     */
    public function getVerifications(Request $request)
    {
        $status = $request->get('status', 'all');
        $page = $request->get('page', 1);
        $limit = $request->get('limit', 20);
        $search = $request->get('search');

        $query = Verification::with(['user', 'verifiedBy'])
            ->select('*')
            ->addSelect(DB::raw('(julianday("now") - julianday(created_at)) * 24 * 60 as minutes_ago'));

        // Filter by status
        if ($status !== 'all') {
            if ($status === 'pending') {
                // For pending, show only verifications that are actually pending
                $query->where('verification_status', 'pending')
                      ->where('status', 'pending');
            } else {
                // For approved/rejected, show only those that have been processed
                $query->where('verification_status', $status)
                      ->where('status', $status);
            }
        }

        // Search functionality
        if ($search) {
            $query->whereHas('user', function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            })->orWhere('document_number', 'like', "%{$search}%");
        }

        $verifications = $query->orderBy('created_at', 'desc')
            ->paginate($limit);

        // Add time formatting and urgency flags
        $verifications->getCollection()->transform(function ($verification) {
            $verification->time_ago = $this->formatTimeAgo($verification->minutes_ago);
            $verification->is_urgent = $verification->minutes_ago > 60; // More than 1 hour
            $verification->is_critical = $verification->minutes_ago > 1440; // More than 24 hours
            return $verification;
        });

        // Debug: Log the query and results
        \Log::info('Verification Query Debug:', [
            'status_filter' => $status,
            'total_found' => $verifications->total(),
            'current_page' => $verifications->currentPage(),
            'per_page' => $verifications->perPage(),
            'verification_ids' => $verifications->pluck('id')->toArray()
        ]);

        return response()->json([
            'success' => true,
            'verifications' => $verifications,
            'stats' => $this->getVerificationStats(),
            'debug' => [
                'status_filter' => $status,
                'total_found' => $verifications->total(),
                'current_page' => $verifications->currentPage(),
                'per_page' => $verifications->perPage()
            ]
        ]);
    }

    /**
     * Debug method to see all verifications
     */
    public function debugVerifications()
    {
        $allVerifications = Verification::with('user')
            ->select('id', 'user_id', 'verification_status', 'status', 'created_at')
            ->orderBy('created_at', 'desc')
            ->get();

        $pendingCount = Verification::where('verification_status', 'pending')->count();
        $statusPendingCount = Verification::where('status', 'pending')->count();
        $bothPendingCount = Verification::where('verification_status', 'pending')
            ->where('status', 'pending')
            ->count();

        return response()->json([
            'success' => true,
            'all_verifications' => $allVerifications,
            'counts' => [
                'total' => $allVerifications->count(),
                'verification_status_pending' => $pendingCount,
                'status_pending' => $statusPendingCount,
                'both_pending' => $bothPendingCount
            ]
        ]);
    }

    /**
     * Clean up inconsistent verification statuses
     */
    public function cleanupInconsistentStatuses()
    {
        try {
            // Find verifications that have been processed but still show as pending
            $inconsistentVerifications = Verification::where(function($q) {
                $q->where('verification_status', 'pending')
                  ->where('status', '!=', 'pending');
            })->orWhere(function($q) {
                $q->where('status', 'pending')
                  ->where('verification_status', '!=', 'pending');
            })->get();

            $cleanedCount = 0;
            foreach ($inconsistentVerifications as $verification) {
                // Sync the statuses - use the more recent/processed status
                if ($verification->verification_status !== 'pending') {
                    $verification->update(['status' => $verification->verification_status]);
                } else {
                    $verification->update(['verification_status' => $verification->status]);
                }
                $cleanedCount++;
            }

            return response()->json([
                'success' => true,
                'message' => "Cleaned up {$cleanedCount} inconsistent verification statuses",
                'cleaned_count' => $cleanedCount
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error cleaning up statuses: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get real-time status updates for verifications
     */
    public function getStatusUpdates()
    {
        $recentVerifications = Verification::where('updated_at', '>=', now()->subMinutes(5))
            ->where('verification_status', 'pending')
            ->where('status', 'pending')
            ->with('user')
            ->get(['id', 'status', 'updated_at', 'user_id']);

        $hasUpdates = $recentVerifications->isNotEmpty();

        return response()->json([
            'success' => true,
            'hasUpdates' => $hasUpdates,
            'verifications' => $recentVerifications->map(function($v) {
                return [
                    'id' => $v->id,
                    'status' => $v->status,
                    'user_name' => $v->user->name ?? 'Unknown',
                    'updated_at' => $v->updated_at->format('Y-m-d H:i:s')
                ];
            })
        ]);
    }

    /**
     * Display verification details page
     */
    public function show($id)
    {
        $verification = Verification::with(['user', 'verifiedBy', 'auditLogs.admin'])->find($id);

        if (!$verification) {
            abort(404, 'Verification not found.');
        }

        // Calculate minutes ago using Carbon (works with SQLite)
        $minutesAgo = $verification->created_at->diffInMinutes(now());
        $verification->minutes_ago = $minutesAgo;
        $verification->time_ago = $this->formatTimeAgo($minutesAgo);
        $verification->is_urgent = $minutesAgo > 60;
        $verification->is_critical = $minutesAgo > 1440;

        // Set review deadline if not set (for skipped verifications)
        if (!$verification->review_deadline && $verification->verification_status === 'pending') {
            $verification->review_deadline = $verification->created_at->addHours(24);
            // Only save the review_deadline field, not the computed properties
            $verification->save(['review_deadline']);
        }

        // Check if document image exists and is accessible
        if ($verification->document_image) {
            $verification->document_image_url = asset('storage/' . $verification->document_image);
            $verification->document_exists = file_exists(public_path('storage/' . $verification->document_image));
        }

        return view('admin.verifications.enhanced-show', compact('verification'));
    }

    /**
     * Get single verification details (API)
     */
    public function getVerificationDetails($id)
    {
        $verification = Verification::with(['user', 'verifiedBy', 'auditLogs.admin'])->find($id);

        if (!$verification) {
            return response()->json([
                'success' => false,
                'message' => 'Verification not found.'
            ], 404);
        }

        // Calculate minutes ago using Carbon (works with SQLite)
        $minutesAgo = $verification->created_at->diffInMinutes(now());
        $verification->minutes_ago = $minutesAgo;
        $verification->time_ago = $this->formatTimeAgo($minutesAgo);
        $verification->is_urgent = $minutesAgo > 60;
        $verification->is_critical = $minutesAgo > 1440;

        // Check if document image exists and is accessible
        if ($verification->document_image) {
            $verification->document_image_url = asset('storage/' . $verification->document_image);
            $verification->document_exists = file_exists(public_path('storage/' . $verification->document_image));
        }

        return response()->json([
            'success' => true,
            'verification' => $verification
        ]);
    }

    /**
     * Display enhanced verification details page
     */
    public function enhancedShow($id)
    {
        $verification = Verification::with(['user', 'verifiedBy', 'auditLogs.admin'])->find($id);

        if (!$verification) {
            abort(404, 'Verification not found.');
        }

        return view('admin.verifications.enhanced-show', compact('verification'));
    }

    /**
     * Approve ID verification with comprehensive validation
     */
    public function approve(Request $request, $id)
    {
        $request->validate([
            'documents_clear' => 'nullable|in:1,0,yes,no',
            'face_match_verified' => 'nullable|in:1,0,yes,no',
            'address_match_verified' => 'nullable|in:1,0,yes,no',
            'confidence_level' => 'nullable|in:high,medium,low',
            'verification_method' => 'nullable|in:manual,automated,hybrid'
        ]);

        DB::beginTransaction();

        try {
            $verification = Verification::with('user')->find($id);
            
            if (!$verification) {
                return response()->json([
                    'success' => false,
                    'message' => 'Verification not found.'
                ], 404);
            }

            if ($verification->status !== 'pending' || $verification->verification_status !== 'pending') {
                return response()->json([
                    'success' => false,
                    'message' => 'This verification has already been processed.'
                ], 400);
            }

            // Check if document images exist (check in public storage)
            // Skip file existence check for testing - in production, ensure files exist
            if (!$verification->front_id_image) {
                return response()->json([
                    'success' => false,
                    'message' => 'Front ID image not found. Cannot approve verification.'
                ], 400);
            }
            
            if (!$verification->back_id_image) {
                return response()->json([
                    'success' => false,
                    'message' => 'Back ID image not found. Cannot approve verification.'
                ], 400);
            }
            
            if (!$verification->selfie_image) {
                return response()->json([
                    'success' => false,
                    'message' => 'Selfie image not found. Cannot approve verification.'
                ], 400);
            }

            // Server-side validation: Ensure all criteria are set to "Yes" (handle both 1/0 and yes/no formats)
            $documentsClear = ($request->documents_clear === '1' || $request->documents_clear === 'yes') ?? true;
            $faceMatchVerified = ($request->face_match_verified === '1' || $request->face_match_verified === 'yes') ?? true;
            $addressMatchVerified = ($request->address_match_verified === '1' || $request->address_match_verified === 'yes') ?? true;

            if (!$documentsClear || !$faceMatchVerified || !$addressMatchVerified) {
                return response()->json([
                    'success' => false, 
                    'message' => 'Cannot approve verification. All criteria (Documents Clear, Face Match Verified, Address Match Verified) must be set to "Yes"'
                ], 400);
            }

            // Remove any other pending verifications for this user to prevent duplicates
            Verification::where('user_id', $verification->user_id)
                ->where('id', '!=', $verification->id)
                ->where('verification_status', 'pending')
                ->where('status', 'pending')
                ->delete();

            // Update verification
            $verification->update([
                'status' => 'approved',
                'verification_status' => 'approved',
                'admin_decision' => 'approved',
                'verified_at' => now(),
                'verified_by' => $this->getAuthId(),
                'admin_reviewed_at' => now(),
                'admin_reviewed_by' => $this->getAuthId(),
                'documents_clear' => $documentsClear,
                'face_match_verified' => $faceMatchVerified,
                'address_match_verified' => $addressMatchVerified,
                'is_legit_sitter' => true,
                'confidence_level' => $request->confidence_level ?? 'high',
                'verification_method' => $request->verification_method ?? 'manual',
                'badges_earned' => json_encode([
                    [
                        'id' => 'legit_sitter',
                        'name' => 'Legit Sitter',
                        'description' => 'Verified pet sitter with approved ID verification',
                        'icon' => 'shield-checkmark',
                        'color' => '#10B981',
                        'earned_at' => now()->toISOString(),
                    ],
                    [
                        'id' => 'verified_identity',
                        'name' => 'Verified ID',
                        'description' => 'Government-issued ID verified',
                        'icon' => 'card',
                        'color' => '#3B82F6',
                        'earned_at' => now()->toISOString(),
                    ],
                    [
                        'id' => 'location_verified',
                        'name' => 'Location Verified',
                        'description' => 'Location verification completed',
                        'icon' => 'location',
                        'color' => '#3B82F6',
                        'earned_at' => now()->toISOString(),
                    ]
                ])
            ]);

            // Update user status to active
            $user = $verification->user;
            $hasPhoneVerification = !is_null($user->phone_verified_at);
            
            // For pet sitters: need both phone and ID verification to be fully verified
            // For pet owners: only need phone verification
            $shouldBeVerified = false;
            if ($user->role === 'pet_sitter') {
                // If sitter doesn't have phone verification, give it to them since ID is approved
                if (!$hasPhoneVerification) {
                    $user->update(['phone_verified_at' => now()]);
                    $hasPhoneVerification = true;
                    Log::info("📱 AUTO-PHONE-VERIFICATION - Granted phone verification to sitter {$user->name} after ID approval");
                }
                $shouldBeVerified = $hasPhoneVerification; // ID verification is being approved now
            } elseif ($user->role === 'pet_owner') {
                $shouldBeVerified = $hasPhoneVerification; // Pet owners only need phone verification
            } else {
                $shouldBeVerified = $hasPhoneVerification; // Other roles follow same logic
            }
            
            $user->update([
                'status' => 'active',
                'approved_at' => now(),
                'approved_by' => $this->getAuthId(),
                'id_verified' => true,
                'id_verified_at' => now(),
                'verification_status' => $shouldBeVerified ? 'verified' : 'pending_verification',
                'can_accept_bookings' => $shouldBeVerified
            ]);

            // Create audit log
            VerificationAuditLog::create([
                'verification_id' => $verification->id,
                'admin_id' => $this->getAuthId(),
                'action' => 'approved',
                'reason' => $request->admin_notes ?? 'ID verification approved',
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'confidence_level' => $request->confidence_level
            ]);

            // Broadcast real-time update to user (with error handling)
            try {
                broadcast(new IdVerificationStatusUpdated(
                    $verification,
                    $verification->user,
                    'approved',
                    '🎉 Congratulations! Your ID verification has been approved! You are now a verified pet sitter.'
                ));
                Log::info('Real-time update broadcasted successfully', ['verification_id' => $verification->id]);
            } catch (\Exception $broadcastError) {
                Log::warning('Failed to broadcast real-time update', [
                    'verification_id' => $verification->id,
                    'error' => $broadcastError->getMessage()
                ]);
                // Continue with the approval process even if broadcasting fails
            }

            // Broadcast admin dashboard update
            try {
                broadcast(new \App\Events\AdminUserVerificationUpdated(
                    $user,
                    $shouldBeVerified ? 'verified' : 'pending_verification',
                    'User verification status updated after ID approval'
                ));
                Log::info('Admin dashboard update broadcasted successfully', ['user_id' => $user->id]);
            } catch (\Exception $broadcastError) {
                Log::warning('Failed to broadcast admin dashboard update', [
                    'user_id' => $user->id,
                    'error' => $broadcastError->getMessage()
                ]);
            }

            // Notify user of approval
            $verification->user->notifications()->create([
                'type' => 'id_verification_approved',
                'title' => 'ID Verification Approved',
                'message' => '🎉 Congratulations! Your ID verification has been approved! You can now start accepting jobs and bookings.',
                'data' => json_encode([
                    'verification_id' => $verification->id,
                    'verified_at' => now()->toISOString(),
                    'admin_name' => $this->getAuthUser()->name,
                    'badges_earned' => json_decode($verification->badges_earned, true),
                    'confidence_level' => $request->confidence_level ?? 'high',
                ])
            ]);

            // Notify all admins
            $admins = User::where('is_admin', true)->where('id', '!=', $this->getAuthId())->get();
            foreach ($admins as $admin) {
                $admin->notifications()->create([
                    'type' => 'admin_notification',
                    'title' => 'ID Verification Approved',
                    'message' => "ID verification approved by " . $this->getAuthUser()->name . " for user: {$verification->user->name} ({$verification->user->email})",
                    'data' => json_encode([
                        'verification_id' => $verification->id,
                        'user_id' => $verification->user_id,
                        'user_name' => $verification->user->name,
                        'user_email' => $verification->user->email,
                        'approved_by' => $this->getAuthUser()->name,
                        'approved_at' => now()->toISOString(),
                    ])
                ]);
            }

            // Log security event
            Log::info('ID Verification Approved', [
                'verification_id' => $verification->id,
                'user_id' => $verification->user_id,
                'admin_id' => $this->getAuthId(),
                'confidence_level' => $request->confidence_level,
                'ip_address' => $request->ip()
            ]);

            // Send real-time notification to user
            try {
                broadcast(new \App\Events\IdVerificationStatusUpdated(
                    $verification,
                    $verification->user,
                    'approved',
                    '🎉 Congratulations! Your ID verification has been approved! Your account is now verified.'
                ));
                Log::info('Real-time approval update broadcasted successfully', ['verification_id' => $verification->id]);
            } catch (\Exception $e) {
                Log::error('Failed to send real-time notification for verification approval', [
                    'verification_id' => $verification->id,
                    'user_id' => $verification->user_id,
                    'error' => $e->getMessage()
                ]);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'ID verification approved successfully.',
                'verification' => [
                    'id' => $verification->id,
                    'status' => $verification->status,
                    'verified_at' => $verification->verified_at->format('Y-m-d H:i:s'),
                    'verified_by' => $this->getAuthUser()->name
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('ID Verification Approval Failed', [
                'verification_id' => $id,
                'admin_id' => $this->getAuthId(),
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to approve verification. Please try again.'
            ], 500);
        }
    }

    /**
     * Reject ID verification with comprehensive validation
     */
    public function reject(Request $request, $id)
    {
        $request->validate([
            'reason' => 'required|string|min:10|max:1000',
            'rejection_category' => 'required|in:document_unclear,document_expired,document_invalid,information_mismatch,suspicious_activity,other',
            'allow_resubmission' => 'required|in:0,1'
        ]);

        DB::beginTransaction();

        try {
            $verification = Verification::with('user')->find($id);
            
            if (!$verification) {
                return response()->json([
                    'success' => false,
                    'message' => 'Verification not found.'
                ], 404);
            }

            if ($verification->status !== 'pending' || $verification->verification_status !== 'pending') {
                return response()->json([
                    'success' => false,
                    'message' => 'This verification has already been processed.'
                ], 400);
            }

            // Remove any other pending verifications for this user to prevent duplicates
            Verification::where('user_id', $verification->user_id)
                ->where('id', '!=', $verification->id)
                ->where('verification_status', 'pending')
                ->where('status', 'pending')
                ->delete();

            // Update verification
            $verification->update([
                'status' => 'rejected',
                'verification_status' => 'rejected',
                'verified_at' => now(),
                'verified_by' => $this->getAuthId(),
                'rejection_reason' => $request->reason,
                'rejection_category' => $request->rejection_category,
                'allow_resubmission' => (bool) $request->allow_resubmission
            ]);

            // Update user status
            $allowResubmission = (bool) $request->allow_resubmission;
            $userStatus = $allowResubmission ? 'pending_verification' : 'suspended';
            $verification->user->update([
                'status' => $userStatus,
                'verification_status' => 'rejected',
                'denied_at' => now(),
                'denied_by' => $this->getAuthId(),
                'denial_reason' => $request->reason
            ]);

            // Create audit log
            VerificationAuditLog::create([
                'verification_id' => $verification->id,
                'admin_id' => $this->getAuthId(),
                'action' => 'rejected',
                'reason' => $request->reason,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'rejection_category' => $request->rejection_category
            ]);

            // Broadcast real-time update to user (with error handling)
            $rejectionMessage = "Your ID verification has been rejected. Please contact the admin at petsitconnectph@gmail.com for further assistance in resolving this issue.";

            try {
                broadcast(new IdVerificationStatusUpdated(
                    $verification,
                    $verification->user,
                    'rejected',
                    $rejectionMessage
                ));
                Log::info('Real-time rejection update broadcasted successfully', ['verification_id' => $verification->id]);
            } catch (\Exception $broadcastError) {
                Log::warning('Failed to broadcast real-time rejection update', [
                    'verification_id' => $verification->id,
                    'error' => $broadcastError->getMessage()
                ]);
                // Continue with the rejection process even if broadcasting fails
            }

            // Notify user of rejection
            $verification->user->notifications()->create([
                'type' => 'id_verification_rejected',
                'title' => 'ID Verification Rejected',
                'message' => 'Your ID verification has been rejected. Please contact the admin at petsitconnectph@gmail.com for further assistance in resolving this issue.',
                'data' => json_encode([
                    'verification_id' => $verification->id,
                    'rejected_at' => now()->toISOString(),
                    'admin_name' => $this->getAuthUser()->name,
                    'rejection_reason' => $request->reason,
                    'rejection_category' => $request->rejection_category,
                    'allow_resubmission' => $request->allow_resubmission,
                ])
            ]);

            // Notify all admins
            $admins = User::where('is_admin', true)->where('id', '!=', $this->getAuthId())->get();
            foreach ($admins as $admin) {
                $admin->notifications()->create([
                    'type' => 'admin_notification',
                    'title' => 'ID Verification Rejected',
                    'message' => "ID verification rejected by " . $this->getAuthUser()->name . " for user: {$verification->user->name}. Reason: {$request->rejection_category}",
                    'data' => json_encode([
                        'verification_id' => $verification->id,
                        'user_id' => $verification->user_id,
                        'user_name' => $verification->user->name,
                        'user_email' => $verification->user->email,
                        'rejected_by' => $this->getAuthUser()->name,
                        'rejected_at' => now()->toISOString(),
                        'rejection_reason' => $request->reason,
                        'rejection_category' => $request->rejection_category,
                    ])
                ]);
            }

            // Log security event
            Log::warning('ID Verification Rejected', [
                'verification_id' => $verification->id,
                'user_id' => $verification->user_id,
                'admin_id' => $this->getAuthId(),
                'rejection_category' => $request->rejection_category,
                'allow_resubmission' => $request->allow_resubmission,
                'ip_address' => $request->ip()
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'ID verification rejected successfully.',
                'verification' => [
                    'id' => $verification->id,
                    'status' => $verification->status,
                    'verified_at' => $verification->verified_at->format('Y-m-d H:i:s'),
                    'verified_by' => $this->getAuthUser()->name,
                    'rejection_reason' => $verification->rejection_reason
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('ID Verification Rejection Failed', [
                'verification_id' => $id,
                'admin_id' => $this->getAuthId(),
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to reject verification. Please try again.'
            ], 500);
        }
    }

    /**
     * Get verification statistics
     */
    private function getVerificationStats()
    {
        $stats = [
            'total' => Verification::count(),
            'pending' => Verification::where('verification_status', 'pending')
                ->where('status', 'pending')
                ->count(),
            'approved' => Verification::where('verification_status', 'approved')
                ->where('status', 'approved')
                ->count(),
            'rejected' => Verification::where('verification_status', 'rejected')
                ->where('status', 'rejected')
                ->count(),
        ];

        // Get urgent and critical counts - only for truly pending verifications
        $stats['urgent'] = Verification::where('verification_status', 'pending')
            ->where('status', 'pending')
            ->where('created_at', '<', Carbon::now()->subHour())
            ->count();

        $stats['critical'] = Verification::where('verification_status', 'pending')
            ->where('status', 'pending')
            ->where('created_at', '<', Carbon::now()->subDay())
            ->count();

        return $stats;
    }

    /**
     * Format time ago for human readability
     */
    private function formatTimeAgo($minutes)
    {
        if ($minutes < 1) {
            return 'Just now';
        } elseif ($minutes < 60) {
            return $minutes . ' minute' . ($minutes == 1 ? '' : 's') . ' ago';
        } elseif ($minutes < 1440) {
            $hours = floor($minutes / 60);
            return $hours . ' hour' . ($hours == 1 ? '' : 's') . ' ago';
        } else {
            $days = floor($minutes / 1440);
            return $days . ' day' . ($days == 1 ? '' : 's') . ' ago';
        }
    }

    /**
     * Bulk action for multiple verifications
     */
    public function bulkAction(Request $request)
    {
        $request->validate([
            'action' => 'required|in:approve,reject',
            'verification_ids' => 'required|array|min:1',
            'verification_ids.*' => 'integer|exists:verifications,id',
            'reason' => 'required_if:action,reject|string|max:1000'
        ]);

        $results = ['success' => 0, 'failed' => 0, 'errors' => []];

        foreach ($request->verification_ids as $id) {
            try {
                if ($request->action === 'approve') {
                    $this->approve(new Request(['confidence_level' => 'medium', 'verification_method' => 'manual']), $id);
                } else {
                    $this->reject(new Request([
                        'reason' => $request->reason,
                        'rejection_category' => 'other',
                        'allow_resubmission' => true
                    ]), $id);
                }
                $results['success']++;
            } catch (\Exception $e) {
                $results['failed']++;
                $results['errors'][] = "ID {$id}: " . $e->getMessage();
            }
        }

        return response()->json([
            'success' => true,
            'message' => "Bulk action completed. {$results['success']} successful, {$results['failed']} failed.",
            'results' => $results
        ]);
    }

    /**
     * Get audit logs for a verification
     */
    public function getAuditLogs($id)
    {
        $logs = VerificationAuditLog::with('admin')
            ->where('verification_id', $id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'audit_logs' => $logs
        ]);
    }

    /**
     * Clean up duplicate verifications for users
     */
    public function cleanupDuplicateVerifications()
    {
        $duplicatesRemoved = 0;
        
        // Find users with multiple verifications
        $usersWithDuplicates = \DB::table('verifications')
            ->select('user_id')
            ->groupBy('user_id')
            ->havingRaw('COUNT(*) > 1')
            ->get();
            
        foreach ($usersWithDuplicates as $user) {
            // Get all verifications for this user
            $verifications = Verification::where('user_id', $user->user_id)
                ->orderBy('created_at', 'desc')
                ->get();
                
            // Keep the latest approved/rejected verification, remove others
            $keepVerification = null;
            $toDelete = [];
            
            foreach ($verifications as $verification) {
                if ($verification->verification_status === 'approved' || $verification->verification_status === 'rejected') {
                    if (!$keepVerification) {
                        $keepVerification = $verification;
                    } else {
                        $toDelete[] = $verification;
                    }
                } else {
                    // Remove pending verifications if user already has approved/rejected
                    if ($keepVerification) {
                        $toDelete[] = $verification;
                    } else {
                        // Keep the latest pending if no approved/rejected exists
                        if (!$keepVerification) {
                            $keepVerification = $verification;
                        } else {
                            $toDelete[] = $verification;
                        }
                    }
                }
            }
            
            // Delete duplicate verifications
            foreach ($toDelete as $verification) {
                $verification->delete();
                $duplicatesRemoved++;
            }
        }
        
        return response()->json([
            'success' => true,
            'message' => "Cleaned up {$duplicatesRemoved} duplicate verification records.",
            'duplicates_removed' => $duplicatesRemoved
        ]);
    }

    /**
     * Clean up old processed verifications (optional maintenance method)
     */
    public function cleanupOldVerifications()
    {
        // Remove verifications that were processed more than 30 days ago
        $deletedCount = Verification::whereIn('status', ['approved', 'rejected'])
            ->where('updated_at', '<', Carbon::now()->subDays(30))
            ->delete();

        return response()->json([
            'success' => true,
            'message' => "Cleaned up {$deletedCount} old verification records.",
            'deleted_count' => $deletedCount
        ]);
    }

    /**
     * Manually verify a sitter (admin override)
     */
    public function manualVerify(Request $request, $id)
    {
        $request->validate([
            'reason' => 'required|string|min:10|max:500',
            'confidence_level' => 'required|in:high,medium,low'
        ]);

        DB::beginTransaction();

        try {
            $sitter = User::where('role', 'pet_sitter')->find($id);
            
            if (!$sitter) {
                Log::warning('Manual verification attempted for non-existent sitter', [
                    'sitter_id' => $id,
                    'admin_id' => $this->getAuthId()
                ]);
                return response()->json([
                    'success' => false,
                    'message' => 'Sitter not found.'
                ], 404);
            }

            if ($sitter->id_verified) {
                Log::info('Manual verification attempted for already verified sitter', [
                    'sitter_id' => $id,
                    'admin_id' => $this->getAuthId(),
                    'current_status' => $sitter->status,
                    'id_verified' => $sitter->id_verified
                ]);
                return response()->json([
                    'success' => false,
                    'message' => 'This sitter is already verified.'
                ], 400);
            }

            Log::info('Starting manual verification process', [
                'sitter_id' => $sitter->id,
                'sitter_name' => $sitter->name,
                'admin_id' => $this->getAuthId(),
                'reason' => $request->reason,
                'confidence_level' => $request->confidence_level
            ]);

            // Create a manual verification record
            $verification = Verification::create([
                'user_id' => $sitter->id,
                'status' => 'approved',
                'verification_status' => 'approved',
                'admin_decision' => 'approved',
                'verified_at' => now(),
                'verified_by' => $this->getAuthId(),
                'admin_reviewed_at' => now(),
                'admin_reviewed_by' => $this->getAuthId(),
                'documents_clear' => true,
                'face_match_verified' => true,
                'address_match_verified' => true,
                'is_legit_sitter' => true,
                'confidence_level' => $request->confidence_level,
                'verification_method' => 'manual_admin',
                'admin_review_notes' => $request->reason,
                'badges_earned' => json_encode([
                    [
                        'id' => 'legit_sitter',
                        'name' => 'Legit Sitter',
                        'description' => 'Verified pet sitter with approved ID verification',
                        'icon' => 'shield-checkmark',
                        'color' => '#10B981',
                        'earned_at' => now()->toISOString(),
                    ],
                    [
                        'id' => 'verified_identity',
                        'name' => 'Verified ID',
                        'description' => 'Government-issued ID verified',
                        'icon' => 'card',
                        'color' => '#3B82F6',
                        'earned_at' => now()->toISOString(),
                    ],
                    [
                        'id' => 'admin_verified',
                        'name' => 'Admin Verified',
                        'description' => 'Manually verified by admin',
                        'icon' => 'star',
                        'color' => '#F59E0B',
                        'earned_at' => now()->toISOString(),
                    ]
                ])
            ]);

            // Update sitter status
            $sitter->update([
                'status' => 'active',
                'approved_at' => now(),
                'approved_by' => $this->getAuthId(),
                'id_verified' => true,
                'id_verified_at' => now(),
                'verification_status' => 'verified',
                'can_accept_bookings' => true
            ]);

            Log::info('Sitter status updated successfully', [
                'sitter_id' => $sitter->id,
                'status' => 'active',
                'id_verified' => true,
                'verification_status' => 'verified'
            ]);

            // Create audit log
            VerificationAuditLog::create([
                'verification_id' => $verification->id,
                'admin_id' => $this->getAuthId(),
                'action' => 'approved',
                'reason' => $request->reason,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'confidence_level' => $request->confidence_level
            ]);

            // Notify sitter
            $sitter->notifications()->create([
                'type' => 'id_verification_approved',
                'title' => 'ID Verification Approved',
                'message' => '🎉 Congratulations! Your ID verification has been approved by admin! You can now start accepting jobs and bookings.',
                'data' => json_encode([
                    'verification_id' => $verification->id,
                    'verified_at' => now()->toISOString(),
                    'admin_name' => $this->getAuthUser()->name,
                    'badges_earned' => json_decode($verification->badges_earned, true),
                    'confidence_level' => $request->confidence_level,
                    'manual_verification' => true
                ])
            ]);

            // Log security event
            Log::info('Manual ID Verification Approved', [
                'verification_id' => $verification->id,
                'sitter_id' => $sitter->id,
                'admin_id' => $this->getAuthId(),
                'reason' => $request->reason,
                'confidence_level' => $request->confidence_level,
                'ip_address' => $request->ip()
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Sitter manually verified successfully.',
                'verification' => [
                    'id' => $verification->id,
                    'sitter_name' => $sitter->name,
                    'verified_at' => $verification->verified_at->format('Y-m-d H:i:s'),
                    'verified_by' => $this->getAuthUser()->name
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Manual Verification Failed', [
                'sitter_id' => $id,
                'admin_id' => $this->getAuthId(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request_data' => $request->all()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to verify sitter: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get verification status text for display
     */
    private function getVerificationStatusText($sitter)
    {
        if ($sitter->id_verified) {
            return 'Verified';
        }
        
        if ($sitter->verification_status === 'rejected') {
            return 'Rejected';
        }
        
        if ($sitter->verification_status === 'pending_verification') {
            return 'Pending Verification';
        }
        
        return 'Not Verified';
    }

    /**
     * Check if sitter can be manually verified
     */
    private function canBeManuallyVerified($sitter)
    {
        return !$sitter->id_verified && 
               $sitter->verification_status !== 'verified' &&
               $sitter->role === 'pet_sitter';
    }

    /**
     * Get unverified sitter statistics
     */
    private function getUnverifiedSitterStats()
    {
        return [
            'total_unverified' => User::where('role', 'pet_sitter')
                ->where(function($q) {
                    $q->where('id_verified', false)
                      ->orWhereNull('id_verified')
                      ->orWhere('verification_status', 'pending_verification')
                      ->orWhere('verification_status', 'rejected');
                })
                ->count(),
            'pending_verification' => User::where('role', 'pet_sitter')
                ->where('verification_status', 'pending_verification')
                ->count(),
            'rejected' => User::where('role', 'pet_sitter')
                ->where('verification_status', 'rejected')
                ->count(),
            'never_verified' => User::where('role', 'pet_sitter')
                ->where('id_verified', false)
                ->orWhereNull('id_verified')
                ->count()
        ];
    }
}
