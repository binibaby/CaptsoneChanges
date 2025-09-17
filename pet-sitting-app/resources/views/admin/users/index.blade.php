@extends('admin.layouts.app')

@section('content')
<div class="space-y-6">
    <div class="sm:flex sm:items-center sm:justify-between">
        <div>
            <h1 class="text-2xl font-bold text-gray-900">User Management</h1>
            <p class="mt-2 text-sm text-gray-700">Manage and monitor all users on the platform.</p>
        </div>
        <div class="flex space-x-3">
            <a href="{{ route('admin.users.export') }}" class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                Export Users
            </a>
        </div>
    </div>

    <!-- Filters -->
    <div class="bg-white shadow rounded-lg p-6">
        <form method="GET" class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
                <label class="block text-sm font-medium text-gray-700">Search</label>
                <input type="text" name="search" value="{{ request('search') }}" placeholder="Name, email, phone..." class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700">Role</label>
                <select name="role" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500">
                    <option value="">All Roles</option>
                    <option value="pet_owner" {{ request('role') == 'pet_owner' ? 'selected' : '' }}>Pet Owner</option>
                    <option value="pet_sitter" {{ request('role') == 'pet_sitter' ? 'selected' : '' }}>Pet Sitter</option>
                </select>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700">Status</label>
                <select name="status" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500">
                    <option value="">All Status</option>
                    <option value="active" {{ request('status') == 'active' ? 'selected' : '' }}>Active</option>
                    <option value="pending" {{ request('status') == 'pending' ? 'selected' : '' }}>Pending</option>
                    <option value="suspended" {{ request('status') == 'suspended' ? 'selected' : '' }}>Suspended</option>
                </select>
            </div>
            <div class="flex items-end">
                <button type="submit" class="w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">Filter</button>
            </div>
        </form>
    </div>

    <!-- Users Table -->
    <div class="bg-white shadow overflow-hidden sm:rounded-md">
        <div class="px-4 py-5 sm:p-6">
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profile</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role & Status</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Verification</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        @forelse($users as $user)
                        <tr>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <div class="flex items-center">
                                    <div class="flex-shrink-0 h-8 w-8">
                                        <div class="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                                            <span class="text-sm font-medium text-gray-700">
                                                {{ $user->first_name ? substr($user->first_name, 0, 1) : substr($user->name, 0, 1) }}
                                            </span>
                                        </div>
                                    </div>
                                    <div class="ml-4">
                                        <div class="text-sm font-medium text-gray-900">
                                            @if($user->first_name && $user->last_name)
                                                {{ $user->first_name }} {{ $user->last_name }}
                                            @else
                                                {{ $user->name }}
                                            @endif
                                        </div>
                                        <div class="text-sm text-gray-500">{{ $user->email }}</div>
                                    </div>
                                </div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <div class="text-sm text-gray-900">{{ $user->phone ?? 'N/A' }}</div>
                                <div class="text-sm text-gray-500">{{ $user->address ?? 'N/A' }}</div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <div class="text-sm text-gray-900">
                                    @if($user->age)
                                        {{ $user->age }} years old
                                    @else
                                        N/A
                                    @endif
                                </div>
                                <div class="text-sm text-gray-500">
                                    @if($user->gender)
                                        {{ ucfirst($user->gender) }}
                                    @else
                                        N/A
                                    @endif
                                </div>
                                @if($user->role === 'pet_sitter')
                                    @if($user->selected_pet_types && is_array($user->selected_pet_types))
                                    <div class="text-xs text-blue-600 font-semibold mt-1">
                                        🐾 Pet Types: {{ implode(', ', $user->selected_pet_types) }}
                                    </div>
                                    @endif
                                    @if($user->pet_breeds && is_array($user->pet_breeds))
                                    <div class="text-xs text-green-600 font-semibold mt-1">
                                        🐕 Breeds: {{ implode(', ', $user->pet_breeds) }}
                                    </div>
                                    @endif
                                    @if($user->hourly_rate)
                                    <div class="text-xs text-purple-600 font-semibold mt-1">
                                        💰 Rate: ${{ $user->hourly_rate }}/hour
                                    </div>
                                    @endif
                                    @if($user->experience)
                                    <div class="text-xs text-orange-600 font-semibold mt-1">
                                        ⭐ Experience: {{ $user->experience }} years
                                    </div>
                                    @endif
                                @else
                                    @if($user->selected_pet_types && is_array($user->selected_pet_types))
                                    <div class="text-xs text-blue-400 mt-1">
                                        Pet Types: {{ implode(', ', $user->selected_pet_types) }}
                                    </div>
                                    @endif
                                    @if($user->pet_breeds && is_array($user->pet_breeds))
                                    <div class="text-xs text-gray-400 mt-1">
                                        Breeds: {{ implode(', ', $user->pet_breeds) }}
                                    </div>
                                    @endif
                                @endif
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <div class="flex items-center">
                                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                                        {{ $user->role === 'pet_sitter' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800' }}">
                                        {{ ucfirst(str_replace('_', ' ', $user->role)) }}
                                    </span>
                                </div>
                                <div class="text-sm text-gray-500 mt-1">
                                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                                        {{ $user->status === 'active' ? 'bg-green-100 text-green-800' : 
                                           ($user->status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800') }}">
                                        {{ ucfirst($user->status) }}
                                    </span>
                                </div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                @if($user->verification_badge)
                                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                                    {{ $user->verification_badge['color'] === 'success' ? 'bg-green-100 text-green-800' : 
                                       ($user->verification_badge['color'] === 'warning' ? 'bg-yellow-100 text-yellow-800' : 
                                       ($user->verification_badge['color'] === 'danger' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800')) }}">
                                    {{ $user->verification_badge['label'] }}
                                </span>
                                @else
                                <span class="text-gray-400">N/A</span>
                                @endif
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <a href="{{ route('admin.users.show', $user->id) }}" class="text-indigo-600 hover:text-indigo-900">View Details</a>
                            </td>
                        </tr>
                        @empty
                        <tr>
                            <td colspan="6" class="px-6 py-4 text-center text-gray-500">
                                No users found.
                            </td>
                        </tr>
                        @endforelse
                    </tbody>
                </table>
            </div>
            
            <!-- Pagination -->
            @if($users->hasPages())
            <div class="px-4 py-3 border-t border-gray-200 sm:px-6">
                {{ $users->links() }}
            </div>
            @endif
        </div>
    </div>
</div>

<script>
let refreshInterval = null;
let isRefreshing = false;

// Auto-refresh user data every 30 seconds
function startAutoRefresh() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
    
    refreshInterval = setInterval(function() {
        if (!isRefreshing) {
            checkForUpdates();
        }
    }, 30000);
}

// Check for updates without full page reload
function checkForUpdates() {
    isRefreshing = true;
    showRefreshIndicator();
    
    fetch('/admin/api/users/status-updates')
        .then(response => response.json())
        .then(data => {
            hideRefreshIndicator();
            if (data.hasUpdates) {
                // Show detailed update notification
                const message = data.updatedCount === 1 
                    ? `1 user updated - refreshing...`
                    : `${data.updatedCount} users updated - refreshing...`;
                showUpdateNotification(message);
                
                // Log updated users for debugging
                if (data.updatedUsers && data.updatedUsers.length > 0) {
                    console.log('Updated users:', data.updatedUsers);
                }
                
                // Refresh the page to show updated data
                setTimeout(() => {
                    location.reload();
                }, 1500);
            }
        })
        .catch(error => {
            hideRefreshIndicator();
            console.log('User status check failed:', error);
        })
        .finally(() => {
            isRefreshing = false;
        });
}

// Real-time user updates
function updateUserStatus(userId, status) {
    fetch(`/admin/api/users/${userId}/status`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
        },
        body: JSON.stringify({ status: status })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showUpdateNotification('User status updated successfully');
            setTimeout(() => {
                location.reload();
            }, 1000);
        }
    })
    .catch(error => console.error('Error updating user status:', error));
}

// Show loading indicator during refresh
function showRefreshIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'refresh-indicator';
    indicator.className = 'fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
    indicator.innerHTML = '<div class="flex items-center"><div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>Checking for updates...</div>';
    document.body.appendChild(indicator);
}

// Remove loading indicator
function hideRefreshIndicator() {
    const indicator = document.getElementById('refresh-indicator');
    if (indicator) {
        indicator.remove();
    }
}

// Show update notification
function showUpdateNotification(message = 'User data updated - refreshing...') {
    const notification = document.createElement('div');
    notification.id = 'update-notification';
    notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
    notification.innerHTML = `
        <div class="flex items-center">
            <div class="animate-pulse mr-2">✓</div>
            ${message}
        </div>
    `;
    document.body.appendChild(notification);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 3000);
}

// Manual refresh button functionality
function manualRefresh() {
    if (!isRefreshing) {
        checkForUpdates();
    }
}

// Add refresh button to the page
function addRefreshButton() {
    const existingButton = document.getElementById('manual-refresh-btn');
    if (existingButton) return;
    
    const refreshButton = document.createElement('button');
    refreshButton.id = 'manual-refresh-btn';
    refreshButton.className = 'inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 ml-3';
    refreshButton.innerHTML = `
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
        </svg>
        Refresh
    `;
    refreshButton.onclick = manualRefresh;
    
    // Add to the existing button group
    const buttonGroup = document.querySelector('.flex.space-x-3');
    if (buttonGroup) {
        buttonGroup.appendChild(refreshButton);
    }
}

// Initialize auto-refresh when page loads
document.addEventListener('DOMContentLoaded', function() {
    startAutoRefresh();
    addRefreshButton();
});

// Clean up on page unload
window.addEventListener('beforeunload', function() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
});

// Pause auto-refresh when page is not visible
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        if (refreshInterval) {
            clearInterval(refreshInterval);
            refreshInterval = null;
        }
    } else {
        startAutoRefresh();
    }
});
</script>
@endsection 