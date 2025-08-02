<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Verification;
use App\Models\User;

class TestVerificationsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get pet sitter users
        $petSitters = User::where('role', 'pet_sitter')->get();

        foreach ($petSitters as $index => $sitter) {
            $statuses = ['pending', 'approved', 'rejected'];
            $documentTypes = ['national_id', 'drivers_license', 'passport', 'other'];
            
            // Create verification records
            Verification::create([
                'user_id' => $sitter->id,
                'document_type' => $documentTypes[$index % count($documentTypes)],
                'document_number' => $this->generateDocumentNumber($documentTypes[$index % count($documentTypes)]),
                'document_image' => 'verifications/sample_id_image.jpg',
                'status' => $statuses[$index % count($statuses)],
                'verified_at' => $statuses[$index % count($statuses)] === 'approved' ? now()->subDays(rand(1, 15)) : null,
                'rejection_reason' => $statuses[$index % count($statuses)] === 'rejected' ? 'Document image unclear or invalid. Please resubmit with better quality.' : null,
                'notes' => 'Test verification record for admin panel display.',
                'verification_method' => $statuses[$index % count($statuses)] === 'approved' ? 'veriff_ai' : 'manual',
            ]);
        }

        $this->command->info('Test verification records created successfully!');
    }

    private function generateDocumentNumber($documentType)
    {
        $patterns = [
            'national_id' => '1234-5678901-2',
            'drivers_license' => 'A12-34-567890',
            'passport' => 'P123456789',
            'other' => 'DOC123456',
        ];

        return $patterns[$documentType] ?? '123456789';
    }
}
