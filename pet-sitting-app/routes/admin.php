<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Admin\PaymentController;
use App\Http\Controllers\Admin\VerificationController;
use App\Http\Controllers\Admin\SupportController;
use App\Http\Controllers\Admin\BookingController;
use App\Http\Controllers\Admin\NotificationController;

Route::middleware(['auth'])->prefix('admin')->name('admin.')->group(function () {
    
    // Dashboard
    Route::get('/', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/export-stats', [DashboardController::class, 'exportStats'])->name('export.stats');

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

    // ID Verification Management
    Route::prefix('verifications')->name('verifications.')->group(function () {
        Route::get('/', [VerificationController::class, 'index'])->name('index');
        Route::get('/{verification}', [VerificationController::class, 'show'])->name('show');
        Route::post('/{verification}/approve', [VerificationController::class, 'approve'])->name('approve');
        Route::post('/{verification}/reject', [VerificationController::class, 'reject'])->name('reject');
        Route::get('/analytics', [VerificationController::class, 'analytics'])->name('analytics');
        Route::get('/export', [VerificationController::class, 'export'])->name('export');
    });

    // ID Verification API Routes (AJAX) - REAL-TIME SYSTEM
    Route::prefix('api/verifications')->name('api.verifications.')->group(function () {
        Route::get('/', [VerificationController::class, 'getVerifications'])->name('list');
        Route::get('/{id}', [VerificationController::class, 'show'])->name('show');
        Route::get('/status-updates', [VerificationController::class, 'getStatusUpdates'])->name('status-updates');
        Route::post('/bulk-action', [VerificationController::class, 'bulkAction'])->name('bulk');
        Route::get('/{id}/audit-logs', [VerificationController::class, 'getAuditLogs'])->name('audit_logs');
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

    // Booking Management
    Route::prefix('bookings')->name('bookings.')->group(function () {
        Route::get('/', [BookingController::class, 'index'])->name('index');
        Route::get('/{booking}', [BookingController::class, 'show'])->name('show');
        Route::post('/{booking}/confirm', [BookingController::class, 'confirm'])->name('confirm');
        Route::post('/{booking}/cancel', [BookingController::class, 'cancel'])->name('cancel');
        Route::post('/bulk-confirm', [BookingController::class, 'bulkConfirm'])->name('bulk-confirm');
        Route::get('/analytics', [BookingController::class, 'analytics'])->name('analytics');
        Route::get('/export', [BookingController::class, 'export'])->name('export');
    });

    // Notification Management
    Route::prefix('notifications')->name('notifications.')->group(function () {
        Route::get('/', [NotificationController::class, 'index'])->name('index');
        Route::post('/send', [NotificationController::class, 'send'])->name('send');
        Route::post('/bulk-send', [NotificationController::class, 'bulkSend'])->name('bulk-send');
        Route::post('/template-send', [NotificationController::class, 'templateSend'])->name('template-send');
        Route::get('/templates', [NotificationController::class, 'templates'])->name('templates');
        Route::get('/analytics', [NotificationController::class, 'analytics'])->name('analytics');
        Route::get('/scheduled', [NotificationController::class, 'scheduled'])->name('scheduled');
        
        // AJAX routes for real-time notifications
        Route::post('/{id}/mark-read', [NotificationController::class, 'markAsRead'])->name('mark-read');
        Route::post('/mark-all-read', [NotificationController::class, 'markAllAsRead'])->name('mark-all-read');
        Route::get('/unread-count', [NotificationController::class, 'getUnreadCount'])->name('unread-count');
        Route::get('/scheduled', [NotificationController::class, 'scheduled'])->name('scheduled');
        Route::delete('/scheduled/{notification}', [NotificationController::class, 'cancelScheduled'])->name('cancel-scheduled');
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

    // Reports
    Route::prefix('reports')->name('reports.')->group(function () {
        Route::get('/users', function () {
            return view('admin.reports.users');
        })->name('users');
        
        Route::get('/bookings', function () {
            return view('admin.reports.bookings');
        })->name('bookings');
        
        Route::get('/payments', function () {
            return view('admin.reports.payments');
        })->name('payments');
        
        Route::get('/support', function () {
            return view('admin.reports.support');
        })->name('support');
        
        Route::get('/revenue', function () {
            return view('admin.reports.revenue');
        })->name('revenue');
    });

    // API Routes for AJAX requests
    Route::prefix('api')->name('api.')->group(function () {
        // Dashboard stats
        Route::get('/stats', [DashboardController::class, 'getStats'])->name('stats');
        
        // User actions
        Route::post('/users/{user}/status', [UserController::class, 'updateStatus'])->name('users.status');
        
        // Payment processing
        Route::post('/payments/process', [PaymentController::class, 'processPayment'])->name('payments.process');
        Route::post('/payments/{payment}/refund', [PaymentController::class, 'processRefund'])->name('payments.refund');
        
        // Verification actions
        Route::post('/verifications/{verification}/review', [VerificationController::class, 'review'])->name('verifications.review');
        
        // Support actions
        Route::post('/support/{ticket}/reply', [SupportController::class, 'reply'])->name('support.reply');
        Route::post('/support/{ticket}/assign', [SupportController::class, 'assign'])->name('support.assign');
        
        // Live chat
        Route::post('/support/chat/{ticket}/message', [SupportController::class, 'sendChatMessage'])->name('support.chat.message');
        Route::get('/support/chat/{ticket}/messages', [SupportController::class, 'getChatMessages'])->name('support.chat.messages');
        
        // Notifications
        Route::post('/notifications/send', [NotificationController::class, 'send'])->name('notifications.send');
        Route::post('/notifications/bulk-send', [NotificationController::class, 'bulkSend'])->name('notifications.bulk-send');
    });
});
