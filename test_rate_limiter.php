<?php
/**
 * Test script for rate limiter configuration
 * This script tests that the rate limiters are properly defined
 */

echo "Testing Rate Limiter Configuration\n";
echo "==================================\n\n";

// Test 1: Check if we can access the API health endpoint (should work)
echo "1. Testing API health endpoint (should work)...\n";
$healthResponse = testEndpoint('http://localhost:8000/api/health', 'GET');
echo "Health check: " . ($healthResponse['success'] ? 'PASS' : 'FAIL') . "\n";
if ($healthResponse['success']) {
    echo "Response: " . $healthResponse['data'] . "\n";
}
echo "\n";

// Test 2: Test admin verification endpoint (should work if authenticated)
echo "2. Testing admin verification endpoint...\n";
$verificationResponse = testEndpoint('http://localhost:8000/api/admin/verifications/1/approve', 'POST', [
    'documents_clear' => 'yes',
    'face_match_verified' => 'yes',
    'address_match_verified' => 'yes'
]);
echo "Admin endpoint: " . ($verificationResponse['success'] ? 'PASS' : 'FAIL') . "\n";
if (!$verificationResponse['success']) {
    echo "Error: " . $verificationResponse['error'] . "\n";
    if (strpos($verificationResponse['error'], 'Rate limiter') !== false) {
        echo "❌ Rate limiter error detected!\n";
    } elseif (strpos($verificationResponse['error'], 'Unauthenticated') !== false) {
        echo "✅ Rate limiter working, but authentication required (expected)\n";
    }
}
echo "\n";

echo "Rate limiter test completed!\n";

/**
 * Test an API endpoint
 */
function testEndpoint($url, $method = 'GET', $data = null) {
    $ch = curl_init();
    
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Accept: application/json',
        'Content-Type: application/json',
        'User-Agent: Rate Limiter Test Script'
    ]);
    
    if ($method === 'POST' && $data) {
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    }
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    
    curl_close($ch);
    
    if ($error) {
        return [
            'success' => false,
            'error' => 'CURL Error: ' . $error
        ];
    }
    
    // Check if response is valid JSON
    $decodedResponse = json_decode($response, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        return [
            'success' => false,
            'error' => 'Invalid JSON response. HTTP Code: ' . $httpCode . ', Response: ' . substr($response, 0, 200) . '...'
        ];
    }
    
    return [
        'success' => true,
        'data' => $response,
        'http_code' => $httpCode,
        'decoded' => $decodedResponse
    ];
}
?>
