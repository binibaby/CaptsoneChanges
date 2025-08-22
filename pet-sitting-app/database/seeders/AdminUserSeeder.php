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
        // DISABLED: No template admin users or sample data will be created
        // Database starts completely clean with 0 users
        
        // This seeder is disabled to ensure a fresh start
        // All template data has been removed
    }
}
