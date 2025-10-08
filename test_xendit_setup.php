<?php
/**
 * Test script to verify Xendit integration setup
 */

echo "🧪 Testing Xendit Integration Setup\n";
echo "==================================\n\n";

// Test 1: Check if Laravel server is running
echo "1. Testing Laravel Server Connection...\n";
$response = file_get_contents('http://localhost:8000/api/health');
if ($response) {
    $data = json_decode($response, true);
    if ($data && $data['status'] === 'ok') {
        echo "   ✅ Laravel server is running\n";
    } else {
        echo "   ❌ Laravel server response invalid\n";
    }
} else {
    echo "   ❌ Laravel server not accessible\n";
}

// Test 2: Check webhook endpoints
echo "\n2. Testing Webhook Endpoints...\n";

// Test payment webhook
$context = stream_context_create([
    'http' => [
        'method' => 'POST',
        'header' => 'Content-Type: application/json',
        'content' => json_encode(['test' => 'webhook'])
    ]
]);

$paymentWebhook = file_get_contents('http://localhost:8000/api/webhooks/xendit/payment', false, $context);
if ($paymentWebhook !== false) {
    echo "   ✅ Payment webhook endpoint accessible\n";
} else {
    echo "   ❌ Payment webhook endpoint not accessible\n";
}

// Test disbursement webhook
$disbursementWebhook = file_get_contents('http://localhost:8000/api/webhooks/xendit/disbursement', false, $context);
if ($disbursementWebhook !== false) {
    echo "   ✅ Disbursement webhook endpoint accessible\n";
} else {
    echo "   ❌ Disbursement webhook endpoint not accessible\n";
}

// Test 3: Check if Xendit package is installed
echo "\n3. Testing Xendit Package Installation...\n";
if (class_exists('Xendit\Xendit')) {
    echo "   ✅ Xendit PHP package is installed\n";
} else {
    echo "   ❌ Xendit PHP package not found\n";
}

// Test 4: Check environment variables
echo "\n4. Testing Environment Configuration...\n";
$envFile = __DIR__ . '/pet-sitting-app/.env';
if (file_exists($envFile)) {
    $envContent = file_get_contents($envFile);
    if (strpos($envContent, 'XENDIT_SECRET_KEY') !== false) {
        echo "   ✅ Xendit environment variables found\n";
    } else {
        echo "   ❌ Xendit environment variables not found\n";
    }
} else {
    echo "   ❌ .env file not found\n";
}

// Test 5: Check database migration
echo "\n5. Testing Database Migration...\n";
try {
    $pdo = new PDO('sqlite:' . __DIR__ . '/pet-sitting-app/database/database.sqlite');
    $stmt = $pdo->query("PRAGMA table_info(users)");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $hasWalletBalance = false;
    foreach ($columns as $column) {
        if ($column['name'] === 'wallet_balance') {
            $hasWalletBalance = true;
            break;
        }
    }
    
    if ($hasWalletBalance) {
        echo "   ✅ wallet_balance column exists in users table\n";
    } else {
        echo "   ❌ wallet_balance column not found in users table\n";
    }
} catch (Exception $e) {
    echo "   ❌ Database connection failed: " . $e->getMessage() . "\n";
}

echo "\n🎉 Setup Test Complete!\n";
echo "\n📋 Next Steps:\n";
echo "1. Set up ngrok account and get authtoken\n";
echo "2. Run: ngrok authtoken YOUR_TOKEN\n";
echo "3. Run: ngrok http 8000\n";
echo "4. Copy the ngrok URL and configure webhooks in Xendit dashboard\n";
echo "5. Test the complete payment flow\n";

echo "\n🔗 Webhook URLs to configure in Xendit:\n";
echo "Payment: https://YOUR-NGROK-URL.ngrok.io/api/webhooks/xendit/payment\n";
echo "Disbursement: https://YOUR-NGROK-URL.ngrok.io/api/webhooks/xendit/disbursement\n";
?>
