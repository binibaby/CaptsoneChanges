<?php
/**
 * Test script to get a valid auth token for testing
 */

require_once 'pet-sitting-app/vendor/autoload.php';

// Bootstrap Laravel
$app = require_once 'pet-sitting-app/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;
use Laravel\Sanctum\PersonalAccessToken;

echo "=== Auth Token Test ===\n\n";

// Find a pet owner user
$petOwner = User::where('role', 'pet_owner')->first();

if (!$petOwner) {
    echo "❌ No pet owner found in database\n";
    exit(1);
}

echo "👤 Found pet owner: {$petOwner->name} (ID: {$petOwner->id})\n";
echo "📧 Email: {$petOwner->email}\n";

// Create a personal access token
$token = $petOwner->createToken('test-token', ['*']);

echo "🔑 Created token: {$token->plainTextToken}\n";
echo "\n=== Test API with this token ===\n";
echo "curl -X GET \"http://192.168.100.204:8000/api/payments/history\" \\\n";
echo "  -H \"Content-Type: application/json\" \\\n";
echo "  -H \"Authorization: Bearer {$token->plainTextToken}\"\n\n";

echo "=== Test Complete ===\n";
?>
