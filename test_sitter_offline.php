<?php
/**
 * Test script to manually set a sitter offline via API
 * This will help debug why the logout offline functionality isn't working
 */

// Configuration
$baseUrl = 'http://172.20.10.2:8000'; // Mobile data backend URL
$sitterId = '71'; // Change this to the sitter ID you want to test
$token = '257|6UmRqC1AOhFOnLfh1o5OI6PaclO5seLZdgtllw2zd8c86930'; // You'll need to get a valid token

echo "🧪 Testing sitter offline functionality\n";
echo "=====================================\n\n";

// Test 1: Set sitter offline
echo "1. Setting sitter $sitterId offline...\n";
$url = "$baseUrl/api/location/status";
$data = json_encode(['is_online' => false]);

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Authorization: Bearer ' . $token,
    'Accept: application/json'
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

if ($error) {
    echo "❌ cURL Error: $error\n";
} else {
    echo "📡 HTTP Status: $httpCode\n";
    echo "📡 Response: $response\n";
    
    $responseData = json_decode($response, true);
    if ($responseData && $responseData['success']) {
        echo "✅ Sitter set offline successfully\n";
    } else {
        echo "❌ Failed to set sitter offline\n";
        if ($responseData) {
            echo "Error: " . ($responseData['message'] ?? 'Unknown error') . "\n";
        }
    }
}

echo "\n";

// Test 2: Check nearby sitters to see if the sitter is gone
echo "2. Checking nearby sitters...\n";
$url = "$baseUrl/api/location/nearby-sitters";
$data = json_encode([
    'latitude' => 16.337091875617205,
    'longitude' => 120.35166546573502,
    'radius_km' => 10
]);

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Accept: application/json'
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

if ($error) {
    echo "❌ cURL Error: $error\n";
} else {
    echo "📡 HTTP Status: $httpCode\n";
    $responseData = json_decode($response, true);
    if ($responseData && $responseData['success']) {
        $sitters = $responseData['sitters'] ?? [];
        echo "📊 Found " . count($sitters) . " sitters nearby\n";
        
        $foundSitter = false;
        foreach ($sitters as $sitter) {
            if ($sitter['id'] == $sitterId) {
                $foundSitter = true;
                echo "❌ Sitter $sitterId is still visible (name: {$sitter['name']})\n";
                break;
            }
        }
        
        if (!$foundSitter) {
            echo "✅ Sitter $sitterId is not visible (offline successfully)\n";
        }
    } else {
        echo "❌ Failed to get nearby sitters\n";
        echo "Response: $response\n";
    }
}

echo "\n";
echo "🏁 Test completed\n";
?>
