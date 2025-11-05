<?php
/**
 * Simple test to check payments API directly
 */

require_once 'pet-sitting-app/vendor/autoload.php';

// Bootstrap Laravel
$app = require_once 'pet-sitting-app/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Payment;
use App\Models\User;
use Illuminate\Support\Facades\Auth;

echo "=== Simple Payments Test ===\n\n";

// Find a pet owner user
$petOwner = User::where('role', 'pet_owner')->first();

if (!$petOwner) {
    echo "❌ No pet owner found\n";
    exit(1);
}

echo "👤 Testing with user: {$petOwner->name} (ID: {$petOwner->id})\n";

// Authenticate the user
Auth::login($petOwner);

// Test the PaymentController directly
$controller = new \App\Http\Controllers\API\PaymentController(new \App\Services\XenditService());
$request = new \Illuminate\Http\Request();

echo "🔍 Testing getPaymentHistory method directly...\n";

try {
    $response = $controller->getPaymentHistory($request);
    $data = $response->getData(true);
    
    echo "✅ API call successful!\n";
    echo "📊 Response data:\n";
    echo json_encode($data, JSON_PRETTY_PRINT);
    
    if (isset($data['data']) && is_array($data['data'])) {
        echo "\n📋 Found " . count($data['data']) . " payments\n";
        
        $totalSpent = 0;
        foreach ($data['data'] as $payment) {
            if ($payment['status'] === 'completed') {
                $totalSpent += floatval($payment['amount']);
            }
        }
        
        echo "💰 Total spent: ₱" . number_format($totalSpent, 2) . "\n";
    } else {
        echo "❌ No payments data found\n";
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Stack trace: " . $e->getTraceAsString() . "\n";
}

echo "\n=== Test Complete ===\n";
?>
