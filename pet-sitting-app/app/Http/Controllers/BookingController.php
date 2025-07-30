<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Booking;
use App\Models\User;
use App\Models\Payment;

class BookingController extends Controller
{
    public function index()
    {
        $bookings = Booking::with(['user', 'sitter', 'payment'])->get();
        return view('admin.bookings', compact('bookings'));
    }
}
