@extends('admin.layouts.app')

@section('content')
<div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
        <div>
            <h1 class="text-2xl font-bold text-gray-900">Name Update History</h1>
            <p class="text-gray-600">View all user name changes and update history</p>
        </div>
        <div class="flex space-x-3">
            <button onclick="showRequestsModal()" class="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                </svg>
                <span>View Name History</span>
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
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">View</th>
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
                <h3 class="text-lg font-medium text-gray-900">View Updated Name</h3>
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
                        <input type="text" id="newFirstName" name="newFirstName" readonly
                               class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 text-gray-600">
                    </div>

                    <div>
                        <label for="newLastName" class="block text-sm font-medium text-gray-700">Last Name *</label>
                        <input type="text" id="newLastName" name="newLastName" readonly
                               class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 text-gray-600">
                    </div>

                    <!-- User Profile Information -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Email</label>
                            <input type="text" id="userEmail" readonly
                                   class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 text-gray-600">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Phone</label>
                            <input type="text" id="userPhone" readonly
                                   class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 text-gray-600">
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Role</label>
                            <input type="text" id="userRole" readonly
                                   class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 text-gray-600">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Status</label>
                            <input type="text" id="userStatus" readonly
                                   class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 text-gray-600">
                        </div>
                    </div>

                    <!-- Pet Sitter Specific Fields -->
                    <div id="sitterFields" class="hidden">
                        <h4 class="text-lg font-medium text-gray-900 mb-3">Pet Sitter Information</h4>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700">Experience</label>
                                <input type="text" id="sitterExperience" readonly
                                       class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 text-gray-600">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700">Hourly Rate</label>
                                <input type="text" id="sitterRate" readonly
                                       class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 text-gray-600">
                            </div>
                        </div>
                        <div class="mt-4">
                            <label class="block text-sm font-medium text-gray-700">Bio</label>
                            <textarea id="sitterBio" rows="3" readonly
                                      class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 text-gray-600"></textarea>
                        </div>
                        <div class="mt-4">
                            <label class="block text-sm font-medium text-gray-700">Services</label>
                            <textarea id="sitterServices" rows="2" readonly
                                      class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 text-gray-600"></textarea>
                        </div>
                    </div>

                    <!-- Pet Owner Specific Fields -->
                    <div id="ownerFields" class="hidden">
                        <h4 class="text-lg font-medium text-gray-900 mb-3">Pet Owner Information</h4>
                        <div class="grid grid-cols-1 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700">Address</label>
                                <input type="text" id="ownerAddress" readonly
                                       class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 text-gray-600">
                            </div>
                        </div>
                    </div>

                    <!-- Change History -->
                    <div class="mt-6">
                        <h4 class="text-lg font-medium text-gray-900 mb-3">Change History</h4>
                        <div class="bg-gray-50 p-4 rounded-lg">
                            <div id="changeHistory" class="space-y-2">
                                <!-- Change history will be populated here -->
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Modal Footer -->
                <div class="flex justify-end space-x-3 mt-6">
                    <button type="button" onclick="closeNameUpdateModal()"
                            class="px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500">
                        Close
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
                <h3 class="text-lg font-medium text-gray-900">Name Update History</h3>
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
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">View</th>
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
    
    // Form submission - now just for viewing
    document.getElementById('nameUpdateForm').addEventListener('submit', function(e) {
        e.preventDefault();
        // Form is now read-only, just close the modal
        closeNameUpdateModal();
    });
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
                    View Name
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
                <span class="text-gray-500">View Only</span>
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
    
    // Pre-fill form with comprehensive user data
    document.getElementById('newFirstName').value = currentUser.first_name || '';
    document.getElementById('newLastName').value = currentUser.last_name || '';
    document.getElementById('userEmail').value = currentUser.email || '';
    document.getElementById('userPhone').value = currentUser.phone || '';
    document.getElementById('userRole').value = currentUser.role === 'pet_sitter' ? 'Pet Sitter' : 'Pet Owner';
    document.getElementById('userStatus').value = currentUser.status || 'Active';
    
    // Show role-specific fields
    if (currentUser.role === 'pet_sitter') {
        document.getElementById('sitterFields').classList.remove('hidden');
        document.getElementById('ownerFields').classList.add('hidden');
        document.getElementById('sitterExperience').value = currentUser.experience || 'Not specified';
        document.getElementById('sitterRate').value = currentUser.hourly_rate ? `₱${currentUser.hourly_rate}/hour` : 'Not set';
        document.getElementById('sitterBio').value = currentUser.bio || 'No bio provided';
        
        // Handle specialties/services - it's an array field
        let servicesText = 'No services specified';
        if (currentUser.specialties && Array.isArray(currentUser.specialties) && currentUser.specialties.length > 0) {
            servicesText = currentUser.specialties.join(', ');
        } else if (currentUser.specialties && typeof currentUser.specialties === 'string') {
            servicesText = currentUser.specialties;
        }
        document.getElementById('sitterServices').value = servicesText;
    } else {
        document.getElementById('ownerFields').classList.remove('hidden');
        document.getElementById('sitterFields').classList.add('hidden');
        document.getElementById('ownerAddress').value = currentUser.address || 'Not provided';
    }
    
    // Populate change history
    populateChangeHistory(currentUser);
    
    document.getElementById('nameUpdateModal').classList.remove('hidden');
}

function closeNameUpdateModal() {
    document.getElementById('nameUpdateModal').classList.add('hidden');
    currentUser = null;
}

async function populateChangeHistory(user) {
    try {
        const response = await fetch(`/admin/api/name-update-requests/user/${user.id}`, {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`,
                'Content-Type': 'application/json',
            }
        });
        
        const data = await response.json();
        const changeHistoryContainer = document.getElementById('changeHistory');
        
        if (data.success && data.requests && data.requests.length > 0) {
            changeHistoryContainer.innerHTML = data.requests.map((request, index) => `
                <div class="relative mb-4">
                    ${index > 0 ? '<div class="absolute left-6 top-0 w-0.5 h-8 bg-gradient-to-b from-blue-200 to-purple-200"></div>' : ''}
                    <div class="flex items-start space-x-4 p-4 bg-gradient-to-r from-white to-gray-50 rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                        <div class="flex-shrink-0 relative">
                            <div class="w-12 h-12 rounded-full ${getChangeTypeColor(request.type)} flex items-center justify-center shadow-md ring-2 ring-white">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                                </svg>
                            </div>
                            <div class="absolute -bottom-1 -right-1 w-5 h-5 rounded-full ${getStatusClass(request.status)} flex items-center justify-center ring-2 ring-white">
                                <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                                </svg>
                            </div>
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="flex items-start justify-between mb-3">
                                <div class="flex-1">
                                    <h4 class="text-sm font-bold text-gray-900 mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                        ${request.field_name} Update
                                    </h4>
                                    <div class="flex items-center space-x-3 text-sm">
                                        <span class="px-3 py-1.5 bg-red-100 text-red-800 rounded-lg font-medium text-xs border border-red-200">
                                            "${request.old_value}"
                                        </span>
                                        <svg class="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
                                        </svg>
                                        <span class="px-3 py-1.5 bg-green-100 text-green-800 rounded-lg font-medium text-xs border border-green-200">
                                            "${request.new_value}"
                                        </span>
                                    </div>
                                </div>
                                <span class="inline-flex px-3 py-1.5 text-xs font-bold rounded-full ${getStatusClass(request.status)} ml-4 shadow-sm">
                                    ${getStatusText(request.status)}
                                </span>
                            </div>
                            
                            <div class="space-y-2">
                                <div class="flex items-center text-xs text-gray-600 bg-blue-50 px-3 py-2 rounded-lg">
                                    <svg class="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                    </svg>
                                    <span class="font-medium">${new Date(request.created_at).toLocaleString()}</span>
                                    ${request.reviewer ? `<span class="ml-2 text-blue-600">• Reviewed by Admin</span>` : ''}
                                </div>
                                
                                ${request.reason ? `
                                    <div class="flex items-start text-xs text-gray-700 bg-yellow-50 px-3 py-2 rounded-lg border border-yellow-200">
                                        <svg class="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                        </svg>
                                        <div>
                                            <span class="font-semibold text-yellow-800">Reason:</span>
                                            <span class="ml-1">${request.reason}</span>
                                        </div>
                                    </div>
                                ` : ''}
                                
                                ${request.admin_notes ? `
                                    <div class="flex items-start text-xs text-indigo-700 bg-indigo-50 px-3 py-2 rounded-lg border border-indigo-200">
                                        <svg class="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                        </svg>
                                        <div>
                                            <span class="font-semibold text-indigo-800">Admin Notes:</span>
                                            <span class="ml-1">${request.admin_notes}</span>
                                        </div>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            `).join('');
        } else {
            changeHistoryContainer.innerHTML = `
                <div class="text-center py-4">
                    <svg class="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    <p class="text-sm text-gray-500 mt-2">No change history found for this user</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading change history:', error);
        document.getElementById('changeHistory').innerHTML = `
            <div class="text-center py-4">
                <p class="text-sm text-red-500">Failed to load change history</p>
            </div>
        `;
    }
}

function getChangeTypeColor(type) {
    const colors = {
        'name_update': 'bg-blue-100 text-blue-800',
        'profile_update': 'bg-green-100 text-green-800',
        'email_update': 'bg-purple-100 text-purple-800',
        'phone_update': 'bg-green-100 text-green-800',
        'experience_update': 'bg-yellow-100 text-yellow-800',
        'rate_update': 'bg-orange-100 text-orange-800',
        'bio_update': 'bg-pink-100 text-pink-800',
        'address_update': 'bg-indigo-100 text-indigo-800',
        'city_update': 'bg-teal-100 text-teal-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
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
        updateButton.textContent = 'View Updated Name';
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
