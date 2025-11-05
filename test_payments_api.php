<?php
/**
 * Test script to check payments API and database
 */

require_once 'pet-sitting-app/vendor/autoload.php';

// Bootstrap Laravel
$app = require_once 'pet-sitting-app/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Payment;
use App\Models\User;
use App\Models\Booking;

echo "=== Payments API Test ===\n\n";

// Check if there are any payments in the database
$totalPayments = Payment::count();
echo "📊 Total payments in database: {$totalPayments}\n";

if ($totalPayments > 0) {
    $payments = Payment::with(['booking.user', 'booking.sitter'])->limit(5)->get();
    echo "📋 Sample payments:\n";
    foreach ($payments as $payment) {
        echo "  - ID: {$payment->id}, Amount: {$payment->amount}, Status: {$payment->status}\n";
        echo "    Booking ID: {$payment->booking_id}\n";
        if ($payment->booking) {
            echo "    Owner: {$payment->booking->user->name} (ID: {$payment->booking->user_id})\n";
            echo "    Sitter: {$payment->booking->sitter->name} (ID: {$payment->booking->sitter_id})\n";
        }
        echo "\n";
    }
} else {
    echo "❌ No payments found in database\n";
}

// Check for pet owners
$petOwners = User::where('role', 'pet_owner')->get();
echo "👥 Pet owners in database: {$petOwners->count()}\n";

if ($petOwners->count() > 0) {
    echo "📋 Sample pet owners:\n";
    foreach ($petOwners->take(3) as $owner) {
        echo "  - {$owner->name} (ID: {$owner->id}, Email: {$owner->email})\n";
    }
}

// Check for bookings
$totalBookings = Booking::count();
echo "\n📅 Total bookings in database: {$totalBookings}\n";

if ($totalBookings > 0) {
    $bookings = Booking::with(['user', 'sitter'])->limit(3)->get();
    echo "📋 Sample bookings:\n";
    foreach ($bookings as $booking) {
        echo "  - ID: {$booking->id}, Status: {$booking->status}\n";
        echo "    Owner: {$booking->user->name} (ID: {$booking->user_id})\n";
        echo "    Sitter: {$booking->sitter->name} (ID: {$booking->sitter_id})\n";
        echo "    Date: {$booking->date}\n\n";
    }
}

echo "\n=== Test Complete ===\n";
echo "To test the API endpoint:\n";
echo "1. Start the Laravel server: cd pet-sitting-app && php artisan serve\n";
echo "2. Test with: curl -H 'Authorization: Bearer YOUR_TOKEN' http://192.168.100.204:8000/api/payments/history\n";
?>
