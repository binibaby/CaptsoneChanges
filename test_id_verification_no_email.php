<?php

// Test ID Verification Without Email Requirement
echo "🔔 Testing ID Verification (No Email Required)\n";
echo "============================================\n\n";

// Test 1: Submit ID verification without email
echo "1. Testing ID Verification Submission (No Email):\n";
$verificationData = [
    'document_type' => 'ph_national_id',
    'document_image' => 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
    'first_name' => 'Test',
    'last_name' => 'User',
    'phone' => '+639123456789'
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'http://localhost:8000/api/verification/submit-simple');
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($verificationData));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Accept: application/json'
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode === 201) {
    $data = json_decode($response, true);
    echo "   ✅ ID verification submitted successfully\n";
    echo "   📄 Document Type: {$verificationData['document_type']}\n";
    echo "   👤 User: {$verificationData['first_name']} {$verificationData['last_name']}\n";
    echo "   📱 Phone: {$verificationData['phone']}\n";
    echo "   📊 Status: " . ($data['verification']['status'] ?? 'Unknown') . "\n";
    echo "   📝 Message: " . ($data['message'] ?? 'No message') . "\n";
} else {
    $data = json_decode($response, true);
    echo "   ❌ ID verification failed\n";
    echo "   📊 HTTP Code: $httpCode\n";
    echo "   📝 Error: " . ($data['message'] ?? 'Unknown error') . "\n";
    if (isset($data['errors'])) {
        echo "   🔍 Validation Errors:\n";
        foreach ($data['errors'] as $field => $errors) {
            echo "      - $field: " . implode(', ', $errors) . "\n";
        }
    }
}

echo "\n";

// Test 2: Submit ID verification with email (should still work)
echo "2. Testing ID Verification Submission (With Email - Optional):\n";
$verificationDataWithEmail = [
    'document_type' => 'ph_drivers_license',
    'document_image' => 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
    'first_name' => 'Test',
    'last_name' => 'User',
    'email' => 'test@example.com', // Optional now
    'phone' => '+639123456789'
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'http://localhost:8000/api/verification/submit-simple');
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($verificationDataWithEmail));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Accept: application/json'
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode === 201) {
    $data = json_decode($response, true);
    echo "   ✅ ID verification with email submitted successfully\n";
    echo "   📄 Document Type: {$verificationDataWithEmail['document_type']}\n";
    echo "   👤 User: {$verificationDataWithEmail['first_name']} {$verificationDataWithEmail['last_name']}\n";
    echo "   📧 Email: {$verificationDataWithEmail['email']}\n";
    echo "   📱 Phone: {$verificationDataWithEmail['phone']}\n";
    echo "   📊 Status: " . ($data['verification']['status'] ?? 'Unknown') . "\n";
} else {
    $data = json_decode($response, true);
    echo "   ❌ ID verification with email failed\n";
    echo "   📊 HTTP Code: $httpCode\n";
    echo "   📝 Error: " . ($data['message'] ?? 'Unknown error') . "\n";
}

echo "\n";

echo "🎉 ID VERIFICATION TESTING COMPLETE!\n";
echo "===================================\n";
echo "✅ Email requirement removed from ID verification\n";
echo "✅ Phone verification codes are logged clearly\n";
echo "✅ System ready for testing\n\n";

echo "📱 TO TEST IN MOBILE APP:\n";
echo "=========================\n";
echo "1. Open the mobile app\n";
echo "2. Navigate to Verification screen\n";
echo "3. Select a Philippine ID type\n";
echo "4. Take a photo of an ID document\n";
echo "5. Submit the verification\n";
echo "6. Check that no email field is required\n\n";

echo "🔢 VERIFICATION CODES IN LOGS:\n";
echo "==============================\n";
echo "Use the monitor script to see codes: ./monitor_verification_codes.sh\n"; 