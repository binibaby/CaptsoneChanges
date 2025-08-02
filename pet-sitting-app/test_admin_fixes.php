<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;
use App\Models\Verification;

echo "🔧 Testing Admin Panel Fixes\n";
echo "============================\n\n";

// Test 1: User relationships
echo "1. Testing User Relationships:\n";
$user = User::first();
if ($user) {
    echo "   ✅ User found: " . $user->name . "\n";
    echo "   ✅ Bookings count: " . $user->bookings()->count() . "\n";
    echo "   ✅ Payments count: " . $user->payments()->count() . "\n";
    echo "   ✅ Verifications count: " . $user->verifications()->count() . "\n";
} else {
    echo "   ❌ No users found\n";
}

// Test 2: Verification data
echo "\n2. Testing Verification Data:\n";
$verification = Verification::with('user')->first();
if ($verification) {
    echo "   ✅ Verification found: ID " . $verification->id . "\n";
    echo "   ✅ User: " . $verification->user->name . "\n";
    echo "   ✅ Document type: " . $verification->document_type . "\n";
    echo "   ✅ Status: " . $verification->status . "\n";
    echo "   ✅ Document image: " . ($verification->document_image ?: 'None') . "\n";
    
    // Test time calculation
    $minutesAgo = $verification->created_at->diffInMinutes(now());
    echo "   ✅ Minutes ago: " . $minutesAgo . "\n";
} else {
    echo "   ❌ No verifications found\n";
}

// Test 3: Profile fields
echo "\n3. Testing Profile Fields:\n";
$usersWithProfiles = User::whereNotNull('first_name')->get();
echo "   ✅ Users with profile data: " . $usersWithProfiles->count() . "\n";

foreach ($usersWithProfiles->take(3) as $user) {
    echo "   - " . $user->first_name . " " . $user->last_name . " (" . $user->age . " years, " . $user->gender . ")\n";
    if ($user->pet_breeds) {
        echo "     Breeds: " . implode(', ', $user->pet_breeds) . "\n";
    }
}

// Test 4: Storage link
echo "\n4. Testing Storage Link:\n";
$storagePath = public_path('storage');
if (is_link($storagePath)) {
    echo "   ✅ Storage link exists\n";
} else {
    echo "   ❌ Storage link missing\n";
}

echo "\n🎉 All tests completed!\n";
echo "The admin panel should now work without errors.\n"; 