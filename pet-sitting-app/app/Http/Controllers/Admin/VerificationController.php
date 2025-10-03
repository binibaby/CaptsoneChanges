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
            ->addSelect(DB::raw('TIMESTAMPDIFF(MINUTE, created_at, NOW()) as minutes_ago'));

        // Filter by status
        if ($status !== 'all') {
            $query->where('verification_status', $status);
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

        return response()->json([
            'success' => true,
            'verifications' => $verifications,
            'stats' => $this->getVerificationStats()
        ]);
    }

    /**
     * Get real-time status updates for verifications
     */
    public function getStatusUpdates()
    {
        $recentVerifications = Verification::where('updated_at', '>=', now()->subMinutes(5))
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
            'documents_clear' => 'nullable|boolean',
            'face_match_verified' => 'nullable|boolean',
            'address_match_verified' => 'nullable|boolean',
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

            if ($verification->status !== 'pending') {
                return response()->json([
                    'success' => false,
                    'message' => 'This verification has already been processed.'
                ], 400);
            }

            // Check if document image exists (check in public storage)
            if (!Storage::disk('public')->exists($verification->document_image)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Document image not found. Cannot approve verification.'
                ], 400);
            }

            // Server-side validation: Ensure all criteria are set to "Yes"
            $documentsClear = $request->documents_clear ?? true;
            $faceMatchVerified = $request->face_match_verified ?? true;
            $addressMatchVerified = $request->address_match_verified ?? true;

            if (!$documentsClear || !$faceMatchVerified || !$addressMatchVerified) {
                return response()->json([
                    'success' => false, 
                    'message' => 'Cannot approve verification. All criteria (Documents Clear, Face Match Verified, Address Match Verified) must be set to "Yes"'
                ], 400);
            }

            // Update verification
            $verification->update([
                'status' => 'approved',
                'verification_status' => 'approved',
                'admin_decision' => 'approved',
                'verified_at' => now(),
                'verified_by' => $this->getAuthId(),
                'admin_reviewed_at' => now(),
                'admin_reviewed_by' => $this->getAuthId(),
                'documents_clear' => $request->documents_clear ?? true,
                'face_match_verified' => $request->face_match_verified ?? true,
                'address_match_verified' => $request->address_match_verified ?? true,
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
            $verification->user->update([
                'status' => 'active',
                'approved_at' => now(),
                'approved_by' => $this->getAuthId(),
                'id_verified' => true,
                'id_verified_at' => now(),
                'verification_status' => 'verified',
                'can_accept_bookings' => true
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

            // Notify user of approval
            Notification::create([
                'user_id' => $verification->user_id,
                'type' => 'verification',
                'message' => '🎉 Congratulations! Your enhanced ID verification has been approved and you are now marked as a legit sitter! You can now start accepting pet sitting jobs and have full access to all platform features.'
            ]);

            // Notify all admins
            $admins = User::where('is_admin', true)->where('id', '!=', $this->getAuthId())->get();
            foreach ($admins as $admin) {
                Notification::create([
                    'user_id' => $admin->id,
                    'type' => 'admin',
                    'message' => "ID verification approved by " . $this->getAuthUser()->name . " for user: {$verification->user->name} ({$verification->user->email})"
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
            'allow_resubmission' => 'required|boolean'
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

            if ($verification->status !== 'pending') {
                return response()->json([
                    'success' => false,
                    'message' => 'This verification has already been processed.'
                ], 400);
            }

            // Update verification
            $verification->update([
                'status' => 'rejected',
                'verified_at' => now(),
                'verified_by' => $this->getAuthId(),
                'rejection_reason' => $request->reason,
                'rejection_category' => $request->rejection_category,
                'allow_resubmission' => $request->allow_resubmission
            ]);

            // Update user status
            $userStatus = $request->allow_resubmission ? 'pending_verification' : 'suspended';
            $verification->user->update([
                'status' => $userStatus,
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
            $rejectionMessage = "Your ID verification was rejected. Reason: {$request->reason}. ";
            $rejectionMessage .= $request->allow_resubmission 
                ? "You may submit a new verification with correct documents." 
                : "Please contact support for assistance.";

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
            Notification::create([
                'user_id' => $verification->user_id,
                'type' => 'verification',
                'message' => $rejectionMessage
            ]);

            // Notify all admins
            $admins = User::where('is_admin', true)->where('id', '!=', $this->getAuthId())->get();
            foreach ($admins as $admin) {
                Notification::create([
                    'user_id' => $admin->id,
                    'type' => 'admin',
                    'message' => "ID verification rejected by " . $this->getAuthUser()->name . " for user: {$verification->user->name}. Reason: {$request->rejection_category}"
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
            'pending' => Verification::where('verification_status', 'pending')->count(),
            'approved' => Verification::where('verification_status', 'approved')->count(),
            'rejected' => Verification::where('verification_status', 'rejected')->count(),
        ];

        // Get urgent and critical counts
        $stats['urgent'] = Verification::where('verification_status', 'pending')
            ->where('created_at', '<', Carbon::now()->subHour())
            ->count();

        $stats['critical'] = Verification::where('verification_status', 'pending')
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
}
