@extends('admin.layouts.app')

@section('content')
<div class="space-y-8">
    <!-- Page Header -->
    <div class="relative overflow-hidden bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl shadow-2xl">
        <div class="absolute inset-0 bg-black opacity-10"></div>
        <div class="relative px-8 py-8">
            <div class="flex items-center justify-between">
                <div class="text-white">
                    <h1 class="text-3xl font-bold mb-2">Booking Details #{{ $booking->id }}</h1>
                    <p class="text-blue-100 text-lg">View and manage booking information</p>
                </div>
                <div class="hidden md:block">
                    <a href="{{ route('admin.bookings.index') }}" class="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg transition-all duration-200 flex items-center">
                        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                        </svg>
                        Back to Bookings
                    </a>
                </div>
            </div>
        </div>
    </div>

    <!-- Booking Information -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Booking Details -->
        <div class="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Booking Information</h3>
            <div class="space-y-4">
                <div class="flex justify-between">
                    <span class="text-gray-600">Booking ID:</span>
                    <span class="font-medium">#{{ $booking->id }}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-gray-600">Date:</span>
                    <span class="font-medium">{{ $booking->date }}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-gray-600">Time:</span>
                    <span class="font-medium">{{ $booking->start_time }} - {{ $booking->end_time }}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-gray-600">Status:</span>
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full {{ 
                        $booking->status === 'confirmed' ? 'bg-green-100 text-green-800' : 
                        ($booking->status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                        ($booking->status === 'completed' ? 'bg-blue-100 text-blue-800' : 
                        'bg-red-100 text-red-800')) 
                    }}">
                        {{ ucfirst($booking->status) }}
                    </span>
                </div>
                <div class="flex justify-between">
                    <span class="text-gray-600">Service Type:</span>
                    <span class="font-medium">{{ $booking->service_type ?? 'N/A' }}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-gray-600">Duration:</span>
                    <span class="font-medium">{{ $booking->duration ?? 'N/A' }} hours</span>
                </div>
                @if($booking->description)
                <div>
                    <span class="text-gray-600 block mb-2">Description:</span>
                    <p class="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{{ $booking->description }}</p>
                </div>
                @endif
            </div>
        </div>

        <!-- Pet Owner Information -->
        <div class="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Pet Owner</h3>
            @if($booking->user)
            <div class="flex items-center space-x-4 mb-4">
                <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-lg font-semibold">
                    {{ substr($booking->user->name, 0, 1) }}
                </div>
                <div>
                    <div class="font-medium text-gray-900">{{ $booking->user->name }}</div>
                    <div class="text-sm text-gray-500">{{ $booking->user->email }}</div>
                </div>
            </div>
            <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                    <span class="text-gray-600">Phone:</span>
                    <span>{{ $booking->user->phone ?? 'N/A' }}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-gray-600">Role:</span>
                    <span class="capitalize">{{ $booking->user->role }}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-gray-600">Joined:</span>
                    <span>{{ $booking->user->created_at->format('M d, Y') }}</span>
                </div>
            </div>
            @else
            <p class="text-gray-500">No user information available</p>
            @endif
        </div>

        <!-- Pet Sitter Information -->
        <div class="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Pet Sitter</h3>
            @if($booking->sitter)
            <div class="flex items-center space-x-4 mb-4">
                <div class="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white text-lg font-semibold">
                    {{ substr($booking->sitter->name, 0, 1) }}
                </div>
                <div>
                    <div class="font-medium text-gray-900">{{ $booking->sitter->name }}</div>
                    <div class="text-sm text-gray-500">{{ $booking->sitter->email }}</div>
                </div>
            </div>
            <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                    <span class="text-gray-600">Phone:</span>
                    <span>{{ $booking->sitter->phone ?? 'N/A' }}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-gray-600">Hourly Rate:</span>
                    <span>₱{{ number_format($booking->sitter->hourly_rate ?? 0, 2) }}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-gray-600">Joined:</span>
                    <span>{{ $booking->sitter->created_at->format('M d, Y') }}</span>
                </div>
            </div>
            @else
            <p class="text-gray-500">No sitter information available</p>
            @endif
        </div>

        <!-- Payment Information -->
        <div class="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Payment Information</h3>
            @if($booking->payment)
            <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                    <span class="text-gray-600">Amount:</span>
                    <span class="font-medium text-lg">₱{{ number_format($booking->payment->amount, 2) }}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-gray-600">Method:</span>
                    <span class="capitalize">{{ $booking->payment->method }}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-gray-600">Status:</span>
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full {{ 
                        $booking->payment->status === 'completed' ? 'bg-green-100 text-green-800' : 
                        ($booking->payment->status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-red-100 text-red-800') 
                    }}">
                        {{ ucfirst($booking->payment->status) }}
                    </span>
                </div>
                <div class="flex justify-between">
                    <span class="text-gray-600">Transaction ID:</span>
                    <span class="font-mono text-xs">{{ $booking->payment->transaction_id ?? 'N/A' }}</span>
                </div>
                @if($booking->payment->processed_at)
                <div class="flex justify-between">
                    <span class="text-gray-600">Processed:</span>
                    <span>{{ $booking->payment->processed_at->format('M d, Y H:i') }}</span>
                </div>
                @endif
            </div>
            @else
            <p class="text-gray-500">No payment information available</p>
            @endif
        </div>
    </div>

    <!-- Actions -->
    <div class="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
        <div class="flex space-x-4">
            @if($booking->status === 'pending')
                <form method="POST" action="{{ route('admin.bookings.confirm', $booking->id) }}" class="inline">
                    @csrf
                    <button type="submit" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors">
                        Confirm Booking
                    </button>
                </form>
                <form method="POST" action="{{ route('admin.bookings.cancel', $booking->id) }}" class="inline">
                    @csrf
                    <button type="submit" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors">
                        Cancel Booking
                    </button>
                </form>
            @endif
            
            <a href="{{ route('admin.bookings.index') }}" class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors">
                Back to List
            </a>
        </div>
    </div>
</div>
@endsection
