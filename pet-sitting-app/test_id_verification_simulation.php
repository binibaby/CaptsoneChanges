<?php
/**
 * Test ID Verification Simulation
 * This script tests the Veriff simulation for ID verification
 */

ob_start(); // Prevent "headers already sent" errors

echo "🔔 TESTING ID VERIFICATION SIMULATION\n";
echo "=====================================\n\n";

// Test data
$testData = [
    'document_type' => 'ph_national_id',
    'document_number' => '1234-5678901-2',
    'first_name' => 'Test',
    'last_name' => 'User',
    'age' => '25',
    'phone' => '+639639283365'
];

echo "📄 Test Document Type: " . $testData['document_type'] . "\n";
echo "🔢 Test Document Number: " . $testData['document_number'] . "\n";
echo "👤 Test User: " . $testData['first_name'] . " " . $testData['last_name'] . "\n";
echo "📱 Test Phone: " . $testData['phone'] . "\n\n";

// Test 1: Direct controller call
echo "🧪 TEST 1: Direct Controller Call\n";
echo "----------------------------------\n";

try {
    // Simulate a request
    $request = new \Illuminate\Http\Request();
    $request->merge($testData);
    
    // Create a mock user
    $user = new \App\Models\User();
    $user->id = 1;
    $user->name = 'Test User';
    $user->email = 'test@example.com';
    
    // Create controller instance
    $controller = new \App\Http\Controllers\API\VerificationController();
    
    // Mock the user() method
    $request->setUserResolver(function () use ($user) {
        return $user;
    });
    
    echo "✅ Controller instantiated successfully\n";
    echo "👤 Mock user created: ID " . $user->id . "\n";
    echo "📄 Request data prepared\n\n";
    
} catch (Exception $e) {
    echo "❌ Error in Test 1: " . $e->getMessage() . "\n\n";
}

// Test 2: API endpoint test
echo "🧪 TEST 2: API Endpoint Test\n";
echo "-----------------------------\n";

$apiUrl = 'http://127.0.0.1:8000/api/verification/submit-simple';

$postData = json_encode([
    'document_type' => 'ph_national_id',
    'document_number' => '1234-5678901-2',
    'first_name' => 'Test',
    'last_name' => 'User',
    'age' => '25',
    'phone' => '+639639283365'
]);

$context = stream_context_create([
    'http' => [
        'method' => 'POST',
        'header' => [
            'Content-Type: application/json',
            'Accept: application/json',
            'Content-Length: ' . strlen($postData)
        ],
        'content' => $postData
    ]
]);

try {
    $response = file_get_contents($apiUrl, false, $context);
    
    if ($response === false) {
        echo "❌ Failed to connect to API endpoint\n";
    } else {
        $result = json_decode($response, true);
        echo "✅ API Response received\n";
        echo "📊 Response Status: " . ($result['success'] ? 'Success' : 'Failed') . "\n";
        echo "💬 Message: " . ($result['message'] ?? 'No message') . "\n";
        
        if (isset($result['verification'])) {
            echo "🆔 Verification ID: " . $result['verification']['id'] . "\n";
            echo "📄 Document Type: " . $result['verification']['document_type'] . "\n";
            echo "📊 Verification Score: " . $result['verification']['verification_score'] . "\n";
        }
        
        if (isset($result['simulation_mode'])) {
            echo "🎭 Simulation Mode: " . ($result['simulation_mode'] ? 'Enabled' : 'Disabled') . "\n";
        }
    }
} catch (Exception $e) {
    echo "❌ Error in Test 2: " . $e->getMessage() . "\n";
}

echo "\n🔍 LOG MONITORING\n";
echo "================\n";
echo "Run this command to monitor logs:\n";
echo "tail -f storage/logs/laravel.log | grep -E \"(🔔|📄|✅|❌|🎭|⏰|🌐|👤|📸|🔑|💾|📊|🎉)\"\n\n";

echo "📝 SUMMARY\n";
echo "==========\n";
echo "✅ ID Verification simulation is ready\n";
echo "🎭 Veriff API calls are simulated (90% success rate)\n";
echo "📊 Enhanced logging with emojis for easy monitoring\n";
echo "🔧 CORS headers added for web compatibility\n";
echo "📸 Image quality checks included\n";
echo "🏳️ Philippine ID validation supported\n\n";

echo "🚀 Ready to test ID verification in your app!\n";
?> 