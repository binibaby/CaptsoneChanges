@extends('admin.layouts.app')

@section('content')
<div class="space-y-8">
    <!-- Page Header -->
    <div class="relative overflow-hidden bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 rounded-2xl shadow-2xl">
        <div class="absolute inset-0 bg-black opacity-10"></div>
        <div class="relative px-8 py-8">
            <div class="flex items-center justify-between">
                <div class="text-white">
                    <h1 class="text-3xl font-bold mb-2">Booking Management</h1>
                    <p class="text-orange-100 text-lg">Monitor and manage all booking requests</p>
                    <div class="flex items-center mt-4 space-x-6">
                        <div class="flex items-center text-orange-100">
                            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                            </svg>
                            <span class="text-sm">{{ $bookings->total() ?? 0 }} Total Bookings</span>
                        </div>
                        <div class="flex items-center text-orange-100">
                            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            <span class="text-sm">{{ $bookings->where('status', 'confirmed')->count() ?? 0 }} Confirmed</span>
                        </div>
                    </div>
                </div>
                <div class="hidden md:block">
                    <div class="w-24 h-24 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                        <svg class="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Action Bar -->
    <div class="flex flex-wrap items-center justify-between gap-4">
        <div class="flex items-center space-x-4">
            <h2 class="text-xl font-semibold text-gray-900">Booking Actions</h2>
        </div>
        <div class="flex items-center space-x-3">
            <button class="bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-xl border border-gray-200 transition-all duration-200 flex items-center shadow-sm hover:shadow-md">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
                Refresh
            </button>
            <button class="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-4 py-2 rounded-xl transition-all duration-200 flex items-center shadow-lg hover:shadow-xl">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
                Add Booking
            </button>
        </div>
    </div>

    <!-- Bookings Overview -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div class="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover-lift">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-gray-600 text-sm font-medium">Total Bookings</p>
                    <p class="text-3xl font-bold text-gray-900">{{ $bookings->total() ?? 0 }}</p>
                </div>
                <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                </div>
            </div>
        </div>
        
        <div class="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover-lift">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-gray-600 text-sm font-medium">Pending</p>
                    <p class="text-3xl font-bold text-yellow-600">{{ $bookings->where('status', 'pending')->count() ?? 0 }}</p>
                </div>
                <div class="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center">
                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                </div>
            </div>
        </div>
        
        <div class="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover-lift">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-gray-600 text-sm font-medium">Confirmed</p>
                    <p class="text-3xl font-bold text-green-600">{{ $bookings->where('status', 'confirmed')->count() ?? 0 }}</p>
                </div>
                <div class="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                </div>
            </div>
        </div>
        
        <div class="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover-lift">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-gray-600 text-sm font-medium">Completed</p>
                    <p class="text-3xl font-bold text-purple-600">{{ $bookings->where('status', 'completed')->count() ?? 0 }}</p>
                </div>
                <div class="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                </div>
            </div>
        </div>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <form method="GET" class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select name="status" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500">
                    <option value="">All Status</option>
                    <option value="pending" {{ request('status') == 'pending' ? 'selected' : '' }}>Pending</option>
                    <option value="confirmed" {{ request('status') == 'confirmed' ? 'selected' : '' }}>Confirmed</option>
                    <option value="completed" {{ request('status') == 'completed' ? 'selected' : '' }}>Completed</option>
                    <option value="cancelled" {{ request('status') == 'cancelled' ? 'selected' : '' }}>Cancelled</option>
                </select>
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <input type="text" name="search" value="{{ request('search') }}" placeholder="Search by ID, name, or email..." class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500">
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Date From</label>
                <input type="date" name="date_from" value="{{ request('date_from') }}" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500">
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Date To</label>
                <input type="date" name="date_to" value="{{ request('date_to') }}" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500">
            </div>
            
            <div class="md:col-span-4 flex space-x-3">
                <button type="submit" class="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
                    Filter
                </button>
                <a href="{{ route('admin.bookings.index') }}" class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                    Clear
                </a>
            </div>
        </form>
    </div>

    <!-- Bookings Table -->
    <div class="bg-white rounded-2xl shadow-lg border border-gray-100 hover-lift">
        <div class="px-6 py-4 border-b border-gray-200">
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                        <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                        </svg>
                    </div>
                    <div>
                        <h3 class="text-lg font-semibold text-gray-900">All Bookings</h3>
                        <p class="text-sm text-gray-600">Manage and monitor booking requests</p>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="overflow-x-auto">
            <table class="w-full">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booking ID</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pet Owner</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pet Sitter</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                    @forelse($bookings as $booking)
                    <tr class="hover:bg-gray-50">
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            #{{ $booking->id }}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <div class="flex items-center">
                                <div class="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                                    {{ substr($booking->user->name ?? 'N/A', 0, 1) }}
                                </div>
                                <div class="ml-3">
                                    <div class="text-sm font-medium text-gray-900">{{ $booking->user->name ?? 'N/A' }}</div>
                                    <div class="text-sm text-gray-500">{{ $booking->user->email ?? 'N/A' }}</div>
                                </div>
                            </div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <div class="flex items-center">
                                <div class="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                                    {{ substr($booking->sitter->name ?? 'N/A', 0, 1) }}
                                </div>
                                <div class="ml-3">
                                    <div class="text-sm font-medium text-gray-900">{{ $booking->sitter->name ?? 'N/A' }}</div>
                                    <div class="text-sm text-gray-500">{{ $booking->sitter->email ?? 'N/A' }}</div>
                                </div>
                            </div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div>{{ $booking->date }}</div>
                            <div class="text-sm text-gray-500">{{ $booking->start_time }} - {{ $booking->end_time }}</div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full {{ 
                                $booking->status === 'confirmed' ? 'bg-green-100 text-green-800' : 
                                ($booking->status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                                ($booking->status === 'completed' ? 'bg-blue-100 text-blue-800' : 
                                'bg-red-100 text-red-800')) 
                            }}">
                                {{ ucfirst($booking->status) }}
                            </span>
                        </td>
                    </tr>
                    @empty
                    <tr>
                        <td colspan="5" class="px-6 py-12 text-center">
                            <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                </div>
                            <h3 class="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
                            <p class="text-gray-500 text-sm">No bookings match your current filters</p>
                        </td>
                    </tr>
                    @endforelse
                </tbody>
            </table>
            </div>
        
        <!-- Pagination -->
        @if($bookings->hasPages())
        <div class="px-6 py-4 border-t border-gray-200">
            {{ $bookings->appends(request()->query())->links() }}
        </div>
        @endif
    </div>
</div>
@endsection 