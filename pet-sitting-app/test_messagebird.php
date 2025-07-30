<?php

echo "🧪 MessageBird Integration Test\n";
echo "==============================\n\n";

// Check if MessageBird credentials are configured
$envFile = '.env';
$envContent = file_get_contents($envFile);

if (strpos($envContent, 'your_access_key_here') !== false) {
    echo "❌ MessageBird credentials not configured yet\n";
    echo "Please update your .env file with:\n";
    echo "MESSAGEBIRD_ACCESS_KEY=your_actual_access_key\n";
    echo "MESSAGEBIRD_ORIGINATOR=PetsitConnect\n\n";
    
    echo "📋 Steps to get credentials:\n";
    echo "1. Go to https://messagebird.com\n";
    echo "2. Sign up for free account\n";
    echo "3. Go to Developer → Access Keys\n";
    echo "4. Copy your access key\n";
    echo "5. Go to Channels → SMS to set up originator\n";
    echo "6. Update .env file and restart server\n\n";
} else {
    echo "✅ MessageBird credentials configured\n";
    echo "Testing SMS functionality...\n\n";
    
    // Test the API endpoint
    $testPhone = "+639639283365";
    $command = "curl -s -X POST http://127.0.0.1:8000/api/send-verification-code " .
               "-H \"Content-Type: application/json\" " .
               "-d '{\"phone\":\"{$testPhone}\"}'";
    
    $response = shell_exec($command);
    $data = json_decode($response, true);
    
    if ($data && $data['success']) {
        echo "✅ SMS test successful!\n";
        echo "Message: " . $data['message'] . "\n";
        
        if (isset($data['message_id'])) {
            echo "Message ID: " . $data['message_id'] . "\n";
            echo "🎉 Real SMS sent via MessageBird!\n";
        } else {
            echo "📝 Note: " . $data['note'] . "\n";
        }
    } else {
        echo "❌ SMS test failed\n";
        echo "Response: " . $response . "\n";
    }
}

echo "\n📱 To test manually:\n";
echo "curl -X POST http://127.0.0.1:8000/api/send-verification-code \\\n";
echo "  -H \"Content-Type: application/json\" \\\n";
echo "  -d '{\"phone\":\"+639639283365\"}'\n"; 