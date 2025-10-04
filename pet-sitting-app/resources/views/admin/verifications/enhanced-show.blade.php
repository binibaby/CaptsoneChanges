@extends('admin.layouts.app')

@push('head')
<!-- Fancybox CSS -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fancyapps/ui@5.0/dist/fancybox/fancybox.css" />
@endpush

@push('scripts')
<!-- Fancybox JavaScript -->
<script src="https://cdn.jsdelivr.net/npm/@fancyapps/ui@5.0/dist/fancybox/fancybox.umd.js"></script>
@endpush

@section('content')
<div class="space-y-6">
    <!-- Header -->
    <div class="sm:flex sm:items-center sm:justify-between">
        <div>
            <h1 class="text-2xl font-bold text-gray-900">Enhanced ID Verification Review</h1>
            <p class="mt-2 text-sm text-gray-700">Review sitter's identity documents and location verification</p>
        </div>
        <div class="mt-4 sm:mt-0">
            <a href="{{ route('admin.verifications.index') }}" class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                </svg>
                Back to Verifications
            </a>
        </div>
    </div>


    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Sitter Information -->
        <div class="bg-white shadow rounded-lg">
            <div class="px-6 py-4 border-b border-gray-200">
                <h3 class="text-lg font-medium text-gray-900">Sitter Information</h3>
            </div>
            <div class="px-6 py-4 space-y-4">
                <div class="flex items-center">
                    <div class="flex-shrink-0 h-12 w-12">
                        <div class="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center">
                            <span class="text-lg font-medium text-gray-700">{{ substr($verification->user->name, 0, 2) }}</span>
                        </div>
                    </div>
                    <div class="ml-4">
                        <div class="text-lg font-medium text-gray-900">{{ $verification->user->name }}</div>
                        <div class="text-sm text-gray-500">{{ $verification->user->email }}</div>
                        <div class="text-sm text-gray-500">Phone: {{ $verification->user->phone ?? 'Not provided' }}</div>
                    </div>
                </div>

                <div class="border-t pt-4">
                    <dl class="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                        <div>
                            <dt class="text-sm font-medium text-gray-500">Document Type</dt>
                            <dd class="mt-1 text-sm text-gray-900">{{ ucwords(str_replace('_', ' ', $verification->document_type)) }}</dd>
                        </div>
                        <div>
                            <dt class="text-sm font-medium text-gray-500">Submitted</dt>
                            <dd class="mt-1 text-sm text-gray-900">{{ $verification->created_at->format('M d, Y H:i') }}</dd>
                        </div>
                        <div>
                            <dt class="text-sm font-medium text-gray-500">Review Deadline</dt>
                            <dd class="mt-1 text-sm text-gray-900">
                                @if($verification->review_deadline)
                                    {{ $verification->review_deadline->format('M d, Y H:i') }}
                                @else
                                    Not set
                                @endif
                            </dd>
                        </div>
                        <div>
                            <dt class="text-sm font-medium text-gray-500">Status</dt>
                            <dd class="mt-1">
                                <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                    {{ ucwords(str_replace('_', ' ', $verification->verification_status)) }}
                                </span>
                            </dd>
                        </div>
                    </dl>
                </div>
            </div>
        </div>

        <!-- Location Verification -->
        <div class="bg-white shadow rounded-lg">
            <div class="px-6 py-4 border-b border-gray-200">
                <h3 class="text-lg font-medium text-gray-900">Location Verification</h3>
            </div>
            <div class="px-6 py-4">
                @if($verification->selfie_address)
                    <div class="space-y-3">
                        <div>
                            <dt class="text-sm font-medium text-gray-500">Selfie Location</dt>
                            <dd class="mt-1 text-sm text-gray-900">{{ $verification->selfie_address }}</dd>
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <dt class="text-sm font-medium text-gray-500">Latitude</dt>
                                <dd class="mt-1 text-sm text-gray-900">{{ number_format($verification->selfie_latitude, 6) }}</dd>
                            </div>
                            <div>
                                <dt class="text-sm font-medium text-gray-500">Longitude</dt>
                                <dd class="mt-1 text-sm text-gray-900">{{ number_format($verification->selfie_longitude, 6) }}</dd>
                            </div>
                        </div>
                        <div>
                            <dt class="text-sm font-medium text-gray-500">Accuracy</dt>
                            <dd class="mt-1 text-sm text-gray-900">{{ number_format($verification->location_accuracy, 1) }} meters</dd>
                        </div>
                    </div>
                @else
                    <p class="text-sm text-gray-500">No location data available</p>
                @endif
            </div>
        </div>
    </div>

    <!-- Document Images -->
    <div class="bg-white shadow rounded-lg">
        <div class="px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-medium text-gray-900">Verification Documents</h3>
            <p class="mt-1 text-sm text-gray-600">Review the submitted documents for verification</p>
        </div>
        <div class="px-6 py-4">
            @if($verification->front_id_image || $verification->back_id_image || $verification->selfie_image)
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <!-- Front ID -->
                    <div class="text-center">
                        <h4 class="text-sm font-medium text-gray-900 mb-3">Front ID</h4>
                        @if($verification->front_id_image)
                            <a href="{{ asset('storage/' . $verification->front_id_image) }}" class="relative group cursor-pointer hover:scale-105 transition-transform duration-200 block" data-fancybox="verification-gallery" data-caption="Front ID">
                                <img src="{{ asset('storage/' . $verification->front_id_image) }}" 
                                     alt="Front ID" 
                                     class="w-full h-48 object-cover rounded-lg border-2 border-gray-300 hover:border-blue-500 hover:shadow-xl transition-all duration-200">
                                <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                                    <svg class="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"></path>
                                    </svg>
                                </div>
                            </a>
                        @else
                            <div class="w-full h-48 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                                <span class="text-gray-400">No image</span>
                            </div>
                        @endif
                    </div>

                    <!-- Back ID -->
                    <div class="text-center">
                        <h4 class="text-sm font-medium text-gray-900 mb-3">Back ID</h4>
                        @if($verification->back_id_image)
                            <a href="{{ asset('storage/' . $verification->back_id_image) }}" class="relative group cursor-pointer hover:scale-105 transition-transform duration-200 block" data-fancybox="verification-gallery" data-caption="Back ID">
                                <img src="{{ asset('storage/' . $verification->back_id_image) }}" 
                                     alt="Back ID" 
                                     class="w-full h-48 object-cover rounded-lg border-2 border-gray-300 hover:border-blue-500 hover:shadow-xl transition-all duration-200">
                                <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                                    <svg class="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"></path>
                                    </svg>
                                </div>
                            </a>
                        @else
                            <div class="w-full h-48 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                                <span class="text-gray-400">No image</span>
                            </div>
                        @endif
                    </div>

                    <!-- Selfie -->
                    <div class="text-center">
                        <h4 class="text-sm font-medium text-gray-900 mb-3">Selfie</h4>
                        @if($verification->selfie_image)
                            <a href="{{ asset('storage/' . $verification->selfie_image) }}" class="relative group cursor-pointer hover:scale-105 transition-transform duration-200 block" data-fancybox="verification-gallery" data-caption="Selfie">
                                <img src="{{ asset('storage/' . $verification->selfie_image) }}" 
                                     alt="Selfie" 
                                     class="w-full h-48 object-cover rounded-lg border-2 border-gray-300 hover:border-blue-500 hover:shadow-xl transition-all duration-200">
                                <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                                    <svg class="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"></path>
                                    </svg>
                                </div>
                            </a>
                        @else
                            <div class="w-full h-48 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                                <span class="text-gray-400">No image</span>
                            </div>
                        @endif
                    </div>
                </div>
            @else
                <!-- No Documents Submitted -->
                <div class="text-center py-12">
                    <div class="mx-auto h-24 w-24 text-gray-400">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                    </div>
                    <h3 class="mt-4 text-lg font-medium text-gray-900">No Verification Documents Submitted</h3>
                    <p class="mt-2 text-sm text-gray-500">
                        This user has not yet submitted their ID verification documents. 
                        They need to complete the verification process in the mobile app.
                    </p>
                    <div class="mt-4">
                        <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                            <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                            </svg>
                            Awaiting Document Submission
                        </span>
                    </div>
                </div>
            @endif
        </div>
    </div>

    <!-- Location Information -->
    @if($verification->selfie_address || $verification->selfie_latitude || $verification->selfie_longitude)
    <div class="bg-white shadow rounded-lg">
        <div class="px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-medium text-gray-900">Location Verification</h3>
            <p class="mt-1 text-sm text-gray-600">Location data from selfie submission</p>
        </div>
        <div class="px-6 py-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h4 class="text-sm font-medium text-gray-900 mb-2">Address</h4>
                    <p class="text-sm text-gray-600">
                        @if($verification->selfie_address)
                            {{ $verification->selfie_address }}
                        @else
                            <span class="text-gray-400">No address provided</span>
                        @endif
                    </p>
                </div>
                <div>
                    <h4 class="text-sm font-medium text-gray-900 mb-2">Coordinates</h4>
                    <p class="text-sm text-gray-600">
                        @if($verification->selfie_latitude && $verification->selfie_longitude)
                            <span class="font-mono">{{ $verification->selfie_latitude }}, {{ $verification->selfie_longitude }}</span>
                            <br>
                            <a href="https://www.google.com/maps?q={{ $verification->selfie_latitude }},{{ $verification->selfie_longitude }}" 
                               target="_blank" 
                               class="text-indigo-600 hover:text-indigo-900 text-xs">
                                View on Google Maps
                            </a>
                        @else
                            <span class="text-gray-400">No coordinates provided</span>
                        @endif
                    </p>
                </div>
            </div>
            
            <!-- Location Accuracy Information -->
            @if($verification->location_accuracy)
            <div class="mt-4 pt-4 border-t border-gray-200">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <h4 class="text-sm font-medium text-gray-900 mb-2">Location Accuracy</h4>
                        <p class="text-sm text-gray-600">
                            <span class="font-mono">{{ number_format($verification->location_accuracy, 1) }} meters</span>
                            @if($verification->location_accuracy <= 10)
                                <span class="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    High Accuracy
                                </span>
                            @elseif($verification->location_accuracy <= 50)
                                <span class="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                    Medium Accuracy
                                </span>
                            @else
                                <span class="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                    Low Accuracy
                                </span>
                            @endif
                        </p>
                    </div>
                    <div>
                        <h4 class="text-sm font-medium text-gray-900 mb-2">Capture Time</h4>
                        <p class="text-sm text-gray-600">
                            {{ $verification->created_at->format('M d, Y H:i:s') }}
                        </p>
                    </div>
                </div>
            </div>
            @endif
        </div>
    </div>
    @endif

    <!-- Resubmission Note Section -->
    @if($verification->status === 'rejected' && $verification->allow_resubmission)
    <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div class="flex">
            <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                </svg>
            </div>
            <div class="ml-3">
                <h3 class="text-sm font-medium text-yellow-800">Resubmission Required</h3>
                <div class="mt-2 text-sm text-yellow-700">
                    <p>This verification was previously rejected and the user has been allowed to resubmit. Please review the new documents carefully.</p>
                    @if($verification->rejection_reason)
                        <p class="mt-2"><strong>Previous rejection reason:</strong> {{ $verification->rejection_reason }}</p>
                    @endif
                    @if($verification->rejection_category)
                        <p class="mt-1"><strong>Rejection category:</strong> {{ ucwords(str_replace('_', ' ', $verification->rejection_category)) }}</p>
                    @endif
                </div>
            </div>
        </div>
    </div>
    @endif

    <!-- Admin Review Section -->
    <div class="bg-white shadow rounded-lg">
        <div class="px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-medium text-gray-900">Admin Review</h3>
        </div>
        <div class="px-6 py-4">
            <form id="verificationReviewForm">
                @csrf
                <div class="space-y-4">

                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700" for="documents_clear_yes">Documents Clear</label>
                            <div class="mt-2">
                                <label class="inline-flex items-center">
                                    <input type="radio" id="documents_clear_yes" name="documents_clear" value="1" class="form-radio" {{ $verification->documents_clear ? 'checked' : '' }}>
                                    <span class="ml-2 text-sm text-gray-700">Yes</span>
                                </label>
                                <label class="inline-flex items-center ml-6">
                                    <input type="radio" id="documents_clear_no" name="documents_clear" value="0" class="form-radio" {{ !$verification->documents_clear ? 'checked' : '' }}>
                                    <span class="ml-2 text-sm text-gray-700">No</span>
                                </label>
                            </div>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700" for="face_match_verified_yes">Face Match Verified</label>
                            <div class="mt-2">
                                <label class="inline-flex items-center">
                                    <input type="radio" id="face_match_verified_yes" name="face_match_verified" value="1" class="form-radio" {{ $verification->face_match_verified ? 'checked' : '' }}>
                                    <span class="ml-2 text-sm text-gray-700">Yes</span>
                                </label>
                                <label class="inline-flex items-center ml-6">
                                    <input type="radio" id="face_match_verified_no" name="face_match_verified" value="0" class="form-radio" {{ !$verification->face_match_verified ? 'checked' : '' }}>
                                    <span class="ml-2 text-sm text-gray-700">No</span>
                                </label>
                            </div>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700" for="address_match_verified_yes">Address Match Verified</label>
                            <div class="mt-2">
                                <label class="inline-flex items-center">
                                    <input type="radio" id="address_match_verified_yes" name="address_match_verified" value="1" class="form-radio" {{ $verification->address_match_verified ? 'checked' : '' }}>
                                    <span class="ml-2 text-sm text-gray-700">Yes</span>
                                </label>
                                <label class="inline-flex items-center ml-6">
                                    <input type="radio" id="address_match_verified_no" name="address_match_verified" value="0" class="form-radio" {{ !$verification->address_match_verified ? 'checked' : '' }}>
                                    <span class="ml-2 text-sm text-gray-700">No</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    </div>

    <!-- Action Buttons -->
    <div class="flex justify-between items-center">
        <div class="flex space-x-3">
            <button type="button" 
                    onclick="approveVerification()"
                    class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                Approve & Mark as Legit Sitter
            </button>
            
            <button type="button" 
                    onclick="rejectVerification()"
                    class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
                Reject
            </button>
        </div>

    </div>
</div>


<script>
// Cache busting - Version 2.1
console.log('Script loaded at:', new Date().toISOString());

// Initialize Fancybox for image gallery
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing Fancybox...');
    console.log('Fancybox available:', typeof Fancybox !== 'undefined');
    
    if (typeof Fancybox === 'undefined') {
        console.error('Fancybox is not loaded!');
        return;
    }
    
    // Check if gallery elements exist before binding
    const galleryElements = document.querySelectorAll('[data-fancybox="verification-gallery"]');
    if (galleryElements.length === 0) {
        console.warn('No gallery elements found for Fancybox binding');
        return;
    }
    
    // Validate that all elements have valid href attributes
    const validElements = Array.from(galleryElements).filter(element => {
        const href = element.href || element.getAttribute('href');
        return href && href.trim() !== '';
    });
    
    if (validElements.length === 0) {
        console.warn('No valid gallery elements found (missing href attributes)');
        return;
    }
    
    console.log('Found', validElements.length, 'valid gallery elements for Fancybox');
    
    try {
        // Validate each gallery element before binding
        galleryElements.forEach((element, index) => {
            console.log(`Gallery element ${index}:`, element);
            console.log(`  - href: ${element.href}`);
            console.log(`  - data-fancybox: ${element.getAttribute('data-fancybox')}`);
            console.log(`  - data-caption: ${element.getAttribute('data-caption')}`);
        });
        
        // Use a simpler configuration to avoid errors
    Fancybox.bind('[data-fancybox="verification-gallery"]', {
            // Basic gallery configuration
        groupAll: true,
        groupAttr: 'data-fancybox',
        
            // Simple UI configuration
        Toolbar: {
            display: {
                left: ['infobar'],
                    middle: ['zoomIn', 'zoomOut'],
                    right: ['close']
                }
            },
            
            // Basic image configuration
        Images: {
                zoom: true
            },
            
            // Basic keyboard shortcuts
        Keyboard: {
            Escape: 'close',
            ArrowRight: 'next',
                ArrowLeft: 'prev'
            },
            
            // Error handling
        on: {
            'init': (fancybox, slide) => {
                    console.log('Fancybox initialized for slide:', slide);
                    if (slide && slide.type === 'image') {
                        console.log('Image slide initialized:', slide.src);
                    }
                },
                'error': (fancybox, error) => {
                    console.error('Fancybox error:', error);
                }
            }
        });
    } catch (error) {
        console.error('Error initializing Fancybox:', error);
    }
});

// Get fresh CSRF token from server
async function refreshCSRFToken() {
    try {
        const response = await fetch('/admin/csrf-token', {
            method: 'GET',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            const newToken = data.csrf_token;
            
            if (newToken) {
                // Update the form token
                const formToken = document.querySelector('input[name="_token"]');
                if (formToken) {
                    formToken.value = newToken;
                }
                
                // Update the meta token
                const metaToken = document.querySelector('meta[name="csrf-token"]');
                if (metaToken) {
                    metaToken.setAttribute('content', newToken);
                }
                
                console.log('CSRF token refreshed:', newToken.substring(0, 10) + '...');
                return newToken;
            }
        }
    } catch (error) {
        console.error('Error refreshing CSRF token:', error);
    }
    return null;
}

// Debug: Log page load
console.log('Enhanced verification page loaded - Version 2.0');
console.log('Verification ID: {{ $verification->id }}');
console.log('CSRF Token available:', !!document.querySelector('meta[name="csrf-token"]'));
console.log('Current timestamp:', new Date().toISOString());

// Debug: Check if functions are defined
console.log('Functions defined:');
console.log('  - refreshCSRFToken:', typeof refreshCSRFToken);
console.log('  - retryApproval:', typeof retryApproval);
console.log('  - approveVerification:', typeof approveVerification);
console.log('  - rejectVerification:', typeof rejectVerification);

// Refresh CSRF token on page load
refreshCSRFToken();

// Fallback function definitions to ensure they're always available
if (typeof window.approveVerification === 'undefined') {
    window.approveVerification = function() {
        alert('approveVerification function not properly loaded. Please refresh the page.');
    };
}

if (typeof window.rejectVerification === 'undefined') {
    window.rejectVerification = function() {
        alert('rejectVerification function not properly loaded. Please refresh the page.');
    };
}

// Test function availability
window.testFunctions = function() {
    console.log('Testing function availability...');
    console.log('approveVerification:', typeof window.approveVerification);
    console.log('rejectVerification:', typeof window.rejectVerification);
    
    if (typeof window.approveVerification === 'function') {
        console.log('✅ approveVerification is available');
    } else {
        console.log('❌ approveVerification is NOT available');
    }
    
    if (typeof window.rejectVerification === 'function') {
        console.log('✅ rejectVerification is available');
    } else {
        console.log('❌ rejectVerification is NOT available');
    }
};

// Run test after a short delay
setTimeout(() => {
    window.testFunctions();
}, 1000);

function retryApproval(formData, csrfToken) {
    try {
        fetch('/api/admin/verifications/{{ $verification->id }}/approve', {
            method: 'POST',
            body: formData,
            credentials: 'include',
            headers: {
                'X-CSRF-TOKEN': csrfToken,
                'Accept': 'application/json'
            }
        })
        .then(response => {
            console.log('Retry approval response status:', response.status);
            console.log('Retry approval response headers:', response.headers);
            
            // Try to parse as JSON regardless of content-type
            return response.text().then(text => {
                console.log('Retry approval raw response text:', text);
                try {
                    const data = JSON.parse(text);
                    console.log('Successfully parsed retry approval JSON:', data);
                    return data;
                } catch (parseError) {
                    console.error('Failed to parse retry approval JSON:', parseError);
                    console.error('Retry approval response text:', text);
                    throw new Error('Response is not valid JSON');
                }
            });
        })
        .then(data => {
            console.log('Retry approval response data:', data);
            if (data.success) {
                alert('Verification approved successfully!');
                window.location.reload();
            } else {
                // Handle error responses (including CSRF errors)
                const errorMessage = data.message || 'An error occurred while approving the verification';
                if (data.message && data.message.includes('CSRF token mismatch')) {
                    alert('Session expired. Please refresh the page and try again.');
                    window.location.reload();
                } else {
                    alert('Error: ' + errorMessage);
                }
            }
        })
        .catch(error => {
            console.error('Retry approval error:', error);
            console.error('Retry approval error details:', {
                message: error.message,
                stack: error.stack
            });
            alert('An error occurred while approving the verification: ' + error.message);
        });
    } catch (fetchError) {
        console.error('Retry approval fetch error:', fetchError);
        alert('Network error: ' + fetchError.message);
    }
}

// Make functions globally accessible
window.approveVerification = async function approveVerification() {
    // Validate that all criteria are set to "Yes"
    const documentsClear = document.querySelector('input[name="documents_clear"]:checked');
    const faceMatchVerified = document.querySelector('input[name="face_match_verified"]:checked');
    const addressMatchVerified = document.querySelector('input[name="address_match_verified"]:checked');
    
    // Check if any criteria is not selected or set to "No"
    const issues = [];
    
    if (!documentsClear || documentsClear.value === '0') {
        issues.push('Documents Clear must be set to "Yes"');
    }
    
    if (!faceMatchVerified || faceMatchVerified.value === '0') {
        issues.push('Face Match Verified must be set to "Yes"');
    }
    
    if (!addressMatchVerified || addressMatchVerified.value === '0') {
        issues.push('Address Match Verified must be set to "Yes"');
    }
    
    // If there are issues, show alert and prevent approval
    if (issues.length > 0) {
        alert('⚠️ Cannot approve verification. Please ensure all criteria are set to "Yes":\n\n' + issues.join('\n'));
        return;
    }
    
    // If all criteria are "Yes", proceed with confirmation
    if (confirm('Are you sure you want to approve this verification and mark the sitter as legit?')) {
        // Get fresh CSRF token
        const csrfToken = await refreshCSRFToken();
        if (!csrfToken) {
            alert('Failed to get CSRF token. Please refresh the page and try again.');
            return;
        }
        
        const formData = new FormData(document.getElementById('verificationReviewForm'));
        formData.append('_method', 'POST');
        formData.append('action', 'approve');
        formData.append('_token', csrfToken);
        
        try {
            fetch('/api/admin/verifications/{{ $verification->id }}/approve', {
            method: 'POST',
            body: formData,
            credentials: 'include',
            headers: {
                    'X-CSRF-TOKEN': csrfToken,
                    'Accept': 'application/json'
                }
            })
        .then(response => {
            console.log('Approval response status:', response.status);
            console.log('Approval response headers:', response.headers);
            
            // Try to parse as JSON regardless of content-type
            return response.text().then(text => {
                console.log('Raw response text:', text);
                try {
                    const data = JSON.parse(text);
                    console.log('Successfully parsed JSON:', data);
                    return data;
                } catch (parseError) {
                    console.error('Failed to parse JSON:', parseError);
                    console.error('Response text:', text);
                    throw new Error('Response is not valid JSON');
                }
            });
        })
        .then(data => {
            console.log('Approval response data:', data);
            if (data.success) {
                alert('Verification approved successfully!');
                window.location.reload();
            } else {
                // Handle error responses (including CSRF errors)
                const errorMessage = data.message || 'An error occurred while approving the verification';
                if (data.message && data.message.includes('CSRF token mismatch')) {
                    alert('Session expired. Please refresh the page and try again.');
                    window.location.reload();
                } else {
                    alert('Error: ' + errorMessage);
                }
            }
        })
        .catch(error => {
            console.error('Approval error:', error);
            console.error('Approval error details:', {
                message: error.message,
                stack: error.stack
            });
            alert('An error occurred while approving the verification: ' + error.message);
        });
        } catch (fetchError) {
            console.error('Fetch error:', fetchError);
            alert('Network error: ' + fetchError.message);
        }
    }
}

window.rejectVerification = async function rejectVerification() {
    const reason = prompt('Please provide a reason for rejection:');
    if (reason && reason.trim() !== '') {
        // Show rejection category selection
        const rejectionCategories = [
            'document_unclear',
            'document_expired', 
            'document_invalid',
            'information_mismatch',
            'suspicious_activity',
            'other'
        ];
        
        const categoryLabels = [
            'Document Unclear',
            'Document Expired',
            'Document Invalid', 
            'Information Mismatch',
            'Suspicious Activity',
            'Other'
        ];
        
        let categorySelection = '';
        for (let i = 0; i < rejectionCategories.length; i++) {
            categorySelection += `${i + 1}. ${categoryLabels[i]}\n`;
        }
        
        const categoryChoice = prompt(`Please select a rejection category:\n\n${categorySelection}\nEnter number (1-6):`);
        if (!categoryChoice || categoryChoice < 1 || categoryChoice > 6) {
            alert('Invalid category selection. Rejection cancelled.');
            return;
        }
        
        const selectedCategory = rejectionCategories[parseInt(categoryChoice) - 1];
        const allowResubmission = confirm('Allow user to resubmit verification?');
        
        // Get fresh CSRF token
        const csrfToken = await refreshCSRFToken();
        if (!csrfToken) {
            alert('Failed to get CSRF token. Please refresh the page and try again.');
            return;
        }
        
        const formData = new FormData(document.getElementById('verificationReviewForm'));
        formData.append('_method', 'POST');
        formData.append('action', 'reject');
        formData.append('reason', reason);
        formData.append('rejection_category', selectedCategory);
        formData.append('allow_resubmission', allowResubmission ? '1' : '0');
        formData.append('_token', csrfToken);
        
        try {
            fetch('/api/admin/verifications/{{ $verification->id }}/reject', {
            method: 'POST',
            body: formData,
            credentials: 'include',
            headers: {
                    'X-CSRF-TOKEN': csrfToken,
                    'Accept': 'application/json'
                }
            })
        .then(response => {
            console.log('Rejection response status:', response.status);
            console.log('Rejection response headers:', response.headers);
            
            // Try to parse as JSON regardless of content-type
            return response.text().then(text => {
                console.log('Rejection raw response text:', text);
                try {
                    const data = JSON.parse(text);
                    console.log('Successfully parsed rejection JSON:', data);
                    return data;
                } catch (parseError) {
                    console.error('Failed to parse rejection JSON:', parseError);
                    console.error('Rejection response text:', text);
                    throw new Error('Response is not valid JSON');
                }
            });
        })
        .then(data => {
            console.log('Response data:', data);
            if (data.success) {
                alert('Verification rejected successfully!');
                window.location.reload();
            } else {
                // Handle error responses (including CSRF errors)
                const errorMessage = data.message || 'An error occurred while rejecting the verification';
                if (data.message && data.message.includes('CSRF token mismatch')) {
                    alert('Session expired. Please refresh the page and try again.');
                    window.location.reload();
                } else {
                    alert('Error: ' + errorMessage);
                }
            }
        })
        .catch(error => {
            console.error('Error:', error);
            console.error('Error details:', {
                message: error.message,
                stack: error.stack
            });
            alert('An error occurred while rejecting the verification: ' + error.message);
        });
        } catch (fetchError) {
            console.error('Rejection fetch error:', fetchError);
            alert('Network error: ' + fetchError.message);
        }
    }
}

// Fallback initialization in case DOMContentLoaded has already fired
if (document.readyState === 'loading') {
    // DOM is still loading, wait for DOMContentLoaded
} else {
    // DOM is already loaded, initialize immediately
    console.log('DOM already loaded, initializing Fancybox immediately...');
    console.log('Fancybox available:', typeof Fancybox !== 'undefined');
    
    if (typeof Fancybox !== 'undefined') {
        // Check if gallery elements exist before binding
        const galleryElements = document.querySelectorAll('[data-fancybox="verification-gallery"]');
        if (galleryElements.length === 0) {
            console.warn('No gallery elements found for Fancybox fallback binding');
        } else {
            // Validate that all elements have valid href attributes
            const validElements = Array.from(galleryElements).filter(element => {
                const href = element.href || element.getAttribute('href');
                return href && href.trim() !== '';
            });
            
            if (validElements.length === 0) {
                console.warn('No valid gallery elements found for fallback (missing href attributes)');
            } else {
        
                console.log('Found', validElements.length, 'valid gallery elements for Fancybox fallback');
                
                try {
                    // Validate each gallery element before binding
                    galleryElements.forEach((element, index) => {
                        console.log(`Fallback gallery element ${index}:`, element);
                        console.log(`  - href: ${element.href}`);
                        console.log(`  - data-fancybox: ${element.getAttribute('data-fancybox')}`);
                        console.log(`  - data-caption: ${element.getAttribute('data-caption')}`);
                    });
                    
                    // Use a simpler configuration to avoid errors
                    Fancybox.bind('[data-fancybox="verification-gallery"]', {
                        // Basic gallery configuration
                        groupAll: true,
                        groupAttr: 'data-fancybox',
                        
                        // Simple UI configuration
                        Toolbar: {
                            display: {
                                left: ['infobar'],
                                middle: ['zoomIn', 'zoomOut'],
                                right: ['close']
                            }
                        },
                        
                        // Basic image configuration
                        Images: {
                            zoom: true
                        },
                        
                        // Basic keyboard shortcuts
                        Keyboard: {
                            Escape: 'close',
                            ArrowRight: 'next',
                            ArrowLeft: 'prev'
                        },
                        
                        // Error handling
                        on: {
                            'init': (fancybox, slide) => {
                                console.log('Fancybox fallback initialized for slide:', slide);
                                if (slide && slide.type === 'image') {
                                    console.log('Image slide initialized:', slide.src);
                                }
                            },
                            'error': (fancybox, error) => {
                                console.error('Fancybox fallback error:', error);
                            }
                        }
                    });
                } catch (error) {
                    console.error('Error initializing Fancybox fallback:', error);
                }
            }
        }
    } else {
        console.error('Fancybox is not loaded in fallback initialization!');
    }
}
</script>
@endsection
