<?php

namespace App\Http\Controllers;

use App\Models\SupportTicket;
use App\Models\SupportMessage;
use App\Models\User;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class SupportController extends Controller
{
    public function index()
    {
        return view('support');
    }

    public function store(Request $request)
    {
        $request->validate([
            'subject' => 'required|string|max:255',
            'category' => 'required|in:technical,billing,account,booking,general',
            'priority' => 'required|in:low,medium,high,urgent',
            'message' => 'required|string|max:1000',
        ]);

        // Generate unique ticket number
        $ticketNumber = 'TKT-' . strtoupper(Str::random(8));

        // Create support ticket
        $ticket = SupportTicket::create([
            'user_id' => auth()->id(),
            'ticket_number' => $ticketNumber,
            'subject' => $request->subject,
            'category' => $request->category,
            'priority' => $request->priority,
            'status' => 'open',
            'description' => $request->message,
        ]);

        // Create initial message
        SupportMessage::create([
            'ticket_id' => $ticket->id,
            'user_id' => auth()->id(),
            'message' => $request->message,
            'is_admin_message' => false,
        ]);

        // Notify all admin users
        $admins = User::where('is_admin', true)->get();
        foreach ($admins as $admin) {
            Notification::create([
                'user_id' => $admin->id,
                'title' => 'New Support Ticket',
                'message' => "New support ticket #{$ticketNumber} created by " . auth()->user()->name,
                'type' => 'support',
                'data' => json_encode([
                    'ticket_id' => $ticket->id,
                    'ticket_number' => $ticketNumber,
                    'user_name' => auth()->user()->name,
                    'subject' => $request->subject,
                    'priority' => $request->priority
                ])
            ]);
        }

        return redirect()->route('support.index')->with('success', 'Support ticket created successfully! Ticket number: ' . $ticketNumber);
    }

    public function myTickets()
    {
        $tickets = SupportTicket::where('user_id', auth()->id())
            ->with(['messages', 'assignedTo'])
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        return view('my-tickets', compact('tickets'));
    }

    public function show(SupportTicket $ticket)
    {
        // Ensure user can only view their own tickets
        if ($ticket->user_id !== auth()->id() && !auth()->user()->is_admin) {
            abort(403);
        }

        $ticket->load(['messages.user', 'assignedTo']);

        return view('ticket-details', compact('ticket'));
    }

    public function reply(Request $request, SupportTicket $ticket)
    {
        $request->validate([
            'message' => 'required|string|max:1000',
        ]);

        // Ensure user can only reply to their own tickets
        if ($ticket->user_id !== auth()->id() && !auth()->user()->is_admin) {
            abort(403);
        }

        // Create message
        SupportMessage::create([
            'ticket_id' => $ticket->id,
            'user_id' => auth()->id(),
            'message' => $request->message,
            'is_admin_message' => auth()->user()->is_admin,
        ]);

        // Update ticket status if admin replied
        if (auth()->user()->is_admin) {
            $ticket->update(['status' => 'in_progress']);
        }

        // Notify the other party
        $recipientId = auth()->user()->is_admin ? $ticket->user_id : $ticket->assigned_to;
        if ($recipientId) {
            Notification::create([
                'user_id' => $recipientId,
                'title' => 'New Message on Ticket #' . $ticket->ticket_number,
                'message' => auth()->user()->name . ' replied to your support ticket',
                'type' => 'support',
                'data' => json_encode([
                    'ticket_id' => $ticket->id,
                    'ticket_number' => $ticket->ticket_number
                ])
            ]);
        }

        return redirect()->back()->with('success', 'Message sent successfully!');
    }
} 