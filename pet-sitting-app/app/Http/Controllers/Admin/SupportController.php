<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SupportTicket;
use App\Models\SupportMessage;
use App\Models\User;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class SupportController extends Controller
{
    public function index(Request $request)
    {
        $query = SupportTicket::with(['user', 'assignedTo', 'messages']);

        // Apply filters
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('priority')) {
            $query->where('priority', $request->priority);
        }

        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }

        if ($request->filled('assigned_to')) {
            $query->where('assigned_to', $request->assigned_to);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('subject', 'like', "%{$search}%")
                  ->orWhere('ticket_number', 'like', "%{$search}%")
                  ->orWhereHas('user', function ($userQuery) use ($search) {
                      $userQuery->where('name', 'like', "%{$search}%")
                               ->orWhere('email', 'like', "%{$search}%");
                  });
            });
        }

        $tickets = $query->orderBy('updated_at', 'desc')->paginate(20);

        // Get statistics
        $stats = [
            'total_tickets' => SupportTicket::count(),
            'open_tickets' => SupportTicket::where('status', 'open')->count(),
            'in_progress_tickets' => SupportTicket::where('status', 'in_progress')->count(),
            'resolved_tickets' => SupportTicket::where('status', 'resolved')->count(),
            'high_priority_tickets' => SupportTicket::where('priority', 'high')->whereIn('status', ['open', 'in_progress'])->count(),
        ];

        return view('admin.support.index', compact('tickets', 'stats'));
    }

    public function show(SupportTicket $ticket)
    {
        $ticket->load(['user', 'assignedTo', 'messages.user']);
        
        // Mark as read if assigned to current admin
        if ($ticket->assigned_to === Auth::id()) {
            $ticket->update(['read_at' => now()]);
        }

        return view('admin.support.show', compact('ticket'));
    }

    public function assign(Request $request, SupportTicket $ticket)
    {
        $request->validate([
            'assigned_to' => 'required|exists:users,id',
        ]);

        $ticket->update([
            'assigned_to' => $request->assigned_to,
            'status' => 'in_progress',
            'assigned_at' => now(),
        ]);

        // Notify assigned admin
        Notification::create([
            'user_id' => $request->assigned_to,
            'title' => 'Support Ticket Assigned',
            'message' => "You have been assigned ticket #{$ticket->ticket_number}",
            'type' => 'support',
            'data' => ['ticket_id' => $ticket->id],
        ]);

        return redirect()->back()->with('success', 'Ticket assigned successfully.');
    }

    public function updateStatus(Request $request, SupportTicket $ticket)
    {
        $request->validate([
            'status' => 'required|in:open,in_progress,resolved,closed',
            'resolution_notes' => 'required_if:status,resolved|string|max:1000',
        ]);

        $ticket->update([
            'status' => $request->status,
            'resolved_at' => $request->status === 'resolved' ? now() : null,
            'resolution_notes' => $request->resolution_notes,
        ]);

        // Notify user of status change
        Notification::create([
            'user_id' => $ticket->user_id,
            'title' => 'Support Ticket Updated',
            'message' => "Your ticket #{$ticket->ticket_number} status has been updated to {$request->status}",
            'type' => 'support',
            'data' => ['ticket_id' => $ticket->id],
        ]);

        return redirect()->back()->with('success', 'Ticket status updated successfully.');
    }

    public function reply(Request $request, SupportTicket $ticket)
    {
        $request->validate([
            'message' => 'required|string|max:2000',
            'is_internal' => 'boolean',
        ]);

        $message = SupportMessage::create([
            'ticket_id' => $ticket->id,
            'user_id' => Auth::id(),
            'message' => $request->message,
            'is_internal' => $request->is_internal ?? false,
        ]);

        // Update ticket status to in_progress if it was open
        if ($ticket->status === 'open') {
            $ticket->update([
                'status' => 'in_progress',
                'last_reply_at' => now(),
            ]);
        }

        // Notify user if not internal message
        if (!$request->is_internal) {
            Notification::create([
                'user_id' => $ticket->user_id,
                'title' => 'Support Ticket Reply',
                'message' => "You have received a reply to your ticket #{$ticket->ticket_number}",
                'type' => 'support',
                'data' => ['ticket_id' => $ticket->id],
            ]);
        }

        return redirect()->back()->with('success', 'Reply sent successfully.');
    }

    public function liveChat()
    {
        // Get active chat sessions from both web and mobile
        $activeChats = SupportTicket::whereIn('type', ['live_chat', 'chat'])
            ->whereIn('status', ['open', 'in_progress'])
            ->with(['user', 'assignedTo', 'messages' => function($query) {
                $query->where('is_read', false)->latest();
            }])
            ->orderBy('updated_at', 'desc')
            ->get();

        return view('admin.support.live-chat', compact('activeChats'));
    }

    public function chatSession(SupportTicket $ticket)
    {
        if (!in_array($ticket->type, ['live_chat', 'chat'])) {
            return redirect()->back()->with('error', 'Invalid chat session.');
        }

        $ticket->load(['user', 'assignedTo', 'messages.user']);
        
        // Mark messages as read by admin
        $ticket->messages()->where('user_id', '!=', Auth::id())
            ->where('is_read', false)
            ->update(['is_read' => true]);
        
        return view('admin.support.chat-session', compact('ticket'));
    }

    public function sendChatMessage(Request $request, SupportTicket $ticket)
    {
        $request->validate([
            'message' => 'required|string|max:1000',
        ]);

        if (!in_array($ticket->type, ['live_chat', 'chat'])) {
            return response()->json(['error' => 'Invalid chat session'], 400);
        }

        $message = SupportMessage::create([
            'ticket_id' => $ticket->id,
            'user_id' => Auth::id(),
            'message' => $request->message,
            'is_internal' => false,
            'is_read' => false,
        ]);

        // Update ticket
        $ticket->update([
            'last_reply_at' => now(),
            'status' => 'in_progress',
            'assigned_to' => Auth::id(),
            'assigned_at' => $ticket->assigned_at ?? now(),
        ]);

        // Create notification for mobile user
        Notification::create([
            'user_id' => $ticket->user_id,
            'type' => 'support',
            'message' => 'You have received a new message from support team.',
            'read_at' => null,
        ]);

        // Broadcast to user (you can use Laravel Echo/Pusher here)
        // event(new SupportMessageSent($message));

        return response()->json([
            'success' => true,
            'message' => [
                'id' => $message->id,
                'message' => $message->message,
                'created_at' => $message->created_at,
                'user' => [
                    'id' => $message->user->id,
                    'name' => $message->user->name,
                    'role' => 'admin'
                ]
            ],
        ]);
    }

    public function getChatMessages(SupportTicket $ticket)
    {
        if (!in_array($ticket->type, ['live_chat', 'chat'])) {
            return response()->json(['error' => 'Invalid chat session'], 400);
        }

        $messages = $ticket->messages()
            ->with('user')
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(function ($message) {
                return [
                    'id' => $message->id,
                    'message' => $message->message,
                    'created_at' => $message->created_at,
                    'is_read' => $message->is_read,
                    'user' => [
                        'id' => $message->user->id,
                        'name' => $message->user->name,
                        'role' => $message->user->is_admin ? 'admin' : $message->user->role
                    ]
                ];
            });

        // Mark messages as read by admin
        $ticket->messages()->where('user_id', '!=', Auth::id())
            ->where('is_read', false)
            ->update(['is_read' => true]);

        return response()->json([
            'chat' => [
                'id' => $ticket->id,
                'subject' => $ticket->subject,
                'status' => $ticket->status,
                'user' => [
                    'id' => $ticket->user->id,
                    'name' => $ticket->user->name,
                    'email' => $ticket->user->email,
                    'role' => $ticket->user->role
                ]
            ],
            'messages' => $messages,
            'last_message_id' => $messages->last() ? $messages->last()['id'] : null,
            'unread_count' => $ticket->messages()->where('user_id', '!=', Auth::id())->where('is_read', false)->count()
        ]);
    }

    /**
     * Get new messages since last message ID (for real-time updates)
     */
    public function getNewMessages(Request $request, SupportTicket $ticket)
    {
        $lastMessageId = $request->get('last_message_id', 0);
        
        $newMessages = $ticket->messages()
            ->where('id', '>', $lastMessageId)
            ->with('user')
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(function ($message) {
                return [
                    'id' => $message->id,
                    'message' => $message->message,
                    'created_at' => $message->created_at,
                    'is_read' => $message->is_read,
                    'user' => [
                        'id' => $message->user->id,
                        'name' => $message->user->name,
                        'role' => $message->user->is_admin ? 'admin' : $message->user->role
                    ]
                ];
            });

        // Mark new messages as read by admin
        if ($newMessages->isNotEmpty()) {
            $ticket->messages()
                ->where('id', '>', $lastMessageId)
                ->where('user_id', '!=', Auth::id())
                ->where('is_read', false)
                ->update(['is_read' => true]);
        }

        return response()->json([
            'new_messages' => $newMessages,
            'has_new_messages' => $newMessages->isNotEmpty(),
            'last_message_id' => $newMessages->last() ? $newMessages->last()['id'] : $lastMessageId
        ]);
    }

    /**
     * Mark message as read
     */
    public function markMessageAsRead(Request $request, SupportTicket $ticket)
    {
        $messageId = $request->get('message_id');
        
        $message = $ticket->messages()->find($messageId);
        if ($message && $message->user_id !== Auth::id()) {
            $message->update(['is_read' => true]);
        }

        return response()->json(['success' => true]);
    }

    /**
     * Get active chat sessions with real-time updates
     */
    public function getActiveChats()
    {
        $activeChats = SupportTicket::whereIn('type', ['live_chat', 'chat'])
            ->whereIn('status', ['open', 'in_progress'])
            ->with(['user', 'assignedTo', 'messages' => function($query) {
                $query->where('is_read', false)->latest();
            }])
            ->orderBy('updated_at', 'desc')
            ->get()
            ->map(function ($chat) {
                return [
                    'id' => $chat->id,
                    'subject' => $chat->subject,
                    'status' => $chat->status,
                    'updated_at' => $chat->updated_at,
                    'unread_count' => $chat->messages->where('is_read', false)->count(),
                    'user' => [
                        'id' => $chat->user->id,
                        'name' => $chat->user->name,
                        'email' => $chat->user->email
                    ],
                    'assigned_to' => $chat->assignedTo ? [
                        'id' => $chat->assignedTo->id,
                        'name' => $chat->assignedTo->name
                    ] : null
                ];
            });

        return response()->json([
            'active_chats' => $activeChats,
            'total_active' => $activeChats->count(),
            'total_unread' => $activeChats->sum('unread_count')
        ]);
    }

    public function analytics(Request $request)
    {
        $dateRange = $request->get('date_range', 'last_30_days');
        $startDate = $this->getStartDate($dateRange);
        $endDate = Carbon::now();

        $analytics = [
            'total_tickets' => SupportTicket::whereBetween('created_at', [$startDate, $endDate])->count(),
            'resolved_tickets' => SupportTicket::where('status', 'resolved')
                ->whereBetween('created_at', [$startDate, $endDate])
                ->count(),
            'average_resolution_time' => $this->getAverageResolutionTime($startDate, $endDate),
            'tickets_by_category' => SupportTicket::whereBetween('created_at', [$startDate, $endDate])
                ->select('category', DB::raw('count(*) as count'))
                ->groupBy('category')
                ->get(),
            'tickets_by_priority' => SupportTicket::whereBetween('created_at', [$startDate, $endDate])
                ->select('priority', DB::raw('count(*) as count'))
                ->groupBy('priority')
                ->get(),
            'tickets_by_status' => SupportTicket::whereBetween('created_at', [$startDate, $endDate])
                ->select('status', DB::raw('count(*) as count'))
                ->groupBy('status')
                ->get(),
            'daily_tickets' => $this->getDailyTicketStats($startDate, $endDate),
            'admin_performance' => $this->getAdminPerformance($startDate, $endDate),
        ];

        return view('admin.support.analytics', compact('analytics', 'dateRange'));
    }

    public function export(Request $request)
    {
        $query = SupportTicket::with(['user', 'assignedTo']);

        // Apply same filters as index
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('priority')) {
            $query->where('priority', $request->priority);
        }

        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }

        if ($request->filled('date_from')) {
            $query->where('created_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->where('created_at', '<=', $request->date_to);
        }

        $tickets = $query->get();

        $filename = 'support_tickets_export_' . now()->format('Y-m-d_H-i-s') . '.csv';
        
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ];

        $callback = function() use ($tickets) {
            $file = fopen('php://output', 'w');
            
            // Add headers
            fputcsv($file, [
                'Ticket Number', 'Subject', 'User', 'Category', 'Priority', 'Status',
                'Assigned To', 'Created At', 'Resolved At', 'Resolution Time (Hours)'
            ]);

            // Add data
            foreach ($tickets as $ticket) {
                $resolutionTime = $ticket->resolved_at && $ticket->created_at 
                    ? $ticket->created_at->diffInHours($ticket->resolved_at) 
                    : null;

                fputcsv($file, [
                    $ticket->ticket_number,
                    $ticket->subject,
                    $ticket->user->name ?? 'N/A',
                    $ticket->category,
                    $ticket->priority,
                    $ticket->status,
                    $ticket->assignedTo->name ?? 'Unassigned',
                    $ticket->created_at->format('Y-m-d H:i:s'),
                    $ticket->resolved_at ? $ticket->resolved_at->format('Y-m-d H:i:s') : 'N/A',
                    $resolutionTime ?? 'N/A',
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    public function bulkAction(Request $request)
    {
        $request->validate([
            'action' => 'required|in:assign,update_status,delete',
            'ticket_ids' => 'required|array',
            'ticket_ids.*' => 'exists:support_tickets,id',
            'assigned_to' => 'required_if:action,assign|exists:users,id',
            'status' => 'required_if:action,update_status|in:open,in_progress,resolved,closed',
        ]);

        $tickets = SupportTicket::whereIn('id', $request->ticket_ids);

        switch ($request->action) {
            case 'assign':
                $tickets->update([
                    'assigned_to' => $request->assigned_to,
                    'status' => 'in_progress',
                    'assigned_at' => now(),
                ]);
                break;

            case 'update_status':
                $tickets->update([
                    'status' => $request->status,
                    'resolved_at' => $request->status === 'resolved' ? now() : null,
                ]);
                break;

            case 'delete':
                $tickets->delete();
                break;
        }

        return redirect()->back()->with('success', 'Bulk action completed successfully.');
    }

    private function getStartDate($dateRange)
    {
        switch ($dateRange) {
            case 'last_7_days':
                return Carbon::now()->subDays(7);
            case 'last_30_days':
                return Carbon::now()->subDays(30);
            case 'last_90_days':
                return Carbon::now()->subDays(90);
            case 'this_year':
                return Carbon::now()->startOfYear();
            default:
                return Carbon::now()->subDays(30);
        }
    }

    private function getAverageResolutionTime($startDate, $endDate)
    {
        $resolvedTickets = SupportTicket::where('status', 'resolved')
            ->whereNotNull('resolved_at')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->get();

        if ($resolvedTickets->isEmpty()) {
            return 0;
        }

        $totalHours = $resolvedTickets->sum(function ($ticket) {
            return $ticket->created_at->diffInHours($ticket->resolved_at);
        });

        return round($totalHours / $resolvedTickets->count(), 2);
    }

    private function getDailyTicketStats($startDate, $endDate)
    {
        return SupportTicket::whereBetween('created_at', [$startDate, $endDate])
            ->select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('COUNT(*) as count'),
                DB::raw('SUM(CASE WHEN status = "resolved" THEN 1 ELSE 0 END) as resolved_count')
            )
            ->groupBy('date')
            ->orderBy('date')
            ->get();
    }

    private function getAdminPerformance($startDate, $endDate)
    {
        return SupportTicket::whereNotNull('assigned_to')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->select(
                'assigned_to',
                DB::raw('COUNT(*) as total_tickets'),
                DB::raw('SUM(CASE WHEN status = "resolved" THEN 1 ELSE 0 END) as resolved_tickets'),
                DB::raw('AVG(CASE WHEN resolved_at IS NOT NULL THEN TIMESTAMPDIFF(HOUR, created_at, resolved_at) END) as avg_resolution_time')
            )
            ->with('assignedTo:id,name')
            ->groupBy('assigned_to')
            ->get();
    }
} 