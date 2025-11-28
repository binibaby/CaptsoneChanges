@extends('admin.layouts.app')

@push('head')
<!-- Fancybox CSS -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fancyapps/ui@5.0/dist/fancybox/fancybox.css" />
<style>
/* Enhanced image gallery styles */
.verification-gallery img {
    cursor: pointer !important;
    transition: all 0.3s ease;
}

.verification-gallery img:hover {
    transform: scale(1.05);
    box-shadow: 0 10px 25px rgba(0,0,0,0.2);
}

.verification-gallery a {
    display: block;
    position: relative;
    overflow: hidden;
}

.verification-gallery a::after {
    content: '🔍';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(0,0,0,0.7);
    color: white;
    padding: 8px;
    border-radius: 50%;
    opacity: 0;
    transition: opacity 0.3s ease;
    font-size: 20px;
}

.verification-gallery a:hover::after {
    opacity: 1;
}

/* Test button styles */
.test-fancybox-btn {
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
    color: white;
    padding: 10px 20px;
    border-radius: 8px;
    border: none;
    cursor: pointer;
    font-weight: 500;
    margin-bottom: 20px;
    transition: all 0.3s ease;
}

.test-fancybox-btn:hover {
    background: linear-gradient(135deg, #1d4ed8, #1e40af);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

/* Hide Fancybox gallery elements */
.fancybox__thumbs,
.fancybox__nav,
.fancybox__slide-indicators,
.fancybox__counter {
    display: none !important;
}

/* Ensure clean popup with highest z-index */
.fancybox__container {
    background: rgba(0, 0, 0, 0.9) !important;
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    z-index: 999999 !important;
    overflow: hidden !important;
}

.fancybox__content {
    padding: 0 !important;
    position: relative !important;
    z-index: 1000000 !important;
}

/* Prevent page jumping and scrolling */
body.fancybox-active {
    overflow: hidden !important;
    position: fixed !important;
    width: 100% !important;
}

/* Ensure Fancybox is above everything */
.fancybox__backdrop {
    z-index: 999998 !important;
}

.fancybox__toolbar {
    z-index: 1000001 !important;
}

/* Ensure images stay in place */
.verification-gallery a {
    display: block;
    position: relative;
    overflow: hidden;
}

.verification-gallery img {
    display: block;
    width: 100%;
    height: auto;
    transition: transform 0.2s ease;
}

/* Remove extra spacing and ensure compact layout */
body {
    margin: 0;
    padding: 0;
}

.main-content {
    min-height: auto !important;
    padding-bottom: 0 !important;
}

/* Ensure no extra spacing in containers */
.space-y-2 > * + * {
    margin-top: 0.5rem !important;
}

/* Remove any default margins/padding that might cause extra space */
.bg-white {
    margin-bottom: 0 !important;
}

/* Ensure the page ends right after the buttons */
html, body {
    height: auto !important;
    min-height: auto !important;
}

/* Remove any extra spacing from the main container */
.space-y-2 {
    padding-bottom: 0 !important;
    margin-bottom: 0 !important;
}

/* Ensure action buttons are the last element */
.flex.justify-between.items-center {
    margin-bottom: 0 !important;
    padding-bottom: 0 !important;
}

/* Override admin layout minimum height and padding */
main {
    min-height: auto !important;
    height: auto !important;
    padding: 0 !important;
    margin: 0 !important;
}

/* Override the main content container */
#main-content {
    min-height: auto !important;
    height: auto !important;
}

/* Ensure the page content doesn't have extra height */
.fade-in-up {
    min-height: auto !important;
    height: auto !important;
    padding: 0 !important;
    margin: 0 !important;
}

/* Override ALL possible spacing sources */
* {
    box-sizing: border-box;
}

/* Remove any default margins/padding from all elements */
body, html, div, main, section, article, aside, nav, header, footer {
    margin: 0 !important;
    padding: 0 !important;
}

/* Specifically target the admin layout elements */
.content-expanded {
    min-height: auto !important;
    height: auto !important;
}

/* Override any Tailwind classes that might add spacing */
.p-6 {
    padding: 0 !important;
}

.min-h-\[calc\(100vh-4rem\)\] {
    min-height: auto !important;
}

/* Prevent automatic scrolling */
html, body {
    scroll-behavior: auto !important;
    overflow-x: hidden !important;
    position: relative !important;
}

/* Prevent any automatic scrolling to elements */
* {
    scroll-margin-top: 0 !important;
    scroll-padding-top: 0 !important;
}

/* Keep page at top */
body {
    scroll-top: 0 !important;
}

/* Prevent hash scrolling */
a[href*="#"] {
    scroll-behavior: auto !important;
}

/* Prevent image links from causing scroll */
[data-fancybox="verification-gallery"] {
    scroll-behavior: auto !important;
    scroll-margin-top: 0 !important;
    scroll-padding-top: 0 !important;
}

/* Prevent any scroll when clicking images */
.verification-gallery a {
    scroll-behavior: auto !important;
    scroll-margin-top: 0 !important;
    scroll-padding-top: 0 !important;
}

/* Ensure images don't cause page jump */
.verification-gallery img {
    scroll-margin-top: 0 !important;
    scroll-padding-top: 0 !important;
}

/* Enhanced Fancybox zoom controls */
.fancybox__toolbar {
    background: rgba(0, 0, 0, 0.8) !important;
    border-radius: 8px !important;
    padding: 8px !important;
    z-index: 1000000 !important;
}

/* Zoom in button */
.fancybox__button--zoomIn {
    background: rgba(255, 255, 255, 0.1) !important;
    border: 1px solid rgba(255, 255, 255, 0.3) !important;
    border-radius: 6px !important;
    color: white !important;
    font-size: 16px !important;
    width: 40px !important;
    height: 40px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    transition: all 0.2s ease !important;
    cursor: pointer !important;
}

.fancybox__button--zoomIn:hover {
    background: rgba(255, 255, 255, 0.2) !important;
    border-color: rgba(255, 255, 255, 0.5) !important;
    transform: scale(1.05) !important;
}

/* Zoom out button */
.fancybox__button--zoomOut {
    background: rgba(255, 255, 255, 0.1) !important;
    border: 1px solid rgba(255, 255, 255, 0.3) !important;
    border-radius: 6px !important;
    color: white !important;
    font-size: 16px !important;
    width: 40px !important;
    height: 40px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    transition: all 0.2s ease !important;
    cursor: pointer !important;
}

.fancybox__button--zoomOut:hover {
    background: rgba(255, 255, 255, 0.2) !important;
    border-color: rgba(255, 255, 255, 0.5) !important;
    transform: scale(1.05) !important;
}

/* Reset zoom button */
.fancybox__button--resetZoom {
    background: rgba(255, 255, 255, 0.1) !important;
    border: 1px solid rgba(255, 255, 255, 0.3) !important;
    border-radius: 6px !important;
    color: white !important;
    font-size: 14px !important;
    width: 40px !important;
    height: 40px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    transition: all 0.2s ease !important;
    cursor: pointer !important;
}

.fancybox__button--resetZoom:hover {
    background: rgba(255, 255, 255, 0.2) !important;
    border-color: rgba(255, 255, 255, 0.5) !important;
    transform: scale(1.05) !important;
}

/* Close button */
.fancybox__button--close {
    background: rgba(255, 255, 255, 0.1) !important;
    border: 1px solid rgba(255, 255, 255, 0.3) !important;
    border-radius: 6px !important;
    color: white !important;
    font-size: 18px !important;
    width: 40px !important;
    height: 40px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    transition: all 0.2s ease !important;
    cursor: pointer !important;
}

.fancybox__button--close:hover {
    background: rgba(255, 0, 0, 0.3) !important;
    border-color: rgba(255, 0, 0, 0.5) !important;
    transform: scale(1.05) !important;
}
</style>
@endpush

@push('scripts')
<!-- Fancybox JavaScript -->
<script src="https://cdn.jsdelivr.net/npm/@fancyapps/ui@5.0/dist/fancybox/fancybox.umd.js"></script>
<script>
// Simple and reliable Fancybox implementation
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, starting Fancybox setup...');
    
    // Wait for Fancybox to load
    function waitForFancybox() {
        if (typeof Fancybox !== 'undefined') {
            console.log('Fancybox loaded successfully!');
            initializeFancybox();
        } else {
            console.log('Waiting for Fancybox...');
            setTimeout(waitForFancybox, 100);
        }
    }
    
    function initializeFancybox() {
        try {
            console.log('Initializing Fancybox...');
            
            // Enhanced Fancybox configuration with full zoom support
            Fancybox.bind('[data-fancybox="verification-gallery"]', {
                // Basic settings
                groupAll: false,
                
                // Enhanced toolbar with zoom controls
                Toolbar: {
                    display: {
                        left: ['infobar'],
                        middle: ['zoomIn', 'zoomOut', 'resetZoom'],
                        right: ['close']
                    }
                },
                
                // Full zoom functionality
                Images: {
                    zoom: true,
                    wheel: 'zoom',
                    click: 'toggleZoom',
                    wheelSensitivity: 1,
                    zoomFactor: 1.2
                },
                
                // Keyboard shortcuts
                Keyboard: {
                    Escape: 'close',
                    Plus: 'zoomIn',
                    Minus: 'zoomOut',
                    Digit0: 'resetZoom'
                },
                
                // Disable thumbnails/gallery
                Thumbs: {
                    showOnStart: false
                },
                
                // Disable navigation arrows
                Navigation: {
                    showOnStart: false
                },
                
                // Animation settings
                Animation: {
                    zoom: {
                        duration: 300
                    }
                },
                
                // Events to prevent page scrolling
                on: {
                    init: function() {
                        // Keep page at top when Fancybox opens
                        window.scrollTo(0, 0);
                        document.documentElement.scrollTop = 0;
                        document.body.scrollTop = 0;
                    },
                    show: function() {
                        // Keep page at top when image shows
                        window.scrollTo(0, 0);
                        document.documentElement.scrollTop = 0;
                        document.body.scrollTop = 0;
                    }
                }
            });
            
            console.log('Fancybox initialized successfully!');
            
            // Add test button
            addTestButton();
            
            // Test if images are clickable
            testImageClicks();
            
        } catch (error) {
            console.error('Fancybox initialization error:', error);
        }
    }
    
    function testImageClicks() {
        const images = document.querySelectorAll('[data-fancybox="verification-gallery"]');
        console.log('Found', images.length, 'gallery images');
        
        images.forEach((img, index) => {
            console.log(`Image ${index + 1}:`, img.href);
            
            // Add click event listener for debugging
            img.addEventListener('click', function(e) {
                console.log('Image clicked:', this.href);
                console.log('Fancybox should open now...');
            });
        });
    }
    
    function addTestButton() {
        const testButton = document.createElement('button');
        testButton.textContent = 'Test Image Popup';
        testButton.className = 'test-fancybox-btn';
        testButton.onclick = function() {
            console.log('Testing Fancybox...');
            const images = document.querySelectorAll('[data-fancybox="verification-gallery"]');
            if (images.length > 0) {
                console.log('Opening first image...');
                Fancybox.show([images[0]]);
            } else {
                alert('No images found!');
            }
        };
        
        const container = document.querySelector('.verification-gallery');
        if (container) {
            container.parentNode.insertBefore(testButton, container);
        }
    }
    
    // Fallback modal in case Fancybox doesn't work
    function createSimpleModal() {
        const modal = document.createElement('div');
        modal.id = 'simple-image-modal';
        modal.style.cssText = `
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.9);
            z-index: 999999;
            cursor: pointer;
        `;
        
        const img = document.createElement('img');
        img.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            max-width: 90%;
            max-height: 90%;
            object-fit: contain;
            cursor: default;
        `;
        
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '×';
        closeBtn.style.cssText = `
            position: absolute;
            top: 20px;
            right: 30px;
            background: none;
            border: none;
            color: white;
            font-size: 40px;
            cursor: pointer;
            z-index: 1000000;
        `;
        
        modal.appendChild(img);
        modal.appendChild(closeBtn);
        document.body.appendChild(modal);
        
        // Close modal
        modal.onclick = function(e) {
            if (e.target === modal || e.target === closeBtn) {
                modal.style.display = 'none';
            }
        };
        
        return { modal, img };
    }
    
    // Add fallback click handlers
    function addFallbackHandlers() {
        const { modal, img } = createSimpleModal();
        
        document.querySelectorAll('[data-fancybox="verification-gallery"]').forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('Fallback modal triggered for:', this.href);
                img.src = this.href;
                modal.style.display = 'block';
            });
        });
    }
    
    // Start the process
    waitForFancybox();
    
    // Add fallback after a delay
    setTimeout(() => {
        console.log('Adding fallback handlers...');
        addFallbackHandlers();
    }, 3000);
    
    // Remove extra spacing dynamically
    function removeExtraSpacing() {
        // Remove padding from main element
        const main = document.querySelector('main');
        if (main) {
            main.style.padding = '0';
            main.style.margin = '0';
            main.style.minHeight = 'auto';
            main.style.height = 'auto';
        }
        
        // Remove padding from fade-in-up div
        const fadeInUp = document.querySelector('.fade-in-up');
        if (fadeInUp) {
            fadeInUp.style.padding = '0';
            fadeInUp.style.margin = '0';
            fadeInUp.style.minHeight = 'auto';
            fadeInUp.style.height = 'auto';
        }
        
        // Remove any extra spacing from body
        document.body.style.margin = '0';
        document.body.style.padding = '0';
        document.body.style.minHeight = 'auto';
        document.body.style.height = 'auto';
        
        // Remove any extra spacing from html
        document.documentElement.style.margin = '0';
        document.documentElement.style.padding = '0';
        document.documentElement.style.minHeight = 'auto';
        document.documentElement.style.height = 'auto';
        
        console.log('Extra spacing removed dynamically');
    }
    
    // Prevent automatic scrolling
    function preventAutoScroll() {
        // Keep page at top
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
        
        // Prevent any hash scrolling
        if (window.location.hash) {
            window.location.hash = '';
        }
        
        // Disable smooth scrolling
        document.documentElement.style.scrollBehavior = 'auto';
        document.body.style.scrollBehavior = 'auto';
        
        console.log('Auto scroll prevented');
    }
    
    // Run immediately and after a delay
    removeExtraSpacing();
    preventAutoScroll();
    setTimeout(removeExtraSpacing, 100);
    setTimeout(preventAutoScroll, 100);
    setTimeout(removeExtraSpacing, 500);
    setTimeout(preventAutoScroll, 500);
    
    // Prevent scrolling on hash change
    window.addEventListener('hashchange', function(e) {
        e.preventDefault();
        window.scrollTo(0, 0);
    });
    
    // Prevent scrolling on page load
    window.addEventListener('load', function() {
        window.scrollTo(0, 0);
    });
    
    // Prevent scrolling when images are clicked
    function preventImageScroll() {
        const imageLinks = document.querySelectorAll('[data-fancybox="verification-gallery"]');
        imageLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                // Prevent default scroll behavior
                e.preventDefault();
                
                // Keep page at top
                window.scrollTo(0, 0);
                document.documentElement.scrollTop = 0;
                document.body.scrollTop = 0;
                
                console.log('Image click - preventing scroll');
            });
        });
    }
    
    // Run image scroll prevention
    preventImageScroll();
    setTimeout(preventImageScroll, 100);
    setTimeout(preventImageScroll, 500);
});
</script>
@endpush

@section('content')
<div class="space-y-2 main-content" style="min-height: auto; padding-bottom: 0;">
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
                            <a href="https://www.google.com/maps?q={{ $verification->selfie_latitude }},{{ $verification->selfie_longitude }}" 
                               target="_blank" 
                               class="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-900">
                                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                                </svg>
                                View on Google Maps
                            </a>
                        </div>
                    </div>
                @else
                    <p class="text-sm text-gray-500">No location information available</p>
                @endif
            </div>
        </div>
    </div>

    <!-- Verification Documents -->
    <div class="bg-white shadow rounded-lg">
        <div class="px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-medium text-gray-900">Verification Documents</h3>
            <p class="mt-1 text-sm text-gray-600">Review the submitted documents for verification</p>
        </div>
        <div class="px-6 py-1">
            @if($verification->front_id_image || $verification->back_id_image || $verification->selfie_image)
                <!-- Image Gallery Instructions -->
                <div class="mb-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                    <div class="flex items-center">
                        <svg class="w-4 h-4 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <p class="text-xs text-blue-800">
                            <strong>Click on any image to view it in full size.</strong> Each image opens individually with zoom controls. Use mouse wheel or +/- keys to zoom.
                        </p>
                    </div>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 verification-gallery">
                    <!-- Front ID -->
                    <div class="text-center">
                        <h4 class="text-sm font-medium text-gray-900 mb-1">Front ID</h4>
                        @if($verification->front_id_image)
                            <a href="{{ asset('storage/' . $verification->front_id_image) }}" 
                               class="relative group cursor-pointer hover:scale-105 transition-transform duration-200 block" 
                               data-fancybox="verification-gallery" 
                               data-caption="Front ID - Click to view full size"
                               title="Click to view full size">
                                <img src="{{ asset('storage/' . $verification->front_id_image) }}" 
                                     alt="Front ID" 
                                     class="w-full h-48 object-cover rounded-lg border-2 border-gray-300 hover:border-blue-500 hover:shadow-xl transition-all duration-200">
                                <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                                    <svg class="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"></path>
                                    </svg>
                                </div>
                                <div class="absolute bottom-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                    Click to enlarge
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
                        <h4 class="text-sm font-medium text-gray-900 mb-1">Back ID</h4>
                        @if($verification->back_id_image)
                            <a href="{{ asset('storage/' . $verification->back_id_image) }}" 
                               class="relative group cursor-pointer hover:scale-105 transition-transform duration-200 block" 
                               data-fancybox="verification-gallery" 
                               data-caption="Back ID - Click to view full size"
                               title="Click to view full size">
                                <img src="{{ asset('storage/' . $verification->back_id_image) }}" 
                                     alt="Back ID" 
                                     class="w-full h-48 object-cover rounded-lg border-2 border-gray-300 hover:border-blue-500 hover:shadow-xl transition-all duration-200">
                                <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                                    <svg class="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"></path>
                                    </svg>
                                </div>
                                <div class="absolute bottom-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                    Click to enlarge
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
                        <h4 class="text-sm font-medium text-gray-900 mb-1">Selfie</h4>
                        @if($verification->selfie_image)
                            <a href="{{ asset('storage/' . $verification->selfie_image) }}" 
                               class="relative group cursor-pointer hover:scale-105 transition-transform duration-200 block" 
                               data-fancybox="verification-gallery" 
                               data-caption="Selfie - Click to view full size"
                               title="Click to view full size">
                                <img src="{{ asset('storage/' . $verification->selfie_image) }}" 
                                     alt="Selfie" 
                                     class="w-full h-48 object-cover rounded-lg border-2 border-gray-300 hover:border-blue-500 hover:shadow-xl transition-all duration-200">
                                <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                                    <svg class="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"></path>
                                    </svg>
                                </div>
                                <div class="absolute bottom-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                    Click to enlarge
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
                <div class="text-center py-8">
                    <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    <h3 class="mt-2 text-sm font-medium text-gray-900">No Documents</h3>
                    <p class="mt-1 text-sm text-gray-500">
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

    <!-- Action Buttons -->
    <div class="flex justify-between items-center mt-2" style="margin-bottom: 0; padding-bottom: 0;">
        <div class="flex space-x-3">
            <button type="button" 
                    onclick="showApprovalModal()"
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

<!-- Approval Modal -->
<div id="approvalModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full hidden z-50">
    <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div class="mt-3">
            <div class="flex items-center justify-center w-12 h-12 mx-auto bg-green-100 rounded-full">
                <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
            </div>
            <div class="mt-2 px-7 py-3">
                <h3 class="text-lg font-medium text-gray-900 text-center">Approve Verification</h3>
                <div class="mt-4 space-y-4">
                    <div class="flex items-center justify-between">
                        <label class="text-sm font-medium text-gray-700">Documents Clear:</label>
                        <select id="documents_clear" class="border border-gray-300 rounded-md px-3 py-1 text-sm">
                            <option value="yes">Yes</option>
                            <option value="no">No</option>
                        </select>
                    </div>
                    <div class="flex items-center justify-between">
                        <label class="text-sm font-medium text-gray-700">Face Match Verified:</label>
                        <select id="face_match_verified" class="border border-gray-300 rounded-md px-3 py-1 text-sm">
                            <option value="yes">Yes</option>
                            <option value="no">No</option>
                        </select>
                    </div>
                    <div class="flex items-center justify-between">
                        <label class="text-sm font-medium text-gray-700">Address Match Verified:</label>
                        <select id="address_match_verified" class="border border-gray-300 rounded-md px-3 py-1 text-sm">
                            <option value="yes">Yes</option>
                            <option value="no">No</option>
                        </select>
                    </div>
                </div>
            </div>
            <div class="items-center px-4 py-3">
                <div class="flex space-x-3">
                    <button onclick="approveVerification()" 
                            class="px-4 py-2 bg-green-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-300">
                        Approve Verification
                    </button>
                    <button onclick="closeApprovalModal()" 
                            class="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    </div>
</div>
</div>

<script>
// Enhanced verification functions with criteria modal
function showApprovalModal() {
    document.getElementById('approvalModal').classList.remove('hidden');
}

function closeApprovalModal() {
    document.getElementById('approvalModal').classList.add('hidden');
}

function approveVerification() {
    // Get values from modal
    const documentsClear = document.getElementById('documents_clear').value;
    const faceMatchVerified = document.getElementById('face_match_verified').value;
    const addressMatchVerified = document.getElementById('address_match_verified').value;
    
    // Validate that all criteria are set to "Yes"
    if (documentsClear !== 'yes' || faceMatchVerified !== 'yes' || addressMatchVerified !== 'yes') {
        alert('All criteria (Documents Clear, Face Match Verified, Address Match Verified) must be set to "Yes" to approve verification.');
        return;
    }
    
    if (confirm('Are you sure you want to approve this verification with the selected criteria?')) {
        // Close modal first
        closeApprovalModal();
        
        // Show loading message
        alert('Processing verification approval...');
        
        // Create form data for AJAX request
        const formData = new FormData();
        formData.append('_token', '{{ csrf_token() }}');
        formData.append('documents_clear', documentsClear);
        formData.append('face_match_verified', faceMatchVerified);
        formData.append('address_match_verified', addressMatchVerified);
        
        console.log('Sending approval request with data:', {
            documents_clear: documentsClear,
            face_match_verified: faceMatchVerified,
            address_match_verified: addressMatchVerified
        });
        
        // Send AJAX request using XMLHttpRequest for better control
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '{{ route("admin.verifications.approve", $verification->id) }}', true);
        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        xhr.setRequestHeader('Accept', 'application/json');
        
        xhr.onreadystatechange = function() {
            console.log('XHR readyState:', xhr.readyState, 'Status:', xhr.status);
            if (xhr.readyState === 4) {
                console.log('Response received:', xhr.responseText);
                if (xhr.status === 200) {
                    try {
                        const data = JSON.parse(xhr.responseText);
                        console.log('Parsed response data:', data);
                        if (data.success) {
                            alert('ID verification approved successfully.');
                            // Reload the page to show updated status
                            window.location.reload();
                        } else {
                            alert('Error: ' + data.message);
                        }
                    } catch (e) {
                        console.error('Error parsing response:', e);
                        console.error('Raw response:', xhr.responseText);
                        alert('An error occurred while processing the response. Raw response: ' + xhr.responseText);
                    }
                } else {
                    console.error('HTTP error:', xhr.status, xhr.statusText);
                    console.error('Response text:', xhr.responseText);
                    alert('HTTP Error ' + xhr.status + ': ' + xhr.statusText + '\nResponse: ' + xhr.responseText);
                }
            }
        };
        
        xhr.onerror = function() {
            console.error('Network error occurred');
            alert('A network error occurred. Please check your connection and try again.');
        };
        
        xhr.ontimeout = function() {
            console.error('Request timeout');
            alert('Request timed out. Please try again.');
        };
        
        // Set timeout to 30 seconds
        xhr.timeout = 30000;
        
        xhr.send(formData);
    }
}

// Close modal when clicking outside
document.addEventListener('click', function(event) {
    const modal = document.getElementById('approvalModal');
    if (event.target === modal) {
        closeApprovalModal();
    }
});

// Close modal with Escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeApprovalModal();
    }
});

function rejectVerification() {
    const reason = prompt('Please provide a reason for rejection:');
    if (reason && reason.trim() !== '') {
        if (confirm('Are you sure you want to reject this verification?')) {
            // Simple form submission
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = '{{ route("admin.verifications.reject", $verification->id) }}';
            
            const csrfToken = document.createElement('input');
            csrfToken.type = 'hidden';
            csrfToken.name = '_token';
            csrfToken.value = '{{ csrf_token() }}';
            form.appendChild(csrfToken);
            
            const reasonInput = document.createElement('input');
            reasonInput.type = 'hidden';
            reasonInput.name = 'reason';
            reasonInput.value = reason;
            form.appendChild(reasonInput);
            
            const categoryInput = document.createElement('input');
            categoryInput.type = 'hidden';
            categoryInput.name = 'rejection_category';
            categoryInput.value = 'other';
            form.appendChild(categoryInput);
            
            const resubmitInput = document.createElement('input');
            resubmitInput.type = 'hidden';
            resubmitInput.name = 'allow_resubmission';
            resubmitInput.value = '1';
            form.appendChild(resubmitInput);
            
            document.body.appendChild(form);
            form.submit();
        }
    }
}
</script>

@endsection

