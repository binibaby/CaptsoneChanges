<?php
// Test script for certificates API endpoints

// Test data
$testCertificates = [
    [
        'id' => '1',
        'name' => 'Pet First Aid Certification',
        'image' => 'https://via.placeholder.com/400x300/4CAF50/white?text=Pet+First+Aid+Certification',
        'date' => '2024-01-15',
        'issuer' => 'Pet Care Academy',
    ],
    [
        'id' => '2',
        'name' => 'Dog Training Certificate',
        'image' => 'https://via.placeholder.com/400x300/2196F3/white?text=Dog+Training+Certificate',
        'date' => '2024-02-20',
        'issuer' => 'Canine Training Institute',
    ],
];

// Test saving certificates
echo "Testing certificates API endpoints...\n\n";

// Test 1: Save certificates
echo "1. Testing save certificates endpoint...\n";
$saveData = json_encode(['certificates' => $testCertificates]);
$saveResult = testApiEndpoint('POST', '/api/profile/save-certificates', $saveData);
echo "Save result: " . $saveResult . "\n\n";

// Test 2: Get certificates
echo "2. Testing get certificates endpoint...\n";
$getResult = testApiEndpoint('GET', '/api/profile/certificates', '');
echo "Get result: " . $getResult . "\n\n";

// Test 3: Test nearby sitters with certificates
echo "3. Testing nearby sitters with certificates...\n";
$sittersResult = testApiEndpoint('GET', '/api/location/nearby-sitters?latitude=14.5995&longitude=120.9842&radius_km=2', '');
echo "Sitters result: " . $sittersResult . "\n\n";

function testApiEndpoint($method, $endpoint, $data) {
    $baseUrl = 'http://localhost:8000';
    $url = $baseUrl . $endpoint;
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: Bearer test-token' // This will fail auth but we can see the endpoint structure
    ]);
    
    if ($method === 'POST' && $data) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
    }
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    return "HTTP $httpCode: " . substr($response, 0, 200) . (strlen($response) > 200 ? '...' : '');
}

echo "Test completed!\n";
?>
