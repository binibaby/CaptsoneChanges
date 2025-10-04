<?php
/**
 * Test page to verify verification images display without authentication
 */

require_once '../vendor/autoload.php';

// Bootstrap Laravel
$app = require_once '../bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Verification;

$verificationId = $_GET['id'] ?? 105;
$verification = Verification::with('user')->find($verificationId);

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
    <title>Verification Display Test</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100">
    <div class="container mx-auto px-4 py-8">
        <h1 class="text-3xl font-bold mb-6">Verification Display Test</h1>
        
        <!-- Verification Info -->
        <div class="bg-white shadow rounded-lg mb-6">
            <div class="px-6 py-4 border-b border-gray-200">
                <h3 class="text-lg font-medium text-gray-900">Verification Information</h3>
            </div>
            <div class="px-6 py-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <strong>User:</strong> <?= htmlspecialchars($verification->user->name) ?>
                    </div>
                    <div>
                        <strong>Status:</strong> <?= htmlspecialchars($verification->verification_status) ?>
                    </div>
                    <div>
                        <strong>Document Type:</strong> <?= htmlspecialchars($verification->document_type) ?>
                    </div>
                    <div>
                        <strong>Created:</strong> <?= $verification->created_at->format('M d, Y H:i:s') ?>
                    </div>
                </div>
            </div>
        </div>

        <!-- Document Images -->
        <div class="bg-white shadow rounded-lg mb-6">
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
                                         class="w-full h-48 object-cover rounded-lg border border-gray-200">
                                </div>
                                <p class="text-xs text-gray-500 mt-2">File: <?= htmlspecialchars($verification->front_id_image) ?></p>
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
                                         class="w-full h-48 object-cover rounded-lg border border-gray-200">
                                </div>
                                <p class="text-xs text-gray-500 mt-2">File: <?= htmlspecialchars($verification->back_id_image) ?></p>
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
                                         class="w-full h-48 object-cover rounded-lg border border-gray-200">
                                </div>
                                <p class="text-xs text-gray-500 mt-2">File: <?= htmlspecialchars($verification->selfie_image) ?></p>
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
        <div class="bg-white shadow rounded-lg mb-6">
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

        <!-- Debug Information -->
        <div class="bg-gray-800 text-white rounded-lg p-4">
            <h4 class="font-bold mb-2">Debug Information</h4>
            <div class="text-sm space-y-1">
                <div>Verification ID: <?= $verification->id ?></div>
                <div>Minutes ago: <?= $minutesAgo ?></div>
                <div>Is urgent: <?= $isUrgent ? 'Yes' : 'No' ?></div>
                <div>Is critical: <?= $isCritical ? 'Yes' : 'No' ?></div>
                <div>Front ID file: <?= $verification->front_id_image ?: 'NULL' ?></div>
                <div>Back ID file: <?= $verification->back_id_image ?: 'NULL' ?></div>
                <div>Selfie file: <?= $verification->selfie_image ?: 'NULL' ?></div>
                <div>Document file: <?= $verification->document_image ?: 'NULL' ?></div>
            </div>
        </div>
    </div>
</body>
</html>
