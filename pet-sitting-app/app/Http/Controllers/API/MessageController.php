<?php

namespace App\Http\Controllers\API;

use App\Events\MessageSent;
use App\Http\Controllers\Controller;
use App\Models\Message;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class MessageController extends Controller
{
    /**
     * Get conversations for the authenticated user
     */
    public function getConversations(Request $request)
    {
        $user = Auth::user();
        
        $conversations = Message::where('sender_id', $user->id)
            ->orWhere('receiver_id', $user->id)
            ->with(['sender', 'receiver'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->groupBy('conversation_id')
            ->map(function ($messages) use ($user) {
                $latestMessage = $messages->first();
                $otherUser = $latestMessage->sender_id === $user->id 
                    ? $latestMessage->receiver 
                    : $latestMessage->sender;
                
                $unreadCount = $messages->where('receiver_id', $user->id)
                    ->where('is_read', false)
                    ->count();
                
                return [
                    'conversation_id' => $latestMessage->conversation_id,
                    'other_user' => [
                        'id' => $otherUser->id,
                        'name' => $otherUser->first_name . ' ' . $otherUser->last_name,
                        'profile_image' => $otherUser->profile_image ? url('storage/profile_images/' . basename($otherUser->profile_image)) : null,
                    ],
                    'latest_message' => [
                        'id' => $latestMessage->id,
                        'message' => $latestMessage->message,
                        'type' => $latestMessage->type,
                        'created_at' => $latestMessage->created_at->toISOString(),
                    ],
                    'unread_count' => $unreadCount,
                ];
            })
            ->values();

        return response()->json([
            'success' => true,
            'conversations' => $conversations,
        ]);
    }

    /**
     * Get messages for a specific conversation
     */
    public function getMessages(Request $request, $conversationId)
    {
        $user = Auth::user();
        
        // Verify user is part of this conversation
        $userIds = explode('_', $conversationId);
        if (!in_array($user->id, $userIds)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $messages = Message::where('conversation_id', $conversationId)
            ->with(['sender', 'receiver'])
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(function ($message) {
                return [
                    'id' => $message->id,
                    'conversation_id' => $message->conversation_id,
                    'sender_id' => $message->sender_id,
                    'receiver_id' => $message->receiver_id,
                    'message' => $message->message,
                    'is_read' => $message->is_read,
                    'type' => $message->type,
                    'booking_id' => $message->booking_id,
                    'metadata' => $message->metadata,
                    'created_at' => $message->created_at->toISOString(),
                    'sender' => [
                        'id' => $message->sender->id,
                        'name' => $message->sender->first_name . ' ' . $message->sender->last_name,
                        'profile_image' => $message->sender->profile_image ? url('storage/profile_images/' . basename($message->sender->profile_image)) : null,
                    ],
                ];
            });

        // Mark messages as read
        Message::where('conversation_id', $conversationId)
            ->where('receiver_id', $user->id)
            ->update(['is_read' => true]);

        return response()->json([
            'success' => true,
            'messages' => $messages,
        ]);
    }

    /**
     * Send a new message
     */
    public function sendMessage(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'receiver_id' => 'required|exists:users,id',
            'message' => 'required|string|max:1000',
            'type' => 'string|in:text,booking_confirmation,booking_cancellation,system',
            'booking_id' => 'nullable|exists:bookings,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = Auth::user();
        $receiverId = $request->receiver_id;
        
        // Prevent users from messaging themselves
        if ($user->id === $receiverId) {
            return response()->json([
                'success' => false,
                'error' => 'Cannot send message to yourself',
            ], 400);
        }

        $conversationId = Message::generateConversationId($user->id, $receiverId);

        $message = Message::create([
            'conversation_id' => $conversationId,
            'sender_id' => $user->id,
            'receiver_id' => $receiverId,
            'message' => $request->message,
            'type' => $request->type ?? 'text',
            'booking_id' => $request->booking_id,
            'metadata' => $request->metadata,
        ]);

        $message->load(['sender', 'receiver']);

        // Broadcast the message (temporarily disabled for testing)
        // broadcast(new MessageSent($message));

        return response()->json([
            'success' => true,
            'message' => [
                'id' => $message->id,
                'conversation_id' => $message->conversation_id,
                'sender_id' => $message->sender_id,
                'receiver_id' => $message->receiver_id,
                'message' => $message->message,
                'is_read' => $message->is_read,
                'type' => $message->type,
                'booking_id' => $message->booking_id,
                'metadata' => $message->metadata,
                'created_at' => $message->created_at->toISOString(),
                'sender' => [
                    'id' => $message->sender->id,
                    'name' => $message->sender->first_name . ' ' . $message->sender->last_name,
                    'profile_image' => $message->sender->profile_image ? url('storage/profile_images/' . basename($message->sender->profile_image)) : null,
                ],
            ],
        ]);
    }

    /**
     * Mark messages as read
     */
    public function markAsRead(Request $request, $conversationId)
    {
        $user = Auth::user();
        
        // Verify user is part of this conversation
        $userIds = explode('_', $conversationId);
        if (!in_array($user->id, $userIds)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        Message::where('conversation_id', $conversationId)
            ->where('receiver_id', $user->id)
            ->update(['is_read' => true]);

        return response()->json([
            'success' => true,
            'message' => 'Messages marked as read',
        ]);
    }

    /**
     * Get unread message count
     */
    public function getUnreadCount(Request $request)
    {
        $user = Auth::user();
        
        $unreadCount = Message::where('receiver_id', $user->id)
            ->where('is_read', false)
            ->count();

        return response()->json([
            'success' => true,
            'unread_count' => $unreadCount,
        ]);
    }

    /**
     * Start a conversation with a user
     */
    public function startConversation(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|exists:users,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = Auth::user();
        $otherUserId = $request->user_id;
        
        // Prevent users from starting conversation with themselves
        if ($user->id === $otherUserId) {
            return response()->json([
                'success' => false,
                'error' => 'Cannot start conversation with yourself',
            ], 400);
        }

        $conversationId = Message::generateConversationId($user->id, $otherUserId);
        $otherUser = User::find($otherUserId);

        return response()->json([
            'success' => true,
            'conversation_id' => $conversationId,
            'other_user' => [
                'id' => $otherUser->id,
                'name' => $otherUser->first_name . ' ' . $otherUser->last_name,
                'profile_image' => $otherUser->profile_image ? url('storage/profile_images/' . basename($otherUser->profile_image)) : null,
            ],
        ]);
    }
}