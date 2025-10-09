<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Fix bookings that are marked as 'completed' but should be 'active'
        // These are bookings where payment was successful but the job hasn't actually finished
        
        $today = now()->format('Y-m-d');
        $now = now();
        
        // Find bookings marked as 'completed' that are either:
        // 1. In the future
        // 2. Today but haven't started yet
        // 3. Today but haven't finished yet
        
        $incorrectBookings = DB::table('bookings')
            ->where('status', 'completed')
            ->where(function ($query) use ($today) {
                // Future bookings
                $query->where('date', '>', $today);
            })
            ->get();
        
        if ($incorrectBookings->count() > 0) {
            echo "Found {$incorrectBookings->count()} bookings incorrectly marked as 'completed'. Fixing...\n";
            
            foreach ($incorrectBookings as $booking) {
                echo "Fixing booking ID {$booking->id} (date: {$booking->date})\n";
            }
            
            // Update these bookings to 'active' status
            DB::table('bookings')
                ->where('status', 'completed')
                ->where('date', '>', $today)
                ->update(['status' => 'active']);
                
            echo "Fixed {$incorrectBookings->count()} bookings.\n";
        } else {
            echo "No incorrectly marked bookings found.\n";
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // This migration is not reversible as we can't determine
        // which bookings were originally 'completed' vs 'active'
    }
};
