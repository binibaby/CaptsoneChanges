<?php

require_once 'vendor/autoload.php';

// Load Laravel environment
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Http\Request;
use App\Http\Controllers\API\AuthController;

// Suppress output to avoid header conflicts
ob_start();

echo "🧪 PHONE VERIFICATION SIMULATION TEST\n";
echo "=====================================\n\n";

// Test phone numbers
$testPhones = [
    "+639639283365",
    "09639283365", 
    "9639283365",
    "+639123456789"
];

echo "📱 Testing phone verification simulation for multiple formats:\n\n";

foreach ($testPhones as $index => $testPhone) {
    echo "🔔 TEST #" . ($index + 1) . " - Phone: {$testPhone}\n";
    echo "----------------------------------------\n";
    
    // Test 1: Send verification code
    echo "📤 Step 1: Sending verification code...\n";
    
    $request = new Request();
    $request->merge([
        'phone' => $testPhone
    ]);
    
    try {
        $controller = new AuthController();
        $response = $controller->sendPhoneVerificationCode($request);
        
        echo "✅ Send Code Result:\n";
        echo "   Status: " . ($response->getData()->success ? "Success" : "Failed") . "\n";
        echo "   Message: " . $response->getData()->message . "\n";
        
        if (isset($response->getData()->debug_code)) {
            echo "   Debug Code: " . $response->getData()->debug_code . "\n";
        }
        
        if (isset($response->getData()->simulation_mode)) {
            echo "   Simulation Mode: " . ($response->getData()->simulation_mode ? "Yes" : "No") . "\n";
        }
        
        if (isset($response->getData()->timestamp)) {
            echo "   Timestamp: " . $response->getData()->timestamp . "\n";
        }
        
        // Test 2: Verify the code
        echo "\n📥 Step 2: Verifying the code...\n";
        
        $verificationRequest = new Request();
        $verificationRequest->merge([
            'phone' => $testPhone,
            'code' => $response->getData()->debug_code ?? '123456'
        ]);
        
        $verifyResponse = $controller->verifyPhoneCode($verificationRequest);
        
        echo "✅ Verify Code Result:\n";
        echo "   Status: " . ($verifyResponse->getData()->success ? "Success" : "Failed") . "\n";
        echo "   Message: " . $verifyResponse->getData()->message . "\n";
        
        if (isset($verifyResponse->getData()->simulation_mode)) {
            echo "   Simulation Mode: " . ($verifyResponse->getData()->simulation_mode ? "Yes" : "No") . "\n";
        }
        
        // Test 3: Try to verify with wrong code
        echo "\n❌ Step 3: Testing with wrong code...\n";
        
        $wrongRequest = new Request();
        $wrongRequest->merge([
            'phone' => $testPhone,
            'code' => '000000'
        ]);
        
        $wrongResponse = $controller->verifyPhoneCode($wrongRequest);
        
        echo "❌ Wrong Code Result:\n";
        echo "   Status: " . ($wrongResponse->getData()->success ? "Success" : "Failed") . "\n";
        echo "   Message: " . $wrongResponse->getData()->message . "\n";
        
    } catch (Exception $e) {
        echo "❌ Error: " . $e->getMessage() . "\n";
    }
    
    echo "\n" . str_repeat("=", 50) . "\n\n";
}

echo "📋 LOGGING INFORMATION:\n";
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

echo "🚀 TO ENABLE REAL SMS:\n";
echo "=====================\n";
echo "1. Add MessageBird credentials to .env file:\n";
echo "   MESSAGEBIRD_ACCESS_KEY=your_access_key_here\n";
echo "   MESSAGEBIRD_ORIGINATOR=your_originator_here\n";
echo "2. Add funds to your MessageBird wallet\n";
echo "3. Restart the Laravel server\n\n";

echo "📞 API ENDPOINTS:\n";
echo "================\n";
echo "Send Code: POST http://127.0.0.1:8000/api/send-phone-verification-code\n";
echo "Verify Code: POST http://127.0.0.1:8000/api/verify-phone-code\n\n";

echo "🎯 TEST COMPLETED! Check the logs for detailed simulation information.\n"; 