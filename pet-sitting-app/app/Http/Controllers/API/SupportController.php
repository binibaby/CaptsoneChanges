<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\SupportTicket;
use App\Models\SupportMessage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class SupportController extends Controller
{
    /**
     * Create a new support ticket
     */
    public function createTicket(Request $request)
    {
        $request->validate([
            'subject' => 'string|max:255',
            'description' => 'string|max:1000',
            'category' => 'string|in:general,billing,technical,booking,other',
            'priority' => 'string|in:low,medium,high',
        ]);

        $ticket = SupportTicket::create([
            'user_id' => Auth::id(),
            'ticket_number' => 'CHAT_' . strtoupper(Str::random(8)),
            'subject' => $request->subject ?? 'Chat Support',
            'description' => $request->description ?? 'Support chat conversation',
            'category' => $request->category ?? 'general',
            'priority' => $request->priority ?? 'medium',
            'status' => 'open',
            'type' => 'chat',
        ]);

        return response()->json([
            'success' => true,
            'ticket' => $ticket->load('user'),
            'message' => 'Support ticket created successfully'
        ]);
    }

    /**
     * Get support tickets for authenticated user
     */
    public function getTickets()
    {
        $tickets = SupportTicket::where('user_id', Auth::id())
            ->where('type', 'chat')
            ->with(['user', 'messages' => function($query) {
                $query->orderBy('created_at', 'asc');
            }])
            ->orderBy('updated_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'tickets' => $tickets
        ]);
    }

    /**
     * Get messages for a specific ticket
     */
    public function getMessages($ticketId)
    {
        $ticket = SupportTicket::where('id', $ticketId)
            ->where('user_id', Auth::id())
            ->with(['user', 'messages.user'])
            ->first();

        if (!$ticket) {
            return response()->json([
                'success' => false,
                'message' => 'Ticket not found'
            ], 404);
        }

        // Mark messages as read
        $ticket->messages()->where('user_id', '!=', Auth::id())
            ->update(['is_read' => true]);

        return response()->json([
            'success' => true,
            'ticket' => $ticket,
            'messages' => $ticket->messages
        ]);
    }

    /**
     * Send a message to support ticket
     */
    public function sendMessage(Request $request, $ticketId)
    {
        $request->validate([
            'message' => 'required|string|max:1000'
        ]);

        $ticket = SupportTicket::where('id', $ticketId)
            ->where('user_id', Auth::id())
            ->first();

        if (!$ticket) {
            return response()->json([
                'success' => false,
                'message' => 'Ticket not found'
            ], 404);
        }

        $message = SupportMessage::create([
            'ticket_id' => $ticket->id,
            'user_id' => Auth::id(),
            'message' => $request->message,
            'is_internal' => false,
            'is_read' => false,
        ]);

        // Update ticket timestamp
        $ticket->touch();

        return response()->json([
            'success' => true,
            'message' => $message->load('user'),
            'ticket' => $ticket
        ]);
    }

    /**
     * Get active chat sessions for current user
     */
    public function getActiveChats()
    {
        $chats = SupportTicket::where('user_id', Auth::id())
            ->where('type', 'chat')
            ->where('status', '!=', 'closed')
            ->with(['user', 'messages' => function($query) {
                $query->where('is_read', false)->latest();
            }])
            ->orderBy('updated_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'chats' => $chats
        ]);
    }

    /**
     * Close a support ticket
     */
    public function closeTicket($ticketId)
    {
        $ticket = SupportTicket::where('id', $ticketId)
            ->where('user_id', Auth::id())
            ->first();

        if (!$ticket) {
            return response()->json([
                'success' => false,
                'message' => 'Ticket not found'
            ], 404);
        }

        $ticket->update([
            'status' => 'closed',
            'resolved_at' => now()
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Ticket closed successfully'
        ]);
    }
} 