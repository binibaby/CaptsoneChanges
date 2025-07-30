<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Booking;
use App\Models\Payment;
use App\Models\SupportTicket;
use App\Models\Notification;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create or update admin user
        $admin = User::updateOrCreate(
            ['email' => 'admin@petsitconnect.com'],
            [
                'name' => 'Admin User',
                'password' => Hash::make('admin123'),
                'role' => 'admin',
                'status' => 'active',
                'is_admin' => true,
                'phone' => '+1234567890',
                'address' => 'Admin Address',
                'approved_at' => now(),
            ]
        );

        // Create or update sample users
        $petOwner = User::updateOrCreate(
            ['email' => 'john@example.com'],
            [
                'name' => 'John Pet Owner',
                'password' => Hash::make('password'),
                'role' => 'pet_owner',
                'status' => 'active',
                'phone' => '+1234567891',
                'address' => '123 Pet Street',
                'approved_at' => now(),
            ]
        );

        $petSitter = User::updateOrCreate(
            ['email' => 'jane@example.com'],
            [
                'name' => 'Jane Pet Sitter',
                'password' => Hash::make('password'),
                'role' => 'pet_sitter',
                'status' => 'active',
                'phone' => '+1234567892',
                'address' => '456 Sitter Avenue',
                'approved_at' => now(),
                'rating' => 4.5,
            ]
        );

        // Create sample booking
        $booking = Booking::create([
            'user_id' => $petOwner->id,
            'sitter_id' => $petSitter->id,
            'date' => now()->addDays(1)->toDateString(),
            'time' => '10:00:00',
            'status' => 'confirmed',
        ]);

        // Create sample payment
        $payment = Payment::create([
            'booking_id' => $booking->id,
            'amount' => 600.00,
            'method' => 'stripe',
            'app_share' => 120.00,
            'sitter_share' => 480.00,
            'status' => 'paid',
        ]);

        // Create sample support ticket
        $ticket = SupportTicket::create([
            'user_id' => $petOwner->id,
            'ticket_number' => 'TICKET_' . time(),
            'subject' => 'Payment Issue',
            'description' => 'I am having trouble with my payment. Can you help?',
            'category' => 'billing',
            'priority' => 'medium',
            'status' => 'open',
            'type' => 'support_ticket',
        ]);

        // Create sample notifications
        Notification::create([
            'user_id' => $petOwner->id,
            'type' => 'booking',
            'message' => 'Your booking with Jane Pet Sitter has been confirmed.',
        ]);

        Notification::create([
            'user_id' => $petSitter->id,
            'type' => 'booking',
            'message' => 'You have a new booking request from John Pet Owner.',
        ]);

        $this->command->info('Admin user and sample data created successfully!');
        $this->command->info('Admin Email: admin@petsitconnect.com');
        $this->command->info('Admin Password: admin123');
    }
}
