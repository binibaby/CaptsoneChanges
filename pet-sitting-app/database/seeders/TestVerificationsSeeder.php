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
        // DISABLED: No template verification data will be created
        // Database starts completely clean with 0 verifications
        
        // This seeder is disabled to ensure a fresh start
        // All template data has been removed
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
