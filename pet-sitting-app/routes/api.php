<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\ProfileController;
use App\Http\Controllers\API\LocationController;
use App\Http\Controllers\API\BookingController;
use App\Http\Controllers\API\MessageController;
use App\Http\Controllers\API\VerificationController;
use App\Http\Controllers\API\PetController;

// Health check endpoint
Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'message' => 'Server is running',
        'timestamp' => now()
    ]);
});

// Test endpoint (no auth required)
Route::get('/test', function () {
    return response()->json([
        'message' => 'API is working!',
        'timestamp' => now()
    ]);
});

// Test profile update (temporarily without auth for testing)
Route::post('/profile/update-test', function (Request $request) {
    return response()->json([
        'success' => true,
        'message' => 'Profile update test endpoint working',
        'received_data' => $request->all(),
        'timestamp' => now()
    ]);
});

// Test location status update (temporarily without auth for testing)
Route::post('/location/status-test', function (Request $request) {
    return response()->json([
        'success' => true,
        'message' => 'Location status test endpoint working',
        'received_data' => $request->all(),
        'timestamp' => now()
    ]);
});

// Test nearby sitters (temporarily without auth for testing)
Route::get('/location/nearby-sitters-test', function (Request $request) {
    return response()->json([
        'success' => true,
        'message' => 'Nearby sitters test endpoint working',
        'sitters' => [],
        'count' => 0,
        'radius_km' => $request->input('radius_km', 2),
        'timestamp' => now()
    ]);
});

// Auth routes
Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);
Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');

// Token management routes (no auth required for token refresh/generation)
Route::post('/refresh-token', [AuthController::class, 'refreshToken']);
Route::post('/generate-token', [AuthController::class, 'generateToken']);

// Phone verification routes (no auth required)
Route::post('/send-verification-code', [AuthController::class, 'sendPhoneVerificationCode']);
Route::post('/verify-phone', [AuthController::class, 'verifyPhone']);
Route::post('/verify-phone-code', [AuthController::class, 'verifyPhoneCode']); // Alias for frontend compatibility

// Profile routes
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/profile', [ProfileController::class, 'show']);
    Route::post('/profile/update', [ProfileController::class, 'update']);
    Route::post('/profile/upload-image', [ProfileController::class, 'uploadImage']);
    Route::post('/profile/upload-certificate-image', [ProfileController::class, 'uploadCertificateImage']);
    Route::post('/profile/save-certificates', [ProfileController::class, 'saveCertificates']);
    Route::get('/profile/certificates', [ProfileController::class, 'getCertificates']);
    
    // Profile update request routes
    Route::post('/profile/update-request', [App\Http\Controllers\API\ProfileUpdateRequestController::class, 'submitRequest']);
    Route::get('/profile/update-requests', [App\Http\Controllers\API\ProfileUpdateRequestController::class, 'getUserRequests']);
    Route::get('/profile/update-request/check-pending', [App\Http\Controllers\API\ProfileUpdateRequestController::class, 'checkPendingRequest']);
});

// Location routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/location/update', [LocationController::class, 'updateLocation']);
    Route::get('/location/sitters', [LocationController::class, 'getNearbySitters']);
    Route::get('/location/nearby-sitters', [LocationController::class, 'getNearbySitters']); // Alias for compatibility
    Route::post('/location/status', [LocationController::class, 'updateStatus']);
});

// Booking routes
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/bookings', [BookingController::class, 'index']);
    Route::post('/bookings', [BookingController::class, 'store']);
    Route::get('/bookings/{id}', [BookingController::class, 'show']);
    Route::put('/bookings/{id}', [BookingController::class, 'update']);
    Route::delete('/bookings/{id}', [BookingController::class, 'destroy']);
    Route::post('/bookings/{id}/accept', [BookingController::class, 'accept']);
    Route::post('/bookings/{id}/reject', [BookingController::class, 'reject']);
    Route::post('/bookings/{id}/complete', [BookingController::class, 'complete']);
});

// Messaging routes
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/messages/conversations', [MessageController::class, 'getConversations']);
    Route::get('/messages/conversations/{conversationId}', [MessageController::class, 'getMessages']);
    Route::post('/messages/send', [MessageController::class, 'sendMessage']);
    Route::post('/messages/conversations/{conversationId}/read', [MessageController::class, 'markAsRead']);
    Route::get('/messages/unread-count', [MessageController::class, 'getUnreadCount']);
    Route::post('/messages/start-conversation', [MessageController::class, 'startConversation']);
});

// Pet routes
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/pets', [PetController::class, 'index']);
    Route::post('/pets', [PetController::class, 'store']);
    Route::get('/pets/{id}', [PetController::class, 'show']);
    Route::put('/pets/{id}', [PetController::class, 'update']);
    Route::delete('/pets/{id}', [PetController::class, 'destroy']);
});

// Verification routes
Route::middleware('auth:sanctum')->group(function () {
    // Enhanced ID verification with real-time updates
    Route::post('/verification/submit-enhanced', [VerificationController::class, 'submitEnhancedVerification']);
    Route::get('/verification/status', [VerificationController::class, 'getVerificationStatus']);
    Route::post('/verification/upload-document', [VerificationController::class, 'uploadDocument']);
    Route::get('/verification/philippine-id-types', [VerificationController::class, 'getPhilippineIdTypes']);
    
    // Legacy verification endpoints
    Route::post('/verification/submit', [VerificationController::class, 'submitVerification']);
    Route::post('/verification/submit-simple', [VerificationController::class, 'submitVerificationSimple']);
    Route::post('/verification/skip', [VerificationController::class, 'skipVerification']);
    
    // Veriff integration
    Route::get('/verification/session-status', [VerificationController::class, 'getVerificationSessionStatus']);
});

// Public verification endpoints (for webhooks and public access)
Route::post('/verification/veriff-webhook', [VerificationController::class, 'handleVeriffWebhook']);
Route::post('/verification/skip-public', [VerificationController::class, 'skipVerificationPublic']);

// Notifications API routes
Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('/notifications/', [App\Http\Controllers\API\NotificationController::class, 'index']);
    Route::post('/notifications/{id}/mark-read', [App\Http\Controllers\API\NotificationController::class, 'markAsRead']);
    Route::post('/notifications/mark-all-read', [App\Http\Controllers\API\NotificationController::class, 'markAllAsRead']);
});

// Admin routes for profile change requests
Route::middleware(['auth:sanctum', 'admin'])->group(function () {
    Route::get('/admin/profile-change-requests', [App\Http\Controllers\API\ProfileChangeRequestController::class, 'getAllRequests']);
    Route::post('/admin/profile-change-requests/{id}/approve', [App\Http\Controllers\API\ProfileChangeRequestController::class, 'approveRequest']);
    Route::post('/admin/profile-change-requests/{id}/reject', [App\Http\Controllers\API\ProfileChangeRequestController::class, 'rejectRequest']);
});

// Admin verification routes (API endpoints for admin panel)
// Use web authentication for admin panel (session-based)
Route::middleware(['web', 'auth:web', 'admin', 'throttle:admin'])->group(function () {
    Route::post('/admin/verifications/{id}/approve', [App\Http\Controllers\Admin\VerificationController::class, 'approve']);
    Route::post('/admin/verifications/{id}/reject', [App\Http\Controllers\Admin\VerificationController::class, 'reject']);
    Route::get('/admin/verifications/{id}/details', [App\Http\Controllers\Admin\VerificationController::class, 'getVerificationDetails']);
    Route::get('/admin/verifications/status-updates', [App\Http\Controllers\Admin\VerificationController::class, 'getStatusUpdates']);
    Route::post('/admin/verifications/bulk-action', [App\Http\Controllers\Admin\VerificationController::class, 'bulkAction']);
    Route::get('/admin/verifications/{id}/audit-logs', [App\Http\Controllers\Admin\VerificationController::class, 'getAuditLogs']);
});