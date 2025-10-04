<?php

require_once 'vendor/autoload.php';

// Load Laravel environment
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Services\SemaphoreService;
use App\Http\Controllers\API\AuthController;
use Illuminate\Http\Request;

echo "🧪 Testing Semaphore SMS Integration\n";
echo "===================================\n\n";

// Test 1: Test Semaphore Service Directly
echo "📱 Test 1: Testing Semaphore Service Directly\n";
echo "---------------------------------------------\n";

$semaphoreService = new SemaphoreService();

// Test connection
echo "🔌 Testing connection...\n";
$connectionTest = $semaphoreService->testConnection();

if ($connectionTest['success']) {
    echo "✅ Connection test successful!\n";
    echo "💰 Account info: " . json_encode($connectionTest['account_info']) . "\n\n";
} else {
    echo "❌ Connection test failed: " . $connectionTest['message'] . "\n";
    echo "🔍 Error: " . ($connectionTest['error'] ?? 'Unknown error') . "\n\n";
}

// Test 2: Test SMS Sending
echo "📱 Test 2: Testing SMS Sending\n";
echo "------------------------------\n";

$testPhone = "+639639283365"; // Replace with your test phone number
$testMessage = "Test message from Petsit Connect - Semaphore integration test";

echo "📞 Sending test SMS to: {$testPhone}\n";
echo "💬 Message: {$testMessage}\n\n";

$smsResult = $semaphoreService->sendSMS($testPhone, $testMessage);

if ($smsResult['success']) {
    echo "✅ SMS sent successfully!\n";
    echo "📊 Response: " . json_encode($smsResult['response']) . "\n\n";
} else {
    echo "❌ SMS sending failed!\n";
    echo "🔍 Error: " . ($smsResult['error'] ?? 'Unknown error') . "\n";
    echo "📊 Status: " . ($smsResult['status'] ?? 'Unknown') . "\n\n";
}

// Test 3: Test Account Information
echo "📊 Test 3: Testing Account Information\n";
echo "-------------------------------------\n";

$accountInfo = $semaphoreService->getAccountInfo();

if ($accountInfo['success']) {
    echo "✅ Account info retrieved successfully!\n";
    echo "📊 Account data: " . json_encode($accountInfo['data']) . "\n\n";
} else {
    echo "❌ Failed to get account info!\n";
    echo "🔍 Error: " . ($accountInfo['error'] ?? 'Unknown error') . "\n\n";
}

// Test 4: Test Phone Verification API
echo "📱 Test 4: Testing Phone Verification API\n";
echo "----------------------------------------\n";

$controller = new AuthController();
$request = new Request();
$request->merge([
    'phone' => $testPhone
]);

echo "📞 Testing phone verification for: {$testPhone}\n";

try {
    $response = $controller->sendPhoneVerificationCode($request);
    $responseData = $response->getData();
    
    echo "✅ Phone verification test completed!\n";
    echo "📊 Success: " . ($responseData->success ? 'Yes' : 'No') . "\n";
    echo "💬 Message: " . $responseData->message . "\n";
    echo "🔑 Debug Code: " . ($responseData->debug_code ?? 'N/A') . "\n";
    echo "🏢 Provider: " . ($responseData->provider ?? 'N/A') . "\n";
    echo "🎭 Simulation Mode: " . (isset($responseData->simulation_mode) && $responseData->simulation_mode ? 'Yes' : 'No') . "\n\n";
    
} catch (Exception $e) {
    echo "❌ Phone verification test failed!\n";
    echo "🔍 Error: " . $e->getMessage() . "\n\n";
}

// Test 5: Test Code Verification
echo "🔐 Test 5: Testing Code Verification\n";
echo "-----------------------------------\n";

if (isset($responseData->debug_code)) {
    $verifyRequest = new Request();
    $verifyRequest->merge([
        'phone' => $testPhone,
        'code' => $responseData->debug_code
    ]);
    
    echo "🔑 Verifying code: {$responseData->debug_code}\n";
    
    try {
        $verifyResponse = $controller->verifyPhoneCode($verifyRequest);
        $verifyData = $verifyResponse->getData();
        
        echo "✅ Code verification test completed!\n";
        echo "📊 Success: " . ($verifyData->success ? 'Yes' : 'No') . "\n";
        echo "💬 Message: " . $verifyData->message . "\n\n";
        
    } catch (Exception $e) {
        echo "❌ Code verification test failed!\n";
        echo "🔍 Error: " . $e->getMessage() . "\n\n";
    }
} else {
    echo "⚠️  Skipping code verification test - no debug code available\n\n";
}

echo "🎉 Semaphore Integration Test Complete!\n";
echo "=====================================\n\n";

echo "📋 Next Steps:\n";
echo "1. Add your Semaphore API key to the .env file\n";
echo "2. Set SEMAPHORE_API_KEY=your_actual_api_key_here\n";
echo "3. Restart your Laravel server\n";
echo "4. Run this test again to verify real SMS sending\n\n";

echo "🔧 Configuration Required:\n";
echo "Add these lines to your .env file:\n";
echo "SEMAPHORE_API_KEY=your_semaphore_api_key_here\n";
echo "SEMAPHORE_SENDER_NAME=PetsitConnect\n\n";

echo "📞 Test API endpoint:\n";
echo "curl -X POST http://127.0.0.1:8000/apir/send-phone-verification-code \\\n";
echo "  -H \"Content-Type: application/json\" \\\n";
echo "  -d '{\"phone\":\"{$testPhone}\"}'\n";
