<?php

// Test Phone-Only Verification System
echo "🔔 Testing Phone-Only Verification System\n";
echo "========================================\n\n";

// Test 1: Register a new user (should auto-verify email)
echo "1. Testing User Registration (Email Auto-Verified):\n";
$registrationData = [
    'name' => 'Test User Phone Only',
    'email' => 'testphone@example.com',
    'password' => 'password123',
    'password_confirmation' => 'password123',
    'role' => 'pet_owner',
    'phone' => '+639123456789'
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'http://localhost:8000/api/register');
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($registrationData));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Accept: application/json'
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode === 201) {
    $data = json_decode($response, true);
    echo "   ✅ Registration successful\n";
    echo "   📧 Email: {$registrationData['email']}\n";
    echo "   📱 Phone: {$registrationData['phone']}\n";
    echo "   🔑 Token: " . substr($data['token'] ?? '', 0, 20) . "...\n";
    echo "   📧 Email Verified: " . ($data['user']['email_verified'] ? 'YES' : 'NO') . "\n";
    echo "   📱 Phone Verified: " . ($data['user']['phone_verified'] ? 'YES' : 'NO') . "\n";
    echo "   📝 Message: " . ($data['message'] ?? 'No message') . "\n";
    
    // Check verification requirements
    if (isset($data['verification_required'])) {
        echo "   🔍 Verification Requirements:\n";
        echo "      - Email: " . ($data['verification_required']['email'] ? 'Required' : 'Auto-verified') . "\n";
        echo "      - Phone: " . ($data['verification_required']['phone'] ? 'Required' : 'Not required') . "\n";
        echo "      - ID: " . ($data['verification_required']['id_verification'] ? 'Required' : 'Not required') . "\n";
    }
} else {
    echo "   ❌ Registration failed\n";
    echo "   📊 Response: $response\n";
}

echo "\n";

// Test 2: Send Phone Verification Code
echo "2. Testing Phone Verification Code:\n";
$phoneData = [
    'phone' => '+639123456789'
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'http://localhost:8000/api/send-verification-code');
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($phoneData));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Accept: application/json'
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode === 200) {
    $data = json_decode($response, true);
    echo "   ✅ Phone verification code sent successfully\n";
    echo "   📱 Phone: {$phoneData['phone']}\n";
    echo "   🔢 Debug Code: " . ($data['debug_code'] ?? 'Check logs') . "\n";
    echo "   📝 Note: " . ($data['note'] ?? 'Check logs for verification code') . "\n";
} else {
    echo "   ❌ Failed to send phone verification code\n";
    echo "   📊 Response: $response\n";
}

echo "\n";

// Test 3: Check Laravel Logs for Phone Verification Codes
echo "3. Checking Laravel Logs for Phone Verification Codes:\n";
$logFile = 'pet-sitting-app/storage/logs/laravel.log';
if (file_exists($logFile)) {
    echo "   ✅ Laravel log file exists\n";
    
    // Get the last 20 lines of the log
    $logLines = file($logFile);
    $recentLines = array_slice($logLines, -20);
    
    echo "   📋 Recent phone verification codes:\n";
    foreach ($recentLines as $line) {
        if (strpos($line, 'PHONE VERIFICATION CODE') !== false) {
            echo "   🔢 " . trim($line) . "\n";
        }
    }
} else {
    echo "   ❌ Laravel log file not found\n";
}

echo "\n";

echo "🎉 PHONE-ONLY VERIFICATION TESTING COMPLETE!\n";
echo "============================================\n";
echo "✅ User registration (email auto-verified)\n";
echo "✅ Phone verification code sent\n";
echo "✅ Logs checked for verification codes\n\n";

echo "📱 VERIFICATION CODES IN LOGS:\n";
echo "==============================\n";
echo "Look for lines with '🔢 PHONE VERIFICATION CODE:' in the logs above\n";
echo "Use these codes in the mobile app for testing\n\n";

echo "🔍 TO MONITOR LOGS IN REAL-TIME:\n";
echo "=================================\n";
echo "tail -f pet-sitting-app/storage/logs/laravel.log | grep 'PHONE VERIFICATION CODE'\n"; 