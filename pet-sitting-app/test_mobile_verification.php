<?php
/**
 * Test script to simulate mobile app verification submission
 */

require_once 'vendor/autoload.php';

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Verification;
use App\Models\User;
use Illuminate\Support\Facades\Storage;

echo "=== Mobile App Verification Test ===\n\n";

// Get a test user
$user = User::first();
if (!$user) {
    echo "❌ No users found in database\n";
    exit(1);
}

echo "👤 Testing with user: " . $user->name . " (ID: " . $user->id . ")\n\n";

// Create a sample base64 image (1x1 pixel PNG)
$sampleBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

// Simulate mobile app payload
$payload = [
    'document_type' => 'ph_national_id',
    'document_image' => $sampleBase64,
    'first_name' => $user->name,
    'last_name' => 'Test',
    'phone' => '+639123456789',
    'front_image' => $sampleBase64,
    'back_image' => $sampleBase64,
    'selfie_image' => $sampleBase64,
    'selfie_latitude' => 14.5995,
    'selfie_longitude' => 120.9842,
    'selfie_address' => 'Manila, Philippines',
    'location_accuracy' => 3.5,
];

echo "📱 Simulating mobile app submission with:\n";
echo "   Document Type: " . $payload['document_type'] . "\n";
echo "   Images: Front, Back, Selfie, Document\n";
echo "   Location: " . $payload['selfie_address'] . "\n";
echo "   Coordinates: " . $payload['selfie_latitude'] . ", " . $payload['selfie_longitude'] . "\n";
echo "   Accuracy: " . $payload['location_accuracy'] . " meters\n\n";

// Clear any existing verifications for this user
Verification::where('user_id', $user->id)->delete();
echo "🧹 Cleared existing verifications for user\n";

// Simulate the API call by calling the controller method directly
$controller = new \App\Http\Controllers\API\VerificationController(new \App\Services\VeriffService());

// Create a mock request
$request = new \Illuminate\Http\Request();
$request->merge($payload);
$request->setUserResolver(function () use ($user) {
    return $user;
});

// Add authentication headers
$request->headers->set('Authorization', 'Bearer test-token');

echo "🚀 Calling submitVerificationSimple API...\n";

try {
    $response = $controller->submitVerificationSimple($request);
    $responseData = $response->getData(true);
    
    if ($responseData['success']) {
        echo "✅ API call successful!\n";
        echo "   Verification ID: " . $responseData['verification']['id'] . "\n";
        echo "   Status: " . $responseData['verification']['status'] . "\n";
        echo "   Images saved: " . json_encode($responseData['verification']['has_images']) . "\n";
        echo "   Location saved: " . ($responseData['verification']['has_location'] ? 'Yes' : 'No') . "\n";
        
        // Verify the data was saved to database
        $verification = Verification::find($responseData['verification']['id']);
        if ($verification) {
            echo "\n📊 Database verification:\n";
            echo "   Front ID: " . ($verification->front_id_image ?? 'NULL') . "\n";
            echo "   Back ID: " . ($verification->back_id_image ?? 'NULL') . "\n";
            echo "   Selfie: " . ($verification->selfie_image ?? 'NULL') . "\n";
            echo "   Document: " . ($verification->document_image ?? 'NULL') . "\n";
            echo "   Location: " . ($verification->selfie_address ?? 'NULL') . "\n";
            echo "   Coordinates: " . $verification->selfie_latitude . ", " . $verification->selfie_longitude . "\n";
            echo "   Accuracy: " . $verification->location_accuracy . " meters\n";
            
            // Check if files exist
            echo "\n📁 File existence check:\n";
            $frontPath = storage_path('app/public/' . $verification->front_id_image);
            $backPath = storage_path('app/public/' . $verification->back_id_image);
            $selfiePath = storage_path('app/public/' . $verification->selfie_image);
            $docPath = storage_path('app/public/' . $verification->document_image);
            
            echo "   Front ID file exists: " . (file_exists($frontPath) ? '✅ YES' : '❌ NO') . "\n";
            echo "   Back ID file exists: " . (file_exists($backPath) ? '✅ YES' : '❌ NO') . "\n";
            echo "   Selfie file exists: " . (file_exists($selfiePath) ? '✅ YES' : '❌ NO') . "\n";
            echo "   Document file exists: " . (file_exists($docPath) ? '✅ YES' : '❌ NO') . "\n";
            
            echo "\n🌐 Admin panel URLs:\n";
            echo "   Enhanced view: http://172.20.10.2:8000/admin/verifications/" . $verification->id . "\n";
            echo "   Should show: Images + Location + Accuracy data\n";
        }
    } else {
        echo "❌ API call failed: " . $responseData['message'] . "\n";
    }
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Stack trace: " . $e->getTraceAsString() . "\n";
}

echo "\n=== Test Complete ===\n";
?>
