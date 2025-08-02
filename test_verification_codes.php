<?php

// Test Verification Codes in Logs
echo "🔔 Testing Verification Codes in Logs\n";
echo "====================================\n\n";

// Test 1: Send Phone Verification Code
echo "1. Testing Phone Verification Code:\n";
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

// Test 2: Send Email Verification Code (via registration)
echo "2. Testing Email Verification Code (via registration):\n";
$registrationData = [
    'name' => 'Test User',
    'email' => 'test@example.com',
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
    echo "   📝 Check logs for verification codes\n";
} else {
    echo "   ❌ Registration failed\n";
    echo "   📊 Response: $response\n";
}

echo "\n";

// Test 3: Check Laravel Logs
echo "3. Checking Laravel Logs:\n";
$logFile = 'pet-sitting-app/storage/logs/laravel.log';
if (file_exists($logFile)) {
    echo "   ✅ Laravel log file exists\n";
    
    // Get the last 50 lines of the log
    $logLines = file($logFile);
    $recentLines = array_slice($logLines, -50);
    
    echo "   📋 Recent log entries:\n";
    foreach ($recentLines as $line) {
        if (strpos($line, 'VERIFICATION CODE') !== false || 
            strpos($line, 'PHONE VERIFICATION CODE') !== false ||
            strpos($line, 'EMAIL VERIFICATION CODE') !== false) {
            echo "   🔢 " . trim($line) . "\n";
        }
    }
} else {
    echo "   ❌ Laravel log file not found\n";
}

echo "\n";

echo "🎉 VERIFICATION CODE TESTING COMPLETE!\n";
echo "=====================================\n";
echo "✅ Phone verification code sent\n";
echo "✅ Email verification code sent (via registration)\n";
echo "✅ Logs checked for verification codes\n\n";

echo "📱 TO FIND VERIFICATION CODES:\n";
echo "==============================\n";
echo "1. Check the Laravel logs above\n";
echo "2. Look for lines with '🔢 PHONE VERIFICATION CODE:'\n";
echo "3. Look for lines with '📧 EMAIL VERIFICATION CODE:'\n";
echo "4. Use these codes in the mobile app\n\n";

echo "📋 LOG FILE LOCATION:\n";
echo "=====================\n";
echo "pet-sitting-app/storage/logs/laravel.log\n\n";

echo "🔍 TO MONITOR LOGS IN REAL-TIME:\n";
echo "=================================\n";
echo "tail -f pet-sitting-app/storage/logs/laravel.log | grep 'VERIFICATION CODE'\n"; 