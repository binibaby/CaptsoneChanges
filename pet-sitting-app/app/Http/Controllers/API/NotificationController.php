<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        
        $notifications = Notification::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->get();
        
        // Filter notifications based on user role
        $filteredNotifications = $this->filterNotificationsByRole($notifications, $user);
        
        return response()->json([
            'success' => true,
            'notifications' => $filteredNotifications->map(function($notification) {
                return [
                    'id' => $notification->id,
                    'type' => $notification->type,
                    'title' => $notification->title ?: 'Notification',
                    'message' => $notification->message,
                    'read_at' => $notification->read_at,
                    'created_at' => $notification->created_at->format('Y-m-d H:i:s'),
                    'data' => $notification->data ? json_decode($notification->data, true) : null
                ];
            }),
            'unread_count' => $filteredNotifications->where('read_at', null)->count()
        ]);
    }

    public function markAsRead(Request $request, $id)
    {
        $user = $request->user();
        
        $notification = Notification::where('id', $id)
            ->where('user_id', $user->id)
            ->first();
        
        if (!$notification) {
            return response()->json([
                'success' => false,
                'message' => 'Notification not found'
            ], 404);
        }
        
        $notification->update(['read_at' => now()]);
        
        return response()->json([
            'success' => true,
            'message' => 'Notification marked as read'
        ]);
    }

    public function markAllAsRead(Request $request)
    {
        $user = $request->user();
        
        Notification::where('user_id', $user->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);
        
        return response()->json([
            'success' => true,
            'message' => 'All notifications marked as read'
        ]);
    }

    public function getUnreadCount(Request $request)
    {
        $user = $request->user();
        
        $count = Notification::where('user_id', $user->id)
            ->whereNull('read_at')
            ->count();
        
        return response()->json([
            'success' => true,
            'unread_count' => $count
        ]);
    }

    /**
     * Filter notifications based on user role
     */
    private function filterNotificationsByRole($notifications, $user)
    {
        $isPetSitter = $user->role === 'pet_sitter';
        
        return $notifications->filter(function($notification) use ($isPetSitter) {
            if ($isPetSitter) {
                // Pet sitters see: booking requests, messages, reviews, system notifications, profile updates, ID verification
                return in_array($notification->type, [
                    'booking',
                    'message', 
                    'review',
                    'system',
                    'profile_update_approved',
                    'profile_update_rejected',
                    'id_verification_approved',
                    'id_verification_rejected'
                ]);
            } else {
                // Pet owners see: booking confirmations/cancellations, messages, system notifications, profile updates
                // (NO ID verification notifications)
                if (in_array($notification->type, ['id_verification_approved', 'id_verification_rejected'])) {
                    return false;
                }
                
                if ($notification->type === 'booking') {
                    // Only show booking notifications with specific statuses
                    $data = $notification->data ? json_decode($notification->data, true) : [];
                    return isset($data['status']) && in_array($data['status'], ['confirmed', 'cancelled']) ||
                           str_contains($notification->title ?? '', 'confirmed') ||
                           str_contains($notification->title ?? '', 'cancelled');
                }
                
                return in_array($notification->type, [
                    'message',
                    'system',
                    'profile_update_approved',
                    'profile_update_rejected'
                ]);
            }
        });
    }
}



