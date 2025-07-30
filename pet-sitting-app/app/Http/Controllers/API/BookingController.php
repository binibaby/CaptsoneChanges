<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\User;
use App\Models\Notification;
use Illuminate\Http\Request;
use Carbon\Carbon;

class BookingController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        
        $query = Booking::with(['user', 'sitter']);
        
        // Filter based on user role
        if ($user->role === 'pet_owner') {
            $query->where('user_id', $user->id);
        } elseif ($user->role === 'pet_sitter') {
            $query->where('sitter_id', $user->id);
        }
        
        $bookings = $query->orderBy('created_at', 'desc')->get();
        
        return response()->json([
            'success' => true,
            'bookings' => $bookings->map(function($booking) {
                return [
                    'id' => $booking->id,
                    'date' => $booking->date,
                    'time' => $booking->time,
                    'status' => $booking->status,
                    'pet_owner' => [
                        'id' => $booking->user->id,
                        'name' => $booking->user->name,
                        'email' => $booking->user->email,
                        'phone' => $booking->user->phone
                    ],
                    'pet_sitter' => [
                        'id' => $booking->sitter->id,
                        'name' => $booking->sitter->name,
                        'email' => $booking->sitter->email,
                        'phone' => $booking->sitter->phone
                    ],
                    'created_at' => $booking->created_at->format('Y-m-d H:i:s')
                ];
            })
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'sitter_id' => 'required|exists:users,id',
            'date' => 'required|date|after_or_equal:today',
            'time' => 'required|date_format:H:i',
            'pet_name' => 'required|string|max:100',
            'pet_type' => 'required|string|max:50',
            'service_type' => 'required|string|max:50',
            'duration' => 'required|integer|min:1',
            'rate_per_hour' => 'required|numeric|min:0',
            'description' => 'nullable|string|max:500'
        ]);

        $user = $request->user();
        
        // Verify the sitter exists and is actually a pet sitter
        $sitter = User::where('id', $request->sitter_id)
            ->where('role', 'pet_sitter')
            ->first();
            
        if (!$sitter) {
            return response()->json([
                'success' => false,
                'message' => 'Selected sitter not found or invalid.'
            ], 404);
        }

        // Create the booking
        $booking = Booking::create([
            'user_id' => $user->id,
            'sitter_id' => $request->sitter_id,
            'date' => $request->date,
            'time' => $request->time,
            'status' => 'pending'
        ]);

        // Calculate total amount
        $totalAmount = $request->rate_per_hour * $request->duration;

        // Notify admin about new booking
        $this->notifyAdminNewBooking($booking, $totalAmount, [
            'pet_name' => $request->pet_name,
            'pet_type' => $request->pet_type,
            'service_type' => $request->service_type,
            'duration' => $request->duration,
            'rate_per_hour' => $request->rate_per_hour,
            'description' => $request->description
        ]);

        // Notify the sitter about new booking request
        $this->notifySitterNewBooking($booking, $sitter);

        return response()->json([
            'success' => true,
            'message' => 'Booking request submitted successfully!',
            'booking' => [
                'id' => $booking->id,
                'date' => $booking->date,
                'time' => $booking->time,
                'status' => $booking->status,
                'pet_owner' => $user->name,
                'pet_sitter' => $sitter->name,
                'total_amount' => $totalAmount,
                'created_at' => $booking->created_at->format('Y-m-d H:i:s')
            ]
        ], 201);
    }

    public function show(Request $request, $id)
    {
        $user = $request->user();
        
        $booking = Booking::with(['user', 'sitter', 'payment'])->find($id);
        
        if (!$booking) {
            return response()->json([
                'success' => false,
                'message' => 'Booking not found.'
            ], 404);
        }

        // Check if user has permission to view this booking
        if ($booking->user_id !== $user->id && $booking->sitter_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized to view this booking.'
            ], 403);
        }

        return response()->json([
            'success' => true,
            'booking' => [
                'id' => $booking->id,
                'date' => $booking->date,
                'time' => $booking->time,
                'status' => $booking->status,
                'pet_owner' => [
                    'id' => $booking->user->id,
                    'name' => $booking->user->name,
                    'email' => $booking->user->email,
                    'phone' => $booking->user->phone
                ],
                'pet_sitter' => [
                    'id' => $booking->sitter->id,
                    'name' => $booking->sitter->name,
                    'email' => $booking->sitter->email,
                    'phone' => $booking->sitter->phone
                ],
                'payment' => $booking->payment ? [
                    'id' => $booking->payment->id,
                    'amount' => $booking->payment->amount,
                    'status' => $booking->payment->status,
                    'method' => $booking->payment->method,
                    'app_share' => $booking->payment->app_share,
                    'sitter_share' => $booking->payment->sitter_share
                ] : null,
                'created_at' => $booking->created_at->format('Y-m-d H:i:s')
            ]
        ]);
    }

    public function confirm(Request $request, $id)
    {
        $user = $request->user();
        $booking = Booking::find($id);
        
        if (!$booking) {
            return response()->json([
                'success' => false,
                'message' => 'Booking not found.'
            ], 404);
        }

        // Only sitter can confirm their bookings
        if ($booking->sitter_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized to confirm this booking.'
            ], 403);
        }

        $booking->update(['status' => 'confirmed']);

        // Notify pet owner about confirmation
        Notification::create([
            'user_id' => $booking->user_id,
            'type' => 'booking',
            'message' => "Your booking with {$user->name} has been confirmed for {$booking->date} at {$booking->time}."
        ]);

        // Notify admin about booking confirmation
        $this->notifyAdminBookingConfirmed($booking);

        return response()->json([
            'success' => true,
            'message' => 'Booking confirmed successfully!',
            'booking' => [
                'id' => $booking->id,
                'status' => $booking->status
            ]
        ]);
    }

    public function cancel(Request $request, $id)
    {
        $user = $request->user();
        $booking = Booking::find($id);
        
        if (!$booking) {
            return response()->json([
                'success' => false,
                'message' => 'Booking not found.'
            ], 404);
        }

        // Only booking owner or sitter can cancel
        if ($booking->user_id !== $user->id && $booking->sitter_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized to cancel this booking.'
            ], 403);
        }

        $booking->update(['status' => 'cancelled']);

        // Notify the other party about cancellation
        $otherUserId = ($booking->user_id === $user->id) ? $booking->sitter_id : $booking->user_id;
        Notification::create([
            'user_id' => $otherUserId,
            'type' => 'booking',
            'message' => "Your booking for {$booking->date} at {$booking->time} has been cancelled by {$user->name}."
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Booking cancelled successfully!',
            'booking' => [
                'id' => $booking->id,
                'status' => $booking->status
            ]
        ]);
    }

    private function notifyAdminNewBooking($booking, $totalAmount, $details)
    {
        $admins = User::where('is_admin', true)->get();
        
        foreach ($admins as $admin) {
            Notification::create([
                'user_id' => $admin->id,
                'type' => 'booking',
                'message' => "New booking request: {$booking->user->name} booked {$booking->sitter->name} for {$booking->date} at {$booking->time}. Service: {$details['service_type']} for {$details['pet_name']} ({$details['pet_type']}). Duration: {$details['duration']} hours. Total: ₱{$totalAmount}."
            ]);
        }
    }

    private function notifySitterNewBooking($booking, $sitter)
    {
        Notification::create([
            'user_id' => $sitter->id,
            'type' => 'booking',
            'message' => "New booking request from {$booking->user->name} for {$booking->date} at {$booking->time}. Please review and confirm."
        ]);
    }

    private function notifyAdminBookingConfirmed($booking)
    {
        $admins = User::where('is_admin', true)->get();
        
        foreach ($admins as $admin) {
            Notification::create([
                'user_id' => $admin->id,
                'type' => 'booking',
                'message' => "Booking confirmed: {$booking->sitter->name} confirmed the booking with {$booking->user->name} for {$booking->date} at {$booking->time}."
            ]);
        }
    }
} 