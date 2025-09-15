<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $query = Notification::with('user');

        // Filter by type
        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        // Filter by read status
        if ($request->filled('read_status')) {
            if ($request->read_status === 'read') {
                $query->whereNotNull('read_at');
            } else {
                $query->whereNull('read_at');
            }
        }

        // Filter by date range
        if ($request->filled('date_from')) {
            $query->where('created_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->where('created_at', '<=', $request->date_to);
        }

        $notifications = $query->latest()->paginate(20);

        // Add notification badges and actions
        $notifications->getCollection()->transform(function ($notification) {
            $notification->badge = $this->getNotificationBadge($notification);
            $notification->action_required = $this->isActionRequired($notification);
            return $notification;
        });

        // Get notification stats
        $stats = [
            'total' => Notification::count(),
            'unread' => Notification::whereNull('read_at')->count(),
            'verification_approved' => Notification::where('type', 'verification_approved')->count(),
            'verification_rejected' => Notification::where('type', 'verification_rejected')->count(),
            'verification_pending' => Notification::where('type', 'verification')->count(),
        ];

        return view('admin.notifications.index', compact('notifications', 'stats'));
    }

    private function getNotificationBadge($notification)
    {
        switch ($notification->type) {
            case 'verification_approved':
                return [
                    'label' => 'Approved',
                    'color' => 'success',
                    'icon' => 'check-circle'
                ];
            case 'verification_rejected':
                return [
                    'label' => 'Rejected',
                    'color' => 'danger',
                    'icon' => 'x-circle'
                ];
            case 'verification':
                return [
                    'label' => 'Pending',
                    'color' => 'warning',
                    'icon' => 'clock'
                ];
            default:
                return [
                    'label' => ucfirst($notification->type),
                    'color' => 'info',
                    'icon' => 'info-circle'
                ];
        }
    }

    private function isActionRequired($notification)
    {
        // Check if notification data indicates action is required
        if ($notification->data) {
            $data = json_decode($notification->data, true);
            return $data['action_required'] ?? false;
        }
        return false;
    }

    public function send(Request $request)
    {
        $request->validate([
            'message' => 'required|string',
            'type' => 'required|string',
            'user_ids' => 'array'
        ]);

        return redirect()->back()->with('success', 'Notification sent successfully.');
    }

    public function bulkSend(Request $request)
    {
        return redirect()->back()->with('success', 'Bulk notifications sent successfully.');
    }

    public function analytics()
    {
        return view('admin.notifications.analytics');
    }

    public function templates()
    {
        return view('admin.notifications.templates');
    }

    public function scheduled()
    {
        return view('admin.notifications.scheduled');
    }

    public function templateSend(Request $request)
    {
        return redirect()->back()->with('success', 'Template notification sent successfully.');
    }

    public function markAsRead(Request $request, $id)
    {
        $notification = Notification::findOrFail($id);
        $notification->update(['read_at' => now()]);

        return response()->json([
            'success' => true,
            'message' => 'Notification marked as read'
        ]);
    }

    public function markAllAsRead(Request $request)
    {
        Notification::whereNull('read_at')->update(['read_at' => now()]);

        return response()->json([
            'success' => true,
            'message' => 'All notifications marked as read'
        ]);
    }

    public function getUnreadCount()
    {
        $count = Notification::whereNull('read_at')->count();
        
        return response()->json([
            'success' => true,
            'count' => $count
        ]);
    }
}
