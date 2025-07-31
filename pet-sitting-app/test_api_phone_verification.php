<?php

echo "🧪 PHONE VERIFICATION API TEST\n";
echo "==============================\n\n";

// Test phone number
$testPhone = "+639639283365";

echo "📱 Testing phone verification API for: {$testPhone}\n\n";

// Test 1: Send verification code via API
echo "📤 Step 1: Sending verification code via API...\n";

$sendData = json_encode(['phone' => $testPhone]);

$sendContext = stream_context_create([
    'http' => [
        'method' => 'POST',
        'header' => 'Content-Type: application/json',
        'content' => $sendData
    ]
]);

$sendResponse = file_get_contents('http://127.0.0.1:8000/api/send-verification-code', false, $sendContext);
$sendResult = json_decode($sendResponse, true);

echo "✅ Send Code API Result:\n";
echo "   Status: " . ($sendResult['success'] ? "Success" : "Failed") . "\n";
echo "   Message: " . $sendResult['message'] . "\n";

if (isset($sendResult['debug_code'])) {
    echo "   Debug Code: " . $sendResult['debug_code'] . "\n";
}

if (isset($sendResult['simulation_mode'])) {
    echo "   Simulation Mode: " . ($sendResult['simulation_mode'] ? "Yes" : "No") . "\n";
}

if (isset($sendResult['timestamp'])) {
    echo "   Timestamp: " . $sendResult['timestamp'] . "\n";
}

// Test 2: Verify the code via API
echo "\n📥 Step 2: Verifying the code via API...\n";

$verifyData = json_encode([
    'phone' => $testPhone,
    'code' => $sendResult['debug_code'] ?? '123456'
]);

$verifyContext = stream_context_create([
    'http' => [
        'method' => 'POST',
        'header' => 'Content-Type: application/json',
        'content' => $verifyData
    ]
]);

$verifyResponse = file_get_contents('http://127.0.0.1:8000/api/verify-phone-code', false, $verifyContext);
$verifyResult = json_decode($verifyResponse, true);

echo "✅ Verify Code API Result:\n";
echo "   Status: " . ($verifyResult['success'] ? "Success" : "Failed") . "\n";
echo "   Message: " . $verifyResult['message'] . "\n";

if (isset($verifyResult['simulation_mode'])) {
    echo "   Simulation Mode: " . ($verifyResult['simulation_mode'] ? "Yes" : "No") . "\n";
}

// Test 3: Try to verify with wrong code
echo "\n❌ Step 3: Testing with wrong code via API...\n";

$wrongData = json_encode([
    'phone' => $testPhone,
    'code' => '000000'
]);

$wrongContext = stream_context_create([
    'http' => [
        'method' => 'POST',
        'header' => 'Content-Type: application/json',
        'content' => $wrongData
    ]
]);

$wrongResponse = file_get_contents('http://127.0.0.1:8000/api/verify-phone-code', false, $wrongContext);
$wrongResult = json_decode($wrongResponse, true);

echo "❌ Wrong Code API Result:\n";
echo "   Status: " . ($wrongResult['success'] ? "Success" : "Failed") . "\n";
echo "   Message: " . $wrongResult['message'] . "\n";

echo "\n📋 LOGGING INFORMATION:\n";
echo "======================\n";
echo "🔍 To view detailed logs:\n";
echo "   tail -f storage/logs/laravel.log | grep -E \"(🔔|📱|✅|❌|🎭|⏰|🌐|👤|📞|🔍|🧹|🎉)\"\n\n";

echo "🔧 SIMULATION MODE FEATURES:\n";
echo "============================\n";
echo "✅ Enhanced logging with emojis and timestamps\n";
echo "✅ Request IP and User Agent tracking\n";
echo "✅ Phone number formatting validation\n";
echo "✅ Cache key management\n";
echo "✅ Code generation and verification\n";
echo "✅ Error handling with fallback modes\n";
echo "✅ Simulation mode indicators\n\n";

echo "🎯 API TEST COMPLETED! Check the logs for detailed simulation information.\n"; 