<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Booking;
use App\Models\Payment;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Carbon\Carbon;

/**
 * @method int|null id() Get the ID of the currently authenticated user
 * @method \App\Models\User|null user() Get the currently authenticated user
 */
class UserController extends Controller
{
    /**
     * Get the authenticated user ID
     * @return int|null
     */
    private function getAuthId(): ?int
    {
        return $this->getAuthId();
    }

    /**
     * Get the authenticated user
     * @return \App\Models\User|null
     */
    private function getAuthUser(): ?User
    {
        return Auth::user();
    }

    public function index(Request $request)
    {
        $query = User::query();

        // Apply filters
        if ($request->filled('role')) {
            $query->where('role', $request->role);
        }

        if ($request->filled('status')) {
            $query->where('users.status', $request->status);
        }

        if ($request->filled('verification_status')) {
            $query->where('verification_status', $request->verification_status);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        if ($request->filled('date_from')) {
            $query->where('created_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->where('created_at', '<=', $request->date_to);
        }

        $users = $query->withCount(['bookings', 'verifications'])
                      ->with(['verifications' => function($q) {
                          $q->latest()->limit(1);
                      }])
                      ->orderBy('created_at', 'desc')
                      ->paginate(20);

        // Add verification status to each user
        $users->getCollection()->transform(function ($user) {
            $user->verification_badge = $this->getVerificationBadge($user);
            $user->verification_summary = $this->getVerificationSummary($user);
            return $user;
        });

        return view('admin.users.index', compact('users'));
    }

    private function getVerificationBadge($user)
    {
        if ($user->id_verified && $user->verification_status === 'verified') {
            return [
                'status' => 'verified',
                'label' => 'Verified',
                'color' => 'success',
                'icon' => 'check-circle'
            ];
        } elseif ($user->verification_status === 'rejected') {
            return [
                'status' => 'rejected',
                'label' => 'Rejected',
                'color' => 'danger',
                'icon' => 'x-circle'
            ];
        } elseif ($user->verifications->count() > 0) {
            return [
                'status' => 'pending',
                'label' => 'Pending',
                'color' => 'warning',
                'icon' => 'clock'
            ];
        } else {
            return [
                'status' => 'not_submitted',
                'label' => 'Not Submitted',
                'color' => 'secondary',
                'icon' => 'document'
            ];
        }
    }

    private function getVerificationSummary($user)
    {
        $latestVerification = $user->verifications->first();
        
        if (!$latestVerification) {
            return 'No verification submitted';
        }

        $summary = "Document: " . ucfirst(str_replace('_', ' ', $latestVerification->document_type));
        
        if ($latestVerification->status === 'approved') {
            $summary .= " | Score: {$latestVerification->verification_score}%";
            if ($latestVerification->verified_at) {
                $summary .= " | Verified: " . $latestVerification->verified_at->format('M d, Y');
            } else {
                $summary .= " | Verified: Date not available";
            }
        } elseif ($latestVerification->status === 'rejected') {
            $summary .= " | Rejected: " . ($latestVerification->rejection_reason ?? 'No reason provided');
        } else {
            $summary .= " | Status: Pending";
        }

        return $summary;
    }

    public function show(User $user)
    {
        $user->load(['bookings', 'payments', 'verifications']);
        
        $stats = [
            'total_bookings' => $user->bookings()->count(),
            'completed_bookings' => $user->bookings()->where('bookings.status', 'completed')->count(),
            'total_spent' => $user->payments()->where('payments.status', 'completed')->sum('amount'),
            'average_rating' => $user->bookings()->avg('rating') ?? 0,
            'latest_verification' => $user->verifications()->latest()->first(),
            'id_verified' => $user->id_verified,
            'id_verified_at' => $user->id_verified_at,
            'verification_status' => $user->verification_status,
            'can_accept_bookings' => $user->can_accept_bookings,
            'profile_info' => [
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'gender' => $user->gender,
                'age' => $user->age,
                'pet_breeds' => $user->pet_breeds,
                'bio' => $user->bio,
            ],
        ];

        return view('admin.users.show', compact('user', 'stats'));
    }

    public function approve(User $user)
    {
        $user->update([
            'status' => 'active',
            'approved_at' => now(),
            'approved_by' => $this->getAuthId(),
        ]);

        // Send approval notification
        $this->sendApprovalNotification($user);

        return redirect()->back()->with('success', 'User approved successfully.');
    }

    public function deny(Request $request, User $user)
    {
        $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        $user->update([
            'status' => 'denied',
            'denied_at' => now(),
            'denied_by' => $this->getAuthId(),
            'denial_reason' => $request->reason,
        ]);

        // Send denial notification
        $this->sendDenialNotification($user, $request->reason);

        return redirect()->back()->with('success', 'User denied successfully.');
    }

    public function suspend(Request $request, User $user)
    {
        $request->validate([
            'reason' => 'required|string|max:500',
            'duration' => 'required|in:1_day,3_days,1_week,1_month,indefinite',
        ]);

        $suspensionEnd = $this->calculateSuspensionEnd($request->duration);

        $user->update([
            'status' => 'suspended',
            'suspended_at' => now(),
            'suspended_by' => $this->getAuthId(),
            'suspension_reason' => $request->reason,
            'suspension_ends_at' => $suspensionEnd,
        ]);

        // Send suspension notification
        $this->sendSuspensionNotification($user, $request->reason, $suspensionEnd);

        return redirect()->back()->with('success', 'User suspended successfully.');
    }

    public function ban(Request $request, User $user)
    {
        $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        $user->update([
            'status' => 'banned',
            'banned_at' => now(),
            'banned_by' => $this->getAuthId(),
            'ban_reason' => $request->reason,
        ]);

        // Cancel all active bookings
        $user->bookings()->where('bookings.status', 'active')->update([
            'status' => 'cancelled',
            'cancellation_reason' => 'User banned by admin',
        ]);

        // Send ban notification
        $this->sendBanNotification($user, $request->reason);

        return redirect()->back()->with('success', 'User banned successfully.');
    }

    public function reactivate(User $user)
    {
        $user->update([
            'status' => 'active',
            'suspended_at' => null,
            'suspended_by' => null,
            'suspension_reason' => null,
            'suspension_ends_at' => null,
            'banned_at' => null,
            'banned_by' => null,
            'ban_reason' => null,
        ]);

        // Send reactivation notification
        $this->sendReactivationNotification($user);

        return redirect()->back()->with('success', 'User reactivated successfully.');
    }

    public function delete(User $user)
    {
        // Soft delete the user
        $user->delete();

        return redirect()->route('admin.users.index')->with('success', 'User deleted successfully.');
    }

    public function bulkAction(Request $request)
    {
        $request->validate([
            'action' => 'required|in:approve,suspend,ban,delete',
            'user_ids' => 'required|array',
            'user_ids.*' => 'exists:users,id',
            'reason' => 'required_if:action,suspend,ban|string|max:500',
        ]);

        $users = User::whereIn('id', $request->user_ids);

        switch ($request->action) {
            case 'approve':
                $users->update([
                    'status' => 'active',
                    'approved_at' => now(),
                    'approved_by' => $this->getAuthId(),
                ]);
                break;

            case 'suspend':
                $suspensionEnd = $this->calculateSuspensionEnd($request->duration ?? '1_week');
                $users->update([
                    'status' => 'suspended',
                    'suspended_at' => now(),
                    'suspended_by' => $this->getAuthId(),
                    'suspension_reason' => $request->reason,
                    'suspension_ends_at' => $suspensionEnd,
                ]);
                break;

            case 'ban':
                $users->update([
                    'status' => 'banned',
                    'banned_at' => now(),
                    'banned_by' => $this->getAuthId(),
                    'ban_reason' => $request->reason,
                ]);
                break;

            case 'delete':
                $users->delete();
                break;
        }

        return redirect()->back()->with('success', 'Bulk action completed successfully.');
    }

    public function export(Request $request)
    {
        $query = User::query();

        // Apply same filters as index
        if ($request->filled('role')) {
            $query->where('role', $request->role);
        }

        if ($request->filled('status')) {
            $query->where('users.status', $request->status);
        }

        if ($request->filled('date_from')) {
            $query->where('created_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->where('created_at', '<=', $request->date_to);
        }

        $users = $query->withCount(['bookings'])->get();

        $filename = 'users_export_' . now()->format('Y-m-d_H-i-s') . '.csv';
        
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ];

        $callback = function() use ($users) {
            $file = fopen('php://output', 'w');
            
            // Add headers
            fputcsv($file, [
                'ID', 'Name', 'Email', 'Phone', 'Role', 'Status', 
                'Total Bookings', 'Total Payments', 'Rating', 'Created At'
            ]);

            // Add data
            foreach ($users as $user) {
                fputcsv($file, [
                    $user->id,
                    $user->name,
                    $user->email,
                    $user->phone,
                    $user->role,
                    $user->status,
                    $user->bookings_count,
                    $user->payments_count,
                    $user->rating ?? 0,
                    $user->created_at->format('Y-m-d H:i:s'),
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    private function calculateSuspensionEnd($duration)
    {
        switch ($duration) {
            case '1_day':
                return now()->addDay();
            case '3_days':
                return now()->addDays(3);
            case '1_week':
                return now()->addWeek();
            case '1_month':
                return now()->addMonth();
            case 'indefinite':
                return null;
            default:
                return now()->addWeek();
        }
    }

    private function sendApprovalNotification(User $user)
    {
        // Create notification record
        Notification::create([
            'user_id' => $user->id,
            'title' => 'Account Approved',
            'message' => 'Your account has been approved. You can now use all features of the platform.',
            'type' => 'admin',
            'data' => ['action' => 'approved'],
        ]);

        // Send email notification
        Mail::send('emails.user.approved', ['user' => $user], function ($message) use ($user) {
            $message->to($user->email)
                    ->subject('Account Approved - PetSitConnect');
        });
    }

    private function sendDenialNotification(User $user, $reason)
    {
        Notification::create([
            'user_id' => $user->id,
            'title' => 'Account Denied',
            'message' => "Your account has been denied. Reason: {$reason}",
            'type' => 'admin',
            'data' => ['action' => 'denied', 'reason' => $reason],
        ]);

        Mail::send('emails.user.denied', ['user' => $user, 'reason' => $reason], function ($message) use ($user) {
            $message->to($user->email)
                    ->subject('Account Denied - PetSitConnect');
        });
    }

    private function sendSuspensionNotification(User $user, $reason, $endDate)
    {
        $endDateText = $endDate ? $endDate->format('M d, Y H:i') : 'indefinitely';
        
        Notification::create([
            'user_id' => $user->id,
            'title' => 'Account Suspended',
            'message' => "Your account has been suspended until {$endDateText}. Reason: {$reason}",
            'type' => 'admin',
            'data' => ['action' => 'suspended', 'reason' => $reason, 'ends_at' => $endDate],
        ]);

        Mail::send('emails.user.suspended', [
            'user' => $user, 
            'reason' => $reason, 
            'endDate' => $endDateText
        ], function ($message) use ($user) {
            $message->to($user->email)
                    ->subject('Account Suspended - PetSitConnect');
        });
    }

    private function sendBanNotification(User $user, $reason)
    {
        Notification::create([
            'user_id' => $user->id,
            'title' => 'Account Banned',
            'message' => "Your account has been permanently banned. Reason: {$reason}",
            'type' => 'admin',
            'data' => ['action' => 'banned', 'reason' => $reason],
        ]);

        Mail::send('emails.user.banned', ['user' => $user, 'reason' => $reason], function ($message) use ($user) {
            $message->to($user->email)
                    ->subject('Account Banned - PetSitConnect');
        });
    }

    private function sendReactivationNotification(User $user)
    {
        Notification::create([
            'user_id' => $user->id,
            'title' => 'Account Reactivated',
            'message' => 'Your account has been reactivated. You can now use the platform again.',
            'type' => 'admin',
            'data' => ['action' => 'reactivated'],
        ]);

        Mail::send('emails.user.reactivated', ['user' => $user], function ($message) use ($user) {
            $message->to($user->email)
                    ->subject('Account Reactivated - PetSitConnect');
        });
    }

    /**
     * Update user profile image (Admin only)
     */
    public function updateProfileImage(Request $request, User $user)
    {
        try {
            $request->validate([
                'profile_image' => 'required|image|mimes:jpeg,png,jpg|max:5120',
            ]);

            $file = $request->file('profile_image');
            $filename = 'profile_' . $user->id . '_' . time() . '.' . $file->getClientOriginalExtension();
            $path = $file->storeAs('profile_images', $filename, 'public');
            $profileImageUrl = '/storage/' . $path;
            
            // Delete old profile image if exists
            if ($user->profile_image) {
                $oldPath = str_replace('/storage/', '', $user->profile_image);
                Storage::disk('public')->delete($oldPath);
            }
            
            $user->profile_image = $profileImageUrl;
            $user->save();

            Log::info('📸 Admin updated profile image for user ' . $user->id . ': ' . $filename);

            return response()->json([
                'success' => true,
                'message' => 'Profile image updated successfully',
                'profile_image' => $profileImageUrl
            ]);

        } catch (\Exception $e) {
            Log::error('Admin profile image update error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update profile image: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete user profile image (Admin only)
     */
    public function deleteProfileImage(User $user)
    {
        try {
            if ($user->profile_image) {
                $oldPath = str_replace('/storage/', '', $user->profile_image);
                Storage::disk('public')->delete($oldPath);
                
                $user->profile_image = null;
                $user->save();

                Log::info('🗑️ Admin deleted profile image for user ' . $user->id);

                return response()->json([
                    'success' => true,
                    'message' => 'Profile image deleted successfully'
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'No profile image to delete'
                ], 404);
            }

        } catch (\Exception $e) {
            Log::error('Admin profile image deletion error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete profile image: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Check for user status updates (API endpoint for auto-refresh)
     */
    public function statusUpdates(Request $request)
    {
        // Get the last check time from request parameter or default to 2 minutes ago
        $lastCheckParam = $request->get('last_check');
        $lastCheck = $lastCheckParam ? \Carbon\Carbon::parse($lastCheckParam) : now()->subMinutes(2);
        
        // Check for any user updates since last check
        $updatedUsers = User::where('updated_at', '>', $lastCheck)
            ->orWhere('created_at', '>', $lastCheck)
            ->get(['id', 'name', 'email', 'status', 'updated_at', 'created_at']);
        
        $hasUpdates = $updatedUsers->count() > 0;
        
        return response()->json([
            'hasUpdates' => $hasUpdates,
            'updatedCount' => $updatedUsers->count(),
            'updatedUsers' => $updatedUsers->map(function($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'status' => $user->status,
                    'updated_at' => $user->updated_at->toISOString(),
                    'is_new' => $user->created_at > now()->subMinutes(2)
                ];
            }),
            'timestamp' => now()->toISOString(),
            'lastCheck' => $lastCheck->toISOString()
        ]);
    }

    /**
     * Update user status (API endpoint for real-time updates)
     */
    public function updateStatus(Request $request, $id)
    {
        $user = User::findOrFail($id);
        
        $request->validate([
            'status' => 'required|in:active,pending,suspended,banned'
        ]);
        
        $user->update([
            'status' => $request->status,
            'updated_at' => now()
        ]);
        
        return response()->json([
            'success' => true,
            'message' => 'User status updated successfully',
            'user' => $user->fresh()
        ]);
    }
}
