<?php

echo "🧪 TESTING VERIFICATION CODE LOGGING\n";
echo "====================================\n\n";

// Generate a test verification code
$verification_code = sprintf("%06d", rand(100000, 999999));
$phone_number = "+1" . sprintf("%010d", rand(1000000000, 9999999999));
$timestamp = date('Y-m-d H:i:s');

echo "🔐 Generated Test Verification Code: $verification_code\n";
echo "📞 Phone Number: $phone_number\n";
echo "⏰ Timestamp: $timestamp\n\n";

// Test logging to Laravel verification log
$laravel_log = __DIR__ . '/pet-sitting-app/storage/logs/verification.log';
$log_entry = "[$timestamp] local.INFO: 🔐 VERIFICATION CODE $verification_code sent to $phone_number via SMS\n";

if (file_put_contents($laravel_log, $log_entry, FILE_APPEND | LOCK_EX)) {
    echo "✅ Successfully logged to Laravel verification.log\n";
} else {
    echo "❌ Failed to log to Laravel verification.log\n";
}

// Test logging to main phone-codes.log
$main_log = __DIR__ . '/logs/phone-codes.log';
$main_entry = "==== $timestamp - TEST VERIFICATION CODE ====\n";
$main_entry .= "🔐 VERIFICATION CODE: $verification_code\n";
$main_entry .= "📞 Phone: $phone_number\n";
$main_entry .= "⏰ Time: $timestamp\n";
$main_entry .= "📝 Details: Test verification code for logging system\n\n";

if (file_put_contents($main_log, $main_entry, FILE_APPEND | LOCK_EX)) {
    echo "✅ Successfully logged to main phone-codes.log\n";
} else {
    echo "❌ Failed to log to main phone-codes.log\n";
}

// Test Laravel-style logging
$laravel_main_log = __DIR__ . '/pet-sitting-app/storage/logs/laravel.log';
$laravel_entry = "[$timestamp] local.INFO: 📱 SMS VERIFICATION - Code $verification_code sent to $phone_number\n";

if (file_put_contents($laravel_main_log, $laravel_entry, FILE_APPEND | LOCK_EX)) {
    echo "✅ Successfully logged to Laravel main log\n";
} else {
    echo "❌ Failed to log to Laravel main log\n";
}

echo "\n🎯 Verification code logging test completed!\n";
echo "🔐 Code: $verification_code should now appear in your logs\n";
echo "📱 Check the enhanced logging system for real-time updates\n";
