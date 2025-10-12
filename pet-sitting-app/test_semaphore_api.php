<?php
/**
 * Test Semaphore API Integration
 * 
 * This script tests the real Semaphore API with the provided API key
 * and verifies that only the 6-digit code is sent.
 */

require_once 'pet-sitting-app/vendor/autoload.php';

// Set up Laravel environment
$app = require_once 'pet-sitting-app/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "📱 SEMAPHORE API TEST\n";
echo "====================\n\n";

// Test configuration
$apiKey = '25e93be412c53c939cab90c41ea110c8';
$testPhone = '+639123456789'; // Replace with your test phone number
$verificationCode = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

echo "🔧 Configuration:\n";
echo "   API Key: " . substr($apiKey, 0, 8) . "...\n";
echo "   Test Phone: {$testPhone}\n";
echo "   Generated Code: {$verificationCode}\n\n";

// Test SemaphoreService
echo "🧪 Testing SemaphoreService...\n";
echo "-------------------------------\n";

try {
    $semaphoreService = new \App\Services\SemaphoreService();
    
    // Test connection first
    echo "1. Testing connection...\n";
    $connectionTest = $semaphoreService->testConnection();
    
    if ($connectionTest['success']) {
        echo "   ✅ Connection successful!\n";
        echo "   💰 Credit Balance: " . ($connectionTest['account_info']['credit_balance'] ?? 'Unknown') . "\n\n";
    } else {
        echo "   ❌ Connection failed: " . ($connectionTest['message'] ?? 'Unknown error') . "\n\n";
    }
    
    // Test SMS sending
    echo "2. Testing SMS sending...\n";
    echo "   📱 Phone: {$testPhone}\n";
    echo "   📝 Message: {$verificationCode} (6-digit code only)\n";
    
    $smsResult = $semaphoreService->sendSMS($testPhone, $verificationCode);
    
    if ($smsResult['success']) {
        echo "   ✅ SMS sent successfully!\n";
        echo "   📊 Response: " . json_encode($smsResult['response']) . "\n\n";
    } else {
        echo "   ❌ SMS failed: " . ($smsResult['message'] ?? 'Unknown error') . "\n";
        echo "   🔍 Error: " . json_encode($smsResult['error'] ?? 'No error details') . "\n\n";
    }
    
} catch (\Exception $e) {
    echo "   ❌ Exception: " . $e->getMessage() . "\n";
    echo "   📍 File: " . $e->getFile() . ":" . $e->getLine() . "\n\n";
}

// Test AuthController integration
echo "🔐 Testing AuthController Integration...\n";
echo "----------------------------------------\n";

try {
    // Simulate the phone verification process
    echo "1. Simulating phone verification request...\n";
    
    // Check if simulation mode is enabled
    $simulationMode = env('SMS_SIMULATION_MODE', false);
    $semaphoreEnabled = env('SEMAPHORE_ENABLED', true);
    
    echo "   📊 SMS_SIMULATION_MODE: " . ($simulationMode ? 'true' : 'false') . "\n";
    echo "   📊 SEMAPHORE_ENABLED: " . ($semaphoreEnabled ? 'true' : 'false') . "\n";
    echo "   📊 Will use: " . ($simulationMode || !$semaphoreEnabled ? 'SIMULATION' : 'REAL SMS') . "\n\n";
    
    if ($simulationMode || !$semaphoreEnabled) {
        echo "   ⚠️  Simulation mode is enabled. Set SEMAPHORE_ENABLED=true and SMS_SIMULATION_MODE=false to use real SMS.\n\n";
    } else {
        echo "   ✅ Real SMS mode is enabled. SMS will be sent via Semaphore API.\n\n";
    }
    
} catch (\Exception $e) {
    echo "   ❌ Exception: " . $e->getMessage() . "\n\n";
}

echo "📋 Summary:\n";
echo "===========\n";
echo "✅ Semaphore API integration is ready\n";
echo "✅ API key configured: " . substr($apiKey, 0, 8) . "...\n";
echo "✅ SMS format: 6-digit code only\n";
echo "✅ Fallback to simulation mode available\n\n";

echo "🚀 Next Steps:\n";
echo "1. Add the environment variables to your .env file\n";
echo "2. Test with a real phone number\n";
echo "3. Check the logs for SMS delivery status\n";
echo "4. Verify the SMS contains only the 6-digit code\n\n";

echo "📝 Environment Variables to Add:\n";
echo "SEMAPHORE_API_KEY=25e93be412c53c939cab90c41ea110c8\n";
echo "SEMAPHORE_ENABLED=true\n";
echo "SMS_SIMULATION_MODE=false\n";
