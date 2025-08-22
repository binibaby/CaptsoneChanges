<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     * 
     * IMPORTANT: This seeder is intentionally left empty to ensure
     * the database starts completely clean with 0 users and no template data.
     * 
     * All template data seeders have been disabled:
     * - TestUsersSeeder: DISABLED
     * - AdminUserSeeder: DISABLED  
     * - TestVerificationsSeeder: DISABLED
     * 
     * The database will start fresh for new user registrations only.
     */
    public function run(): void
    {
        // Database starts completely clean with 0 users
        // No template data will be created
        
        // To create test data for development, manually run specific seeders
        // or uncomment the lines below:
        // $this->call([
        //     TestUsersSeeder::class,
        //     AdminUserSeeder::class,
        //     TestVerificationsSeeder::class,
        // ]);
    }
}
