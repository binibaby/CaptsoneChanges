@extends('admin.layouts.app')

@section('content')
<div class="space-y-8">
    <!-- Welcome Header -->
    <div class="relative overflow-hidden bg-white rounded-2xl shadow-2xl border border-gray-200">
        <div class="relative px-8 py-12">
            <div class="flex items-center justify-between">
                <div class="text-gray-900">
                    <h1 class="text-4xl font-bold mb-2">Welcome back, {{ Auth::user()->name ?? 'Admin' }}!</h1>
                    <p class="text-gray-600 text-lg">Here's what's happening with your PetSitConnect platform today.</p>
                    <div class="flex items-center mt-4 space-x-4">
                        <div class="flex items-center text-gray-600">
                            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            <span class="text-sm">{{ now()->format('l, F j, Y') }}</span>
                        </div>
                    </div>
                </div>
                <div class="hidden md:block">
                    <div class="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                        <svg class="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                        </svg>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Quick Actions -->
    <div class="flex flex-wrap items-center justify-between gap-4">
        <div class="flex items-center space-x-4">
            <h2 class="text-xl font-semibold text-gray-900">Quick Actions</h2>
        </div>
        <div class="flex items-center space-x-3">
            <button class="bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-xl border border-gray-200 transition-all duration-200 flex items-center shadow-sm hover:shadow-md">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                Export Report
            </button>
            <button class="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-xl transition-all duration-200 flex items-center shadow-lg hover:shadow-xl">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
                Add New
            </button>
        </div>
    </div>

    <!-- KPI Cards -->
    <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
        <!-- Total Users -->
        <div class="group relative overflow-hidden bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover-lift">
            <div class="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
            <div class="relative p-6">
                <div class="flex items-center justify-between">
                    <div class="flex-1">
                        <div class="flex items-center space-x-3 mb-4">
                            <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
                                </svg>
                            </div>
                            <div>
                                <p class="text-gray-600 text-sm font-medium">Total Users</p>
                                <p class="text-3xl font-bold text-gray-900">{{ number_format($stats['total_users'] ?? 0) }}</p>
                            </div>
                        </div>
                        <div class="flex items-center justify-between">
                            @if(isset($stats['new_users_this_month']) && $stats['new_users_this_month'] > 0)
                                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                        <path fill-rule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clip-rule="evenodd"></path>
                                    </svg>
                                    +{{ $stats['new_users_this_month'] }} this month
                                </span>
                            @else
                                <span class="text-gray-500 text-sm">No new users</span>
                            @endif
                            <a href="{{ route('admin.users.index') }}" class="text-blue-600 hover:text-blue-700 text-sm font-medium">View →</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Total Bookings -->
        <div class="group relative overflow-hidden bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover-lift">
            <div class="absolute inset-0 bg-gradient-to-br from-orange-500 to-orange-600 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
            <div class="relative p-6">
                <div class="flex items-center justify-between">
                    <div class="flex-1">
                        <div class="flex items-center space-x-3 mb-4">
                            <div class="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                </svg>
                            </div>
                            <div>
                                <p class="text-gray-600 text-sm font-medium">Total Bookings</p>
                                <p class="text-3xl font-bold text-gray-900">{{ number_format($stats['total_bookings'] ?? 0) }}</p>
                            </div>
                        </div>
                        <div class="flex items-center justify-between">
                            @if(isset($stats['new_bookings_this_month']) && $stats['new_bookings_this_month'] > 0)
                                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                        <path fill-rule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clip-rule="evenodd"></path>
                                    </svg>
                                    +{{ $stats['new_bookings_this_month'] }} this month
                                </span>
                            @else
                                <span class="text-gray-500 text-sm">No new bookings</span>
                            @endif
                            <a href="{{ route('admin.bookings.index') }}" class="text-orange-600 hover:text-orange-700 text-sm font-medium">View →</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Total Revenue -->
        <div class="group relative overflow-hidden bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover-lift">
            <div class="absolute inset-0 bg-gradient-to-br from-green-500 to-green-600 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
            <div class="relative p-6">
                <div class="flex items-center justify-between">
                    <div class="flex-1">
                        <div class="flex items-center space-x-3 mb-4">
                            <div class="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                                </svg>
                            </div>
                            <div>
                                <p class="text-gray-600 text-sm font-medium">Total Revenue</p>
                                <p class="text-3xl font-bold text-gray-900">₱{{ number_format($stats['total_revenue'] ?? 0, 2) }}</p>
                            </div>
                        </div>
                        <div class="flex items-center justify-between">
                            @if(isset($stats['monthly_revenue']) && $stats['monthly_revenue'] > 0)
                                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                        <path fill-rule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clip-rule="evenodd"></path>
                                    </svg>
                                    +₱{{ number_format($stats['monthly_revenue'], 2) }} this month
                                </span>
                            @else
                                <span class="text-gray-500 text-sm">No revenue this month</span>
                            @endif
                            <a href="{{ route('admin.payments.index') }}" class="text-green-600 hover:text-green-700 text-sm font-medium">View →</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Pending Verifications -->
        <div class="group relative overflow-hidden bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover-lift">
            <div class="absolute inset-0 bg-gradient-to-br from-purple-500 to-purple-600 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
            <div class="relative p-6">
                <div class="flex items-center justify-between">
                    <div class="flex-1">
                        <div class="flex items-center space-x-3 mb-4">
                            <div class="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                            </div>
                            <div>
                                <p class="text-gray-600 text-sm font-medium">Pending Verifications</p>
                                <p class="text-3xl font-bold text-gray-900">{{ number_format($stats['pending_verifications'] ?? 0) }}</p>
                            </div>
                        </div>
                        <div class="flex items-center justify-between">
                            @if(isset($stats['pending_verifications']) && $stats['pending_verifications'] > 0)
                                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                    <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                        <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                                    </svg>
                                    Requires attention
                                </span>
                            @else
                                <span class="text-gray-500 text-sm">All clear</span>
                            @endif
                            <a href="{{ route('admin.verifications.index') }}" class="text-purple-600 hover:text-purple-700 text-sm font-medium">View →</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Analytics Overview -->
        <div class="group relative overflow-hidden bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover-lift cursor-pointer" onclick="window.location.href='{{ route('admin.analytics.index') }}'">
            <div class="absolute inset-0 bg-gradient-to-br from-indigo-500 to-indigo-600 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
            <div class="relative p-6">
                <div class="flex items-center justify-between">
                    <div class="flex-1">
                        <div class="flex items-center space-x-3 mb-4">
                            <div class="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                                </svg>
                            </div>
                            <div>
                                <p class="text-gray-600 text-sm font-medium">Analytics</p>
                                <p class="text-3xl font-bold text-gray-900">📊</p>
                            </div>
                        </div>
                        <div class="flex items-center justify-between">
                            <span class="text-gray-500 text-sm">Growth & Revenue</span>
                            <a href="{{ route('admin.analytics.index') }}" class="text-indigo-600 hover:text-indigo-700 text-sm font-medium">View →</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Analytics Section Header -->
    <div class="flex items-center justify-between mb-6">
        <div>
            <h2 class="text-2xl font-bold text-gray-900">Analytics & Insights</h2>
            <p class="text-gray-600">Track user growth and revenue trends with detailed analytics</p>
        </div>
        <a href="{{ route('admin.analytics.index') }}" class="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-xl transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
            </svg>
            <span>View Full Analytics</span>
        </a>
    </div>

    <!-- Analytics Section -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- User Growth Chart -->
        <div class="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover-lift cursor-pointer group" onclick="window.location.href='{{ route('admin.analytics.index') }}'">
            <div class="flex items-center justify-between mb-6">
                <div>
                    <h3 class="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">User Growth</h3>
                    <p class="text-sm text-gray-600">Monthly user registration trends</p>
                </div>
                <div class="flex items-center space-x-2">
                    <button class="px-3 py-1.5 text-xs bg-blue-100 text-blue-700 rounded-lg font-medium hover:bg-blue-200 transition-colors">Month</button>
                    <button class="px-3 py-1.5 text-xs bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors">Year</button>
                    <a href="{{ route('admin.analytics.index') }}" class="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center ml-2">
                        View Details
                        <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                        </svg>
                    </a>
                </div>
            </div>
            
            <!-- User Growth Chart -->
            <div class="h-64 relative">
                <canvas id="userGrowthChart" class="w-full h-full"></canvas>
            </div>
        </div>

        <!-- Revenue Chart -->
        <div class="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover-lift cursor-pointer group" onclick="window.location.href='{{ route('admin.analytics.index') }}'">
            <div class="flex items-center justify-between mb-6">
                <div>
                    <h3 class="text-xl font-semibold text-gray-900 group-hover:text-green-600 transition-colors">Revenue Trends</h3>
                    <p class="text-sm text-gray-600">Monthly revenue performance</p>
                </div>
                <div class="flex items-center space-x-2">
                    <button class="px-3 py-1.5 text-xs bg-green-100 text-green-700 rounded-lg font-medium hover:bg-green-200 transition-colors">Month</button>
                    <button class="px-3 py-1.5 text-xs bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors">Year</button>
                    <a href="{{ route('admin.analytics.index') }}" class="text-green-600 hover:text-green-700 text-sm font-medium flex items-center ml-2">
                        View Details
                        <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                        </svg>
                    </a>
                </div>
            </div>
            
            <!-- Revenue Chart -->
            <div class="h-64 relative">
                <canvas id="revenueChart" class="w-full h-full"></canvas>
            </div>
        </div>
    </div>

    <!-- Recent Activities -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Recent Users -->
        <div class="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover-lift">
            <div class="flex items-center justify-between mb-6">
                <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                        <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
                        </svg>
                    </div>
                    <div>
                        <h3 class="text-lg font-semibold text-gray-900">Recent Users</h3>
                        <p class="text-sm text-gray-600">Latest user registrations</p>
                    </div>
                </div>
                <a href="{{ route('admin.users.index') }}" class="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center">
                    View all
                    <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                    </svg>
                </a>
            </div>
            <div class="space-y-3">
                @forelse($recentActivities['recent_users'] ?? [] as $user)
                <div class="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-all duration-200 border border-transparent hover:border-gray-200">
                    <div class="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                        <span class="text-sm font-semibold text-gray-600">{{ substr($user->name, 0, 1) }}</span>
                    </div>
                    <div class="flex-1">
                        <p class="text-sm font-semibold text-gray-900">{{ $user->name }}</p>
                        <p class="text-xs text-gray-500">{{ ucfirst($user->role) }} • {{ $user->created_at->diffForHumans() }}</p>
                    </div>
                    <span class="px-2.5 py-1 text-xs rounded-full font-medium {{ $user->role === 'pet_sitter' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700' }}">
                        {{ ucfirst($user->role) }}
                    </span>
                </div>
                @empty
                <div class="text-center py-8">
                    <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
                        </svg>
                    </div>
                    <p class="text-gray-500 text-sm">No recent users</p>
                </div>
                @endforelse
            </div>
        </div>

        <!-- Recent Bookings -->
        <div class="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover-lift">
            <div class="flex items-center justify-between mb-6">
                <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                        <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                    </div>
                    <div>
                        <h3 class="text-lg font-semibold text-gray-900">Recent Bookings</h3>
                        <p class="text-sm text-gray-600">Latest booking requests</p>
                    </div>
                </div>
                <a href="{{ route('admin.bookings.index') }}" class="text-orange-600 hover:text-orange-700 text-sm font-medium flex items-center">
                    View all
                    <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                    </svg>
                </a>
            </div>
            <div class="space-y-3">
                @forelse($recentActivities['recent_bookings'] ?? [] as $booking)
                <div class="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-all duration-200 border border-transparent hover:border-gray-200">
                    <div class="w-10 h-10 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center">
                        <svg class="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                    </div>
                    <div class="flex-1">
                        <p class="text-sm font-semibold text-gray-900">Booking #{{ $booking->id }}</p>
                        <p class="text-xs text-gray-500">{{ $booking->user->name ?? 'Unknown' }} • {{ $booking->created_at->diffForHumans() }}</p>
                    </div>
                    <span class="px-2.5 py-1 text-xs rounded-full font-medium {{ $booking->status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700' }}">
                        {{ ucfirst($booking->status) }}
                    </span>
                </div>
                @empty
                <div class="text-center py-8">
                    <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                    </div>
                    <p class="text-gray-500 text-sm">No recent bookings</p>
                </div>
                @endforelse
            </div>
        </div>
    </div>

    <!-- Platform Overview -->
    <div class="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover-lift">
        <div class="flex items-center justify-between mb-6">
            <div class="flex items-center space-x-3">
                <div class="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center">
                    <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                    </svg>
                </div>
                <div>
                    <h3 class="text-lg font-semibold text-gray-900">Platform Overview</h3>
                    <p class="text-sm text-gray-600">Key performance indicators</p>
                </div>
            </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="text-center p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
                <div class="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
                    </svg>
                </div>
                <div class="text-3xl font-bold text-blue-600 mb-1">{{ number_format($stats['total_users'] ?? 0) }}</div>
                <div class="text-sm text-blue-700 font-medium">Total Users</div>
                <div class="text-xs text-blue-600 mt-1">Active members</div>
            </div>
            
            <div class="text-center p-4 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200">
                <div class="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                </div>
                <div class="text-3xl font-bold text-orange-600 mb-1">{{ number_format($stats['total_bookings'] ?? 0) }}</div>
                <div class="text-sm text-orange-700 font-medium">Total Bookings</div>
                <div class="text-xs text-orange-600 mt-1">Service requests</div>
            </div>
            
            <div class="text-center p-4 rounded-xl bg-gradient-to-br from-green-50 to-green-100 border border-green-200">
                <div class="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                    </svg>
                </div>
                <div class="text-3xl font-bold text-green-600 mb-1">₱{{ number_format($stats['total_revenue'] ?? 0, 2) }}</div>
                <div class="text-sm text-green-700 font-medium">Total Revenue</div>
                <div class="text-xs text-green-600 mt-1">Platform earnings</div>
            </div>
        </div>
    </div>
</div>

<!-- Chart.js CDN -->
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

<script>
document.addEventListener('DOMContentLoaded', function() {
    // User Growth Chart
    const userGrowthCtx = document.getElementById('userGrowthChart').getContext('2d');
    
    // Get actual data from backend
    const monthlyStats = @json($chartsData['monthly_stats']);
    const userLabels = monthlyStats.map(stat => stat.month);
    const userData = monthlyStats.map(stat => stat.users);
    
    const userGrowthChart = new Chart(userGrowthCtx, {
        type: 'line',
        data: {
            labels: userLabels,
            datasets: [{
                label: 'New Users',
                data: userData,
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: 'rgb(59, 130, 246)',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 6,
                pointHoverRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        color: '#6b7280'
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#6b7280'
                    }
                }
            },
            elements: {
                point: {
                    hoverBackgroundColor: 'rgb(59, 130, 246)'
                }
            }
        }
    });

    // Revenue Chart
    const revenueCtx = document.getElementById('revenueChart').getContext('2d');
    
    // Get actual revenue data from backend
    const revenueData = monthlyStats.map(stat => stat.revenue);
    const revenueBackgroundColors = revenueData.map(() => 'rgba(34, 197, 94, 0.8)');
    
    const revenueChart = new Chart(revenueCtx, {
        type: 'bar',
        data: {
            labels: userLabels,
            datasets: [{
                label: 'Revenue (₱)',
                data: revenueData,
                backgroundColor: revenueBackgroundColors,
                borderColor: 'rgb(34, 197, 94)',
                borderWidth: 2,
                borderRadius: 6,
                borderSkipped: false,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        color: '#6b7280',
                        callback: function(value) {
                            return '₱' + value.toLocaleString();
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#6b7280'
                    }
                }
            }
        }
    });

    // Chart toggle functionality
    const userGrowthButtons = document.querySelectorAll('.bg-white.rounded-2xl.shadow-lg.p-6.border.border-gray-100.hover-lift:first-of-type .flex.items-center.space-x-2 button');
    const revenueButtons = document.querySelectorAll('.bg-white.rounded-2xl.shadow-lg.p-6.border.border-gray-100.hover-lift:last-of-type .flex.items-center.space-x-2 button');

    // User Growth Chart Toggle
    userGrowthButtons.forEach(button => {
        button.addEventListener('click', function() {
            userGrowthButtons.forEach(btn => {
                btn.classList.remove('bg-blue-100', 'text-blue-700');
                btn.classList.add('bg-gray-100', 'text-gray-600');
            });
            this.classList.remove('bg-gray-100', 'text-gray-600');
            this.classList.add('bg-blue-100', 'text-blue-700');
            
            // Update chart data based on selection
            if (this.textContent === 'Month') {
                userGrowthChart.data.labels = userLabels;
                userGrowthChart.data.datasets[0].data = userData;
            } else {
                // For yearly view, we could aggregate the data, but for now just show monthly
                userGrowthChart.data.labels = userLabels;
                userGrowthChart.data.datasets[0].data = userData;
            }
            userGrowthChart.update();
        });
    });

    // Revenue Chart Toggle
    revenueButtons.forEach(button => {
        button.addEventListener('click', function() {
            revenueButtons.forEach(btn => {
                btn.classList.remove('bg-green-100', 'text-green-700');
                btn.classList.add('bg-gray-100', 'text-gray-600');
            });
            this.classList.remove('bg-gray-100', 'text-gray-600');
            this.classList.add('bg-green-100', 'text-green-700');
            
            // Update chart data based on selection
            if (this.textContent === 'Month') {
                revenueChart.data.labels = userLabels;
                revenueChart.data.datasets[0].data = revenueData;
            } else {
                // For yearly view, we could aggregate the data, but for now just show monthly
                revenueChart.data.labels = userLabels;
                revenueChart.data.datasets[0].data = revenueData;
            }
            revenueChart.update();
        });
    });
});
</script>
@endsection