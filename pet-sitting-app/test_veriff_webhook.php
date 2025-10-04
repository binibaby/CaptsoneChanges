<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Verification;

echo "🔔 Testing Veriff Webhook Integration\n";
echo "====================================\n\n";

// Get pending verifications
$pendingVerifications = Verification::where('verification_status', 'pending')->get();

if ($pendingVerifications->isEmpty()) {
    echo "❌ No pending verifications found. Creating test verification...\n";
    
    // Create a test verification
    $verification = Verification::create([
        'user_id' => 1, // Use first user
        'document_type' => 'national_id',
        'document_number' => '1234-5678901-2',
        'document_image' => 'verifications/sample_id_image.jpg',
        'status' => 'pending',
        'verification_method' => 'veriff_ai',
        'extracted_data' => json_encode([
            'veriff_session_id' => 'veriff_test_' . uniqid(),
            'submitted_at' => now()->toISOString(),
            'verification_url' => 'https://veriff.me/session/test',
            'status' => 'processing'
        ])
    ]);
    
    echo "✅ Test verification created: ID " . $verification->id . "\n";
    $pendingVerifications = collect([$verification]);
}

echo "📋 Found " . $pendingVerifications->count() . " pending verification(s)\n\n";

foreach ($pendingVerifications as $verification) {
    echo "🔄 Processing verification ID: " . $verification->id . "\n";
    
    // Simulate Veriff webhook data
    $webhookData = [
        'session_id' => json_decode($verification->extracted_data, true)['veriff_session_id'] ?? 'veriff_test_' . $verification->id,
        'status' => rand(1, 100) <= 80 ? 'approved' : 'rejected', // 80% success rate
        'reason' => 'Document verification completed',
        'confidence_score' => rand(85, 100),
        'verification_method' => 'veriff_ai',
        'processed_at' => now()->toISOString()
    ];
    
    echo "📊 Webhook data: " . json_encode($webhookData, JSON_PRETTY_PRINT) . "\n";
    
    // Simulate webhook call
    $response = simulateWebhookCall($verification, $webhookData);
    
    echo "✅ Webhook processed: " . ($response['success'] ? 'SUCCESS' : 'FAILED') . "\n";
    echo "📈 New status: " . $verification->fresh()->status . "\n\n";
}

echo "🎉 Veriff webhook simulation completed!\n";
echo "Check the admin panel to see real-time updates.\n";

function simulateWebhookCall($verification, $webhookData) {
    // Update verification status based on Veriff decision
    $status = $webhookData['status'] === 'approved' ? 'approved' : 'rejected';
    $verificationScore = $webhookData['status'] === 'approved' ? $webhookData['confidence_score'] : null;
    $rejectionReason = $webhookData['status'] === 'rejected' ? ($webhookData['reason'] ?? 'Verification failed') : null;
    
    // Update verification record
    $verification->update([
        'status' => $status,
        'rejection_reason' => $rejectionReason,
        'verified_at' => $status === 'approved' ? now() : null,
        'verified_by' => $status === 'approved' ? 1 : null, // Use admin user ID
        'extracted_data' => json_encode(array_merge(
            json_decode($verification->extracted_data, true) ?? [],
            [
                'veriff_decision' => $webhookData,
                'processed_at' => now()->toISOString(),
                'verification_method' => 'veriff_ai',
                'verification_score' => $webhookData['confidence_score']
            ]
        ))
    ]);
    
    // Update user verification status
    $user = $verification->user;
    if ($status === 'approved') {
        $user->update([
            'id_verified' => true,
            'id_verified_at' => now(),
            'verification_status' => 'verified',
            'can_accept_bookings' => true,
        ]);
    } else {
        $user->update([
            'verification_status' => 'rejected',
            'can_accept_bookings' => false,
        ]);
    }
    
    return ['success' => true, 'status' => $status];
} 