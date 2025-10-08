<?php
/**
 * Test script for real-time notifications
 * This script simulates various notification events to test the real-time functionality
 */

require_once 'pet-sitting-app/vendor/autoload.php';

use Illuminate\Support\Facades\Event;
use App\Events\ProfileChangeApproved;
use App\Events\ProfileChangeRejected;
use App\Events\IdVerificationStatusUpdated;
use App\Models\User;
use App\Models\ProfileChangeRequest;
use App\Models\Verification;

// Bootstrap Laravel
$app = require_once 'pet-sitting-app/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "🧪 Testing Real-time Notifications\n";
echo "==================================\n\n";

// Test users
$petOwnerId = 5; // Pet Owner
$petSitterId = 21; // Pet Sitter

echo "📱 Testing notifications for Pet Owner (ID: $petOwnerId) and Pet Sitter (ID: $petSitterId)\n\n";

// Test 1: Profile Change Approved
echo "1️⃣ Testing Profile Change Approved notification...\n";
try {
    $user = User::find($petOwnerId);
    if ($user) {
        // Create a mock profile change request
        $profileRequest = new ProfileChangeRequest([
            'user_id' => $user->id,
            'field_name' => 'name',
            'old_value' => 'Old Name',
            'new_value' => 'New Name',
            'status' => 'approved',
            'admin_notes' => 'Test approval',
            'reviewed_by' => 1,
            'reviewed_at' => now(),
        ]);
        $profileRequest->save();
        
        // Broadcast the event
        event(new ProfileChangeApproved($profileRequest));
        echo "✅ Profile Change Approved event broadcasted\n";
    } else {
        echo "❌ Pet Owner not found\n";
    }
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}

echo "\n";

// Test 2: Profile Change Rejected
echo "2️⃣ Testing Profile Change Rejected notification...\n";
try {
    $user = User::find($petOwnerId);
    if ($user) {
        // Create a mock profile change request
        $profileRequest = new ProfileChangeRequest([
            'user_id' => $user->id,
            'field_name' => 'phone',
            'old_value' => '1234567890',
            'new_value' => '0987654321',
            'status' => 'rejected',
            'admin_notes' => 'Test rejection - invalid format',
            'reviewed_by' => 1,
            'reviewed_at' => now(),
        ]);
        $profileRequest->save();
        
        // Broadcast the event
        event(new ProfileChangeRejected($profileRequest));
        echo "✅ Profile Change Rejected event broadcasted\n";
    } else {
        echo "❌ Pet Owner not found\n";
    }
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}

echo "\n";

// Test 3: ID Verification Approved
echo "3️⃣ Testing ID Verification Approved notification...\n";
try {
    $user = User::find($petSitterId);
    if ($user) {
        // Create a mock verification
        $verification = new Verification([
            'user_id' => $user->id,
            'status' => 'approved',
            'verification_score' => 95,
            'verified_at' => now(),
            'verified_by' => 1,
            'document_type' => 'drivers_license',
            'extracted_data' => json_encode(['test' => 'data']),
        ]);
        $verification->save();
        
        // Broadcast the event
        event(new IdVerificationStatusUpdated($verification, $user, 'approved', 'Your ID verification has been approved!'));
        echo "✅ ID Verification Approved event broadcasted\n";
    } else {
        echo "❌ Pet Sitter not found\n";
    }
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}

echo "\n";

// Test 4: ID Verification Rejected
echo "4️⃣ Testing ID Verification Rejected notification...\n";
try {
    $user = User::find($petSitterId);
    if ($user) {
        // Create a mock verification
        $verification = new Verification([
            'user_id' => $user->id,
            'status' => 'rejected',
            'verification_score' => 45,
            'verified_at' => now(),
            'verified_by' => 1,
            'rejection_reason' => 'Document unclear',
            'document_type' => 'passport',
            'extracted_data' => json_encode(['test' => 'data']),
        ]);
        $verification->save();
        
        // Broadcast the event
        event(new IdVerificationStatusUpdated($verification, $user, 'rejected', 'Your ID verification has been rejected. Please resubmit with clearer documents.'));
        echo "✅ ID Verification Rejected event broadcasted\n";
    } else {
        echo "❌ Pet Sitter not found\n";
    }
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}

echo "\n";

// Test 5: Booking Status Update (simulated)
echo "5️⃣ Testing Booking Status Update notification...\n";
try {
    // Simulate a booking confirmation event
    $bookingData = [
        'booking_id' => 'test-' . time(),
        'user_id' => $petOwnerId,
        'sitter_id' => $petSitterId,
        'status' => 'confirmed',
        'date' => now()->format('Y-m-d'),
        'start_time' => '10:00 AM',
        'end_time' => '2:00 PM',
        'hourly_rate' => 25,
        'sitter_name' => 'Test Sitter',
        'pet_owner_name' => 'Test Owner',
    ];
    
    // This would normally be handled by a BookingStatusUpdated event
    // For now, we'll simulate it by creating a notification directly
    \App\Models\Notification::create([
        'user_id' => $petOwnerId,
        'type' => 'booking',
        'title' => 'Booking Confirmed',
        'message' => 'Your booking has been confirmed by the pet sitter!',
        'data' => json_encode($bookingData),
        'is_read' => false,
    ]);
    
    echo "✅ Booking Status Update notification created\n";
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}

echo "\n";

echo "🎉 Real-time notification tests completed!\n";
echo "Check your mobile app to see if notifications appear in real-time.\n";
echo "Make sure Laravel Reverb is running: php artisan reverb:start\n";
echo "And that your mobile app is connected to the same network.\n";
?>
