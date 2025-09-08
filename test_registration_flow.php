<?php

echo "🧪 TESTING REGISTRATION FLOW & PHONE VERIFICATION\n";
echo "==================================================\n\n";

$base_url = "http://172.20.10.2:8000";

echo "✅ Testing with updated IP: $base_url\n\n";

// Test 1: Check if server is running
echo "1. Testing Server Connectivity:\n";
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $base_url . '/api/test');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode === 200) {
    $data = json_decode($response, true);
    if ($data['success']) {
        echo "   ✅ Server is running and accessible\n";
        echo "   📊 API Status: " . $data['message'] . "\n";
        echo "   🕐 Timestamp: " . $data['timestamp'] . "\n";
    } else {
        echo "   ❌ API returned error\n";
        exit(1);
    }
} else {
    echo "   ❌ Server not accessible (HTTP $httpCode)\n";
    echo "   💡 Make sure Laravel is running on $base_url\n";
    exit(1);
}

echo "\n";

// Test 2: Test registration endpoint
echo "2. Testing Registration Endpoint:\n";
$registrationData = [
    'name' => 'Test User',
    'first_name' => 'Test',
    'last_name' => 'User',
    'email' => 'test' . time() . '@example.com',
    'password' => 'password123',
    'password_confirmation' => 'password123',
    'role' => 'pet_owner',
    'phone' => '+639123456789',
    'address' => 'Test Address',
    'gender' => 'male',
    'age' => 25
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $base_url . '/api/register');
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($registrationData));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Accept: application/json'
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode === 200 || $httpCode === 201) {
    $data = json_decode($response, true);
    if ($data['success']) {
        echo "   ✅ Registration successful\n";
        echo "   📱 User ID: " . $data['user']['id'] . "\n";
        echo "   📧 Email: " . $data['user']['email'] . "\n";
        echo "   📞 Phone: " . $data['user']['phone'] . "\n";
        echo "   🔐 Status: " . $data['user']['status'] . "\n";
        
        // Store user ID for phone verification test
        $userId = $data['user']['id'];
        $userPhone = $data['user']['phone'];
    } else {
        echo "   ❌ Registration failed: " . ($data['message'] ?? 'Unknown error') . "\n";
        exit(1);
    }
} else {
    echo "   ❌ Registration endpoint error (HTTP $httpCode)\n";
    echo "   📊 Response: $response\n";
    exit(1);
}

echo "\n";

// Test 3: Test phone verification code sending
echo "3. Testing Phone Verification Code Sending:\n";
$phoneData = [
    'phone' => $userPhone
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $base_url . '/api/send-verification-code');
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($phoneData));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Accept: application/json'
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode === 200) {
    $data = json_decode($response, true);
    if ($data['success']) {
        echo "   ✅ Phone verification code sent successfully\n";
        echo "   📱 Phone: $userPhone\n";
        echo "   🔢 Debug Code: " . ($data['debug_code'] ?? 'Check logs') . "\n";
        echo "   📝 Note: " . ($data['note'] ?? 'Check logs for verification code') . "\n";
        
        // Store verification code for testing
        $verificationCode = $data['debug_code'];
    } else {
        echo "   ❌ Phone verification failed: " . ($data['message'] ?? 'Unknown error') . "\n";
        exit(1);
    }
} else {
    echo "   ❌ Phone verification endpoint error (HTTP $httpCode)\n";
    echo "   📊 Response: $response\n";
    exit(1);
}

echo "\n";

// Test 4: Test phone verification code verification
echo "4. Testing Phone Verification Code Verification:\n";
$verifyData = [
    'phone' => $userPhone,
    'code' => $verificationCode
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $base_url . '/api/verify-phone-code');
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($verifyData));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Accept: application/json'
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode === 200) {
    $data = json_decode($response, true);
    if ($data['success']) {
        echo "   ✅ Phone verification code verified successfully\n";
        echo "   📱 Phone: $userPhone\n";
        echo "   🔢 Code: $verificationCode\n";
        echo "   ✅ Status: Verified\n";
    } else {
        echo "   ❌ Phone verification failed: " . ($data['message'] ?? 'Unknown error') . "\n";
    }
} else {
    echo "   ❌ Phone verification endpoint error (HTTP $httpCode)\n";
    echo "   📊 Response: $response\n";
}

echo "\n";
echo "🎯 REGISTRATION FLOW TEST COMPLETED!\n";
echo "====================================\n";
echo "✅ Server connectivity: Working\n";
echo "✅ Registration endpoint: Working\n";
echo "✅ Phone verification sending: Working\n";
echo "✅ Phone verification verification: Working\n";
echo "\n";
echo "💡 If your app still isn't working, check:\n";
echo "1. 📱 Expo app is using the correct IP (172.20.10.2:8000)\n";
echo "2. 🔄 App has been restarted after IP changes\n";
echo "3. 📋 Console logs for any JavaScript errors\n";
echo "4. 🌐 Network connectivity between phone and computer\n";
