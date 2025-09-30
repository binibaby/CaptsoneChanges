<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\ProfileController;
use App\Http\Controllers\API\LocationController;
use App\Http\Controllers\API\BookingController;
use App\Http\Controllers\API\MessageController;
use App\Http\Controllers\API\VerificationController;

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

// Phone verification routes (no auth required)
Route::post('/send-verification-code', [AuthController::class, 'sendPhoneVerificationCode']);
Route::post('/verify-phone', [AuthController::class, 'verifyPhone']);
Route::post('/verify-phone-code', [AuthController::class, 'verifyPhoneCode']); // Alias for frontend compatibility

// Profile routes
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/profile', [ProfileController::class, 'show']);
    Route::post('/profile/update', [ProfileController::class, 'update']);
    Route::post('/profile/upload-image', [ProfileController::class, 'uploadImage']);
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

// Verification routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/verification/submit', [VerificationController::class, 'submitVerification']);
    Route::post('/verification/submit-simple', [VerificationController::class, 'submitVerificationSimple']);
    Route::get('/verification/status', [VerificationController::class, 'getVerificationStatus']);
    Route::get('/verification/session-status', [VerificationController::class, 'getVerificationSessionStatus']);
    Route::post('/verification/skip', [VerificationController::class, 'skipVerification']);
    Route::post('/verification/upload-document', [VerificationController::class, 'uploadDocument']);
    Route::get('/verification/philippine-ids', [VerificationController::class, 'getPhilippineIdTypes']);
});

// Public verification routes (no auth required)
Route::post('/verification/skip-public', [VerificationController::class, 'skipVerificationPublic']);
Route::post('/verification/webhook', [VerificationController::class, 'handleVeriffWebhook']);