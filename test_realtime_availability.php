<?php
/**
 * Test script to verify real-time availability detection
 * This script simulates a sitter going online/offline and checks if the map updates
 */

// Configuration
$baseUrl = 'http://192.168.100.184:8000';
$testUserToken = '64|dTO5Gio05Om1Buxtkta02gVpvQnetCTMrofsLjeudda0034b'; // Test sitter token

echo "🧪 Real-time Availability Detection Test\n";
echo "========================================\n\n";

// Test coordinates (Manila area)
$testLat = 14.5995;
$testLon = 120.9842;

// Function to get nearby sitters
function getNearbySitters($lat, $lon) {
    global $baseUrl;
    
    $url = $baseUrl . '/api/location/nearby-sitters';
    $data = [
        'latitude' => $lat,
        'longitude' => $lon,
        'radius_km' => 2
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
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($response === false) {
        return ['success' => false, 'message' => 'CURL error'];
    }
    
    $decodedResponse = json_decode($response, true);
    
    if ($httpCode >= 200 && $httpCode < 300) {
        return $decodedResponse;
    } else {
        return ['success' => false, 'message' => $decodedResponse['message'] ?? 'HTTP ' . $httpCode];
    }
}

// Function to set sitter status
function setSitterStatus($isOnline, $token) {
    global $baseUrl;
    
    $url = $baseUrl . '/api/location/status';
    $data = ['is_online' => $isOnline];
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Accept: application/json',
        'Authorization: Bearer ' . $token
    ]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($response === false) {
        return ['success' => false, 'message' => 'CURL error'];
    }
    
    $decodedResponse = json_decode($response, true);
    
    if ($httpCode >= 200 && $httpCode < 300) {
        return $decodedResponse;
    } else {
        return ['success' => false, 'message' => $decodedResponse['message'] ?? 'HTTP ' . $httpCode];
    }
}

// Function to update sitter location
function updateSitterLocation($lat, $lon, $address, $isOnline, $token) {
    global $baseUrl;
    
    $url = $baseUrl . '/api/location/update';
    $data = [
        'latitude' => $lat,
        'longitude' => $lon,
        'address' => $address,
        'is_online' => $isOnline
    ];
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Accept: application/json',
        'Authorization: Bearer ' . $token
    ]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($response === false) {
        return ['success' => false, 'message' => 'CURL error'];
    }
    
    $decodedResponse = json_decode($response, true);
    
    if ($httpCode >= 200 && $httpCode < 300) {
        return $decodedResponse;
    } else {
        return ['success' => false, 'message' => $decodedResponse['message'] ?? 'HTTP ' . $httpCode];
    }
}

echo "📍 Test Location: {$testLat}, {$testLon}\n\n";

// Step 1: Set sitter online with location
echo "1. Setting sitter online with location...\n";
$response = updateSitterLocation($testLat, $testLon, 'Test Location, Manila', true, $testUserToken);
if ($response['success']) {
    echo "✅ Sitter location updated and set online\n";
} else {
    echo "❌ Failed: " . $response['message'] . "\n";
    exit(1);
}

// Wait for cache to update
sleep(2);

// Step 2: Check if sitter appears in nearby list
echo "\n2. Checking if sitter appears in nearby list...\n";
$response = getNearbySitters($testLat, $testLon);
if ($response['success']) {
    $count = $response['count'];
    echo "✅ Found {$count} nearby sitters\n";
    
    if ($count > 0) {
        foreach ($response['sitters'] as $sitter) {
            $status = $sitter['isOnline'] ? 'ONLINE' : 'OFFLINE';
            echo "   - {$sitter['name']} ({$status})\n";
        }
    }
} else {
    echo "❌ Failed to get nearby sitters: " . $response['message'] . "\n";
}

// Step 3: Set sitter offline
echo "\n3. Setting sitter offline...\n";
$response = setSitterStatus(false, $testUserToken);
if ($response['success']) {
    echo "✅ Sitter set offline\n";
} else {
    echo "❌ Failed: " . $response['message'] . "\n";
}

// Wait for cache to update
sleep(2);

// Step 4: Check if sitter is removed from nearby list
echo "\n4. Checking if sitter is removed from nearby list...\n";
$response = getNearbySitters($testLat, $testLon);
if ($response['success']) {
    $count = $response['count'];
    echo "✅ Found {$count} nearby sitters\n";
    
    if ($count > 0) {
        echo "   Sitters still visible:\n";
        foreach ($response['sitters'] as $sitter) {
            $status = $sitter['isOnline'] ? 'ONLINE' : 'OFFLINE';
            echo "   - {$sitter['name']} ({$status})\n";
        }
        echo "   ⚠️ ISSUE: Offline sitter is still visible!\n";
    } else {
        echo "   ✅ SUCCESS: No sitters found (offline sitter properly hidden)\n";
    }
} else {
    echo "❌ Failed to get nearby sitters: " . $response['message'] . "\n";
}

// Step 5: Set sitter online again
echo "\n5. Setting sitter online again...\n";
$response = setSitterStatus(true, $testUserToken);
if ($response['success']) {
    echo "✅ Sitter set online\n";
} else {
    echo "❌ Failed: " . $response['message'] . "\n";
}

// Wait for cache to update
sleep(2);

// Step 6: Check if sitter appears again
echo "\n6. Checking if sitter appears again...\n";
$response = getNearbySitters($testLat, $testLon);
if ($response['success']) {
    $count = $response['count'];
    echo "✅ Found {$count} nearby sitters\n";
    
    if ($count > 0) {
        foreach ($response['sitters'] as $sitter) {
            $status = $sitter['isOnline'] ? 'ONLINE' : 'OFFLINE';
            echo "   - {$sitter['name']} ({$status})\n";
        }
    }
} else {
    echo "❌ Failed to get nearby sitters: " . $response['message'] . "\n";
}

echo "\n🎉 Test completed!\n";
echo "The key test is step 4 - if the offline sitter was properly hidden, the real-time detection is working.\n";
?>
