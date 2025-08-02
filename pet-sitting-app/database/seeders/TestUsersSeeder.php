<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class TestUsersSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create Pet Owners
        User::create([
            'name' => 'John Doe',
            'first_name' => 'John',
            'last_name' => 'Doe',
            'email' => 'john.doe@example.com',
            'password' => Hash::make('password123'),
            'role' => 'pet_owner',
            'status' => 'active',
            'phone' => '+639123456789',
            'address' => '123 Main Street, Manila, Philippines',
            'gender' => 'male',
            'age' => 28,
            'pet_breeds' => ['Golden Retriever', 'Labrador Retriever'],
            'bio' => 'I love taking care of dogs and cats. Looking for reliable pet sitters.',
            'email_verified_at' => now(),
            'phone_verified_at' => now(),
        ]);

        User::create([
            'name' => 'Maria Santos',
            'first_name' => 'Maria',
            'last_name' => 'Santos',
            'email' => 'maria.santos@example.com',
            'password' => Hash::make('password123'),
            'role' => 'pet_owner',
            'status' => 'active',
            'phone' => '+639234567890',
            'address' => '456 Oak Avenue, Quezon City, Philippines',
            'gender' => 'female',
            'age' => 32,
            'pet_breeds' => ['Persian Cat', 'Siamese Cat'],
            'bio' => 'Cat lover with two beautiful Persian cats. Need help when traveling.',
            'email_verified_at' => now(),
            'phone_verified_at' => now(),
        ]);

        // Create Pet Sitters
        User::create([
            'name' => 'Pedro Cruz',
            'first_name' => 'Pedro',
            'last_name' => 'Cruz',
            'email' => 'pedro.cruz@example.com',
            'password' => Hash::make('password123'),
            'role' => 'pet_sitter',
            'status' => 'active',
            'phone' => '+639345678901',
            'address' => '789 Pine Street, Makati, Philippines',
            'gender' => 'male',
            'age' => 25,
            'pet_breeds' => ['All Breeds'],
            'bio' => 'Professional pet sitter with 3 years experience. Certified in pet first aid.',
            'email_verified_at' => now(),
            'phone_verified_at' => now(),
            'id_verified' => true,
            'id_verified_at' => now(),
            'can_accept_bookings' => true,
        ]);

        User::create([
            'name' => 'Ana Reyes',
            'first_name' => 'Ana',
            'last_name' => 'Reyes',
            'email' => 'ana.reyes@example.com',
            'password' => Hash::make('password123'),
            'role' => 'pet_sitter',
            'status' => 'pending_verification',
            'phone' => '+639456789012',
            'address' => '321 Elm Street, Taguig, Philippines',
            'gender' => 'female',
            'age' => 29,
            'pet_breeds' => ['Small Dogs', 'Cats'],
            'bio' => 'Experienced with small dogs and cats. Available for home visits.',
            'email_verified_at' => now(),
            'phone_verified_at' => now(),
        ]);

        User::create([
            'name' => 'Carlos Mendoza',
            'first_name' => 'Carlos',
            'last_name' => 'Mendoza',
            'email' => 'carlos.mendoza@example.com',
            'password' => Hash::make('password123'),
            'role' => 'pet_sitter',
            'status' => 'active',
            'phone' => '+639567890123',
            'address' => '654 Maple Drive, Pasig, Philippines',
            'gender' => 'male',
            'age' => 35,
            'pet_breeds' => ['Large Dogs', 'Working Dogs'],
            'bio' => 'Specialized in large and working dogs. Available for overnight stays.',
            'email_verified_at' => now(),
            'phone_verified_at' => now(),
            'id_verified' => true,
            'id_verified_at' => now(),
            'can_accept_bookings' => true,
        ]);

        // Create a user with pending verification
        User::create([
            'name' => 'Luz Garcia',
            'first_name' => 'Luz',
            'last_name' => 'Garcia',
            'email' => 'luz.garcia@example.com',
            'password' => Hash::make('password123'),
            'role' => 'pet_sitter',
            'status' => 'pending',
            'phone' => '+639678901234',
            'address' => '987 Cedar Lane, Marikina, Philippines',
            'gender' => 'female',
            'age' => 27,
            'pet_breeds' => ['Cats Only'],
            'bio' => 'Cat specialist with 5 years experience. Available for cat sitting only.',
            'email_verified_at' => now(),
            'phone_verified_at' => null, // Not verified yet
        ]);

        $this->command->info('Test users created successfully!');
        $this->command->info('Pet Owners: john.doe@example.com, maria.santos@example.com');
        $this->command->info('Pet Sitters: pedro.cruz@example.com, ana.reyes@example.com, carlos.mendoza@example.com, luz.garcia@example.com');
        $this->command->info('All passwords: password123');
    }
}
