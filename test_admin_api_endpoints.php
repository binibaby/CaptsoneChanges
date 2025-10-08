<?php
/**
 * Test script for admin verification API endpoints
 * This script tests the API endpoints to ensure they return proper JSON responses
 */

// Configuration
$baseUrl = 'http://localhost:8000'; // Adjust this to your Laravel app URL
$verificationId = 1; // Replace with an actual verification ID

echo "Testing Admin Verification API Endpoints\n";
echo "=====================================\n\n";

// Test 1: Check if API health endpoint works
echo "1. Testing API health endpoint...\n";
$healthResponse = testEndpoint($baseUrl . '/api/health', 'GET');
echo "Health check: " . ($healthResponse['success'] ? 'PASS' : 'FAIL') . "\n";
if ($healthResponse['success']) {
    echo "Response: " . $healthResponse['data'] . "\n";
}
echo "\n";

// Test 2: Test verification details endpoint (GET request)
echo "2. Testing verification details endpoint...\n";
$detailsResponse = testEndpoint($baseUrl . '/api/admin/verifications/' . $verificationId . '/details', 'GET');
echo "Details endpoint: " . ($detailsResponse['success'] ? 'PASS' : 'FAIL') . "\n";
if (!$detailsResponse['success']) {
    echo "Error: " . $detailsResponse['error'] . "\n";
}
echo "\n";

// Test 3: Test approve endpoint (POST request)
echo "3. Testing approve endpoint...\n";
$approveData = [
    'documents_clear' => 'yes',
    'face_match_verified' => 'yes',
    'address_match_verified' => 'yes',
    'confidence_level' => 'high',
    'verification_method' => 'manual',
    'admin_notes' => 'Test approval via API'
];
$approveResponse = testEndpoint($baseUrl . '/api/admin/verifications/' . $verificationId . '/approve', 'POST', $approveData);
echo "Approve endpoint: " . ($approveResponse['success'] ? 'PASS' : 'FAIL') . "\n";
if (!$approveResponse['success']) {
    echo "Error: " . $approveResponse['error'] . "\n";
} else {
    echo "Response: " . $approveResponse['data'] . "\n";
}
echo "\n";

// Test 4: Test reject endpoint (POST request)
echo "4. Testing reject endpoint...\n";
$rejectData = [
    'reason' => 'Test rejection via API',
    'rejection_category' => 'other',
    'allow_resubmission' => '1'
];
$rejectResponse = testEndpoint($baseUrl . '/api/admin/verifications/' . $verificationId . '/reject', 'POST', $rejectData);
echo "Reject endpoint: " . ($rejectResponse['success'] ? 'PASS' : 'FAIL') . "\n";
if (!$rejectResponse['success']) {
    echo "Error: " . $rejectResponse['error'] . "\n";
} else {
    echo "Response: " . $rejectResponse['data'] . "\n";
}
echo "\n";

echo "Testing completed!\n";

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
        'User-Agent: Admin API Test Script'
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
