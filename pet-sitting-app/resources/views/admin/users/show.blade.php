@extends('admin.layouts.app')

@section('title', 'User Details')

@section('content')
<div class="container mx-auto px-4 py-8">
    <div class="mb-6">
        <div class="flex items-center justify-between">
            <h1 class="text-3xl font-bold text-gray-900">User Details</h1>
            <a href="{{ route('admin.users.index') }}" class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">
                ← Back to Users
            </a>
        </div>
    </div>

    <!-- User Profile Section -->
    <div class="bg-white shadow rounded-lg mb-6">
        <div class="px-6 py-4 border-b border-gray-200">
            <h2 class="text-xl font-semibold text-gray-900">Profile Information</h2>
        </div>
        <div class="px-6 py-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h3 class="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
                    <dl class="space-y-3">
                        <div>
                            <dt class="text-sm font-medium text-gray-500">Full Name</dt>
                            <dd class="text-sm text-gray-900">
                                {{ $user->first_name && $user->last_name ? $user->first_name . ' ' . $user->last_name : $user->name }}
                            </dd>
                        </div>
                        <div>
                            <dt class="text-sm font-medium text-gray-500">Email</dt>
                            <dd class="text-sm text-gray-900">{{ $user->email }}</dd>
                        </div>
                        <div>
                            <dt class="text-sm font-medium text-gray-500">Phone</dt>
                            <dd class="text-sm text-gray-900">{{ $user->phone ?: 'Not provided' }}</dd>
                        </div>
                        <div>
                            <dt class="text-sm font-medium text-gray-500">Role</dt>
                            <dd class="text-sm text-gray-900">
                                <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full 
                                    {{ $user->role === 'pet_sitter' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800' }}">
                                    {{ ucwords(str_replace('_', ' ', $user->role)) }}
                                </span>
                            </dd>
                        </div>
                        <div>
                            <dt class="text-sm font-medium text-gray-500">Status</dt>
                            <dd class="text-sm text-gray-900">
                                <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full 
                                    {{ $user->status === 'active' ? 'bg-green-100 text-green-800' : 
                                       ($user->status === 'suspended' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800') }}">
                                    {{ ucfirst($user->status) }}
                                </span>
                            </dd>
                        </div>
                    </dl>
                </div>
                <div>
                    <h3 class="text-lg font-medium text-gray-900 mb-4">Additional Information</h3>
                    <dl class="space-y-3">
                        <div>
                            <dt class="text-sm font-medium text-gray-500">Age</dt>
                            <dd class="text-sm text-gray-900">{{ $user->age ? $user->age . ' years' : 'Not provided' }}</dd>
                        </div>
                        <div>
                            <dt class="text-sm font-medium text-gray-500">Gender</dt>
                            <dd class="text-sm text-gray-900">{{ $user->gender ? ucfirst($user->gender) : 'Not provided' }}</dd>
                        </div>
                        <div>
                            <dt class="text-sm font-medium text-gray-500">Address</dt>
                            <dd class="text-sm text-gray-900">{{ $user->address ?: 'Not provided' }}</dd>
                        </div>
                        <div>
                            <dt class="text-sm font-medium text-gray-500">Experience</dt>
                            <dd class="text-sm text-gray-900">{{ $user->experience ?: 'Not specified' }}</dd>
                        </div>
                        <div>
                            <dt class="text-sm font-medium text-gray-500">Hourly Rate</dt>
                            <dd class="text-sm text-gray-900">{{ $user->hourly_rate ? '$' . $user->hourly_rate . '/hr' : 'Not specified' }}</dd>
                        </div>
                        <div>
                            <dt class="text-sm font-medium text-gray-500">Specialties</dt>
                            <dd class="text-sm text-gray-900">
                                @if($user->specialties && is_array($user->specialties) && count($user->specialties) > 0)
                                    {{ implode(', ', $user->specialties) }}
                                @else
                                    Not specified
                                @endif
                            </dd>
                        </div>
                        <div>
                            <dt class="text-sm font-medium text-gray-500">Pet Breeds</dt>
                            <dd class="text-sm text-gray-900">
                                @if($user->pet_breeds && is_array($user->pet_breeds) && count($user->pet_breeds) > 0)
                                    {{ implode(', ', $user->pet_breeds) }}
                                @else
                                    Not specified
                                @endif
                            </dd>
                        </div>
                        <div>
                            <dt class="text-sm font-medium text-gray-500">About Me</dt>
                            <dd class="text-sm text-gray-900">{{ $user->bio ?: 'No bio provided' }}</dd>
                        </div>
                    </dl>
                </div>
            </div>
        </div>
    </div>

    <!-- Statistics Section -->
    <div class="bg-white shadow rounded-lg mb-6">
        <div class="px-6 py-4 border-b border-gray-200">
            <h2 class="text-xl font-semibold text-gray-900">Statistics</h2>
        </div>
        <div class="px-6 py-4">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div class="bg-blue-50 p-4 rounded-lg">
                    <div class="text-2xl font-bold text-blue-600">{{ $stats['total_bookings'] }}</div>
                    <div class="text-sm text-blue-600">Total Bookings</div>
                </div>
                <div class="bg-green-50 p-4 rounded-lg">
                    <div class="text-2xl font-bold text-green-600">{{ $stats['completed_bookings'] }}</div>
                    <div class="text-sm text-green-600">Completed Bookings</div>
                </div>
                <div class="bg-purple-50 p-4 rounded-lg">
                    <div class="text-2xl font-bold text-purple-600">${{ number_format($stats['total_spent'], 2) }}</div>
                    <div class="text-sm text-purple-600">Total Spent</div>
                </div>
                <div class="bg-yellow-50 p-4 rounded-lg">
                    <div class="text-2xl font-bold text-yellow-600">{{ number_format($stats['average_rating'], 1) }}</div>
                    <div class="text-sm text-yellow-600">Average Rating</div>
                </div>
            </div>
        </div>
    </div>

    <!-- Verification Status Section -->
    <div class="bg-white shadow rounded-lg mb-6">
        <div class="px-6 py-4 border-b border-gray-200">
            <h2 class="text-xl font-semibold text-gray-900">Verification Status</h2>
        </div>
        <div class="px-6 py-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h3 class="text-lg font-medium text-gray-900 mb-4">Current Status</h3>
                    <dl class="space-y-3">
                        <div>
                            <dt class="text-sm font-medium text-gray-500">ID Verified</dt>
                            <dd class="text-sm text-gray-900">
                                @if($user->id_verified)
                                    <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                        ✅ Verified
                                    </span>
                                @else
                                    <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                        ❌ Not Verified
                                    </span>
                                @endif
                            </dd>
                        </div>
                        <div>
                            <dt class="text-sm font-medium text-gray-500">Verification Status</dt>
                            <dd class="text-sm text-gray-900">
                                @if($user->verification_status === 'verified')
                                    <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                        ✅ Verified
                                    </span>
                                @elseif($user->verification_status === 'rejected')
                                    <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                        ❌ Rejected
                                    </span>
                                @else
                                    <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                        ⏳ Pending
                                    </span>
                                @endif
                            </dd>
                        </div>
                        <div>
                            <dt class="text-sm font-medium text-gray-500">Can Accept Bookings</dt>
                            <dd class="text-sm text-gray-900">
                                @if($user->can_accept_bookings)
                                    <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                        ✅ Yes
                                    </span>
                                @else
                                    <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                        ❌ No
                                    </span>
                                @endif
                            </dd>
                        </div>
                        @if($user->id_verified_at)
                        <div>
                            <dt class="text-sm font-medium text-gray-500">Verified At</dt>
                            <dd class="text-sm text-gray-900">{{ $user->id_verified_at->format('M d, Y H:i') }}</dd>
                        </div>
                        @endif
                    </dl>
                </div>
                <div>
                    <h3 class="text-lg font-medium text-gray-900 mb-4">Latest Verification</h3>
                    @if($stats['verification_status'])
                        <dl class="space-y-3">
                            <div>
                                <dt class="text-sm font-medium text-gray-500">Document Type</dt>
                                <dd class="text-sm text-gray-900">{{ ucwords(str_replace('_', ' ', $stats['verification_status']->document_type)) }}</dd>
                            </div>
                            <div>
                                <dt class="text-sm font-medium text-gray-500">Status</dt>
                                <dd class="text-sm text-gray-900">
                                    @if($stats['verification_status']->status === 'approved')
                                        <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                            ✅ Veriff Approved
                                        </span>
                                    @elseif($stats['verification_status']->status === 'rejected')
                                        <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                            ❌ Veriff Rejected
                                        </span>
                                    @else
                                        <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                            ⏳ Veriff Processing
                                        </span>
                                    @endif
                                </dd>
                            </div>
                            <div>
                                <dt class="text-sm font-medium text-gray-500">Submitted</dt>
                                <dd class="text-sm text-gray-900">{{ $stats['verification_status']->created_at->format('M d, Y H:i') }}</dd>
                            </div>
                            @if($stats['verification_status']->verification_score)
                            <div>
                                <dt class="text-sm font-medium text-gray-500">Verification Score</dt>
                                <dd class="text-sm text-gray-900">{{ $stats['verification_status']->verification_score }}%</dd>
                            </div>
                            @endif
                        </dl>
                    @else
                        <p class="text-sm text-gray-500">No verification records found.</p>
                    @endif
                </div>
            </div>
            
            <!-- Verification Notes Section -->
            @if($stats['verification_status'])
            <div class="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 class="text-sm font-medium text-gray-700 mb-2">Verification Notes</h4>
                @if($stats['verification_status']->status === 'skipped')
                    <div class="text-sm text-amber-700 bg-amber-50 p-3 rounded border border-amber-200">
                        <strong>⚠️ ID Verification Skipped:</strong> User chose to skip ID verification during registration. 
                        They can complete this later through their profile.
                    </div>
                @endif
                
                @if($stats['verification_status']->notes)
                    <div class="text-sm text-gray-700 mt-2">
                        <strong>Notes:</strong> {{ $stats['verification_status']->notes }}
                    </div>
                @endif
                
                @if($stats['verification_status']->extracted_data)
                    @php
                        $extractedData = json_decode($stats['verification_status']->extracted_data, true);
                    @endphp
                    @if(isset($extractedData['skip_reason']))
                        <div class="text-sm text-gray-700 mt-2">
                            <strong>Skip Reason:</strong> {{ $extractedData['skip_reason'] }}
                        </div>
                    @endif
                    @if(isset($extractedData['can_complete_later']))
                        <div class="text-sm text-gray-700 mt-2">
                            <strong>Can Complete Later:</strong> {{ $extractedData['can_complete_later'] ? 'Yes' : 'No' }}
                        </div>
                    @endif
                @endif
            </div>
            @endif
            
            <!-- Phone Verification Status -->
            <div class="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 class="text-sm font-medium text-blue-700 mb-2">Phone Verification</h4>
                @if($user->phone_verified_at)
                    <div class="text-sm text-green-700">
                        <strong>✅ Phone Verified:</strong> {{ $user->phone_verified_at->format('M d, Y H:i') }}
                    </div>
                @elseif($user->phone)
                    <div class="text-sm text-amber-700">
                        <strong>📱 Phone Number:</strong> {{ $user->phone }} (Not verified)
                        <br><em class="text-xs">Note: Using simulation mode for development</em>
                    </div>
                @else
                    <div class="text-sm text-gray-700">
                        <strong>📱 Phone:</strong> Not provided
                    </div>
                @endif
            </div>
        </div>
    </div>

    <!-- Action Buttons -->
    <div class="bg-white shadow rounded-lg">
        <div class="px-6 py-4 border-b border-gray-200">
            <h2 class="text-xl font-semibold text-gray-900">Actions</h2>
        </div>
        <div class="px-6 py-4">
            <div class="flex flex-wrap gap-4">
                @if($user->status === 'active')
                    <button onclick="suspendUser({{ $user->id }})" class="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded">
                        Suspend User
                    </button>
                @elseif($user->status === 'suspended')
                    <button onclick="reactivateUser({{ $user->id }})" class="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
                        Reactivate User
                    </button>
                @endif
                
                @if($user->status !== 'banned')
                    <button onclick="banUser({{ $user->id }})" class="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
                        Ban User
                    </button>
                @endif
                
                <button onclick="deleteUser({{ $user->id }})" class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">
                    Delete User
                </button>
            </div>
        </div>
    </div>

    <!-- Security Information Section (Admin Only) -->
    <div class="bg-white shadow rounded-lg mt-6">
        <div class="px-6 py-4 border-b border-gray-200">
            <h2 class="text-xl font-semibold text-gray-900">Security Information</h2>
        </div>
        <div class="px-6 py-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h3 class="text-lg font-medium text-gray-900 mb-4">Account Security</h3>
                    <dl class="space-y-3">
                        <div>
                            <dt class="text-sm font-medium text-gray-500">Password Hash</dt>
                            <dd class="text-sm text-gray-900 font-mono break-all">
                                {{ $user->password ? substr($user->password, 0, 50) . '...' : 'No password set' }}
                            </dd>
                        </div>
                        <div>
                            <dt class="text-sm font-medium text-gray-500">Email Verified</dt>
                            <dd class="text-sm text-gray-900">
                                @if($user->email_verified_at)
                                    <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                        ✅ {{ $user->email_verified_at->format('M d, Y H:i') }}
                                    </span>
                                @else
                                    <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                        ❌ Not Verified
                                    </span>
                                @endif
                            </dd>
                        </div>
                        <div>
                            <dt class="text-sm font-medium text-gray-500">Account Created</dt>
                            <dd class="text-sm text-gray-900">{{ $user->created_at->format('M d, Y H:i') }}</dd>
                        </div>
                        <div>
                            <dt class="text-sm font-medium text-gray-500">Last Updated</dt>
                            <dd class="text-sm text-gray-900">{{ $user->updated_at->format('M d, Y H:i') }}</dd>
                        </div>
                    </dl>
                </div>
                <div>
                    <h3 class="text-lg font-medium text-gray-900 mb-4">Location & Activity</h3>
                    <dl class="space-y-3">
                        <div>
                            <dt class="text-sm font-medium text-gray-500">Country/Region</dt>
                            <dd class="text-sm text-gray-900">
                                @if($user->address)
                                    @php
                                        $addressParts = explode(',', $user->address);
                                        $country = end($addressParts);
                                    @endphp
                                    {{ trim($country) ?: 'Not specified' }}
                                @else
                                    Not specified
                                @endif
                            </dd>
                        </div>
                        <div>
                            <dt class="text-sm font-medium text-gray-500">Last Active</dt>
                            <dd class="text-sm text-gray-900">
                                @if($user->last_active_at)
                                    {{ $user->last_active_at->format('M d, Y H:i') }}
                                @else
                                    Never
                                @endif
                            </dd>
                        </div>
                        <div>
                            <dt class="text-sm font-medium text-gray-500">Remember Token</dt>
                            <dd class="text-sm text-gray-900 font-mono break-all">
                                {{ $user->remember_token ? substr($user->remember_token, 0, 30) . '...' : 'None' }}
                            </dd>
                        </div>
                    </dl>
                </div>
            </div>
        </div>
    </div>
</div>

<script>
function suspendUser(userId) {
    if (confirm('Are you sure you want to suspend this user?')) {
        const reason = prompt('Please provide a reason for suspension:');
        if (reason) {
            window.location.href = `/admin/users/${userId}/suspend?reason=${encodeURIComponent(reason)}`;
        }
    }
}

function reactivateUser(userId) {
    if (confirm('Are you sure you want to reactivate this user?')) {
        window.location.href = `/admin/users/${userId}/reactivate`;
    }
}

function banUser(userId) {
    if (confirm('Are you sure you want to ban this user? This action cannot be undone.')) {
        const reason = prompt('Please provide a reason for the ban:');
        if (reason) {
            window.location.href = `/admin/users/${userId}/ban?reason=${encodeURIComponent(reason)}`;
        }
    }
}

function deleteUser(userId) {
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
        window.location.href = `/admin/users/${userId}/delete`;
    }
}
</script>
@endsection 