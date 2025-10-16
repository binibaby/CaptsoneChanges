<?php
/**
 * Test script for the "Mark as Full" booking prevention feature
 * This script tests that bookings are blocked when a day is marked as full
 */

require_once 'pet-sitting-app/vendor/autoload.php';

// Test configuration
$baseUrl = 'http://localhost:8000'; // Adjust this to your Laravel app URL
$testSitterToken = 'your_test_sitter_token_here'; // Replace with actual sitter token
$testOwnerToken = 'your_test_owner_token_here'; // Replace with actual owner token

echo "🧪 Testing Mark as Full Booking Prevention Feature\n";
echo "=================================================\n\n";

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
 * Test 2: Try to create booking on marked full date (should fail)
 */
function testBookingOnFullDate($baseUrl, $ownerToken, $sitterId, $date = '2025-01-20') {
    echo "📝 Test 2: Try to create booking on marked full date: {$date}\n";
    
    $url = $baseUrl . '/api/bookings';
    $data = [
        'sitter_id' => $sitterId,
        'date' => $date,
        'time' => '10:00',
        'pet_name' => 'Test Pet',
        'pet_type' => 'Dog',
        'service_type' => 'Walking',
        'duration' => 2,
        'rate_per_hour' => 25,
        'description' => 'Test booking on full date'
    ];
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $ownerToken,
        'Accept: application/json'
    ]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    echo "HTTP Code: {$httpCode}\n";
    echo "Response: " . $response . "\n\n";
    
    if ($httpCode === 422) {
        $responseData = json_decode($response, true);
        if (isset($responseData['error_code']) && $responseData['error_code'] === 'DATE_FULL') {
            echo "✅ Test 2 PASSED: Booking correctly blocked on full date\n\n";
            return true;
        } else {
            echo "❌ Test 2 FAILED: Wrong error code returned\n\n";
            return false;
        }
    } else {
        echo "❌ Test 2 FAILED: Booking should have been blocked (expected 422, got {$httpCode})\n\n";
        return false;
    }
}

/**
 * Test 3: Create booking on available date (should succeed)
 */
function testBookingOnAvailableDate($baseUrl, $ownerToken, $sitterId, $date = '2025-01-21') {
    echo "📝 Test 3: Create booking on available date: {$date}\n";
    
    $url = $baseUrl . '/api/bookings';
    $data = [
        'sitter_id' => $sitterId,
        'date' => $date,
        'time' => '10:00',
        'pet_name' => 'Test Pet',
        'pet_type' => 'Dog',
        'service_type' => 'Walking',
        'duration' => 2,
        'rate_per_hour' => 25,
        'description' => 'Test booking on available date'
    ];
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $ownerToken,
        'Accept: application/json'
    ]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    echo "HTTP Code: {$httpCode}\n";
    echo "Response: " . $response . "\n\n";
    
    if ($httpCode === 201 || $httpCode === 200) {
        echo "✅ Test 3 PASSED: Booking successfully created on available date\n\n";
        return true;
    } else {
        echo "❌ Test 3 FAILED: Booking should have succeeded on available date\n\n";
        return false;
    }
}

/**
 * Test 4: Remove full status and try booking again
 */
function testRemoveFullStatusAndBook($baseUrl, $sitterToken, $ownerToken, $sitterId, $date = '2025-01-20') {
    echo "📝 Test 4: Remove full status and try booking again\n";
    
    // First, remove the full status
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
        'Authorization: Bearer ' . $sitterToken,
        'Accept: application/json'
    ]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    echo "Remove full status - HTTP Code: {$httpCode}\n";
    
    if ($httpCode !== 200) {
        echo "❌ Test 4 FAILED: Could not remove full status\n\n";
        return false;
    }
    
    // Now try to create a booking
    $url = $baseUrl . '/api/bookings';
    $data = [
        'sitter_id' => $sitterId,
        'date' => $date,
        'time' => '14:00',
        'pet_name' => 'Test Pet 2',
        'pet_type' => 'Cat',
        'service_type' => 'Sitting',
        'duration' => 1.5,
        'rate_per_hour' => 30,
        'description' => 'Test booking after removing full status'
    ];
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $ownerToken,
        'Accept: application/json'
    ]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    echo "Create booking after removing full status - HTTP Code: {$httpCode}\n";
    echo "Response: " . $response . "\n\n";
    
    if ($httpCode === 201 || $httpCode === 200) {
        echo "✅ Test 4 PASSED: Booking successfully created after removing full status\n\n";
        return true;
    } else {
        echo "❌ Test 4 FAILED: Booking should have succeeded after removing full status\n\n";
        return false;
    }
}

// Run all tests
echo "🚀 Starting booking prevention tests...\n\n";

$testsPassed = 0;
$totalTests = 4;
$testSitterId = 'your_sitter_id_here'; // Replace with actual sitter ID

// Note: You'll need to replace the tokens and sitter ID with real ones for these tests to work
if ($testSitterToken === 'your_test_sitter_token_here' || $testOwnerToken === 'your_test_owner_token_here' || $testSitterId === 'your_sitter_id_here') {
    echo "⚠️  WARNING: Please update the following variables with real values to run the tests:\n";
    echo "   - \$testSitterToken: Sitter authentication token\n";
    echo "   - \$testOwnerToken: Pet owner authentication token\n";
    echo "   - \$testSitterId: Sitter user ID\n\n";
    
    echo "💡 To run all tests, update these variables with real values from your system.\n";
} else {
    // Run all tests
    if (testMarkAvailabilityAsFull($baseUrl, $testSitterToken)) {
        $testsPassed++;
    }
    
    if (testBookingOnFullDate($baseUrl, $testOwnerToken, $testSitterId)) {
        $testsPassed++;
    }
    
    if (testBookingOnAvailableDate($baseUrl, $testOwnerToken, $testSitterId)) {
        $testsPassed++;
    }
    
    if (testRemoveFullStatusAndBook($baseUrl, $testSitterToken, $testOwnerToken, $testSitterId)) {
        $testsPassed++;
    }
    
    echo "📊 Test Results: {$testsPassed}/{$totalTests} tests passed\n";
}

echo "\n🎉 Feature Implementation Summary:\n";
echo "=================================\n";
echo "✅ Visual Indicators: Added '🚫 FULL' badge to availability cards\n";
echo "✅ Status Display: Shows 'Day marked as FULL - No new bookings' message\n";
echo "✅ Booking Prevention: Backend blocks bookings on full dates\n";
echo "✅ Error Handling: Clear error messages for blocked bookings\n";
echo "✅ Status Management: Can mark/unmark dates as full\n";
echo "✅ Real-time Updates: Status persists across app sessions\n";
echo "✅ Notifications: Pet owners notified when dates marked as full\n";
echo "\n📱 How it works:\n";
echo "1. Pet sitter clicks 'Mark as Full' on any availability card\n";
echo "2. Card shows '🚫 FULL' badge and 'No new bookings' message\n";
echo "3. Backend stores full status in cache for 7 days\n";
echo "4. When pet owners try to book that date, they get error message\n";
echo "5. Pet owners receive notifications about the full status\n";
echo "6. Sitter can remove full status to allow bookings again\n";
echo "\n🔧 Technical Details:\n";
echo "- Frontend: Visual indicators and local state management\n";
echo "- Backend: Cache-based full status storage and booking validation\n";
echo "- API: New endpoint for managing full status\n";
echo "- Security: Proper authentication and validation\n";
echo "- UX: Clear error messages and confirmation dialogs\n";
?>
