<?php
/**
 * Test script to verify the API response for full dates
 */

echo "🧪 Testing API Response for Full Dates\n";
echo "=====================================\n\n";

// Test configuration
$baseUrl = 'http://192.168.100.204:8000'; // Use the current WiFi IP
$testSitterId = '8'; // Use sitter ID from logs
$testDate = '2025-10-23'; // Use date from logs
$testOwnerToken = 'your_test_owner_token_here'; // Replace with actual token

echo "🔍 Testing API Response:\n";
echo "Base URL: {$baseUrl}\n";
echo "Sitter ID: {$testSitterId}\n";
echo "Test Date: {$testDate}\n\n";

/**
 * Test the booking API directly
 */
function testBookingAPI($baseUrl, $token, $sitterId, $date) {
    echo "📝 Testing booking API for date: {$date}\n";
    
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
        $responseData = json_decode($response, true);
        if (isset($responseData['error_code']) && $responseData['error_code'] === 'DATE_FULL') {
            echo "✅ SUCCESS: API correctly returns DATE_FULL error\n";
            echo "✅ Error Code: " . $responseData['error_code'] . "\n";
            echo "✅ Message: " . $responseData['message'] . "\n";
            return true;
        } else {
            echo "❌ FAIL: API returns 422 but wrong error code\n";
            return false;
        }
    } else {
        echo "❌ FAIL: API should return 422 for full dates\n";
        return false;
    }
}

/**
 * Test the date check API
 */
function testDateCheckAPI($baseUrl, $token, $sitterId, $date) {
    echo "📝 Testing date check API for date: {$date}\n";
    
    $url = $baseUrl . "/api/sitters/{$sitterId}/check-date-full/{$date}";
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
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
        $responseData = json_decode($response, true);
        if (isset($responseData['is_full'])) {
            echo "✅ SUCCESS: Date check API working\n";
            echo "✅ Is Full: " . ($responseData['is_full'] ? 'true' : 'false') . "\n";
            return $responseData['is_full'];
        }
    }
    
    echo "❌ FAIL: Date check API not working properly\n";
    return false;
}

// Run tests
echo "🚀 Running API Tests...\n\n";

if ($testOwnerToken === 'your_test_owner_token_here') {
    echo "⚠️  Please update the \$testOwnerToken variable with a real token to run the tests.\n\n";
    
    echo "💡 Expected Results:\n";
    echo "===================\n";
    echo "1. Booking API should return HTTP 422\n";
    echo "2. Response should contain: {\"error_code\":\"DATE_FULL\"}\n";
    echo "3. Message should indicate date is full\n";
    echo "4. Date check API should return {\"is_full\":true}\n\n";
} else {
    $bookingResult = testBookingAPI($baseUrl, $testOwnerToken, $testSitterId, $testDate);
    $dateCheckResult = testDateCheckAPI($baseUrl, $testOwnerToken, $testSitterId, $testDate);
    
    echo "📊 Test Results:\n";
    echo "===============\n";
    echo "Booking API (422 expected): " . ($bookingResult ? "✅ PASS" : "❌ FAIL") . "\n";
    echo "Date Check API (true expected): " . ($dateCheckResult ? "✅ PASS" : "❌ FAIL") . "\n\n";
}

echo "🔍 Debugging Steps:\n";
echo "==================\n";
echo "1. Check if the date is actually marked as full in the backend cache\n";
echo "2. Verify the API endpoints are working correctly\n";
echo "3. Check the frontend error handling in bookingService.ts\n";
echo "4. Verify the return statements are working in BookingScreen.tsx\n\n";

echo "🚨 Common Issues:\n";
echo "================\n";
echo "1. Date not marked as full in cache\n";
echo "2. Wrong sitter ID or date format\n";
echo "3. API endpoint not working\n";
echo "4. Frontend error handling not working\n";
echo "5. Missing return statements in catch blocks\n\n";

echo "💡 Next Steps:\n";
echo "==============\n";
echo "1. Mark the date as full in the sitter availability screen\n";
echo "2. Test the API endpoints directly\n";
echo "3. Check the console logs for detailed error information\n";
echo "4. Verify the frontend error handling is working\n";
?>
