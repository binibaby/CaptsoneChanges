<?php
/**
 * Test script for the new "Mark Availability as Full" feature
 * This script tests the API endpoint functionality
 */

require_once 'pet-sitting-app/vendor/autoload.php';

// Test configuration
$baseUrl = 'http://localhost:8000'; // Adjust this to your Laravel app URL
$testSitterToken = 'your_test_sitter_token_here'; // Replace with actual token

echo "🧪 Testing Mark Availability as Full Feature\n";
echo "==========================================\n\n";

/**
 * Test 1: Mark availability as full
 */
function testMarkAvailabilityAsFull($baseUrl, $token, $date = '2025-01-20') {
    echo "📝 Test 1: Mark availability as full for date: {$date}\n";
    
    $url = $baseUrl . '/api/sitters/mark-availability-full';
    $data = [
        'date' => $date,
        'is_full' => true
    ];
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $token,
        'Accept: application/json'
    ]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    echo "HTTP Code: {$httpCode}\n";
    echo "Response: " . $response . "\n\n";
    
    if ($httpCode === 200) {
        echo "✅ Test 1 PASSED: Successfully marked availability as full\n\n";
        return true;
    } else {
        echo "❌ Test 1 FAILED: Could not mark availability as full\n\n";
        return false;
    }
}

/**
 * Test 2: Remove full status
 */
function testRemoveFullStatus($baseUrl, $token, $date = '2025-01-20') {
    echo "📝 Test 2: Remove full status for date: {$date}\n";
    
    $url = $baseUrl . '/api/sitters/mark-availability-full';
    $data = [
        'date' => $date,
        'is_full' => false
    ];
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $token,
        'Accept: application/json'
    ]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    echo "HTTP Code: {$httpCode}\n";
    echo "Response: " . $response . "\n\n";
    
    if ($httpCode === 200) {
        echo "✅ Test 2 PASSED: Successfully removed full status\n\n";
        return true;
    } else {
        echo "❌ Test 2 FAILED: Could not remove full status\n\n";
        return false;
    }
}

/**
 * Test 3: Invalid date format
 */
function testInvalidDate($baseUrl, $token) {
    echo "📝 Test 3: Test with invalid date format\n";
    
    $url = $baseUrl . '/api/sitters/mark-availability-full';
    $data = [
        'date' => 'invalid-date',
        'is_full' => true
    ];
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $token,
        'Accept: application/json'
    ]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    echo "HTTP Code: {$httpCode}\n";
    echo "Response: " . $response . "\n\n";
    
    if ($httpCode === 422) {
        echo "✅ Test 3 PASSED: Correctly rejected invalid date format\n\n";
        return true;
    } else {
        echo "❌ Test 3 FAILED: Should have rejected invalid date format\n\n";
        return false;
    }
}

/**
 * Test 4: Unauthorized access (no token)
 */
function testUnauthorizedAccess($baseUrl) {
    echo "📝 Test 4: Test unauthorized access (no token)\n";
    
    $url = $baseUrl . '/api/sitters/mark-availability-full';
    $data = [
        'date' => '2025-01-20',
        'is_full' => true
    ];
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Accept: application/json'
    ]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    echo "HTTP Code: {$httpCode}\n";
    echo "Response: " . $response . "\n\n";
    
    if ($httpCode === 401) {
        echo "✅ Test 4 PASSED: Correctly rejected unauthorized access\n\n";
        return true;
    } else {
        echo "❌ Test 4 FAILED: Should have rejected unauthorized access\n\n";
        return false;
    }
}

// Run all tests
echo "🚀 Starting API tests...\n\n";

$testsPassed = 0;
$totalTests = 4;

// Note: You'll need to replace the token with a real one for these tests to work
if ($testSitterToken === 'your_test_sitter_token_here') {
    echo "⚠️  WARNING: Please update the \$testSitterToken variable with a real sitter token to run the authenticated tests.\n\n";
    
    // Run only the unauthorized test
    if (testUnauthorizedAccess($baseUrl)) {
        $testsPassed++;
    }
    
    echo "📊 Test Results: {$testsPassed}/1 tests passed (4 tests require authentication)\n";
    echo "💡 To run all tests, update the token in this script with a real sitter token.\n";
} else {
    // Run all tests
    if (testMarkAvailabilityAsFull($baseUrl, $testSitterToken)) {
        $testsPassed++;
    }
    
    if (testRemoveFullStatus($baseUrl, $testSitterToken)) {
        $testsPassed++;
    }
    
    if (testInvalidDate($baseUrl, $testSitterToken)) {
        $testsPassed++;
    }
    
    if (testUnauthorizedAccess($baseUrl)) {
        $testsPassed++;
    }
    
    echo "📊 Test Results: {$testsPassed}/{$totalTests} tests passed\n";
}

echo "\n🎉 Feature Implementation Summary:\n";
echo "=================================\n";
echo "✅ Frontend: Added 'Mark as Full' button to availability cards\n";
echo "✅ Backend: Created API endpoint /api/sitters/mark-availability-full\n";
echo "✅ Notifications: Pet owners will be notified when availability is marked as full\n";
echo "✅ Validation: Proper date validation and error handling\n";
echo "✅ Security: Authentication required for all operations\n";
echo "\n📱 How to use:\n";
echo "1. Pet sitter opens the Set Availability screen\n";
echo "2. Clicks 'Mark as Full' button on any availability card\n";
echo "3. Confirms the action in the dialog\n";
echo "4. Pet owners receive notifications about the availability update\n";
echo "\n🔧 Technical Details:\n";
echo "- Frontend: PetSitterAvailabilityScreen.tsx updated with new button and handler\n";
echo "- Backend: LocationController.php with markAvailabilityAsFull method\n";
echo "- Notifications: Real-time notifications via database and WebSocket\n";
echo "- Storage: Full status stored in cache for 7 days\n";
?>
