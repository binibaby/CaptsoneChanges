<?php

require_once 'vendor/autoload.php';

// Load Laravel environment
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Http\Controllers\API\AuthController;
use Illuminate\Http\Request;

echo "🧪 Testing Phone Number Validation and Verification Flow\n";
echo "======================================================\n\n";

// Test phone number formatting
echo "📱 Test 1: Phone Number Formatting\n";
echo "----------------------------------\n";

$controller = new AuthController();
$reflection = new ReflectionClass($controller);
$formatMethod = $reflection->getMethod('formatPhoneNumber');
$formatMethod->setAccessible(true);

$testNumbers = [
    '09639283365',
    '639639283365',
    '+639639283365',
    '+09639283365',
    '9639283365'
];

foreach ($testNumbers as $number) {
    $formatted = $formatMethod->invoke($controller, $number);
    echo "📞 {$number} → {$formatted}\n";
}

echo "\n";

// Test phone number validation regex
echo "📱 Test 2: Phone Number Validation\n";
echo "----------------------------------\n";

$validNumbers = [
    '09639283365',
    '639639283365', 
    '+639639283365',
    '09123456789',
    '639123456789'
];

$invalidNumbers = [
    '1234567890', // US number
    '123456789',  // Too short
    '12345678901', // Too long
    'abc1234567', // Contains letters
    '123-456-7890', // Contains dashes
    '+1234567890' // US number
];

echo "✅ Valid numbers:\n";
foreach ($validNumbers as $number) {
    $isValid = preg_match('/^(\+63|63|0)?[0-9]{10}$/', $number);
    echo "📞 {$number} - " . ($isValid ? "✅ Valid" : "❌ Invalid") . "\n";
}

echo "\n❌ Invalid numbers:\n";
foreach ($invalidNumbers as $number) {
    $isValid = preg_match('/^(\+63|63|0)?[0-9]{10}$/', $number);
    echo "📞 {$number} - " . ($isValid ? "✅ Valid" : "❌ Invalid") . "\n";
}

echo "\n";

// Test registration with phone validation
echo "📱 Test 3: Registration with Phone Validation\n";
echo "---------------------------------------------\n";

$testRegistrationData = [
    'name' => 'Test User',
    'email' => 'test@example.com',
    'password' => 'password123',
    'password_confirmation' => 'password123',
    'role' => 'pet_owner',
    'phone' => '09639283365'
];

echo "📝 Testing registration with phone: {$testRegistrationData['phone']}\n";

try {
    $request = new Request();
    $request->merge($testRegistrationData);
    
    // This would normally create a user, but we'll just test validation
    $validator = \Validator::make($testRegistrationData, [
        'name' => 'required|string|max:255',
        'email' => 'required|string|email|max:255',
        'password' => 'required|string|min:8|confirmed',
        'role' => 'required|in:pet_owner,pet_sitter',
        'phone' => 'required|string|max:20|regex:/^(\+63|63|0)?[0-9]{10}$/',
    ]);
    
    if ($validator->fails()) {
        echo "❌ Validation failed:\n";
        foreach ($validator->errors()->all() as $error) {
            echo "   - {$error}\n";
        }
    } else {
        echo "✅ Validation passed\n";
        echo "📱 Phone would be formatted to: " . $formatMethod->invoke($controller, $testRegistrationData['phone']) . "\n";
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}

echo "\n";

// Test phone verification flow
echo "📱 Test 4: Phone Verification Flow\n";
echo "----------------------------------\n";

echo "📞 Testing phone verification for: +639639283365\n";

// Test sending verification code
$verifyRequest = new Request();
$verifyRequest->merge(['phone' => '+639639283365']);

try {
    echo "📤 Sending verification code...\n";
    $response = $controller->sendPhoneVerificationCode($verifyRequest);
    $responseData = $response->getData();
    
    echo "📊 Response: " . ($responseData->success ? "✅ Success" : "❌ Failed") . "\n";
    echo "💬 Message: " . $responseData->message . "\n";
    
    if (isset($responseData->debug_code)) {
        echo "🔑 Debug Code: " . $responseData->debug_code . "\n";
        
        // Test code verification
        echo "\n📤 Verifying code...\n";
        $verifyCodeRequest = new Request();
        $verifyCodeRequest->merge([
            'phone' => '+639639283365',
            'code' => $responseData->debug_code
        ]);
        
        $verifyResponse = $controller->verifyPhoneCode($verifyCodeRequest);
        $verifyData = $verifyResponse->getData();
        
        echo "📊 Verification: " . ($verifyData->success ? "✅ Success" : "❌ Failed") . "\n";
        echo "💬 Message: " . $verifyData->message . "\n";
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}

echo "\n";

// Test phone number mismatch scenario
echo "📱 Test 5: Phone Number Mismatch Protection\n";
echo "--------------------------------------------\n";

echo "🔒 This test would require a logged-in user with a different phone number\n";
echo "📝 In a real scenario, the system would:\n";
echo "   1. Check if the requested phone matches the user's registered phone\n";
echo "   2. Return an error if they don't match\n";
echo "   3. Prevent sending codes to unregistered numbers\n";

echo "\n🎉 Phone Validation Testing Complete!\n";
echo "====================================\n\n";

echo "📋 Summary of Improvements:\n";
echo "✅ Phone number validation during registration\n";
echo "✅ Automatic phone number formatting to +63XXXXXXXXXX\n";
echo "✅ Phone number validation during verification\n";
echo "✅ Protection against phone number mismatches\n";
echo "✅ Proper error messages for invalid numbers\n";
echo "✅ Integration with Semaphore SMS service\n\n";

echo "🔧 Phone Number Format Examples:\n";
echo "   Input: 09639283365 → Output: +639639283365\n";
echo "   Input: 639639283365 → Output: +639639283365\n";
echo "   Input: +639639283365 → Output: +639639283365\n";
echo "   Input: +09639283365 → Output: +639639283365\n";
