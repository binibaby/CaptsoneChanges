@extends('admin.layouts.app')

@section('content')
<div class="space-y-8">
    <!-- Page Header -->
    <div class="relative overflow-hidden rounded-2xl shadow-2xl" style="background: linear-gradient(135deg, #0d9488, #06b6d4, #3b82f6, #8b5cf6);">
        <div class="absolute inset-0 bg-black opacity-10"></div>
        <div class="relative px-8 py-8">
            <div class="flex items-center justify-between">
                <div class="text-white">
                    <h1 class="text-3xl font-bold mb-2">ID Access Management 🔓</h1>
                    <p class="text-teal-100 text-lg">Manage sitter verification and manual ID access</p>
                    <div class="flex items-center mt-4 space-x-6">
                        <div class="flex items-center text-teal-100">
                            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            <span class="text-sm">Manual Verification</span>
                        </div>
                        <div class="flex items-center text-teal-100">
                            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                            </svg>
                            <span class="text-sm">Admin Override</span>
                        </div>
                    </div>
                </div>
                <div class="hidden md:block">
                    <div class="w-24 h-24 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                        <svg class="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path>
                        </svg>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Statistics Cards -->
    <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div class="rounded-2xl shadow-xl border-4 border-orange-500 hover:shadow-2xl hover:scale-105 transition-all duration-300 p-6" style="background: linear-gradient(135deg, #f97316, #ea580c, #dc2626);">
            <div class="flex items-center">
                <div class="flex-shrink-0">
                    <div class="w-14 h-14 bg-white bg-opacity-30 rounded-xl flex items-center justify-center shadow-lg">
                        <svg class="w-8 h-8 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                    </div>
                </div>
                <div class="ml-4 flex-1">
                    <div class="text-sm font-medium text-white drop-shadow-lg">Unverified Sitters</div>
                    <div class="text-3xl font-bold text-white drop-shadow-lg unverified-count">0</div>
                </div>
            </div>
        </div>

        <div class="rounded-2xl shadow-xl border-4 border-yellow-500 hover:shadow-2xl hover:scale-105 transition-all duration-300 p-6" style="background: linear-gradient(135deg, #fbbf24, #f59e0b, #ef4444);">
            <div class="flex items-center">
                <div class="flex-shrink-0">
                    <div class="w-14 h-14 bg-white bg-opacity-30 rounded-xl flex items-center justify-center shadow-lg">
                        <svg class="w-8 h-8 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                    </div>
                </div>
                <div class="ml-4 flex-1">
                    <div class="text-sm font-medium text-white drop-shadow-lg">Pending Verification</div>
                    <div class="text-3xl font-bold text-white drop-shadow-lg pending-count">0</div>
                </div>
            </div>
        </div>

        <div class="rounded-2xl shadow-xl border-4 border-red-600 hover:shadow-2xl hover:scale-105 transition-all duration-300 p-6" style="background: linear-gradient(135deg, #ef4444, #f43f5e, #ec4899);">
            <div class="flex items-center">
                <div class="flex-shrink-0">
                    <div class="w-14 h-14 bg-white bg-opacity-30 rounded-xl flex items-center justify-center shadow-lg">
                        <svg class="w-8 h-8 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </div>
                </div>
                <div class="ml-4 flex-1">
                    <div class="text-sm font-medium text-white drop-shadow-lg">Rejected</div>
                    <div class="text-3xl font-bold text-white drop-shadow-lg rejected-count">0</div>
                </div>
            </div>
        </div>

        <div class="rounded-2xl shadow-xl border-4 border-blue-600 hover:shadow-2xl hover:scale-105 transition-all duration-300 p-6" style="background: linear-gradient(135deg, #3b82f6, #06b6d4, #6366f1);">
            <div class="flex items-center">
                <div class="flex-shrink-0">
                    <div class="w-14 h-14 bg-white bg-opacity-30 rounded-xl flex items-center justify-center shadow-lg">
                        <svg class="w-8 h-8 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                        </svg>
                    </div>
                </div>
                <div class="ml-4 flex-1">
                    <div class="text-sm font-medium text-white drop-shadow-lg">Never Verified</div>
                    <div class="text-3xl font-bold text-white drop-shadow-lg never-verified-count">0</div>
                </div>
            </div>
        </div>
    </div>

    <!-- Unverified Sitters Table -->
    <div class="bg-gradient-to-br from-teal-50 to-cyan-100 rounded-2xl shadow-lg border border-teal-200 hover-lift">
        <div class="px-6 py-4 border-b border-teal-200 bg-gradient-to-r from-teal-100 to-cyan-100 rounded-t-2xl">
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
                        <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path>
                        </svg>
                    </div>
                    <div>
                        <h3 class="text-lg font-semibold text-teal-800">Unverified Sitters</h3>
                        <p class="text-sm text-teal-600">Manage sitter verification status and manual verification</p>
                    </div>
                </div>
                <div class="flex space-x-4">
                    <input type="text" id="search-sitters" placeholder="Search sitters..." class="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <button id="refresh-sitters" class="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        Refresh
                    </button>
                </div>
            </div>
        </div>
        <div class="overflow-hidden">
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sitter</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200" id="sitters-table-body">
                    <!-- Sitters will be loaded via JavaScript -->
                    <tr id="loading-row">
                        <td colspan="5" class="px-6 py-4 text-center text-sm text-gray-500">
                            <div class="flex items-center justify-center">
                                <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mr-2"></div>
                                Loading sitters...
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>

</div>

<script>
let sitters = [];

// Load unverified sitters from API
async function loadSitters() {
    try {
        const response = await fetch('/admin/api/verifications/unverified-sitters');
        const data = await response.json();
        
        if (data.success) {
            sitters = data.sitters.data;
            renderSitters();
            
            // Update stats if available
            if (data.stats) {
                updateStats(data.stats);
            }
        } else {
            console.error('Failed to load sitters:', data.message);
            showError('Failed to load sitters');
        }
    } catch (error) {
        console.error('Error loading sitters:', error);
        showError('Error loading sitters');
    }
}

// Update stats display
function updateStats(stats) {
    const unverifiedElement = document.querySelector('.unverified-count');
    if (unverifiedElement) {
        unverifiedElement.textContent = stats.total_unverified;
    }
    
    const pendingElement = document.querySelector('.pending-count');
    if (pendingElement) {
        pendingElement.textContent = stats.pending_verification;
    }
    
    const rejectedElement = document.querySelector('.rejected-count');
    if (rejectedElement) {
        rejectedElement.textContent = stats.rejected;
    }
    
    const neverVerifiedElement = document.querySelector('.never-verified-count');
    if (neverVerifiedElement) {
        neverVerifiedElement.textContent = stats.never_verified;
    }
}

// Render sitters in the table
function renderSitters() {
    const tbody = document.getElementById('sitters-table-body');
    const loadingRow = document.getElementById('loading-row');
    
    // Remove loading row
    if (loadingRow) {
        loadingRow.remove();
    }
    
    if (sitters.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="px-6 py-4 text-center text-sm text-gray-500">
                    No unverified sitters found.
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = sitters.map(sitter => `
        <tr class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                    <div class="flex-shrink-0 h-10 w-10">
                        <div class="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <span class="text-sm font-medium text-gray-700">${sitter.name.substring(0, 2).toUpperCase()}</span>
                        </div>
                    </div>
                    <div class="ml-4">
                        <div class="text-sm font-medium text-gray-900">${sitter.name}</div>
                        <div class="text-sm text-gray-500">ID: ${sitter.id}</div>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">${sitter.email}</div>
                <div class="text-sm text-gray-500">${sitter.phone || 'No phone'}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                ${getStatusBadge(sitter.verification_status_text, sitter.can_be_verified)}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${sitter.time_ago}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                ${sitter.can_be_verified ? 
                    `<button onclick="verifySitter(${sitter.id}, '${sitter.name}')" class="text-green-600 hover:text-green-900 bg-green-100 px-3 py-1 rounded-md text-xs font-medium hover:bg-green-200 transition-colors">
                        Verify
                    </button>` : 
                    '<span class="text-gray-400 text-xs">Already verified</span>'
                }
            </td>
        </tr>
    `).join('');
}

// Get status badge HTML
function getStatusBadge(status, canBeVerified) {
    let badgeClass, badgeText;
    
    switch (status) {
        case 'Verified':
            badgeClass = 'inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800';
            badgeText = '✅ Verified';
            break;
        case 'Rejected':
            badgeClass = 'inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800';
            badgeText = '❌ Rejected';
            break;
        case 'Pending Verification':
            badgeClass = 'inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800';
            badgeText = '⏳ Pending';
            break;
        default:
            badgeClass = 'inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800';
            badgeText = '❓ Not Verified';
    }
    
    return `<span class="${badgeClass}">${badgeText}</span>`;
}

// Direct verification function
async function verifySitter(sitterId, sitterName) {
    if (!confirm(`Are you sure you want to verify ${sitterName}?`)) {
        return;
    }
    
    try {
        const response = await fetch(`/admin/api/verifications/${sitterId}/manual-verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
            },
            body: JSON.stringify({
                reason: `Manual verification for ${sitterName}`,
                confidence_level: 'high'
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Sitter verified successfully!');
            loadSitters(); // Refresh the list
        } else {
            alert('Failed to verify sitter: ' + (data.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Verification error:', error);
        alert('Error verifying sitter: ' + error.message);
    }
}

// Show error message
function showError(message) {
    const tbody = document.getElementById('sitters-table-body');
    tbody.innerHTML = `
        <tr>
            <td colspan="5" class="px-6 py-4 text-center text-sm text-red-500">
                ${message}
            </td>
        </tr>
    `;
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Load initial sitters
    loadSitters();
    
    // Search functionality
    document.getElementById('search-sitters').addEventListener('input', function(e) {
        // Implement search functionality here
        console.log('Search:', e.target.value);
    });
    
    // Refresh button
    document.getElementById('refresh-sitters').addEventListener('click', function() {
        loadSitters();
    });
});

// Auto-refresh every 30 seconds
setInterval(function() {
    loadSitters();
}, 30000);
</script>
@endsection
