<?php
/**
 * Test script to verify admin panel works without database errors
 */

require_once 'vendor/autoload.php';

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Verification;

echo "=== Admin Panel Test ===\n\n";

// Test verification with images
$verification = Verification::with('user')->find(105);
if ($verification) {
    echo "✅ Verification ID 105 found:\n";
    echo "   User: " . $verification->user->name . "\n";
    echo "   Status: " . $verification->verification_status . "\n";
    echo "   Document Type: " . $verification->document_type . "\n";
    echo "   Created: " . $verification->created_at . "\n\n";
    
    echo "📸 Images:\n";
    echo "   Front ID: " . ($verification->front_id_image ? '✅ ' . $verification->front_id_image : '❌ NULL') . "\n";
    echo "   Back ID: " . ($verification->back_id_image ? '✅ ' . $verification->back_id_image : '❌ NULL') . "\n";
    echo "   Selfie: " . ($verification->selfie_image ? '✅ ' . $verification->selfie_image : '❌ NULL') . "\n";
    echo "   Document: " . ($verification->document_image ? '✅ ' . $verification->document_image : '❌ NULL') . "\n\n";
    
    echo "📍 Location:\n";
    echo "   Address: " . ($verification->selfie_address ?: 'NULL') . "\n";
    echo "   Coordinates: " . $verification->selfie_latitude . ", " . $verification->selfie_longitude . "\n";
    echo "   Accuracy: " . $verification->location_accuracy . " meters\n";
    echo "   Verified: " . ($verification->location_verified ? 'Yes' : 'No') . "\n\n";
    
    // Test computed properties (should not cause database errors)
    $minutesAgo = $verification->created_at->diffInMinutes(now());
    echo "⏰ Time Info:\n";
    echo "   Minutes ago: " . $minutesAgo . "\n";
    echo "   Is urgent (>1h): " . ($minutesAgo > 60 ? 'Yes' : 'No') . "\n";
    echo "   Is critical (>24h): " . ($minutesAgo > 1440 ? 'Yes' : 'No') . "\n\n";
    
    // Test file existence
    echo "📁 File Existence:\n";
    $frontPath = storage_path('app/public/' . $verification->front_id_image);
    $backPath = storage_path('app/public/' . $verification->back_id_image);
    $selfiePath = storage_path('app/public/' . $verification->selfie_image);
    $docPath = storage_path('app/public/' . $verification->document_image);
    
    echo "   Front ID exists: " . (file_exists($frontPath) ? '✅ YES' : '❌ NO') . "\n";
    echo "   Back ID exists: " . (file_exists($backPath) ? '✅ YES' : '❌ NO') . "\n";
    echo "   Selfie exists: " . (file_exists($selfiePath) ? '✅ YES' : '❌ NO') . "\n";
    echo "   Document exists: " . (file_exists($docPath) ? '✅ YES' : '❌ NO') . "\n\n";
    
    // Test URLs
    echo "🌐 Generated URLs:\n";
    echo "   Front ID: " . asset('storage/' . $verification->front_id_image) . "\n";
    echo "   Back ID: " . asset('storage/' . $verification->back_id_image) . "\n";
    echo "   Selfie: " . asset('storage/' . $verification->selfie_image) . "\n";
    echo "   Document: " . asset('storage/' . $verification->document_image) . "\n\n";
    
    echo "🎯 Admin Panel URL: http://0.0.0.0:8000/admin/verifications/105\n";
    echo "   Should display: All 4 images + location data + accuracy info\n";
    
} else {
    echo "❌ Verification ID 105 not found\n";
}

echo "\n=== Test Complete ===\n";
?>
