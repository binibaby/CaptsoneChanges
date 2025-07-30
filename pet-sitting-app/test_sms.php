<?php

require_once 'vendor/autoload.php';

// Load Laravel environment
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Http\Request;
use App\Http\Controllers\API\AuthController;

echo "🧪 Testing SMS Verification System\n";
echo "================================\n\n";

// Test phone number (replace with your actual number)
$testPhone = "+639639283365"; // Replace with your phone number

echo "📱 Testing SMS verification for: {$testPhone}\n\n";

// Create a mock request
$request = new Request();
$request->merge([
    'phone' => $testPhone
]);

// Test the SMS sending
try {
    $controller = new AuthController();
    $response = $controller->sendPhoneVerificationCode($request);
    
    echo "✅ SMS Test Results:\n";
    echo "Status: " . ($response->getData()->success ? "Success" : "Failed") . "\n";
    echo "Message: " . $response->getData()->message . "\n";
    
    if (isset($response->getData()->debug_code)) {
        echo "Debug Code: " . $response->getData()->debug_code . "\n";
    }
    
    if (isset($response->getData()->note)) {
        echo "Note: " . $response->getData()->note . "\n";
    }
    
    echo "\n📋 To check the verification code:\n";
    echo "1. Check Laravel logs: tail -f storage/logs/laravel.log\n";
    echo "2. Look for lines starting with '📱 SMS'\n";
    echo "3. The verification code will be in the log message\n\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}

echo "🔧 To enable real SMS:\n";
echo "1. Add your MessageBird access key to .env file\n";
echo "2. Add your MessageBird originator to .env file\n";
echo "3. Add funds to your MessageBird wallet\n";
echo "4. Restart the Laravel server\n\n";

echo "📞 Test API endpoint:\n";
echo "curl -X POST http://127.0.0.1:8000/api/send-phone-verification-code \\\n";
echo "  -H \"Content-Type: application/json\" \\\n";
echo "  -d '{\"phone\":\"{$testPhone}\"}'\n"; 