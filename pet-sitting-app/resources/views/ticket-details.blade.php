@extends('layouts.app')

@section('content')
<div class="min-h-screen bg-gray-50 py-12">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Header -->
        <div class="mb-8">
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-3xl font-bold text-gray-900">{{ $ticket->ticket_number }}</h1>
                    <p class="mt-2 text-lg text-gray-600">{{ $ticket->subject }}</p>
                </div>
                <div class="flex items-center space-x-2">
                    @if($ticket->priority == 'urgent')
                        <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">Urgent</span>
                    @elseif($ticket->priority == 'high')
                        <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">High</span>
                    @elseif($ticket->priority == 'medium')
                        <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">Medium</span>
                    @else
                        <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">Low</span>
                    @endif

                    @if($ticket->status == 'open')
                        <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">Open</span>
                    @elseif($ticket->status == 'in_progress')
                        <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">In Progress</span>
                    @elseif($ticket->status == 'resolved')
                        <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">Resolved</span>
                    @else
                        <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">Closed</span>
                    @endif
                </div>
            </div>
            
            <div class="mt-4 flex items-center space-x-6 text-sm text-gray-500">
                <span>Created {{ $ticket->created_at->format('M d, Y \a\t g:i A') }}</span>
                <span>{{ $ticket->category }}</span>
                @if($ticket->assignedTo)
                    <span>Assigned to {{ $ticket->assignedTo->name }}</span>
                @else
                    <span class="text-orange-600">Awaiting assignment</span>
                @endif
            </div>
        </div>

        @if(session('success'))
            <div class="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                {{ session('success') }}
            </div>
        @endif

        <!-- Messages -->
        <div class="bg-white shadow rounded-lg">
            <div class="px-6 py-4 border-b border-gray-200">
                <h2 class="text-lg font-medium text-gray-900">Conversation</h2>
            </div>
            
            <div class="p-6 space-y-6 max-h-96 overflow-y-auto">
                @forelse($ticket->messages as $message)
                <div class="flex space-x-3 {{ $message->is_admin_message ? 'justify-start' : 'justify-end' }}">
                    <div class="flex-shrink-0">
                        <div class="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                            <span class="text-sm font-medium text-indigo-700">{{ $message->user->name[0] }}</span>
                        </div>
                    </div>
                    <div class="flex-1 {{ $message->is_admin_message ? 'max-w-xs' : 'max-w-xs ml-auto' }}">
                        <div class="bg-gray-100 rounded-lg px-4 py-2">
                            <div class="flex items-center justify-between mb-1">
                                <p class="text-sm font-medium text-gray-900">{{ $message->user->name }}</p>
                                <p class="text-xs text-gray-500">{{ $message->created_at->format('g:i A') }}</p>
                            </div>
                            <p class="text-sm text-gray-700">{{ $message->message }}</p>
                        </div>
                    </div>
                </div>
                @empty
                <div class="text-center text-gray-500 py-8">
                    <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                    </svg>
                    <p class="mt-2 text-sm">No messages yet</p>
                </div>
                @endforelse
            </div>

            <!-- Reply Form -->
            @if($ticket->status !== 'resolved' && $ticket->status !== 'closed')
            <div class="px-6 py-4 border-t border-gray-200">
                <form method="POST" action="{{ route('support.reply', $ticket) }}">
                    @csrf
                    <div class="space-y-4">
                        <div>
                            <label for="message" class="block text-sm font-medium text-gray-700">Add a reply</label>
                            <textarea name="message" id="message" rows="3" required
                                      class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                      placeholder="Type your message here..."></textarea>
                        </div>
                        <div class="flex justify-end">
                            <button type="submit" 
                                    class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                                </svg>
                                Send Reply
                            </button>
                        </div>
                    </div>
                </form>
            </div>
            @else
            <div class="px-6 py-4 border-t border-gray-200">
                <div class="text-center text-gray-500">
                    <p class="text-sm">This ticket has been {{ $ticket->status }}. You cannot add more replies.</p>
                </div>
            </div>
            @endif
        </div>

        <!-- Back Button -->
        <div class="mt-6">
            <a href="{{ route('support.my-tickets') }}" class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                </svg>
                Back to My Tickets
            </a>
        </div>
    </div>
</div>
@endsection 