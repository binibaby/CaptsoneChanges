@extends('admin.layouts.app')

@section('content')
<div class="space-y-6">
    <div class="sm:flex sm:items-center sm:justify-between">
        <div>
            <h1 class="text-2xl font-bold text-gray-900">ID Verification Management</h1>
            <p class="mt-2 text-sm text-gray-700">Review and manage user identity verification requests.</p>
        </div>
    </div>

    <!-- Statistics Cards -->
    <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <div class="bg-white overflow-hidden shadow rounded-lg">
            <div class="p-5">
                <div class="flex items-center">
                    <div class="flex-shrink-0">
                        <div class="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                            <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                        </div>
                    </div>
                    <div class="ml-5 w-0 flex-1">
                        <dl>
                            <dt class="text-sm font-medium text-gray-500 truncate">Pending Reviews</dt>
                            <dd class="text-lg font-medium text-gray-900">{{ \App\Models\Verification::where('verification_status', 'pending')->count() }}</dd>
                        </dl>
                    </div>
                </div>
            </div>
        </div>

        <div class="bg-white overflow-hidden shadow rounded-lg">
            <div class="p-5">
                <div class="flex items-center">
                    <div class="flex-shrink-0">
                        <div class="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                            <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                            </svg>
                        </div>
                    </div>
                    <div class="ml-5 w-0 flex-1">
                        <dl>
                            <dt class="text-sm font-medium text-gray-500 truncate">Approved</dt>
                            <dd class="text-lg font-medium text-gray-900">{{ \App\Models\Verification::where('verification_status', 'approved')->count() }}</dd>
                        </dl>
                    </div>
                </div>
            </div>
        </div>

        <div class="bg-white overflow-hidden shadow rounded-lg">
            <div class="p-5">
                <div class="flex items-center">
                    <div class="flex-shrink-0">
                        <div class="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                            <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"/>
                            </svg>
                        </div>
                    </div>
                    <div class="ml-5 w-0 flex-1">
                        <dl>
                            <dt class="text-sm font-medium text-gray-500 truncate">Rejected</dt>
                            <dd class="text-lg font-medium text-gray-900">{{ \App\Models\Verification::where('verification_status', 'rejected')->count() }}</dd>
                        </dl>
                    </div>
                </div>
            </div>
        </div>

        <div class="bg-white overflow-hidden shadow rounded-lg">
            <div class="p-5">
                <div class="flex items-center">
                    <div class="flex-shrink-0">
                        <div class="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                            <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
                            </svg>
                        </div>
                    </div>
                    <div class="ml-5 w-0 flex-1">
                        <dl>
                            <dt class="text-sm font-medium text-gray-500 truncate">Total Submissions</dt>
                            <dd class="text-lg font-medium text-gray-900">{{ \App\Models\Verification::count() }}</dd>
                        </dl>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Verification Requests Table -->
    <div class="bg-white shadow rounded-lg">
        <div class="px-6 py-4 border-b border-gray-200">
            <div class="flex justify-between items-center">
                <div>
                    <h3 class="text-lg font-medium text-gray-900">ID Verification Requests</h3>
                    <p class="mt-1 text-sm text-gray-600">Review and manage user identity verification submissions.</p>
                </div>
                <div class="flex space-x-4">
                    <select id="status-filter" class="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        <option value="all">All Verifications</option>
                        <option value="pending" selected>Pending Review</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                    </select>
                    <button id="refresh-btn" class="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        Refresh
                    </button>
                </div>
            </div>
        </div>
        <div class="overflow-hidden">
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Document Type</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Document Number</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Documents</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Review Deadline</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200" id="verifications-table-body">
                    <!-- Verifications will be loaded via JavaScript -->
                    <tr id="loading-row">
                        <td colspan="7" class="px-6 py-4 text-center text-sm text-gray-500">
                            <div class="flex items-center justify-center">
                                <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mr-2"></div>
                                Loading verifications...
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>

<script>
let currentStatus = 'pending';
let verifications = [];

// Load verifications from API
async function loadVerifications(status = 'pending') {
    try {
        const response = await fetch(`/admin/api/verifications?status=${status}`);
        const data = await response.json();
        
        if (data.success) {
            verifications = data.verifications.data;
            renderVerifications();
        } else {
            console.error('Failed to load verifications:', data.message);
            showError('Failed to load verifications');
        }
    } catch (error) {
        console.error('Error loading verifications:', error);
        showError('Error loading verifications');
    }
}

// Render verifications in the table
function renderVerifications() {
    const tbody = document.getElementById('verifications-table-body');
    const loadingRow = document.getElementById('loading-row');
    
    // Remove loading row
    if (loadingRow) {
        loadingRow.remove();
    }
    
    if (verifications.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="px-6 py-4 text-center text-sm text-gray-500">
                    No verification requests found.
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = verifications.map(verification => `
        <tr class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                    <div class="flex-shrink-0 h-10 w-10">
                        <div class="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <span class="text-sm font-medium text-gray-700">${verification.user.name.substring(0, 2).toUpperCase()}</span>
                        </div>
                    </div>
                    <div class="ml-4">
                        <div class="text-sm font-medium text-gray-900">${verification.user.name}</div>
                        <div class="text-sm text-gray-500">${verification.user.email}</div>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ${verification.document_type ? verification.document_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Not specified'}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ${verification.document_number || 'Not provided'}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <div class="flex space-x-1">
                    ${verification.front_id_image ? `<img src="/storage/${verification.front_id_image}" alt="Front ID" class="h-8 w-8 object-cover rounded border" onerror="this.style.display='none';" />` : ''}
                    ${verification.back_id_image ? `<img src="/storage/${verification.back_id_image}" alt="Back ID" class="h-8 w-8 object-cover rounded border" onerror="this.style.display='none';" />` : ''}
                    ${verification.selfie_image ? `<img src="/storage/${verification.selfie_image}" alt="Selfie" class="h-8 w-8 object-cover rounded-full border" onerror="this.style.display='none';" />` : ''}
                    ${!verification.front_id_image && !verification.back_id_image && !verification.selfie_image ? '<span class="text-gray-400">No images</span>' : ''}
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ${verification.selfie_address ? 
                    `<div class="max-w-xs truncate" title="${verification.selfie_address}">📍 ${verification.selfie_address}</div>` : 
                    '<span class="text-gray-400">No location</span>'
                }
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                ${getStatusBadge(verification.verification_status, verification.is_legit_sitter, verification.verification_method)}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${new Date(verification.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <a href="/admin/verifications/${verification.id}/enhanced" class="text-indigo-600 hover:text-indigo-900 mr-3">View Details</a>
                ${getActionStatus(verification.verification_status)}
            </td>
        </tr>
    `).join('');
}

// Get status badge HTML
function getStatusBadge(status, isLegitSitter, method) {
    let badgeClass, badgeText, icon;
    
    switch (status) {
        case 'pending':
            badgeClass = 'inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800';
            badgeText = '⏳ Pending Review';
            break;
        case 'approved':
            badgeClass = 'inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800';
            badgeText = '✅ Approved';
            break;
        case 'rejected':
            badgeClass = 'inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800';
            badgeText = '❌ Rejected';
            break;
        default:
            badgeClass = 'inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800';
            badgeText = status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    
    let html = `<span class="${badgeClass}">${badgeText}</span>`;
    
    if (status === 'approved' && isLegitSitter) {
        html += '<div class="text-xs text-green-600 mt-1">🏆 Legit Sitter</div>';
    }
    
    if (method) {
        html += `<div class="text-xs text-gray-500 mt-1">${method.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</div>`;
    }
    
    return html;
}

// Get action status HTML
function getActionStatus(status) {
    switch (status) {
        case 'pending':
            return '<span class="text-yellow-600 text-xs">⏳ Pending Review</span>';
        case 'approved':
            return '<span class="text-green-600 text-xs">✅ Approved</span>';
        case 'rejected':
            return '<span class="text-red-600 text-xs">❌ Rejected</span>';
        default:
            return '';
    }
}

// Show error message
function showError(message) {
    const tbody = document.getElementById('verifications-table-body');
    tbody.innerHTML = `
        <tr>
            <td colspan="7" class="px-6 py-4 text-center text-sm text-red-500">
                ${message}
            </td>
        </tr>
    `;
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Load initial verifications
    loadVerifications(currentStatus);
    
    // Status filter change
    document.getElementById('status-filter').addEventListener('change', function(e) {
        currentStatus = e.target.value;
        loadVerifications(currentStatus);
    });
    
    // Refresh button
    document.getElementById('refresh-btn').addEventListener('click', function() {
        loadVerifications(currentStatus);
    });
});

// Auto-refresh verification status every 30 seconds
setInterval(function() {
    fetch('/admin/api/verifications/status-updates')
        .then(response => response.json())
        .then(data => {
            if (data.hasUpdates) {
                loadVerifications(currentStatus);
            }
        })
        .catch(error => console.log('Status check failed:', error));
}, 30000);

// Real-time status updates
function updateVerificationStatus(verificationId, status) {
    const statusElement = document.querySelector(`[data-verification-id="${verificationId}"]`);
    if (statusElement) {
        statusElement.textContent = status === 'approved' ? '✅ Veriff Approved' : '❌ Veriff Rejected';
        statusElement.className = status === 'approved' ? 'text-green-600 text-xs' : 'text-red-600 text-xs';
    }
}
</script>
</div>
@endsection 