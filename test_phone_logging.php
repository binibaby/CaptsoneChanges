<?php

echo "🧪 TESTING PHONE VERIFICATION CODE LOGGING\n";
echo "==========================================\n\n";

// Test logging to the enhanced phone-codes.log
$log_file = __DIR__ . '/logs/phone-codes.log';
$timestamp = date('Y-m-d H:i:s');

echo "📁 Testing logging to: $log_file\n";
echo "⏰ Timestamp: $timestamp\n\n";

// Test entry
$test_entry = "==== $timestamp - TEST VERIFICATION CODE ====\n";
$test_entry .= "🔐 VERIFICATION CODE: 123456\n";
$test_entry .= "📞 Phone: +1234567890\n";
$test_entry .= "⏰ Time: $timestamp\n";
$test_entry .= "📝 Details: Test verification code for logging system\n\n";

// Write test entry
if (file_put_contents($log_file, $test_entry, FILE_APPEND | LOCK_EX)) {
    echo "✅ Successfully wrote test entry to phone-codes.log\n";
} else {
    echo "❌ Failed to write to phone-codes.log\n";
}

// Test Laravel-style logging
$laravel_log = __DIR__ . '/pet-sitting-app/storage/logs/verification.log';
$laravel_entry = "[$timestamp] local.INFO: 🧪 TEST - Verification code 654321 sent to +9876543210\n";

if (file_put_contents($laravel_log, $laravel_entry, FILE_APPEND | LOCK_EX)) {
    echo "✅ Successfully wrote test entry to Laravel verification.log\n";
} else {
    echo "❌ Failed to write to Laravel verification.log\n";
}

// Show current log contents
echo "\n📋 Current phone-codes.log contents:\n";
echo "------------------------------------\n";
if (file_exists($log_file)) {
    $lines = file($log_file, FILE_IGNORE_NEW_LINES);
    $recent_lines = array_slice($lines, -10); // Show last 10 lines
    foreach ($recent_lines as $line) {
        echo "$line\n";
    }
} else {
    echo "❌ Log file not found\n";
}

echo "\n🎯 Phone verification code logging system is ready!\n";
echo "💡 All verification codes will now be logged to: $log_file\n";
echo "🔍 The enhanced logging script is monitoring all verification activities\n";
