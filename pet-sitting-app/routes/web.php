<?php

use Illuminate\Support\Facades\Route;
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

// Include admin routes
require __DIR__.'/admin.php';
require __DIR__.'/auth.php';
