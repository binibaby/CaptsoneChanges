<?php
/**
 * Public Admin Verification View - Shows verification details without authentication
 */

require_once '../vendor/autoload.php';

// Bootstrap Laravel
$app = require_once '../bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Verification;

$verificationId = $_GET['id'] ?? 105;
$verification = Verification::with(['user', 'verifiedBy', 'auditLogs.admin'])->find($verificationId);

if (!$verification) {
    die("Verification ID $verificationId not found");
}

// Calculate time info
$minutesAgo = $verification->created_at->diffInMinutes(now());
$isUrgent = $minutesAgo > 60;
$isCritical = $minutesAgo > 1440;

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Verification View - Pet Sit Connect</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100">
    <div class="min-h-screen">
        <!-- Header -->
        <div class="bg-white shadow">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between items-center py-6">
                    <div class="flex items-center">
                        <h1 class="text-2xl font-bold text-gray-900">Pet Sit Connect - Admin</h1>
                    </div>
                    <div class="flex items-center space-x-4">
                        <a href="?id=105" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">With Images</a>
                        <a href="?id=78" class="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">Without Images</a>
                    </div>
                </div>
            </div>
        </div>

        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div class="space-y-6">
                <!-- Header -->
                <div class="sm:flex sm:items-center sm:justify-between">
                    <div>
                        <h1 class="text-2xl font-bold text-gray-900">Enhanced ID Verification Review</h1>
                        <p class="mt-2 text-sm text-gray-700">Review sitter's identity documents and location verification</p>
                    </div>
                    <div class="mt-4 sm:mt-0">
                        <a href="?id=105" class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
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
                                        <span class="text-lg font-medium text-gray-700"><?= substr($verification->user->name, 0, 2) ?></span>
                                    </div>
                                </div>
                                <div class="ml-4">
                                    <div class="text-lg font-medium text-gray-900"><?= htmlspecialchars($verification->user->name) ?></div>
                                    <div class="text-sm text-gray-500"><?= htmlspecialchars($verification->user->email) ?></div>
                                    <div class="text-sm text-gray-500">Phone: <?= htmlspecialchars($verification->user->phone ?? 'Not provided') ?></div>
                                </div>
                            </div>

                            <div class="border-t pt-4">
                                <dl class="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                                    <div>
                                        <dt class="text-sm font-medium text-gray-500">Document Type</dt>
                                        <dd class="mt-1 text-sm text-gray-900"><?= ucwords(str_replace('_', ' ', $verification->document_type)) ?></dd>
                                    </div>
                                    <div>
                                        <dt class="text-sm font-medium text-gray-500">Submitted</dt>
                                        <dd class="mt-1 text-sm text-gray-900"><?= $verification->created_at->format('M d, Y H:i') ?></dd>
                                    </div>
                                    <div>
                                        <dt class="text-sm font-medium text-gray-500">Review Deadline</dt>
                                        <dd class="mt-1 text-sm text-gray-900">
                                            <?= $verification->review_deadline ? $verification->review_deadline->format('M d, Y H:i') : 'Not set' ?>
                                        </dd>
                                    </div>
                                    <div>
                                        <dt class="text-sm font-medium text-gray-500">Status</dt>
                                        <dd class="mt-1">
                                            <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                                <?= ucwords(str_replace('_', ' ', $verification->verification_status)) ?>
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
                            <?php if ($verification->selfie_address): ?>
                                <div class="space-y-3">
                                    <div>
                                        <dt class="text-sm font-medium text-gray-500">Selfie Location</dt>
                                        <dd class="mt-1 text-sm text-gray-900"><?= htmlspecialchars($verification->selfie_address) ?></dd>
                                    </div>
                                    <div class="grid grid-cols-2 gap-4">
                                        <div>
                                            <dt class="text-sm font-medium text-gray-500">Latitude</dt>
                                            <dd class="mt-1 text-sm text-gray-900"><?= number_format($verification->selfie_latitude, 6) ?></dd>
                                        </div>
                                        <div>
                                            <dt class="text-sm font-medium text-gray-500">Longitude</dt>
                                            <dd class="mt-1 text-sm text-gray-900"><?= number_format($verification->selfie_longitude, 6) ?></dd>
                                        </div>
                                    </div>
                                    <div>
                                        <dt class="text-sm font-medium text-gray-500">Accuracy</dt>
                                        <dd class="mt-1 text-sm text-gray-900"><?= number_format($verification->location_accuracy, 1) ?> meters</dd>
                                    </div>
                                </div>
                            <?php else: ?>
                                <p class="text-sm text-gray-500">No location data available</p>
                            <?php endif; ?>
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
                        <?php if ($verification->front_id_image || $verification->back_id_image || $verification->selfie_image): ?>
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <!-- Front ID -->
                                <div class="text-center">
                                    <h4 class="text-sm font-medium text-gray-900 mb-3">Front ID</h4>
                                    <?php if ($verification->front_id_image): ?>
                                        <div class="relative group">
                                            <img src="<?= asset('storage/' . $verification->front_id_image) ?>" 
                                                 alt="Front ID" 
                                                 class="w-full h-48 object-cover rounded-lg border border-gray-200 cursor-pointer hover:shadow-lg transition-shadow"
                                                 onclick="openImageModal('<?= asset('storage/' . $verification->front_id_image) ?>', 'Front ID')">
                                            <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                                                <svg class="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"></path>
                                                </svg>
                                            </div>
                                        </div>
                                    <?php else: ?>
                                        <div class="w-full h-48 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                                            <span class="text-gray-400">No image</span>
                                        </div>
                                    <?php endif; ?>
                                </div>

                                <!-- Back ID -->
                                <div class="text-center">
                                    <h4 class="text-sm font-medium text-gray-900 mb-3">Back ID</h4>
                                    <?php if ($verification->back_id_image): ?>
                                        <div class="relative group">
                                            <img src="<?= asset('storage/' . $verification->back_id_image) ?>" 
                                                 alt="Back ID" 
                                                 class="w-full h-48 object-cover rounded-lg border border-gray-200 cursor-pointer hover:shadow-lg transition-shadow"
                                                 onclick="openImageModal('<?= asset('storage/' . $verification->back_id_image) ?>', 'Back ID')">
                                            <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                                                <svg class="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"></path>
                                                </svg>
                                            </div>
                                        </div>
                                    <?php else: ?>
                                        <div class="w-full h-48 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                                            <span class="text-gray-400">No image</span>
                                        </div>
                                    <?php endif; ?>
                                </div>

                                <!-- Selfie -->
                                <div class="text-center">
                                    <h4 class="text-sm font-medium text-gray-900 mb-3">Selfie</h4>
                                    <?php if ($verification->selfie_image): ?>
                                        <div class="relative group">
                                            <img src="<?= asset('storage/' . $verification->selfie_image) ?>" 
                                                 alt="Selfie" 
                                                 class="w-full h-48 object-cover rounded-lg border border-gray-200 cursor-pointer hover:shadow-lg transition-shadow"
                                                 onclick="openImageModal('<?= asset('storage/' . $verification->selfie_image) ?>', 'Selfie')">
                                            <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                                                <svg class="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"></path>
                                                </svg>
                                            </div>
                                        </div>
                                    <?php else: ?>
                                        <div class="w-full h-48 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                                            <span class="text-gray-400">No image</span>
                                        </div>
                                    <?php endif; ?>
                                </div>
                            </div>
                        <?php else: ?>
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
                        <?php endif; ?>
                    </div>
                </div>

                <!-- Location Information -->
                <?php if ($verification->selfie_address || $verification->selfie_latitude || $verification->selfie_longitude): ?>
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
                                    <?= $verification->selfie_address ? htmlspecialchars($verification->selfie_address) : '<span class="text-gray-400">No address provided</span>' ?>
                                </p>
                            </div>
                            <div>
                                <h4 class="text-sm font-medium text-gray-900 mb-2">Coordinates</h4>
                                <p class="text-sm text-gray-600">
                                    <?php if ($verification->selfie_latitude && $verification->selfie_longitude): ?>
                                        <span class="font-mono"><?= $verification->selfie_latitude ?>, <?= $verification->selfie_longitude ?></span>
                                        <br>
                                        <a href="https://www.google.com/maps?q=<?= $verification->selfie_latitude ?>,<?= $verification->selfie_longitude ?>" 
                                           target="_blank" 
                                           class="text-indigo-600 hover:text-indigo-900 text-xs">
                                            View on Google Maps
                                        </a>
                                    <?php else: ?>
                                        <span class="text-gray-400">No coordinates provided</span>
                                    <?php endif; ?>
                                </p>
                            </div>
                        </div>
                        
                        <!-- Location Accuracy Information -->
                        <?php if ($verification->location_accuracy): ?>
                        <div class="mt-4 pt-4 border-t border-gray-200">
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <h4 class="text-sm font-medium text-gray-900 mb-2">Location Accuracy</h4>
                                    <p class="text-sm text-gray-600">
                                        <span class="font-mono"><?= number_format($verification->location_accuracy, 1) ?> meters</span>
                                        <?php if ($verification->location_accuracy <= 10): ?>
                                            <span class="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                High Accuracy
                                            </span>
                                        <?php elseif ($verification->location_accuracy <= 50): ?>
                                            <span class="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                Medium Accuracy
                                            </span>
                                        <?php else: ?>
                                            <span class="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                Low Accuracy
                                            </span>
                                        <?php endif; ?>
                                    </p>
                                </div>
                                <div>
                                    <h4 class="text-sm font-medium text-gray-900 mb-2">Capture Time</h4>
                                    <p class="text-sm text-gray-600">
                                        <?= $verification->created_at->format('M d, Y H:i:s') ?>
                                    </p>
                                </div>
                                <div>
                                    <h4 class="text-sm font-medium text-gray-900 mb-2">Location Status</h4>
                                    <p class="text-sm text-gray-600">
                                        <?php if ($verification->location_verified): ?>
                                            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                                                </svg>
                                                Verified
                                            </span>
                                        <?php else: ?>
                                            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                                                </svg>
                                                Pending Review
                                            </span>
                                        <?php endif; ?>
                                    </p>
                                </div>
                            </div>
                        </div>
                        <?php endif; ?>
                    </div>
                </div>
                <?php endif; ?>

                <!-- Action Buttons -->
                <div class="flex justify-between items-center">
                    <div class="flex space-x-3">
                        <button type="button" 
                                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                            Approve & Mark as Legit Sitter
                        </button>
                        
                        <button type="button" 
                                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                            Reject
                        </button>
                    </div>

                    <div class="text-sm text-gray-500">
                        Review deadline: 
                        <?= $verification->review_deadline ? $verification->review_deadline->format('M d, Y H:i') : 'Not set' ?>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Enhanced Image Modal with Zoom -->
    <div id="imageModal" class="fixed inset-0 bg-black bg-opacity-75 overflow-y-auto h-full w-full hidden z-50">
        <div class="relative min-h-screen flex items-center justify-center p-4">
            <div class="relative max-w-6xl max-h-full bg-white rounded-lg shadow-2xl">
                <!-- Modal Header -->
                <div class="flex justify-between items-center p-4 border-b border-gray-200">
                    <h3 id="modalTitle" class="text-xl font-semibold text-gray-900"></h3>
                    <div class="flex items-center space-x-2">
                        <button id="zoomInBtn" onclick="zoomIn()" class="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                            </svg>
                        </button>
                        <button id="zoomOutBtn" onclick="zoomOut()" class="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 12H6"></path>
                            </svg>
                        </button>
                        <button id="resetZoomBtn" onclick="resetZoom()" class="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                            </svg>
                        </button>
                        <button onclick="closeImageModal()" class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                    </div>
                </div>
                
                <!-- Modal Body with Zoomable Image -->
                <div class="p-4 overflow-auto max-h-[80vh]">
                    <div id="imageContainer" class="text-center relative">
                        <img id="modalImage" 
                             src="" 
                             alt="" 
                             class="max-w-full h-auto rounded-lg shadow-lg cursor-zoom-in transition-transform duration-200"
                             style="transform-origin: center;"
                             onclick="toggleZoom()">
                    </div>
                </div>
                
                <!-- Modal Footer -->
                <div class="flex justify-between items-center p-4 border-t border-gray-200 bg-gray-50">
                    <div class="text-sm text-gray-500">
                        <span id="zoomLevel">100%</span> • Click image to zoom • Use buttons to control zoom
                    </div>
                    <div class="flex space-x-2">
                        <button onclick="downloadImage()" class="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700">
                            Download
                        </button>
                        <button onclick="closeImageModal()" class="px-3 py-1 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
    let currentZoom = 1;
    const maxZoom = 5;
    const minZoom = 0.5;
    const zoomStep = 0.25;

    function openImageModal(imageSrc, title) {
        document.getElementById('modalImage').src = imageSrc;
        document.getElementById('modalTitle').textContent = title;
        document.getElementById('imageModal').classList.remove('hidden');
        resetZoom();
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    function closeImageModal() {
        document.getElementById('imageModal').classList.add('hidden');
        document.body.style.overflow = 'auto'; // Restore scrolling
        resetZoom();
    }

    function zoomIn() {
        if (currentZoom < maxZoom) {
            currentZoom += zoomStep;
            updateZoom();
        }
    }

    function zoomOut() {
        if (currentZoom > minZoom) {
            currentZoom -= zoomStep;
            updateZoom();
        }
    }

    function resetZoom() {
        currentZoom = 1;
        updateZoom();
    }

    function toggleZoom() {
        if (currentZoom === 1) {
            currentZoom = 2;
        } else {
            currentZoom = 1;
        }
        updateZoom();
    }

    function updateZoom() {
        const image = document.getElementById('modalImage');
        const zoomLevel = document.getElementById('zoomLevel');
        
        image.style.transform = `scale(${currentZoom})`;
        zoomLevel.textContent = Math.round(currentZoom * 100) + '%';
        
        // Update button states
        document.getElementById('zoomInBtn').disabled = currentZoom >= maxZoom;
        document.getElementById('zoomOutBtn').disabled = currentZoom <= minZoom;
        
        // Update cursor
        if (currentZoom > 1) {
            image.classList.remove('cursor-zoom-in');
            image.classList.add('cursor-zoom-out');
        } else {
            image.classList.remove('cursor-zoom-out');
            image.classList.add('cursor-zoom-in');
        }
    }

    function downloadImage() {
        const image = document.getElementById('modalImage');
        const link = document.createElement('a');
        link.href = image.src;
        link.download = document.getElementById('modalTitle').textContent + '.jpg';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Close modal when clicking outside
    document.getElementById('imageModal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeImageModal();
        }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        if (!document.getElementById('imageModal').classList.contains('hidden')) {
            switch(e.key) {
                case 'Escape':
                    closeImageModal();
                    break;
                case '+':
                case '=':
                    e.preventDefault();
                    zoomIn();
                    break;
                case '-':
                    e.preventDefault();
                    zoomOut();
                    break;
                case '0':
                    e.preventDefault();
                    resetZoom();
                    break;
            }
        }
    });

    // Prevent image drag
    document.addEventListener('dragstart', function(e) {
        if (e.target.tagName === 'IMG') {
            e.preventDefault();
        }
    });
    </script>
</body>
</html>
