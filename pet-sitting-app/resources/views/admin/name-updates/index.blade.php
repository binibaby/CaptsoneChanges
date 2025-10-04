@extends('admin.layouts.app')

@section('content')
<div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
        <div>
            <h1 class="text-2xl font-bold text-gray-900">Name Update Management</h1>
            <p class="text-gray-600">Manage user name updates and requests</p>
        </div>
        <div class="flex space-x-3">
            <button onclick="showRequestsModal()" class="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                </svg>
                <span>View Requests</span>
            </button>
        </div>
    </div>

    <!-- Search and Filters -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <!-- Search -->
            <div class="md:col-span-2">
                <label for="search" class="block text-sm font-medium text-gray-700 mb-2">Search Users</label>
                <div class="relative">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                        </svg>
                    </div>
                    <input type="text" id="search" name="search" 
                           class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                           placeholder="Search by name, email, or phone...">
                </div>
            </div>

            <!-- Role Filter -->
            <div>
                <label for="roleFilter" class="block text-sm font-medium text-gray-700 mb-2">Filter by Role</label>
                <select id="roleFilter" name="roleFilter" 
                        class="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500">
                    <option value="all">All Users</option>
                    <option value="pet_sitter">Pet Sitters</option>
                    <option value="pet_owner">Pet Owners</option>
                </select>
            </div>
        </div>
    </div>

    <!-- Users Table -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200">
        <div class="px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-medium text-gray-900">Users</h3>
        </div>
        
        <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody id="usersTableBody" class="bg-white divide-y divide-gray-200">
                    <!-- Users will be loaded here via JavaScript -->
                </tbody>
            </table>
        </div>

        <!-- Loading State -->
        <div id="loadingState" class="text-center py-8">
            <div class="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-gray-500 bg-white">
                <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading users...
            </div>
        </div>

        <!-- Empty State -->
        <div id="emptyState" class="text-center py-8 hidden">
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
            </svg>
            <h3 class="mt-2 text-sm font-medium text-gray-900">No users found</h3>
            <p class="mt-1 text-sm text-gray-500">Try adjusting your search criteria.</p>
        </div>
    </div>
</div>

<!-- Name Update Modal -->
<div id="nameUpdateModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full hidden z-50">
    <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div class="mt-3">
            <!-- Modal Header -->
            <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-medium text-gray-900">Update User Name</h3>
                <button onclick="closeNameUpdateModal()" class="text-gray-400 hover:text-gray-600">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>

            <!-- User Info -->
            <div id="userInfo" class="mb-4 p-3 bg-gray-50 rounded-lg">
                <!-- User info will be populated here -->
            </div>

            <!-- Form -->
            <form id="nameUpdateForm">
                <div class="space-y-4">
                    <div>
                        <label for="newFirstName" class="block text-sm font-medium text-gray-700">First Name *</label>
                        <input type="text" id="newFirstName" name="newFirstName" required
                               class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500">
                    </div>

                    <div>
                        <label for="newLastName" class="block text-sm font-medium text-gray-700">Last Name *</label>
                        <input type="text" id="newLastName" name="newLastName" required
                               class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500">
                    </div>

                    <div>
                        <label for="updateReason" class="block text-sm font-medium text-gray-700">Reason for Update *</label>
                        <textarea id="updateReason" name="updateReason" rows="3" required
                                  class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                                  placeholder="Explain why this name update is necessary"></textarea>
                    </div>

                    <div>
                        <label for="adminNotes" class="block text-sm font-medium text-gray-700">Admin Notes (Optional)</label>
                        <textarea id="adminNotes" name="adminNotes" rows="2"
                                  class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                                  placeholder="Add any additional notes"></textarea>
                    </div>
                </div>

                <!-- Modal Footer -->
                <div class="flex justify-end space-x-3 mt-6">
                    <button type="button" onclick="closeNameUpdateModal()"
                            class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
                        Cancel
                    </button>
                    <button type="submit" id="updateButton"
                            class="px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500">
                        Update Name
                    </button>
                </div>
            </form>
        </div>
    </div>
</div>

<!-- Requests Modal -->
<div id="requestsModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full hidden z-50">
    <div class="relative top-10 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        <div class="mt-3">
            <!-- Modal Header -->
            <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-medium text-gray-900">Name Update Requests</h3>
                <button onclick="closeRequestsModal()" class="text-gray-400 hover:text-gray-600">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>

            <!-- Requests Table -->
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name Change</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="requestsTableBody" class="bg-white divide-y divide-gray-200">
                        <!-- Requests will be loaded here -->
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>

<script>
let currentUser = null;
let users = [];
let requests = [];

// Load users on page load
document.addEventListener('DOMContentLoaded', function() {
    loadUsers();
    loadRequests();
    
    // Search functionality
    document.getElementById('search').addEventListener('input', filterUsers);
    document.getElementById('roleFilter').addEventListener('change', filterUsers);
    
    // Form submission
    document.getElementById('nameUpdateForm').addEventListener('submit', handleNameUpdate);
});

async function loadUsers() {
    try {
        const response = await fetch('/admin/api/users', {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`,
                'Content-Type': 'application/json',
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            users = data.users;
            renderUsers(users);
        } else {
            showError('Failed to load users: ' + data.message);
        }
    } catch (error) {
        console.error('Error loading users:', error);
        showError('Failed to load users. Please try again.');
    }
}

async function loadRequests() {
    try {
        const response = await fetch('/admin/api/name-update-requests', {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`,
                'Content-Type': 'application/json',
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            requests = data.requests;
            renderRequests(requests);
        } else {
            console.error('Failed to load requests:', data.message);
        }
    } catch (error) {
        console.error('Error loading requests:', error);
    }
}

function filterUsers() {
    const searchQuery = document.getElementById('search').value.toLowerCase();
    const roleFilter = document.getElementById('roleFilter').value;
    
    let filteredUsers = users;
    
    // Filter by search query
    if (searchQuery) {
        filteredUsers = filteredUsers.filter(user => 
            user.name.toLowerCase().includes(searchQuery) ||
            user.email.toLowerCase().includes(searchQuery) ||
            (user.phone && user.phone.toLowerCase().includes(searchQuery)) ||
            (user.first_name && user.first_name.toLowerCase().includes(searchQuery)) ||
            (user.last_name && user.last_name.toLowerCase().includes(searchQuery))
        );
    }
    
    // Filter by role
    if (roleFilter !== 'all') {
        filteredUsers = filteredUsers.filter(user => user.role === roleFilter);
    }
    
    renderUsers(filteredUsers);
}

function renderUsers(usersToRender) {
    const tbody = document.getElementById('usersTableBody');
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');
    
    // Hide loading state
    loadingState.classList.add('hidden');
    
    if (usersToRender.length === 0) {
        tbody.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }
    
    emptyState.classList.add('hidden');
    
    tbody.innerHTML = usersToRender.map(user => `
        <tr class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                    <div class="flex-shrink-0 h-10 w-10">
                        <div class="h-10 w-10 rounded-full bg-orange-500 flex items-center justify-center">
                            <span class="text-sm font-medium text-white">
                                ${(user.first_name || user.name || 'U')[0].toUpperCase()}
                            </span>
                        </div>
                    </div>
                    <div class="ml-4">
                        <div class="text-sm font-medium text-gray-900">${user.name}</div>
                        <div class="text-sm text-gray-500">ID: ${user.id}</div>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">${user.email}</div>
                <div class="text-sm text-gray-500">${user.phone || 'No phone'}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${user.role === 'pet_sitter' ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}">
                    ${user.role === 'pet_sitter' ? 'Pet Sitter' : 'Pet Owner'}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${new Date(user.created_at).toLocaleDateString()}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button onclick="openNameUpdateModal(${user.id})" 
                        class="text-orange-600 hover:text-orange-900">
                    Update Name
                </button>
            </td>
        </tr>
    `).join('');
}

function renderRequests(requestsToRender) {
    const tbody = document.getElementById('requestsTableBody');
    
    if (requestsToRender.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-4 text-center text-gray-500">No requests found</td></tr>';
        return;
    }
    
    tbody.innerHTML = requestsToRender.map(request => `
        <tr class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">${request.user.name}</div>
                <div class="text-sm text-gray-500">${request.user.email}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">"${request.old_name}" → "${request.new_name}"</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900 max-w-xs truncate">${request.reason}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusClass(request.status)}">
                    ${getStatusText(request.status)}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${new Date(request.created_at).toLocaleDateString()}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                ${request.status === 'pending' ? `
                    <button onclick="approveRequest(${request.id})" class="text-green-600 hover:text-green-900 mr-2">Approve</button>
                    <button onclick="rejectRequest(${request.id})" class="text-red-600 hover:text-red-900">Reject</button>
                ` : '-'}
            </td>
        </tr>
    `).join('');
}

function getStatusClass(status) {
    switch (status) {
        case 'pending': return 'bg-yellow-100 text-yellow-800';
        case 'approved': return 'bg-green-100 text-green-800';
        case 'rejected': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
    }
}

function getStatusText(status) {
    switch (status) {
        case 'pending': return 'Pending';
        case 'approved': return 'Approved';
        case 'rejected': return 'Rejected';
        default: return status;
    }
}

function openNameUpdateModal(userId) {
    currentUser = users.find(user => user.id === userId);
    if (!currentUser) return;
    
    // Populate user info
    document.getElementById('userInfo').innerHTML = `
        <div class="text-sm">
            <div class="font-medium text-gray-900">${currentUser.name}</div>
            <div class="text-gray-500">${currentUser.email}</div>
            <div class="text-gray-500">Role: ${currentUser.role === 'pet_sitter' ? 'Pet Sitter' : 'Pet Owner'}</div>
        </div>
    `;
    
    // Pre-fill form
    document.getElementById('newFirstName').value = currentUser.first_name || '';
    document.getElementById('newLastName').value = currentUser.last_name || '';
    document.getElementById('updateReason').value = '';
    document.getElementById('adminNotes').value = '';
    
    document.getElementById('nameUpdateModal').classList.remove('hidden');
}

function closeNameUpdateModal() {
    document.getElementById('nameUpdateModal').classList.add('hidden');
    currentUser = null;
}

function showRequestsModal() {
    document.getElementById('requestsModal').classList.remove('hidden');
}

function closeRequestsModal() {
    document.getElementById('requestsModal').classList.add('hidden');
}

async function handleNameUpdate(e) {
    e.preventDefault();
    
    if (!currentUser) return;
    
    const formData = new FormData(e.target);
    const updateButton = document.getElementById('updateButton');
    
    // Disable button and show loading
    updateButton.disabled = true;
    updateButton.textContent = 'Updating...';
    
    try {
        const response = await fetch('/admin/api/update-user-name', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: currentUser.id,
                new_first_name: formData.get('newFirstName'),
                new_last_name: formData.get('newLastName'),
                reason: formData.get('updateReason'),
                admin_notes: formData.get('adminNotes'),
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showSuccess('User name updated successfully!');
            closeNameUpdateModal();
            loadUsers(); // Refresh users list
            loadRequests(); // Refresh requests list
        } else {
            showError(data.message || 'Failed to update user name.');
        }
    } catch (error) {
        console.error('Error updating user name:', error);
        showError('Failed to update user name. Please try again.');
    } finally {
        // Re-enable button
        updateButton.disabled = false;
        updateButton.textContent = 'Update Name';
    }
}

async function approveRequest(requestId) {
    if (!confirm('Are you sure you want to approve this request?')) return;
    
    try {
        const response = await fetch(`/admin/api/name-update-requests/${requestId}/approve`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                admin_notes: 'Approved by admin'
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showSuccess('Request approved successfully!');
            loadRequests();
            loadUsers();
        } else {
            showError(data.message || 'Failed to approve request.');
        }
    } catch (error) {
        console.error('Error approving request:', error);
        showError('Failed to approve request. Please try again.');
    }
}

async function rejectRequest(requestId) {
    if (!confirm('Are you sure you want to reject this request?')) return;
    
    try {
        const response = await fetch(`/admin/api/name-update-requests/${requestId}/reject`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                admin_notes: 'Rejected by admin'
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showSuccess('Request rejected successfully!');
            loadRequests();
        } else {
            showError(data.message || 'Failed to reject request.');
        }
    } catch (error) {
        console.error('Error rejecting request:', error);
        showError('Failed to reject request. Please try again.');
    }
}

function getAuthToken() {
    // This should return the actual auth token
    // For now, we'll use a placeholder
    return '{{ csrf_token() }}';
}

function showSuccess(message) {
    // Simple alert for now - you can replace with a proper notification system
    alert(message);
}

function showError(message) {
    // Simple alert for now - you can replace with a proper notification system
    alert('Error: ' + message);
}
</script>
@endsection
