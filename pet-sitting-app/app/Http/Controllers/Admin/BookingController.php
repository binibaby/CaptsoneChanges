<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\User;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BookingController extends Controller
{
    public function index(Request $request)
    {
        // Get filter parameters
        $status = $request->get('status');
        $search = $request->get('search');
        $dateFrom = $request->get('date_from');
        $dateTo = $request->get('date_to');
        
        // Build query
        $query = Booking::with(['user', 'sitter', 'payment'])
            ->orderBy('created_at', 'desc');
        
        // Apply filters
        if ($status) {
            $query->where('status', $status);
        }
        
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('id', 'like', "%{$search}%")
                  ->orWhereHas('user', function ($userQuery) use ($search) {
                      $userQuery->where('name', 'like', "%{$search}%")
                               ->orWhere('email', 'like', "%{$search}%");
                  })
                  ->orWhereHas('sitter', function ($sitterQuery) use ($search) {
                      $sitterQuery->where('name', 'like', "%{$search}%")
                                 ->orWhere('email', 'like', "%{$search}%");
                  });
            });
        }
        
        if ($dateFrom) {
            $query->where('date', '>=', $dateFrom);
        }
        
        if ($dateTo) {
            $query->where('date', '<=', $dateTo);
        }
        
        // Get paginated results
        $bookings = $query->paginate(20);
        
        // Get statistics
        $stats = [
            'total' => Booking::count(),
            'pending' => Booking::where('status', 'pending')->count(),
            'confirmed' => Booking::where('status', 'confirmed')->count(),
            'completed' => Booking::where('status', 'completed')->count(),
            'cancelled' => Booking::where('status', 'cancelled')->count(),
        ];
        
        return view('admin.bookings.index', compact('bookings', 'stats'));
    }

    public function show($id)
    {
        $booking = Booking::with(['user', 'sitter', 'payment'])->findOrFail($id);
        return view('admin.bookings.show', compact('booking'));
    }

    public function confirm($id)
    {
        $booking = Booking::findOrFail($id);
        
        if ($booking->status === 'pending') {
            $booking->update(['status' => 'confirmed']);
            return redirect()->back()->with('success', 'Booking confirmed successfully.');
        }
        
        return redirect()->back()->with('error', 'Only pending bookings can be confirmed.');
    }

    public function cancel($id)
    {
        $booking = Booking::findOrFail($id);
        
        if (in_array($booking->status, ['pending', 'confirmed'])) {
            $booking->update(['status' => 'cancelled']);
            return redirect()->back()->with('success', 'Booking cancelled successfully.');
        }
        
        return redirect()->back()->with('error', 'This booking cannot be cancelled.');
    }
}
