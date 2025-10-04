<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class TestUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create a test pet owner
        $petOwner = User::create([
            'name' => 'Test Pet Owner',
            'email' => 'petowner@test.com',
            'password' => Hash::make('password123'),
            'role' => 'pet_owner',
            'phone' => '+639123456789',
            'email_verified_at' => now(),
            'phone_verified_at' => now(),
            'status' => 'active',
        ]);

        // Create a test pet sitter
        $petSitter = User::create([
            'name' => 'Test Pet Sitter',
            'email' => 'petsitter@test.com',
            'password' => Hash::make('password123'),
            'role' => 'pet_sitter',
            'phone' => '+639987654321',
            'email_verified_at' => now(),
            'phone_verified_at' => now(),
            'status' => 'active',
            'bio' => 'I love taking care of pets!',
        ]);

        // Generate Sanctum tokens for API testing
        $petOwnerToken = $petOwner->createToken('test-token')->plainTextToken;
        $petSitterToken = $petSitter->createToken('test-token')->plainTextToken;

        $this->command->info('Test users created:');
        $this->command->info('Pet Owner: petowner@test.com (Token: ' . $petOwnerToken . ')');
        $this->command->info('Pet Sitter: petsitter@test.com (Token: ' . $petSitterToken . ')');
    }
}
