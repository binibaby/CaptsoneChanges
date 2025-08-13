<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\BookingController;
use App\Http\Controllers\API\PaymentController;
use App\Http\Controllers\API\VerificationController;
use App\Http\Controllers\API\WalletController;
use App\Http\Controllers\API\SupportController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// Test endpoint for connectivity
Route::get('/test', function () {
    return response()->json([
        'success' => true,
        'message' => 'API is running',
        'timestamp' => now()->format('Y-m-d H:i:s'),
        'server' => 'Laravel API Server',
        'version' => '1.0.0'
    ]);
});

    // Auth routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');

// Phone verification routes
Route::post('/send-verification-code', [AuthController::class, 'sendPhoneVerificationCode']);
Route::post('/verify-phone-code', [AuthController::class, 'verifyPhoneCode']);
Route::post('/resend-verification-code', [AuthController::class, 'resendVerificationCode']);

// Verification routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/verification/submit', [VerificationController::class, 'submitVerification']);
    Route::post('/verification/submit-simple', [VerificationController::class, 'submitSimpleVerification']);
    Route::post('/verification/skip', [VerificationController::class, 'skipVerification']);
    Route::get('/verification/status', [VerificationController::class, 'getVerificationStatus']);
    Route::get('/verification/session-status', [VerificationController::class, 'getVerificationSessionStatus']);
});

// Public fallback route to allow skipping ID verification right after phone verification
// This is intended for development/testing mobile flows where auth token may not yet be persisted
Route::post('/verification/skip-public', [VerificationController::class, 'skipVerificationPublic']);

    // Booking routes
Route::prefix('bookings')->middleware('auth:sanctum')->group(function () {
    Route::get('/', [BookingController::class, 'index']);
    Route::post('/', [BookingController::class, 'store']);
    Route::get('/{booking}', [BookingController::class, 'show']);
    Route::put('/{booking}', [BookingController::class, 'update']);
    Route::delete('/{booking}', [BookingController::class, 'destroy']);
});

    // Payment routes
Route::prefix('payments')->middleware('auth:sanctum')->group(function () {
    Route::get('/', [PaymentController::class, 'index']);
    Route::post('/', [PaymentController::class, 'store']);
    Route::get('/{payment}', [PaymentController::class, 'show']);
});

    // Wallet routes
Route::prefix('wallet')->middleware('auth:sanctum')->group(function () {
    Route::get('/balance', [WalletController::class, 'getBalance']);
    Route::get('/transactions', [WalletController::class, 'getTransactions']);
    Route::post('/add-funds', [WalletController::class, 'addFunds']);
    Route::post('/withdraw', [WalletController::class, 'withdraw']);
});

// Support routes
Route::prefix('support')->middleware('auth:sanctum')->group(function () {
    Route::get('/tickets', [SupportController::class, 'getTickets']);
    Route::post('/tickets', [SupportController::class, 'createTicket']);
    Route::get('/tickets/{ticket}', [SupportController::class, 'getTicket']);
    Route::post('/tickets/{ticket}/messages', [SupportController::class, 'sendMessage']);
}); 