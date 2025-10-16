@extends('admin.layouts.app')

@section('content')
<div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
        <div>
            <h1 class="text-3xl font-bold text-gray-900">Password Reset</h1>
            <p class="text-gray-600 mt-1">Manage user passwords and account access</p>
        </div>
        <div class="flex items-center space-x-3">
            <div class="text-sm text-gray-500">
                Total Users: <span class="font-semibold text-gray-900">{{ $users->total() }}</span>
            </div>
        </div>
    </div>

    <!-- Search and Filter -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div class="flex flex-col sm:flex-row gap-4">
            <div class="flex-1">
                <input type="text" id="search-input" placeholder="Search users by name, email, or phone..." 
                       class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            </div>
            <div class="flex gap-2">
                <select id="role-filter" class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="">All Roles</option>
                    <option value="Pet Owner">Pet Owner</option>
                    <option value="Pet Sitter">Pet Sitter</option>
                </select>
                <select id="status-filter" class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="suspended">Suspended</option>
                    <option value="banned">Banned</option>
                </select>
            </div>
        </div>
    </div>

    <!-- Users Table -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody id="users-table-body" class="bg-white divide-y divide-gray-200">
                    @foreach($users as $user)
                    <tr class="hover:bg-gray-50 transition-colors duration-200">
                        <td class="px-6 py-4 whitespace-nowrap">
                            <div class="flex items-center">
                                <div class="flex-shrink-0 h-10 w-10">
                                    @if($user->profile_image)
                                        <img class="h-10 w-10 rounded-full object-cover" src="{{ asset('storage/' . $user->profile_image) }}" alt="{{ $user->name }}">
                                    @else
                                        <div class="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                            <span class="text-white font-medium text-sm">{{ substr($user->name, 0, 1) }}</span>
                                        </div>
                                    @endif
                                </div>
                                <div class="ml-4">
                                    <div class="text-sm font-medium text-gray-900">{{ $user->name }}</div>
                                    <div class="text-sm text-gray-500">ID: {{ $user->id }}</div>
                                </div>
                            </div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <div class="text-sm text-gray-900">{{ $user->email }}</div>
                            <div class="text-sm text-gray-500">{{ $user->phone ?? 'No phone' }}</div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                {{ $user->role === 'Pet Owner' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800' }}">
                                {{ $user->role }}
                            </span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                {{ $user->status === 'active' ? 'bg-green-100 text-green-800' : 
                                   ($user->status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                                   ($user->status === 'suspended' ? 'bg-orange-100 text-orange-800' : 'bg-red-100 text-red-800')) }}">
                                {{ ucfirst($user->status) }}
                            </span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {{ $user->created_at->format('M j, Y') }}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button onclick="openPasswordModal({{ $user->id }}, '{{ $user->name }}', '{{ $user->email }}')" 
                                    class="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-lg transition-colors duration-200">
                                <i class="fas fa-key mr-1"></i>Change Password
                            </button>
                        </td>
                    </tr>
                    @endforeach
                </tbody>
            </table>
        </div>

        <!-- Pagination -->
        <div class="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
            {{ $users->links() }}
        </div>
    </div>
</div>

<!-- Password Change Modal -->
<div id="password-modal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full hidden z-50">
    <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div class="mt-3">
            <!-- Modal Header -->
            <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-medium text-gray-900">Change Password</h3>
                <button onclick="closePasswordModal()" class="text-gray-400 hover:text-gray-600">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <!-- User Info -->
            <div class="mb-4 p-3 bg-gray-50 rounded-lg">
                <div class="text-sm text-gray-600">User:</div>
                <div class="font-medium text-gray-900" id="modal-user-name"></div>
                <div class="text-sm text-gray-500" id="modal-user-email"></div>
            </div>

            <!-- Password Form -->
            <form id="password-form">
                <input type="hidden" id="user-id" name="user_id">
                
                <div class="mb-4">
                    <label for="new-password" class="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                    <div class="relative">
                        <input type="password" id="new-password" name="new_password" 
                               class="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                               placeholder="Enter new password" minlength="8" required>
                        <button type="button" onclick="togglePasswordVisibility('new-password', 'new-password-toggle')" 
                                class="absolute inset-y-0 right-0 pr-3 flex items-center">
                            <i id="new-password-toggle" class="fas fa-eye text-gray-400 hover:text-gray-600 cursor-pointer"></i>
                        </button>
                    </div>
                    <p class="text-xs text-gray-500 mt-1">
                        Password must contain at least 8 characters with uppercase, lowercase, number, and special character (@$!%*?&)
                    </p>
                </div>

                <div class="mb-6">
                    <label for="confirm-password" class="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                    <div class="relative">
                        <input type="password" id="confirm-password" name="confirm_password" 
                               class="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                               placeholder="Confirm new password" minlength="8" required>
                        <button type="button" onclick="togglePasswordVisibility('confirm-password', 'confirm-password-toggle')" 
                                class="absolute inset-y-0 right-0 pr-3 flex items-center">
                            <i id="confirm-password-toggle" class="fas fa-eye text-gray-400 hover:text-gray-600 cursor-pointer"></i>
                        </button>
                    </div>
                </div>

                <!-- Error/Success Messages -->
                <div id="modal-message" class="mb-4 hidden"></div>

                <!-- Modal Actions -->
                <div class="flex gap-3">
                    <button type="submit" id="change-password-btn"
                            class="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors duration-200">
                        <i class="fas fa-key mr-1"></i>Change Password
                    </button>
                    <button type="button" onclick="closePasswordModal()"
                            class="flex-1 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors duration-200">
                        <i class="fas fa-times mr-1"></i>Cancel
                    </button>
                </div>
            </form>
        </div>
    </div>
</div>

<script>
// Search and Filter functionality
document.getElementById('search-input').addEventListener('input', filterUsers);
document.getElementById('role-filter').addEventListener('change', filterUsers);
document.getElementById('status-filter').addEventListener('change', filterUsers);

function filterUsers() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const roleFilter = document.getElementById('role-filter').value;
    const statusFilter = document.getElementById('status-filter').value;
    const rows = document.querySelectorAll('#users-table-body tr');

    rows.forEach(row => {
        const name = row.cells[0].textContent.toLowerCase();
        const email = row.cells[1].textContent.toLowerCase();
        const role = row.cells[2].textContent.trim();
        const status = row.cells[3].textContent.trim().toLowerCase();

        const matchesSearch = name.includes(searchTerm) || email.includes(searchTerm);
        const matchesRole = !roleFilter || role === roleFilter;
        const matchesStatus = !statusFilter || status === statusFilter;

        if (matchesSearch && matchesRole && matchesStatus) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Password Modal functionality
function openPasswordModal(userId, userName, userEmail) {
    document.getElementById('user-id').value = userId;
    document.getElementById('modal-user-name').textContent = userName;
    document.getElementById('modal-user-email').textContent = userEmail;
    document.getElementById('password-form').reset();
    document.getElementById('modal-message').classList.add('hidden');
    document.getElementById('password-modal').classList.remove('hidden');
}

function closePasswordModal() {
    document.getElementById('password-modal').classList.add('hidden');
    document.getElementById('password-form').reset();
    document.getElementById('modal-message').classList.add('hidden');
}

function showModalMessage(message, type = 'success') {
    const messageDiv = document.getElementById('modal-message');
    messageDiv.innerHTML = message;
    messageDiv.className = `mb-4 p-3 rounded-md ${type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`;
    messageDiv.classList.remove('hidden');
}

// Handle password form submission
document.getElementById('password-form').addEventListener('submit', function(e) {
    e.preventDefault();

    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const userId = document.getElementById('user-id').value;
    const messageDiv = document.getElementById('modal-message');

    // Clear previous messages
    messageDiv.classList.add('hidden');

    // Validate passwords
    if (!newPassword || !confirmPassword) {
        showModalMessage('Please fill in all password fields', 'error');
        return;
    }

    if (newPassword !== confirmPassword) {
        showModalMessage('Passwords do not match', 'error');
        return;
    }

    if (newPassword.length < 8) {
        showModalMessage('Password must be at least 8 characters long', 'error');
        return;
    }

    // Show confirmation dialog
    if (!confirm(`Are you sure you want to change the password for this user?\n\nThis action cannot be undone.`)) {
        return;
    }

    // Show loading
    const submitBtn = document.getElementById('change-password-btn');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>Changing...';
    submitBtn.disabled = true;

    // Get user email for the API call
    const userEmail = document.getElementById('modal-user-email').textContent;

    fetch('/admin/password-reset/reset', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
        },
        body: JSON.stringify({
            email: userEmail,
            new_password: newPassword
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showModalMessage(`Password changed successfully for ${data.data.name}`, 'success');
            setTimeout(() => {
                closePasswordModal();
            }, 2000);
        } else {
            showModalMessage(data.message || 'Failed to change password', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showModalMessage('An error occurred while changing the password', 'error');
    })
    .finally(() => {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    });
});

// Close modal when clicking outside
document.getElementById('password-modal').addEventListener('click', function(e) {
    if (e.target === this) {
        closePasswordModal();
    }
});

// Password visibility toggle function
function togglePasswordVisibility(inputId, iconId) {
    const input = document.getElementById(inputId);
    const icon = document.getElementById(iconId);
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}
</script>
@endsection