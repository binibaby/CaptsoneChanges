@extends('layouts.app')

@section('content')
<div class="min-h-screen bg-gray-50 py-12">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Header -->
        <div class="mb-8">
            <h1 class="text-3xl font-bold text-gray-900">My Support Tickets</h1>
            <p class="mt-2 text-sm text-gray-600">Track the status of your support requests.</p>
        </div>

        @if(session('success'))
            <div class="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                {{ session('success') }}
            </div>
        @endif

        <!-- Create New Ticket Button -->
        <div class="mb-6">
            <a href="{{ route('support.index') }}" class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
                Create New Ticket
            </a>
        </div>

        <!-- Tickets List -->
        <div class="bg-white shadow overflow-hidden sm:rounded-md">
            <div class="px-4 py-5 sm:p-6">
                <div class="flow-root">
                    <ul role="list" class="-my-5 divide-y divide-gray-200">
                        @forelse($tickets as $ticket)
                        <li class="py-4">
                            <div class="flex items-center space-x-4">
                                <div class="flex-shrink-0">
                                    <div class="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                                        <span class="text-sm font-medium text-indigo-700">#</span>
                                    </div>
                                </div>
                                <div class="flex-1 min-w-0">
                                    <div class="flex items-center justify-between">
                                        <div>
                                            <p class="text-sm font-medium text-gray-900 truncate">
                                                <a href="{{ route('support.show', $ticket) }}" class="hover:text-indigo-600">
                                                    {{ $ticket->ticket_number }} - {{ $ticket->subject }}
                                                </a>
                                            </p>
                                            <p class="text-sm text-gray-500">{{ $ticket->category }} • {{ $ticket->created_at->format('M d, Y') }}</p>
                                        </div>
                                        <div class="flex items-center space-x-2">
                                            @if($ticket->priority == 'urgent')
                                                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Urgent</span>
                                            @elseif($ticket->priority == 'high')
                                                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">High</span>
                                            @elseif($ticket->priority == 'medium')
                                                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Medium</span>
                                            @else
                                                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Low</span>
                                            @endif

                                            @if($ticket->status == 'open')
                                                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Open</span>
                                            @elseif($ticket->status == 'in_progress')
                                                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">In Progress</span>
                                            @elseif($ticket->status == 'resolved')
                                                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Resolved</span>
                                            @else
                                                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Closed</span>
                                            @endif
                                        </div>
                                    </div>
                                    <div class="mt-2 flex items-center justify-between">
                                        <div class="flex items-center space-x-4 text-sm text-gray-500">
                                            @if($ticket->assignedTo)
                                                <span>Assigned to {{ $ticket->assignedTo->name }}</span>
                                            @else
                                                <span class="text-orange-600">Awaiting assignment</span>
                                            @endif
                                            <span>{{ $ticket->messages->count() }} messages</span>
                                        </div>
                                        <div class="flex items-center space-x-2">
                                            <a href="{{ route('support.show', $ticket) }}" class="text-indigo-600 hover:text-indigo-900 text-sm font-medium">View Details</a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </li>
                        @empty
                        <li class="py-8 text-center">
                            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                            </svg>
                            <h3 class="mt-2 text-sm font-medium text-gray-900">No tickets found</h3>
                            <p class="mt-1 text-sm text-gray-500">You haven't created any support tickets yet.</p>
                            <div class="mt-6">
                                <a href="{{ route('support.index') }}" class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
                                    Create Your First Ticket
                                </a>
                            </div>
                        </li>
                        @endforelse
                    </ul>
                </div>
            </div>
        </div>

        <!-- Pagination -->
        @if($tickets->hasPages())
        <div class="mt-6">
            {{ $tickets->links() }}
        </div>
        @endif
    </div>
</div>
@endsection 