<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Admin\VerificationController;
use App\Http\Controllers\Admin\SupportController;
use App\Http\Controllers\Admin\NameUpdateController;
use App\Http\Controllers\Admin\PasswordResetController;
use App\Http\Controllers\Admin\BookingController;
use App\Http\Controllers\Admin\PaymentController;

// Handle admin redirect for unauthenticated users
Route::get('/admin', function () {
    if (Auth::check()) {
        return redirect()->route('admin.dashboard');
    }
    return redirect()->route('admin.login');
})->name('admin.redirect');

// CSRF token endpoint
Route::get('/admin/csrf-token', function () {
    return response()->json(['csrf_token' => csrf_token()]);
})->middleware(['web', 'auth']);

Route::middleware(['web', 'auth'])->prefix('admin')->name('admin.')->group(function () {
    
    // Dashboard
    Route::get('/', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/export-stats', [DashboardController::class, 'exportStats'])->name('export.stats');

    // Announcements
    Route::get('/announcements', [DashboardController::class, 'announcements'])->name('announcements');

    // User Management
    Route::prefix('users')->name('users.')->group(function () {
        Route::get('/', [UserController::class, 'index'])->name('index');
        Route::get('/{user}', [UserController::class, 'show'])->name('show');
        Route::post('/{user}/approve', [UserController::class, 'approve'])->name('approve');
        Route::post('/{user}/deny', [UserController::class, 'deny'])->name('deny');
        Route::post('/{user}/suspend', [UserController::class, 'suspend'])->name('suspend');
        Route::post('/{user}/ban', [UserController::class, 'ban'])->name('ban');
        Route::post('/{user}/reactivate', [UserController::class, 'reactivate'])->name('reactivate');
        Route::delete('/{user}', [UserController::class, 'delete'])->name('delete');
        Route::post('/bulk-action', [UserController::class, 'bulkAction'])->name('bulk-action');
        Route::get('/export', [UserController::class, 'export'])->name('export');
        
        // Profile Image Management
        Route::post('/{user}/profile-image', [UserController::class, 'updateProfileImage'])->name('update-profile-image');
        Route::delete('/{user}/profile-image', [UserController::class, 'deleteProfileImage'])->name('delete-profile-image');
        
        // API endpoints for auto-refresh
        Route::get('/api/status-updates', [UserController::class, 'statusUpdates'])->name('api.status-updates');
        Route::post('/api/{user}/status', [UserController::class, 'updateStatus'])->name('api.update-status');
    });

    // Booking Management
    Route::prefix('bookings')->name('bookings.')->group(function () {
        Route::get('/', [BookingController::class, 'index'])->name('index');
        Route::get('/{booking}', [BookingController::class, 'show'])->name('show');
        Route::post('/{booking}/confirm', [BookingController::class, 'confirm'])->name('confirm');
        Route::post('/{booking}/cancel', [BookingController::class, 'cancel'])->name('cancel');
    });

    // Payment Management
    Route::prefix('payments')->name('payments.')->group(function () {
        Route::get('/', [PaymentController::class, 'index'])->name('index');
        Route::get('/{payment}', [PaymentController::class, 'show'])->name('show');
        Route::post('/process', [PaymentController::class, 'processPayment'])->name('process');
        Route::post('/{payment}/refund', [PaymentController::class, 'processRefund'])->name('refund');
        Route::get('/analytics', [PaymentController::class, 'analytics'])->name('analytics');
        Route::get('/export', [PaymentController::class, 'export'])->name('export');
    });

    // Password Reset Management
    Route::prefix('password-reset')->name('password-reset.')->group(function () {
        Route::get('/', [PasswordResetController::class, 'index'])->name('index');
        Route::post('/search-user', [PasswordResetController::class, 'searchUser'])->name('search-user');
        Route::post('/reset', [PasswordResetController::class, 'resetPassword'])->name('reset');
    });

    // Name Update Management
    Route::prefix('name-updates')->name('name-updates.')->group(function () {
        Route::get('/users', [NameUpdateController::class, 'index'])->name('users');
        Route::post('/update-user-name', [NameUpdateController::class, 'updateUserName'])->name('update-user-name');
        Route::get('/requests', [NameUpdateController::class, 'getNameUpdateRequests'])->name('requests');
        Route::get('/user/{userId}/requests', [NameUpdateController::class, 'getUserNameUpdateRequests'])->name('user-requests');
        Route::post('/requests/{id}/approve', [NameUpdateController::class, 'approveRequest'])->name('approve-request');
        Route::post('/requests/{id}/reject', [NameUpdateController::class, 'rejectRequest'])->name('reject-request');
    });

    // Profile Update Requests Management
    Route::prefix('profile-update-requests')->name('profile-update-requests.')->group(function () {
        Route::get('/', [App\Http\Controllers\Admin\ProfileUpdateRequestController::class, 'index'])->name('index');
        Route::get('/{id}', [App\Http\Controllers\Admin\ProfileUpdateRequestController::class, 'show'])->name('show');
        Route::post('/{id}/approve', [App\Http\Controllers\Admin\ProfileUpdateRequestController::class, 'approve'])->name('approve');
        Route::post('/{id}/reject', [App\Http\Controllers\Admin\ProfileUpdateRequestController::class, 'reject'])->name('reject');
        Route::get('/stats', [App\Http\Controllers\Admin\ProfileUpdateRequestController::class, 'getStats'])->name('stats');
    });

    // Admin API routes
    Route::prefix('api')->name('api.')->group(function () {
        Route::get('/profile-update-requests', [App\Http\Controllers\Admin\ProfileUpdateRequestController::class, 'index'])->name('profile-update-requests');
        Route::get('/profile-update-requests/stats', [App\Http\Controllers\Admin\ProfileUpdateRequestController::class, 'getStats'])->name('profile-update-requests.stats');
    });


    // ID Verification Management
    Route::prefix('verifications')->name('verifications.')->group(function () {
        Route::get('/', [VerificationController::class, 'index'])->name('index');
        Route::get('/id-access', [VerificationController::class, 'idAccess'])->name('id-access');
        Route::get('/{verification}', [VerificationController::class, 'show'])->name('show');
        Route::get('/{verification}/enhanced', [VerificationController::class, 'enhancedShow'])->name('enhanced-show');
        Route::post('/{verification}/approve', [VerificationController::class, 'approve'])->name('approve');
        Route::post('/{verification}/reject', [VerificationController::class, 'reject'])->name('reject');
        Route::get('/analytics', [VerificationController::class, 'analytics'])->name('analytics');
        Route::get('/export', [VerificationController::class, 'export'])->name('export');
    });

    // ID Verification API Routes (AJAX) - REAL-TIME SYSTEM
    Route::prefix('api/verifications')->name('api.verifications.')->group(function () {
        Route::get('/', [VerificationController::class, 'getVerifications'])->name('list');
        Route::get('/unverified-sitters', [VerificationController::class, 'getUnverifiedSitters'])->name('unverified-sitters');
        Route::post('/{id}/manual-verify', [VerificationController::class, 'manualVerify'])->name('manual-verify');
        Route::get('/debug', [VerificationController::class, 'debugVerifications'])->name('debug');
        Route::post('/cleanup-statuses', [VerificationController::class, 'cleanupInconsistentStatuses'])->name('cleanup-statuses');
        Route::get('/{id}/details', [VerificationController::class, 'getVerificationDetails'])->name('details');
        Route::get('/status-updates', [VerificationController::class, 'getStatusUpdates'])->name('status-updates');
        Route::post('/bulk-action', [VerificationController::class, 'bulkAction'])->name('bulk');
        Route::get('/{id}/audit-logs', [VerificationController::class, 'getAuditLogs'])->name('audit_logs');
        Route::post('/cleanup', [VerificationController::class, 'cleanupOldVerifications'])->name('cleanup');
        Route::post('/cleanup-duplicates', [VerificationController::class, 'cleanupDuplicateVerifications'])->name('cleanup-duplicates');
    });

    // Support Management
    Route::prefix('support')->name('support.')->group(function () {
        Route::get('/', [SupportController::class, 'index'])->name('index');
        Route::get('/{ticket}', [SupportController::class, 'show'])->name('show');
        Route::post('/{ticket}/assign', [SupportController::class, 'assign'])->name('assign');
        Route::post('/{ticket}/status', [SupportController::class, 'updateStatus'])->name('update-status');
        Route::post('/{ticket}/reply', [SupportController::class, 'reply'])->name('reply');
        Route::post('/{ticket}/bulk-action', [SupportController::class, 'bulkAction'])->name('bulk-action');
        Route::get('/export', [SupportController::class, 'export'])->name('export');
        
        // Live Chat
        Route::get('/live-chat', [SupportController::class, 'liveChat'])->name('live-chat');
        Route::get('/live-chat/{ticket}', [SupportController::class, 'chatSession'])->name('chat-session');
        Route::post('/live-chat/{ticket}/message', [SupportController::class, 'sendChatMessage'])->name('send-message');
        Route::get('/live-chat/{ticket}/messages', [SupportController::class, 'getChatMessages'])->name('get-messages');
        Route::get('/live-chat/{ticket}/new-messages', [SupportController::class, 'getNewMessages'])->name('get-new-messages');
        Route::post('/live-chat/{ticket}/mark-read', [SupportController::class, 'markMessageAsRead'])->name('mark-read');
        Route::get('/live-chat/active-chats', [SupportController::class, 'getActiveChats'])->name('get-active-chats');
        
        // Analytics
        Route::get('/analytics', [SupportController::class, 'analytics'])->name('analytics');
    });



    // System Settings
    Route::prefix('settings')->name('settings.')->group(function () {
        Route::get('/', function () {
            return view('admin.settings.index');
        })->name('index');
        
        Route::post('/general', function (Request $request) {
            // Update general settings
            return redirect()->back()->with('success', 'Settings updated successfully.');
        })->name('general');
        
        Route::post('/payment', function (Request $request) {
            // Update payment settings
            return redirect()->back()->with('success', 'Payment settings updated successfully.');
        })->name('payment');
        
        Route::post('/notification', function (Request $request) {
            // Update notification settings
            return redirect()->back()->with('success', 'Notification settings updated successfully.');
        })->name('notification');
    });


    // API Routes for AJAX requests
    Route::prefix('api')->name('api.')->group(function () {
        // Dashboard stats
        Route::get('/stats', [DashboardController::class, 'getStats'])->name('stats');
        
        // User actions
        Route::post('/users/{user}/status', [UserController::class, 'updateStatus'])->name('users.status');
        
        
        // Verification actions
        Route::post('/verifications/{verification}/review', [VerificationController::class, 'review'])->name('verifications.review');
        
        // Support actions
        Route::post('/support/{ticket}/reply', [SupportController::class, 'reply'])->name('support.reply');
        Route::post('/support/{ticket}/assign', [SupportController::class, 'assign'])->name('support.assign');
        
        // Live chat
        Route::post('/support/chat/{ticket}/message', [SupportController::class, 'sendChatMessage'])->name('support.chat.message');
        Route::get('/support/chat/{ticket}/messages', [SupportController::class, 'getChatMessages'])->name('support.chat.messages');
        
        
        // Name Update Management
        Route::get('/users', [NameUpdateController::class, 'getUsers'])->name('users');
        Route::post('/update-user-name', [NameUpdateController::class, 'updateUserName'])->name('update-user-name');
        Route::get('/name-update-requests', [NameUpdateController::class, 'getNameUpdateRequests'])->name('name-update-requests');
        Route::get('/name-update-requests/user/{userId}', [NameUpdateController::class, 'getUserNameUpdateRequests'])->name('name-update-requests.user');
        Route::post('/name-update-requests/{id}/approve', [NameUpdateController::class, 'approveRequest'])->name('name-update-requests.approve');
        Route::post('/name-update-requests/{id}/reject', [NameUpdateController::class, 'rejectRequest'])->name('name-update-requests.reject');
        
        // Profile Update Requests Management
        Route::get('/profile-update-requests', [App\Http\Controllers\Admin\ProfileUpdateRequestController::class, 'index'])->name('profile-update-requests');
        Route::get('/profile-update-requests/{id}', [App\Http\Controllers\Admin\ProfileUpdateRequestController::class, 'show'])->name('profile-update-requests.show');
        Route::post('/profile-update-requests/{id}/approve', [App\Http\Controllers\Admin\ProfileUpdateRequestController::class, 'approve'])->name('profile-update-requests.approve');
        Route::post('/profile-update-requests/{id}/reject', [App\Http\Controllers\Admin\ProfileUpdateRequestController::class, 'reject'])->name('profile-update-requests.reject');
        Route::get('/profile-update-requests/stats', [App\Http\Controllers\Admin\ProfileUpdateRequestController::class, 'getStats'])->name('profile-update-requests.stats');
        
    });
});
