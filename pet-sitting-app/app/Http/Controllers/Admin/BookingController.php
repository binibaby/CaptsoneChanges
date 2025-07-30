<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class BookingController extends Controller
{
    public function index()
    {
        return view('admin.bookings.index');
    }

    public function show($id)
    {
        return view('admin.bookings.show');
    }

    public function confirm($id)
    {
        return redirect()->back()->with('success', 'Booking confirmed successfully.');
    }

    public function cancel($id)
    {
        return redirect()->back()->with('success', 'Booking cancelled successfully.');
    }
}
