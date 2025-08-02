<?php

require_once 'pet-sitting-app/vendor/autoload.php';

use App\Services\VeriffService;

// Test Veriff Service
echo "🔔 Testing Veriff Integration\n";
echo "=============================\n\n";

// Initialize Veriff Service
$veriffService = new VeriffService();

// Test 1: Check if Veriff is configured
echo "1. Checking Veriff Configuration:\n";
$isConfigured = $veriffService->isConfigured();
echo "   Veriff Configured: " . ($isConfigured ? "✅ Yes" : "❌ No") . "\n\n";

// Test 2: Test Philippine ID validation
echo "2. Testing Philippine ID Validation:\n";
$testIds = [
    'ph_national_id' => '1234-5678901-2',
    'ph_drivers_license' => 'A12-34-567890',
    'sss_id' => '12-3456789-0',
    'philhealth_id' => '12-345678901-2',
    'tin_id' => '123-456-789-000',
    'postal_id' => 'ABC1234567',
    'voters_id' => '1234-5678-9012-3456',
    'prc_id' => '1234567',
    'umid' => '1234-5678901-2',
    'owwa_id' => 'AB12345678'
];

foreach ($testIds as $type => $number) {
    $isValid = $veriffService->validatePhilippineId($type, $number);
    echo "   {$type}: " . ($isValid ? "✅ Valid" : "❌ Invalid") . " ({$number})\n";
}

echo "\n";

// Test 3: Get Philippine ID patterns
echo "3. Philippine ID Patterns:\n";
$patterns = $veriffService->getPhilippineIdPatterns();
foreach ($patterns as $type => $data) {
    echo "   {$type}: {$data['description']}\n";
    echo "   Pattern: {$data['pattern']}\n";
    echo "   Placeholder: {$data['placeholder']}\n\n";
}

echo "✅ Veriff Integration Test Complete!\n";
echo "\nNext Steps:\n";
echo "1. Add your Veriff Secret Key to .env file\n";
echo "2. Configure webhook URL in Veriff dashboard\n";
echo "3. Test with real API calls\n"; 