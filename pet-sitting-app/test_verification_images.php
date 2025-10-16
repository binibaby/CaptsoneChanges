<?php
/**
 * Test script to verify verification image display functionality
 */

require_once 'vendor/autoload.php';

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Verification;

echo "=== Verification Image Display Test ===\n\n";

// Test verification with images
$verificationWithImages = Verification::find(104);
if ($verificationWithImages) {
    echo "✅ Verification ID 104 (with images):\n";
    echo "   User: " . $verificationWithImages->user->name . "\n";
    echo "   Front ID: " . ($verificationWithImages->front_id_image ?? 'NULL') . "\n";
    echo "   Back ID: " . ($verificationWithImages->back_id_image ?? 'NULL') . "\n";
    echo "   Selfie: " . ($verificationWithImages->selfie_image ?? 'NULL') . "\n";
    echo "   Document Image: " . ($verificationWithImages->document_image ?? 'NULL') . "\n";
    
    // Check if images exist in storage
    $frontImagePath = storage_path('app/public/' . $verificationWithImages->front_id_image);
    $backImagePath = storage_path('app/public/' . $verificationWithImages->back_id_image);
    $selfieImagePath = storage_path('app/public/' . $verificationWithImages->selfie_image);
    $docImagePath = storage_path('app/public/' . $verificationWithImages->document_image);
    
    echo "\n   File existence check:\n";
    echo "   Front ID file exists: " . (file_exists($frontImagePath) ? '✅ YES' : '❌ NO') . "\n";
    echo "   Back ID file exists: " . (file_exists($backImagePath) ? '✅ YES' : '❌ NO') . "\n";
    echo "   Selfie file exists: " . (file_exists($selfieImagePath) ? '✅ YES' : '❌ NO') . "\n";
    echo "   Document file exists: " . (file_exists($docImagePath) ? '✅ YES' : '❌ NO') . "\n";
    
    // Check public storage link
    $publicFrontPath = public_path('storage/' . $verificationWithImages->front_id_image);
    echo "\n   Public storage check:\n";
    echo "   Public front ID file exists: " . (file_exists($publicFrontPath) ? '✅ YES' : '❌ NO') . "\n";
    
    // Generate URLs
    echo "\n   Generated URLs:\n";
    echo "   Front ID URL: " . asset('storage/' . $verificationWithImages->front_id_image) . "\n";
    echo "   Back ID URL: " . asset('storage/' . $verificationWithImages->back_id_image) . "\n";
    echo "   Selfie URL: " . asset('storage/' . $verificationWithImages->selfie_image) . "\n";
    echo "   Document URL: " . asset('storage/' . $verificationWithImages->document_image) . "\n";
} else {
    echo "❌ Verification ID 103 not found\n";
}

echo "\n";

// Test verification without images (original issue)
$verificationWithoutImages = Verification::find(78);
if ($verificationWithoutImages) {
    echo "ℹ️  Verification ID 78 (without images - original issue):\n";
    echo "   User: " . $verificationWithoutImages->user->name . "\n";
    echo "   Front ID: " . ($verificationWithoutImages->front_id_image ?? 'NULL') . "\n";
    echo "   Back ID: " . ($verificationWithoutImages->back_id_image ?? 'NULL') . "\n";
    echo "   Selfie: " . ($verificationWithoutImages->selfie_image ?? 'NULL') . "\n";
    echo "   Document Image: " . ($verificationWithoutImages->document_image ?? 'NULL') . "\n";
    echo "   → This correctly shows 'No Verification Documents Submitted'\n";
} else {
    echo "❌ Verification ID 78 not found\n";
}

echo "\n=== Test Complete ===\n";
echo "To test the admin panel:\n";
echo "1. Visit: http://172.20.10.2:8000/admin/verifications/104 (should show images and location)\n";
echo "2. Visit: http://172.20.10.2:8000/admin/verifications/78 (should show 'No Documents' message)\n";
?>
