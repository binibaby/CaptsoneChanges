<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\Auth\LoginController;

// Root route - redirect to admin login
Route::get('/', function () {
    return redirect()->route('admin.login');
});

// Simple admin login route
Route::get('/admin/login', function () {
    return view('admin.login');
})->name('admin.login');

Route::post('/admin/login', [LoginController::class, 'adminLogin'])->name('admin.login.post');

// Handle admin redirect for unauthenticated users (must be before admin routes)
Route::get('/admin', function () {
    if (Auth::check()) {
        return redirect()->route('admin.dashboard');
    }
    return redirect()->route('admin.login');
})->name('admin.redirect');

// Include admin routes
require __DIR__.'/admin.php';
require __DIR__.'/auth.php';

// Removed conflicting dashboard route - admin dashboard is the main one

// Support Routes
Route::middleware(['auth'])->group(function () {
    Route::get('/support', [App\Http\Controllers\SupportController::class, 'index'])->name('support.index');
    Route::post('/support', [App\Http\Controllers\SupportController::class, 'store'])->name('support.store');
    Route::get('/support/my-tickets', [App\Http\Controllers\SupportController::class, 'myTickets'])->name('support.my-tickets');
    Route::get('/support/ticket/{ticket}', [App\Http\Controllers\SupportController::class, 'show'])->name('support.show');
    Route::post('/support/ticket/{ticket}/reply', [App\Http\Controllers\SupportController::class, 'reply'])->name('support.reply');
});

// Test route for live chat (temporary)
Route::get('/test-live-chat', function () {
    return view('admin.support.live-chat', ['activeChats' => collect([])]);
})->name('test.live-chat');

// Simple admin route without middleware (temporary)
Route::get('/admin-test/support/live-chat', function () {
    return view('admin.support.live-chat', ['activeChats' => collect([])]);
})->name('admin.test.live-chat');

// Completely open live chat route (for testing)
Route::get('/live-chat-test', function () {
    return view('admin.support.live-chat', ['activeChats' => collect([])]);
})->name('live-chat.test');

// Test admin dashboard without authentication
Route::get('/admin-test', function () {
    $stats = [
        'total_users' => 0,
        'total_bookings' => 0,
        'total_payments' => 0,
        'total_verifications' => 0,
    ];
    $recentActivities = collect([]);
    $chartsData = [];
    return view('admin.dashboard', compact('stats', 'recentActivities', 'chartsData'));
})->name('admin.test');

// Simple admin login and dashboard (working version)
Route::get('/admin-dashboard', function () {
    return view('admin.dashboard');
})->name('admin.dashboard.simple');

Route::get('/admin-support', function () {
    return view('admin.support.index', [
        'tickets' => collect([]),
        'stats' => [
            'total_tickets' => 0,
            'open_tickets' => 0,
            'in_progress_tickets' => 0,
            'resolved_tickets' => 0,
            'high_priority_tickets' => 0,
        ]
    ]);
})->name('admin.support.simple');


// Admin Users Page
Route::get('/admin-users', function () {
    return view('admin.users', [
        'users' => collect([]),
    ]);
})->name('admin.users.simple');

// Admin Announcements Page
Route::get('/admin-announcements', function () {
    return view('admin.announcements');
})->name('admin.announcements.simple');

// Admin Verifications Page
Route::get('/admin-verifications', function () {
    return view('admin.verifications.index', [
        'verifications' => collect([]),
    ]);
})->name('admin.verifications.simple');
