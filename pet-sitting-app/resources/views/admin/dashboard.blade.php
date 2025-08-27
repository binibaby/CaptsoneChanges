@extends('admin.layouts.app')

@section('content')
<div class="space-y-6">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
        <div>
            <h1 class="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p class="mt-2 text-gray-600">Welcome to your PetSitConnect admin dashboard</p>
        </div>
        <div class="flex items-center space-x-3">
            <button class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                Export Report
            </button>
        </div>
    </div>

    <!-- KPI Cards -->
    <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <!-- Total Users -->
        <div class="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
            <div>
                <p class="text-blue-100 text-sm font-medium">Total Users</p>
                <p class="text-3xl font-bold">{{ number_format($stats['total_users'] ?? 0) }}</p>
                <p class="text-blue-100 text-sm mt-1">
                    @if(isset($stats['new_users_this_month']) && $stats['new_users_this_month'] > 0)
                        <span class="text-green-300">(+{{ $stats['new_users_this_month'] }} this month)</span>
                    @else
                        <span class="text-blue-200">No new users</span>
                    @endif
                </p>
            </div>
        </div>

        <!-- Total Bookings -->
        <div class="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
            <div>
                <p class="text-orange-100 text-sm font-medium">Total Bookings</p>
                <p class="text-3xl font-bold">{{ number_format($stats['total_bookings'] ?? 0) }}</p>
                <p class="text-orange-100 text-sm mt-1">
                    @if(isset($stats['new_bookings_this_month']) && $stats['new_bookings_this_month'] > 0)
                        <span class="text-green-300">(+{{ $stats['new_bookings_this_month'] }} this month)</span>
                    @else
                        <span class="text-orange-200">No new bookings</span>
                    @endif
                </p>
            </div>
        </div>

        <!-- Total Revenue -->
        <div class="bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
            <div>
                <p class="text-green-100 text-sm font-medium">Total Revenue</p>
                <p class="text-3xl font-bold">₱{{ number_format($stats['total_revenue'] ?? 0, 2) }}</p>
                <p class="text-green-100 text-sm mt-1">
                    @if(isset($stats['monthly_revenue']) && $stats['monthly_revenue'] > 0)
                        <span class="text-green-300">(+₱{{ number_format($stats['monthly_revenue'], 2) }} this month)</span>
                    @else
                        <span class="text-green-200">No revenue this month</span>
                    @endif
                </p>
            </div>
        </div>

        <!-- Pending Verifications -->
        <div class="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
            <div>
                <p class="text-purple-100 text-sm font-medium">Pending Verifications</p>
                <p class="text-3xl font-bold">{{ number_format($stats['pending_verifications'] ?? 0) }}</p>
                <p class="text-purple-100 text-sm mt-1">
                    @if(isset($stats['pending_verifications']) && $stats['pending_verifications'] > 0)
                        <span class="text-yellow-300">Requires attention</span>
                    @else
                        <span class="text-purple-200">All clear</span>
                    @endif
                </p>
            </div>
        </div>
    </div>

    <!-- Charts Section -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Traffic Chart -->
        <div class="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div class="flex items-center justify-between mb-6">
                <div>
                    <h3 class="text-lg font-semibold text-gray-900">User Growth</h3>
                    <p class="text-sm text-gray-600">Monthly user registration trends</p>
                </div>
                <div class="flex items-center space-x-2">
                    <button class="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-lg font-medium">Month</button>
                    <button class="px-3 py-1 text-xs bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">Year</button>
                </div>
            </div>
            
            <!-- Chart Placeholder -->
            <div class="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                <div class="text-center">
                    <svg class="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                    </svg>
                    <p class="text-gray-500 text-sm">Chart visualization will be implemented here</p>
                </div>
            </div>
        </div>

        <!-- Revenue Chart -->
        <div class="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div class="flex items-center justify-between mb-6">
                <div>
                    <h3 class="text-lg font-semibold text-gray-900">Revenue Trends</h3>
                    <p class="text-sm text-gray-600">Monthly revenue performance</p>
                </div>
                <div class="flex items-center space-x-2">
                    <button class="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-lg font-medium">Month</button>
                    <button class="px-3 py-1 text-xs bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">Year</button>
                </div>
            </div>
            
            <!-- Chart Placeholder -->
            <div class="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                <div class="text-center">
                    <svg class="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                    </svg>
                    <p class="text-gray-500 text-sm">Revenue chart will be implemented here</p>
                </div>
            </div>
        </div>
    </div>

    <!-- Recent Activities -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Recent Users -->
        <div class="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div class="flex items-center justify-between mb-6">
                <h3 class="text-lg font-semibold text-gray-900">Recent Users</h3>
                <a href="{{ route('admin.users.index') }}" class="text-blue-600 hover:text-blue-700 text-sm font-medium">View all</a>
            </div>
            <div class="space-y-4">
                @forelse($recentActivities['recent_users'] ?? [] as $user)
                <div class="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div class="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                        </svg>
                    </div>
                    <div class="flex-1">
                        <p class="text-sm font-medium text-gray-900">{{ $user->name }}</p>
                        <p class="text-xs text-gray-500">{{ ucfirst($user->role) }} • {{ $user->created_at->diffForHumans() }}</p>
                    </div>
                    <span class="px-2 py-1 text-xs rounded-full {{ $user->role === 'pet_sitter' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700' }}">
                        {{ ucfirst($user->role) }}
                    </span>
                </div>
                @empty
                <div class="text-center py-8 text-gray-500">
                    <p>No recent users</p>
                </div>
                @endforelse
            </div>
        </div>

        <!-- Recent Bookings -->
        <div class="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div class="flex items-center justify-between mb-6">
                <h3 class="text-lg font-semibold text-gray-900">Recent Bookings</h3>
                <a href="{{ route('admin.bookings.index') }}" class="text-blue-600 hover:text-blue-700 text-sm font-medium">View all</a>
            </div>
            <div class="space-y-4">
                @forelse($recentActivities['recent_bookings'] ?? [] as $booking)
                <div class="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div class="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                        <svg class="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                    </div>
                    <div class="flex-1">
                        <p class="text-sm font-medium text-gray-900">Booking #{{ $booking->id }}</p>
                        <p class="text-xs text-gray-500">{{ $booking->user->name ?? 'Unknown' }} • {{ $booking->created_at->diffForHumans() }}</p>
                    </div>
                    <span class="px-2 py-1 text-xs rounded-full {{ $booking->status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700' }}">
                        {{ ucfirst($booking->status) }}
                    </span>
                </div>
                @empty
                <div class="text-center py-8 text-gray-500">
                    <p>No recent bookings</p>
                </div>
                @endforelse
            </div>
        </div>
    </div>

    <!-- Platform Stats -->
    <div class="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <h3 class="text-lg font-semibold text-gray-900 mb-6">Platform Overview</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="text-center">
                <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
                    </svg>
                </div>
                <div class="text-2xl font-bold text-blue-600">{{ number_format($stats['total_users'] ?? 0) }}</div>
                <div class="text-sm text-gray-600">Total Users</div>
            </div>
            
            <div class="text-center">
                <div class="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg class="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                </div>
                <div class="text-2xl font-bold text-orange-600">{{ number_format($stats['total_bookings'] ?? 0) }}</div>
                <div class="text-sm text-gray-600">Total Bookings</div>
            </div>
            
            <div class="text-center">
                <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                    </svg>
                </div>
                <div class="text-2xl font-bold text-green-600">₱{{ number_format($stats['total_revenue'] ?? 0, 2) }}</div>
                <div class="text-sm text-gray-600">Total Revenue</div>
            </div>
        </div>
    </div>
</div>
@endsection