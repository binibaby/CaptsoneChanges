@extends('admin.layouts.app')

@section('content')
<div class="space-y-8">
    <!-- Page Header -->
    <div class="relative overflow-hidden rounded-2xl shadow-2xl" style="background: linear-gradient(135deg, #0d9488, #06b6d4, #3b82f6, #8b5cf6);">
        <div class="absolute inset-0 bg-black opacity-10"></div>
        <div class="relative px-8 py-8">
            <div class="flex items-center justify-between">
                <div class="text-white">
                    <h1 class="text-3xl font-bold mb-2">ID Verification Management 🔐</h1>
                    <p class="text-teal-100 text-lg">Review and manage user identity verification requests</p>
                    <div class="flex items-center mt-4 space-x-6">
                        <div class="flex items-center text-teal-100">
                            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            <span class="text-sm">Secure Identity Verification</span>
                        </div>
                        <div class="flex items-center text-teal-100">
                            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                            </svg>
                            <span class="text-sm">Trust & Safety First</span>
                        </div>
                    </div>
                </div>
                <div class="hidden md:block">
                    <div class="w-24 h-24 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                        <svg class="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Action Bar -->
    <div class="flex flex-wrap items-center justify-between gap-4">
        <div class="flex items-center space-x-4">
            <h2 class="text-xl font-semibold text-gray-900">Verification Actions</h2>
        </div>
        <div class="flex items-center space-x-3">
            <button id="refresh-verifications" class="bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 text-blue-700 px-4 py-2 rounded-xl border border-blue-200 transition-all duration-200 flex items-center shadow-sm hover:shadow-md">
                <svg class="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
                Refresh
            </button>
            <button id="export-verifications" class="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white px-4 py-2 rounded-xl transition-all duration-200 flex items-center shadow-lg hover:shadow-xl">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                Export Data
            </button>
        </div>
    </div>

    <!-- Statistics Cards -->
    <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
                    <div class="text-sm font-medium text-white drop-shadow-lg">Pending Reviews</div>
                    <div class="text-3xl font-bold text-white drop-shadow-lg">{{ \App\Models\Verification::where('verification_status', 'pending')->count() }}</div>
                </div>
            </div>
        </div>

        <div class="rounded-2xl shadow-xl border-4 border-green-600 hover:shadow-2xl hover:scale-105 transition-all duration-300 p-6" style="background: linear-gradient(135deg, #10b981, #059669, #0d9488);">
            <div class="flex items-center">
                <div class="flex-shrink-0">
                    <div class="w-14 h-14 bg-white bg-opacity-30 rounded-xl flex items-center justify-center shadow-lg">
                        <svg class="w-8 h-8 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                    </div>
                </div>
                <div class="ml-4 flex-1">
                    <div class="text-sm font-medium text-white drop-shadow-lg">Approved</div>
                    <div class="text-3xl font-bold text-white drop-shadow-lg">{{ \App\Models\Verification::where('verification_status', 'approved')->count() }}</div>
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
                    <div class="text-3xl font-bold text-white drop-shadow-lg">{{ \App\Models\Verification::where('verification_status', 'rejected')->count() }}</div>
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
                    <div class="text-sm font-medium text-white drop-shadow-lg">Total Submissions</div>
                    <div class="text-3xl font-bold text-white drop-shadow-lg">{{ \App\Models\Verification::count() }}</div>
                </div>
            </div>
        </div>
    </div>

    <!-- Verification Requests Table -->
    <div class="bg-gradient-to-br from-teal-50 to-cyan-100 rounded-2xl shadow-lg border border-teal-200 hover-lift">
        <div class="px-6 py-4 border-b border-teal-200 bg-gradient-to-r from-teal-100 to-cyan-100 rounded-t-2xl">
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
                        <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                    </div>
                    <div>
                        <h3 class="text-lg font-semibold text-teal-800">ID Verification Requests</h3>
                        <p class="text-sm text-teal-600">Review and manage user identity verification submissions</p>
                    </div>
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