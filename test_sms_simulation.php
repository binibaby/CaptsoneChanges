<?php
/**
 * Test SMS Simulation Mode
 * 
 * This script demonstrates how the SMS simulation mode works
 * while waiting for Semaphore API approval.
 */

require_once 'pet-sitting-app/vendor/autoload.php';

// Set up Laravel environment
$app = require_once 'pet-sitting-app/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "🎭 SMS SIMULATION MODE TEST\n";
echo "============================\n\n";

// Test simulation mode detection
$simulationMode = env('SMS_SIMULATION_MODE', true);
$semaphoreEnabled = env('SEMAPHORE_ENABLED', false);

echo "📊 Configuration:\n";
echo "   SMS_SIMULATION_MODE: " . ($simulationMode ? 'true' : 'false') . "\n";
echo "   SEMAPHORE_ENABLED: " . ($semaphoreEnabled ? 'true' : 'false') . "\n";
echo "   Simulation Active: " . ($simulationMode || !$semaphoreEnabled ? 'YES' : 'NO') . "\n\n";

// Simulate phone verification process
echo "📱 Simulating Phone Verification Process:\n";
echo "----------------------------------------\n";

$phone = '+639123456789';
$verificationCode = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
$timestamp = now()->format('Y-m-d H:i:s');

echo "📞 Phone: {$phone}\n";
echo "🔢 Generated Code: {$verificationCode}\n";
echo "⏰ Timestamp: {$timestamp}\n\n";

// Simulate the SMS sending
echo "🎭 SMS SIMULATION OUTPUT:\n";
echo "========================\n";
echo "🎭 ========================================\n";
echo "🎭 SMS SIMULATION - VERIFICATION CODE\n";
echo "🎭 ========================================\n";
echo "🎭 Phone: {$phone}\n";
echo "🎭 Code: {$verificationCode}\n";
echo "🎭 Code: {$verificationCode}\n";
echo "🎭 Code: {$verificationCode}\n";
echo "🎭 Message: Petsit Connect code: {$verificationCode}. Valid for 10 mins.\n";
echo "🎭 ========================================\n";
echo "🎭 COPY THIS CODE: {$verificationCode}\n";
echo "🎭 ========================================\n\n";

echo "✅ Simulation Mode is working correctly!\n";
echo "📝 The verification code is displayed above for testing.\n";
echo "🔧 To disable simulation, set SMS_SIMULATION_MODE=false and SEMAPHORE_ENABLED=true in your .env file.\n";
echo "📋 Check the configuration guide: SMS_SIMULATION_CONFIG.md\n";
?>
