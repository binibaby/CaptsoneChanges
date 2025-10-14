<?php

namespace App\Http\Controllers\API;

use App\Events\BookingCompleted;
use App\Events\SessionStarted;
use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\User;
use App\Models\Notification;
use App\Models\WalletTransaction;
use Illuminate\Http\Request;
use Carbon\Carbon;

class BookingController extends Controller
{
    /**
     * Safely parse a date string with error handling
     */
    private function safeParseDate($dateString, $format = 'Y-m-d')
    {
        try {
            $cleanDate = trim($dateString);
            // Extract only the date part if there's extra data
            if (preg_match('/(\d{4}-\d{2}-\d{2})/', $cleanDate, $matches)) {
                $cleanDate = $matches[1];
            }
            return \Carbon\Carbon::createFromFormat($format, $cleanDate);
        } catch (\Exception $e) {
            \Log::error('Date parsing error:', [
                'input' => $dateString,
                'format' => $format,
                'error' => $e->getMessage()
            ]);
            return \Carbon\Carbon::now();
        }
    }

    /**
     * Safely parse a time string with error handling
     */
    private function safeParseTime($timeString, $format = 'H:i')
    {
        try {
            $cleanTime = trim($timeString);
            // Extract only the time part if there's extra data
            if (preg_match('/(\d{1,2}:\d{2})/', $cleanTime, $matches)) {
                $cleanTime = $matches[1];
            }
            return \Carbon\Carbon::createFromFormat($format, $cleanTime);
        } catch (\Exception $e) {
            \Log::error('Time parsing error:', [
                'input' => $timeString,
                'format' => $format,
                'error' => $e->getMessage()
            ]);
            return \Carbon\Carbon::now();
        }
    }
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
                    'time' => $booking->start_time ? $booking->date . ' ' . $booking->start_time : $booking->time,
                    'status' => $booking->status,
                    'hourly_rate' => $booking->hourly_rate,
                    'total_amount' => $booking->total_amount,
                    'start_time' => $booking->start_time,
                    'end_time' => $booking->end_time,
                    'duration' => $booking->duration,
                    'pet_name' => $booking->pet_name,
                    'pet_type' => $booking->pet_type,
                    'service_type' => $booking->service_type,
                    'description' => $booking->description,
                    'is_weekly' => $booking->is_weekly,
                    'start_date' => $booking->start_date,
                    'end_date' => $booking->end_date,
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
        // Debug: Log the incoming request data
        \Log::info('📝 BookingController - Incoming booking request:', [
            'date' => $request->date,
            'time' => $request->time,
            'start_time' => $request->start_time,
            'end_time' => $request->end_time,
            'sitter_id' => $request->sitter_id,
            'is_weekly' => $request->is_weekly,
            'all_data' => $request->all()
        ]);
        
        // Debug: Test date parsing with error handling
        $testDate = $request->date;
        $parsedDate = $this->safeParseDate($testDate);
        \Log::info('📅 Backend date parsing test:', [
            'input_date' => $testDate,
            'parsed_date' => $parsedDate->format('Y-m-d'),
            'formatted_for_notification' => $parsedDate->format('F j, Y'),
            'timezone' => $parsedDate->timezone->getName()
        ]);
        
        $request->validate([
            'sitter_id' => 'required|exists:users,id',
            'date' => 'required|date|after_or_equal:today',
            'time' => 'required|date_format:H:i',
            'pet_name' => 'nullable|string|max:100',
            'pet_type' => 'nullable|string|max:50',
            'service_type' => 'nullable|string|max:50',
            'duration' => 'nullable|numeric|min:0.5',
            'rate_per_hour' => 'nullable|numeric|min:0',
            'description' => 'nullable|string|max:500',
            'is_weekly' => 'nullable|boolean',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'start_time' => 'nullable|date_format:H:i',
            'end_time' => 'nullable|date_format:H:i',
            'total_amount' => 'nullable|numeric|min:0'
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

        // Determine if this is a weekly booking
        $isWeekly = $request->boolean('is_weekly', false);
        
        // Calculate total amount
        $totalAmount = 0;
        if ($isWeekly && $request->total_amount) {
            $totalAmount = $request->total_amount;
        } elseif ($request->rate_per_hour && $request->duration) {
            // Duration is now in hours, so multiply directly
            $totalAmount = $request->rate_per_hour * $request->duration;
        }

        // Validate that we have a valid total amount
        if ($totalAmount <= 0) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid booking amount. Please provide valid rate and duration.'
            ], 400);
        }

        // Create the booking
        $booking = Booking::create([
            'user_id' => $user->id,
            'sitter_id' => $request->sitter_id,
            'date' => $request->date,
            'time' => $request->time,
            'status' => 'confirmed',
            'is_weekly' => $isWeekly,
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
            'start_time' => $request->start_time,
            'end_time' => $request->end_time,
            'hourly_rate' => $request->rate_per_hour,
            'total_amount' => $totalAmount,
            'pet_name' => $request->pet_name,
            'pet_type' => $request->pet_type,
            'service_type' => $request->service_type,
            'duration' => $request->duration,
            'description' => $request->description
        ]);
        
        // Debug: Log the created booking data
        \Log::info('📝 BookingController - Booking created successfully:', [
            'booking_id' => $booking->id,
            'date' => $booking->date,
            'time' => $booking->time,
            'start_time' => $booking->start_time,
            'end_time' => $booking->end_time,
            'is_weekly' => $booking->is_weekly,
            'sitter_id' => $booking->sitter_id,
            'user_id' => $booking->user_id
        ]);

        // Dispatch real-time event for dashboard updates
        event(new \App\Events\BookingUpdated($user->id, $user->role, [
            'booking_id' => $booking->id,
            'status' => $booking->status,
            'date' => $booking->date,
            'sitter_id' => $booking->sitter_id,
            'user_id' => $booking->user_id
        ]));

        // Also notify the sitter's dashboard
        event(new \App\Events\BookingUpdated($sitter->id, $sitter->role, [
            'booking_id' => $booking->id,
            'status' => $booking->status,
            'date' => $booking->date,
            'sitter_id' => $booking->sitter_id,
            'user_id' => $booking->user_id
        ]));

        // Notify admin about new booking
        $this->notifyAdminNewBooking($booking, $totalAmount, [
            'pet_name' => $request->pet_name,
            'pet_type' => $request->pet_type,
            'service_type' => $request->service_type,
            'duration' => $request->duration,
            'rate_per_hour' => $request->rate_per_hour,
            'description' => $request->description,
            'is_weekly' => $isWeekly
        ]);

        // Notify the sitter about new confirmed booking (auto-confirmed)
        $this->notifySitterNewBooking($booking, $sitter);

        return response()->json([
            'success' => true,
            'message' => 'Booking confirmed successfully!',
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
        $message = '';
        if ($booking->is_weekly) {
            $startDate = $this->safeParseDate($booking->start_date)->format('F j, Y');
            $endDate = $this->safeParseDate($booking->end_date)->format('F j, Y');
            $message = "Your weekly booking with {$user->name} has been confirmed from {$startDate} to {$endDate}.";
        } else {
            $date = $this->safeParseDate($booking->date)->format('F j, Y');
            $time = $this->safeParseTime($booking->time)->format('g:i A');
            $message = "Your booking with {$user->name} has been confirmed for {$date} at {$time}.";
        }
        
        Notification::create([
            'user_id' => $booking->user_id,
            'type' => 'booking',
            'message' => $message,
            'data' => json_encode([
                'booking_id' => $booking->id,
                'booking_type' => $booking->is_weekly ? 'weekly' : 'daily',
                'pet_owner_name' => $booking->user->name,
                'sitter_name' => $user->name,
                'date' => $booking->date,
                'time' => $booking->time,
                'start_date' => $booking->start_date,
                'end_date' => $booking->end_date,
                'start_time' => $booking->start_time,
                'end_time' => $booking->end_time,
                'hourly_rate' => $booking->hourly_rate,
                'status' => 'confirmed'
            ])
        ]);

        // Notify admin about booking confirmation
        $this->notifyAdminBookingConfirmed($booking);

        // Dispatch real-time event for dashboard updates
        event(new \App\Events\BookingUpdated($booking->user_id, 'pet_owner', [
            'booking_id' => $booking->id,
            'status' => $booking->status,
            'date' => $booking->date,
            'sitter_id' => $booking->sitter_id,
            'user_id' => $booking->user_id
        ]));

        event(new \App\Events\BookingUpdated($booking->sitter_id, 'pet_sitter', [
            'booking_id' => $booking->id,
            'status' => $booking->status,
            'date' => $booking->date,
            'sitter_id' => $booking->sitter_id,
            'user_id' => $booking->user_id
        ]));

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
        
        $message = '';
        if ($booking->is_weekly) {
            $startDate = $this->safeParseDate($booking->start_date)->format('F j, Y');
            $endDate = $this->safeParseDate($booking->end_date)->format('F j, Y');
            $message = "Your weekly booking from {$startDate} to {$endDate} has been cancelled by {$user->name}.";
        } else {
            $date = $this->safeParseDate($booking->date)->format('F j, Y');
            $time = $this->safeParseTime($booking->time)->format('g:i A');
            $message = "Your booking for {$date} at {$time} has been cancelled by {$user->name}.";
        }
        
        Notification::create([
            'user_id' => $otherUserId,
            'type' => 'booking',
            'message' => $message,
            'data' => json_encode([
                'booking_id' => $booking->id,
                'booking_type' => $booking->is_weekly ? 'weekly' : 'daily',
                'pet_owner_name' => $booking->user->name,
                'sitter_name' => $booking->sitter->name,
                'date' => $booking->date,
                'time' => $booking->time,
                'start_date' => $booking->start_date,
                'end_date' => $booking->end_date,
                'start_time' => $booking->start_time,
                'end_time' => $booking->end_time,
                'hourly_rate' => $booking->hourly_rate,
                'status' => 'cancelled'
            ])
        ]);

        // Dispatch real-time event for dashboard updates
        event(new \App\Events\BookingUpdated($booking->user_id, 'pet_owner', [
            'booking_id' => $booking->id,
            'status' => $booking->status,
            'date' => $booking->date,
            'sitter_id' => $booking->sitter_id,
            'user_id' => $booking->user_id
        ]));

        event(new \App\Events\BookingUpdated($booking->sitter_id, 'pet_sitter', [
            'booking_id' => $booking->id,
            'status' => $booking->status,
            'date' => $booking->date,
            'sitter_id' => $booking->sitter_id,
            'user_id' => $booking->user_id
        ]));

        return response()->json([
            'success' => true,
            'message' => 'Booking cancelled successfully!',
            'booking' => [
                'id' => $booking->id,
                'status' => $booking->status
            ]
        ]);
    }

    /**
     * Start a booking session (sitter only).
     */
    public function start(Request $request, $id)
    {
        $user = $request->user();
        $booking = Booking::with(['sitter', 'user'])->find($id);
        
        if (!$booking) {
            return response()->json([
                'success' => false,
                'message' => 'Booking not found.'
            ], 404);
        }

        // Only the sitter can start the session
        if ($booking->sitter_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Only the assigned sitter can start the session.'
            ], 403);
        }

        // Check if booking is confirmed
        if ($booking->status !== 'confirmed') {
            return response()->json([
                'success' => false,
                'message' => 'Booking must be confirmed before starting the session.'
            ], 400);
        }

        // Check if session can be started (within 3 minutes of start time)
        // Handle different time formats - start_time might be just time (HH:MM) or full datetime
        $startTimeString = $booking->getRawOriginal('start_time');
        
        // Debug: Check if the issue is with model access
        \Log::info('🕐 Model access debug:', [
            'booking_id' => $booking->id,
            'date' => $booking->date,
            'date_type' => gettype($booking->date),
            'start_time' => $startTimeString,
            'start_time_type' => gettype($startTimeString),
            'raw_attributes' => $booking->getRawOriginal(),
            'toArray' => $booking->toArray()
        ]);
        
        // Debug: Log the time data we're working with
        \Log::info('🕐 Start session time parsing:', [
            'booking_id' => $booking->id,
            'date' => $booking->date,
            'start_time' => $startTimeString,
            'start_time_type' => gettype($startTimeString),
            'contains_space' => strpos($startTimeString, ' ') !== false,
            'raw_start_time' => $booking->getRawOriginal('start_time'),
            'start_time_length' => strlen($startTimeString),
            'char_codes' => array_map('ord', str_split($startTimeString)),
            'regex_test_1' => preg_match('/(\d{1,2}:\d{2})/', $startTimeString, $matches1) ? $matches1[1] : 'no match',
            'regex_test_2' => preg_match('/(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2})\s+(\d{1,2}:\d{2})/', $startTimeString, $matches2) ? $matches2 : 'no match'
        ]);
        
        try {
            // Clean up the time string first
            $cleanTimeString = trim($startTimeString);
            
            // Get the raw date value to avoid datetime concatenation issues
            $rawDate = $booking->getRawOriginal('date');
            $dateOnly = date('Y-m-d', strtotime($rawDate));
            
            // Check if it's a malformed datetime with double time specification
            if (preg_match('/(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2})\s+(\d{1,2}:\d{2})/', $cleanTimeString, $matches)) {
                // Extract the actual time part (the second time specification)
                $actualTime = $matches[3];
                $startTime = Carbon::parse($dateOnly . ' ' . $actualTime);
            } elseif (preg_match('/(\d{4}-\d{2}-\d{2})\s+(\d{1,2}:\d{2})/', $cleanTimeString, $matches)) {
                // Handle case where date and time are combined but we only want the time part
                $actualTime = $matches[2];
                $startTime = Carbon::parse($dateOnly . ' ' . $actualTime);
            } elseif (strpos($cleanTimeString, ' ') !== false) {
                // If start_time already contains date and time, use it directly
                $startTime = Carbon::parse($cleanTimeString);
            } else {
                // If start_time is just time (HH:MM), combine with date
                $startTime = Carbon::parse($dateOnly . ' ' . $cleanTimeString);
            }
        } catch (\Exception $e) {
            \Log::error('🕐 Time parsing error:', [
                'booking_id' => $booking->id,
                'date' => $booking->date,
                'start_time' => $startTimeString,
                'error' => $e->getMessage()
            ]);
            
            // Fallback: try to extract just the time part if it's malformed
            $rawDate = $booking->getRawOriginal('date');
            $dateOnly = date('Y-m-d', strtotime($rawDate));
            if (preg_match('/(\d{1,2}:\d{2})/', $startTimeString, $matches)) {
                $startTime = Carbon::parse($dateOnly . ' ' . $matches[1]);
            } elseif (preg_match('/(\d{1,2}:\d{2}:\d{2})/', $startTimeString, $matches)) {
                // Try to match time with seconds
                $startTime = Carbon::parse($dateOnly . ' ' . $matches[1]);
            } else {
                // Last resort: try to extract any time-like pattern
                if (preg_match('/(\d{1,2}:\d{2}(?::\d{2})?)/', $startTimeString, $matches)) {
                    $startTime = Carbon::parse($dateOnly . ' ' . $matches[1]);
                } else {
                    \Log::error('🕐 Complete time parsing failure:', [
                        'booking_id' => $booking->id,
                        'start_time_string' => $startTimeString,
                        'string_length' => strlen($startTimeString),
                        'char_codes' => array_map('ord', str_split($startTimeString))
                    ]);
                    
                    return response()->json([
                        'success' => false,
                        'message' => 'Invalid time format in booking data.'
                    ], 400);
                }
            }
        }
        
        $currentTime = Carbon::now();
        $timeDifference = $startTime->diffInMinutes($currentTime, false);

        // Allow starting session at any time (removed 3-minute restriction)
        // Only prevent starting if it's more than 24 hours in the future
        if ($timeDifference > 1440) { // 1440 minutes = 24 hours
            return response()->json([
                'success' => false,
                'message' => 'Session cannot be started more than 24 hours in advance.'
            ], 400);
        }

        try {
            // Update booking status to active
            $booking->update(['status' => 'active']);

            // Create notification for the owner
            $owner = $booking->user;
            $sitter = $booking->sitter;
            
            $owner->notifications()->create([
                'type' => 'session_started',
                'title' => 'Session Started',
                'message' => "Your sitter {$sitter->first_name} {$sitter->last_name} has started the session for your booking.",
                'data' => json_encode([
                    'booking_id' => $booking->id,
                    'sitter_name' => "{$sitter->first_name} {$sitter->last_name}",
                    'pet_name' => $booking->pet_name,
                    'date' => $booking->date->format('Y-m-d'),
                    'start_time' => $booking->start_time,
                    'end_time' => $booking->end_time,
                ]),
            ]);

            // Broadcast the event
            broadcast(new SessionStarted($booking, $sitter, $owner));

            // Dispatch real-time event for dashboard updates
            event(new \App\Events\BookingUpdated($booking->user_id, 'pet_owner', [
                'booking_id' => $booking->id,
                'status' => $booking->status,
                'date' => $booking->date,
                'sitter_id' => $booking->sitter_id,
                'user_id' => $booking->user_id
            ]));

            event(new \App\Events\BookingUpdated($booking->sitter_id, 'pet_sitter', [
                'booking_id' => $booking->id,
                'status' => $booking->status,
                'date' => $booking->date,
                'sitter_id' => $booking->sitter_id,
                'user_id' => $booking->user_id
            ]));

            return response()->json([
                'success' => true,
                'message' => 'Session started successfully!',
                'booking' => [
                    'id' => $booking->id,
                    'status' => $booking->status,
                    'sitter_name' => "{$sitter->first_name} {$sitter->last_name}",
                    'owner_name' => "{$owner->first_name} {$owner->last_name}",
                ],
            ]);

        } catch (\Exception $e) {
            \Log::error('Error starting session: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to start session. Please try again.'
            ], 500);
        }
    }

    /**
     * Automatically complete sessions that have ended.
     */
    public function autoCompleteSessions()
    {
        try {
            $now = Carbon::now();
            
            // Find active bookings where the session should have ended
            $activeBookings = Booking::with(['sitter', 'user'])
                ->where('status', 'active')
                ->get()
                ->filter(function ($booking) use ($now) {
                    try {
                        $endTime = Carbon::parse($booking->date . ' ' . $booking->end_time);
                        return $now->greaterThan($endTime);
                    } catch (\Exception $e) {
                        \Log::error('Error parsing end time for auto-completion: ' . $e->getMessage());
                        return false;
                    }
                });

            $completedCount = 0;
            
            foreach ($activeBookings as $booking) {
                try {
                    // Update booking status to completed
                    $booking->update(['status' => 'completed']);

                    // Update sitter's wallet balance (90% of total amount)
                    $sitter = $booking->sitter;
                    $sitterShare = $booking->total_amount * 0.9;
                    $sitter->increment('wallet_balance', $sitterShare);

                    // Create wallet transaction record for the sitter
                    WalletTransaction::create([
                        'user_id' => $sitter->id,
                        'type' => 'credit',
                        'amount' => $sitterShare,
                        'status' => 'completed',
                        'reference_number' => 'BOOKING_' . $booking->id,
                        'notes' => 'Payment for completed booking #' . $booking->id,
                        'processed_at' => now(),
                    ]);

                    // Create notification for the owner
                    $owner = $booking->user;
                    
                    $owner->notifications()->create([
                        'type' => 'booking_completed',
                        'title' => 'Booking Completed',
                        'message' => "Your booking with {$sitter->name} has been automatically completed. You can go to the Book Service page, open the Past tab, and rate and review your sitter.",
                        'data' => json_encode([
                            'booking_id' => $booking->id,
                            'sitter_name' => $sitter->name,
                            'sitter_id' => $sitter->id,
                            'pet_name' => $booking->pet_name,
                            'date' => $booking->date->format('Y-m-d'),
                            'start_time' => $booking->start_time,
                            'end_time' => $booking->end_time,
                            'total_amount' => $booking->total_amount,
                        ]),
                    ]);

                    // Create notification for the sitter
                    $sitter->notifications()->create([
                        'type' => 'booking_completed',
                        'title' => 'Booking Completed',
                        'message' => "Your session with {$owner->first_name} {$owner->last_name} has been automatically completed. You earned ₱{$sitterShare}.",
                        'data' => json_encode([
                            'booking_id' => $booking->id,
                            'owner_name' => "{$owner->first_name} {$owner->last_name}",
                            'owner_id' => $owner->id,
                            'pet_name' => $booking->pet_name,
                            'date' => $booking->date->format('Y-m-d'),
                            'start_time' => $booking->start_time,
                            'end_time' => $booking->end_time,
                            'total_amount' => $booking->total_amount,
                            'sitter_earnings' => $sitterShare,
                        ]),
                    ]);

                    // Broadcast the event
                    broadcast(new BookingCompleted($booking, $sitter, $owner));
                    
                    $completedCount++;
                } catch (\Exception $e) {
                    \Log::error('Error auto-completing booking ' . $booking->id . ': ' . $e->getMessage());
                }
            }

            \Log::info("Auto-completed {$completedCount} sessions");
            
            return response()->json([
                'success' => true,
                'message' => "Auto-completed {$completedCount} sessions",
                'completed_count' => $completedCount,
            ]);

        } catch (\Exception $e) {
            \Log::error('Error in autoCompleteSessions: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to auto-complete sessions',
            ], 500);
        }
    }

    /**
     * Complete a booking session (sitter only).
     */
    public function complete(Request $request, $id)
    {
        $user = $request->user();
        $booking = Booking::with(['sitter', 'user'])->find($id);
        
        if (!$booking) {
            return response()->json([
                'success' => false,
                'message' => 'Booking not found.'
            ], 404);
        }

        // Only the sitter can complete the session
        if ($booking->sitter_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Only the assigned sitter can complete the session.'
            ], 403);
        }

        // Check if booking is active
        if ($booking->status !== 'active') {
            return response()->json([
                'success' => false,
                'message' => 'Booking must be active before completing the session.'
            ], 400);
        }

        try {
            // Update booking status to completed
            $booking->update(['status' => 'completed']);

            // Update sitter's wallet balance (90% of total amount)
            $sitterShare = $booking->total_amount * 0.9;
            $sitter->increment('wallet_balance', $sitterShare);

            // Create wallet transaction record for the sitter
            WalletTransaction::create([
                'user_id' => $sitter->id,
                'type' => 'credit',
                'amount' => $sitterShare,
                'status' => 'completed',
                'reference_number' => 'BOOKING_' . $booking->id,
                'notes' => 'Payment for completed booking #' . $booking->id,
                'processed_at' => now(),
            ]);

            // Create notification for the owner
            $owner = $booking->user;
            $sitter = $booking->sitter;
            
            $owner->notifications()->create([
                'type' => 'booking_completed',
                'title' => 'Booking Completed',
                'message' => "Your booking with {$sitter->first_name} {$sitter->last_name} is now completed. You can go to the Book Service page, open the Past tab, and rate and review your sitter.",
                'data' => json_encode([
                    'booking_id' => $booking->id,
                    'sitter_name' => "{$sitter->first_name} {$sitter->last_name}",
                    'sitter_id' => $sitter->id,
                    'pet_name' => $booking->pet_name,
                    'date' => $booking->date->format('Y-m-d'),
                    'start_time' => $booking->start_time,
                    'end_time' => $booking->end_time,
                    'total_amount' => $booking->total_amount,
                ]),
            ]);

            // Broadcast the event
            broadcast(new BookingCompleted($booking, $sitter, $owner));
            
            // Broadcast dashboard update for the sitter
            $dashboardData = [
                'wallet_balance' => $sitter->wallet_balance,
                'total_income' => $sitter->wallet_balance,
                'this_week_income' => $sitter->wallet_balance,
                'upcoming_jobs' => $sitter->bookings()->where('status', 'confirmed')->count(),
                'completed_jobs' => $sitter->bookings()->where('status', 'completed')->count(),
            ];
            broadcast(new \App\Events\DashboardUpdated($sitter, $dashboardData));

            // Dispatch real-time event for dashboard updates
            event(new \App\Events\BookingUpdated($booking->user_id, 'pet_owner', [
                'booking_id' => $booking->id,
                'status' => $booking->status,
                'date' => $booking->date,
                'sitter_id' => $booking->sitter_id,
                'user_id' => $booking->user_id
            ]));

            event(new \App\Events\BookingUpdated($booking->sitter_id, 'pet_sitter', [
                'booking_id' => $booking->id,
                'status' => $booking->status,
                'date' => $booking->date,
                'sitter_id' => $booking->sitter_id,
                'user_id' => $booking->user_id
            ]));

            return response()->json([
                'success' => true,
                'message' => 'Booking completed successfully!',
                'booking' => [
                    'id' => $booking->id,
                    'status' => $booking->status,
                    'sitter_name' => "{$sitter->first_name} {$sitter->last_name}",
                    'owner_name' => "{$owner->first_name} {$owner->last_name}",
                ],
            ]);

        } catch (\Exception $e) {
            \Log::error('Error completing booking: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to complete booking. Please try again.'
            ], 500);
        }
    }

    private function notifyAdminNewBooking($booking, $totalAmount, $details)
    {
        $admins = User::where('is_admin', true)->get();
        
        $message = '';
        
        if ($booking->is_weekly) {
            // Weekly booking message
            $startDate = $this->safeParseDate($booking->start_date)->format('F j, Y');
            $endDate = $this->safeParseDate($booking->end_date)->format('F j, Y');
            $startTime = $this->safeParseTime($booking->start_time)->format('g:i A');
            $endTime = $this->safeParseTime($booking->end_time)->format('g:i A');
            
            $message = "New weekly booking request: {$booking->user->name} booked {$booking->sitter->name} from {$startDate} to {$endDate} at {$startTime} - {$endTime}. Service: {$details['service_type']} for {$details['pet_name']} ({$details['pet_type']}). Duration: {$details['duration']} hours. Total: ₱{$totalAmount}.";
        } else {
            // Daily booking message
            $date = $this->safeParseDate($booking->date)->format('F j, Y');
            $startTime = $this->safeParseTime($booking->time)->format('g:i A');
            $endTime = $this->safeParseTime($booking->time)->addHours($details['duration'] ?? 8)->format('g:i A');
            
            $message = "New booking request: {$booking->user->name} booked {$booking->sitter->name} for {$date} at {$startTime} - {$endTime}. Service: {$details['service_type']} for {$details['pet_name']} ({$details['pet_type']}). Duration: {$details['duration']} hours. Total: ₱{$totalAmount}.";
        }
        
        foreach ($admins as $admin) {
            Notification::create([
                'user_id' => $admin->id,
                'type' => 'booking',
                'title' => 'New Booking Created',
                'message' => $message,
                'data' => json_encode([
                    'booking_id' => $booking->id,
                    'booking_type' => $booking->is_weekly ? 'weekly' : 'daily',
                    'pet_owner_name' => $booking->user->name,
                    'sitter_name' => $booking->sitter->name,
                    'date' => $booking->date,
                    'time' => $booking->time,
                    'start_date' => $booking->start_date,
                    'end_date' => $booking->end_date,
                    'start_time' => $booking->start_time,
                    'end_time' => $booking->end_time,
                    'hourly_rate' => $booking->hourly_rate,
                    'status' => $booking->status
                ])
            ]);
        }
    }

    private function notifySitterNewBooking($booking, $sitter)
    {
        // Debug: Log the booking data being used for notification
        \Log::info('🔔 Creating sitter notification for booking:', [
            'booking_id' => $booking->id,
            'date' => $booking->date,
            'time' => $booking->time,
            'start_time' => $booking->start_time,
            'end_time' => $booking->end_time,
            'duration' => $booking->duration,
            'is_weekly' => $booking->is_weekly,
            'pet_owner_name' => $booking->user->name,
            'sitter_name' => $sitter->name
        ]);
        
        $message = '';
        
        if ($booking->is_weekly) {
            // Weekly booking message
            $startDate = $this->safeParseDate($booking->start_date)->format('F j, Y');
            $endDate = $this->safeParseDate($booking->end_date)->format('F j, Y');
            $startTime = $this->safeParseTime($booking->start_time)->format('g:i A');
            $endTime = $this->safeParseTime($booking->end_time)->format('g:i A');
            
            $message = "You have a new booking from {$booking->user->name}. Please check your schedule for details.";
        } else {
            // Daily booking message - parse date without timezone conversion
            $date = $this->safeParseDate($booking->date)->format('F j, Y');
            
            // Use start_time and end_time if available, otherwise fall back to time + duration
            if ($booking->start_time && $booking->end_time) {
                $startTime = $this->safeParseTime($booking->start_time)->format('g:i A');
                $endTime = $this->safeParseTime($booking->end_time)->format('g:i A');
            } else {
                $startTime = $this->safeParseTime($booking->time)->format('g:i A');
                $endTime = $this->safeParseTime($booking->time)->addHours($booking->duration ?? 8)->format('g:i A');
            }
            
            $message = "You have a new booking from {$booking->user->name}. Please check your schedule for details.";
        }
        
        // Debug: Log the final message being created
        \Log::info('🔔 Sitter notification message:', [
            'message' => $message,
            'formatted_date' => $date ?? 'N/A',
            'formatted_start_time' => $startTime ?? 'N/A',
            'formatted_end_time' => $endTime ?? 'N/A'
        ]);
        
        Notification::create([
            'user_id' => $sitter->id,
            'type' => 'booking',
            'title' => 'New Booking Request',
            'message' => $message,
            'data' => json_encode([
                'booking_id' => $booking->id,
                'booking_type' => $booking->is_weekly ? 'weekly' : 'daily',
                'pet_owner_name' => $booking->user->name,
                'sitter_name' => $sitter->name,
                'date' => $booking->date,
                'time' => $booking->time,
                'start_date' => $booking->start_date,
                'end_date' => $booking->end_date,
                'start_time' => $booking->start_time,
                'end_time' => $booking->end_time,
                'hourly_rate' => $booking->hourly_rate,
                'status' => $booking->status
            ])
        ]);
    }

    private function notifyAdminBookingConfirmed($booking)
    {
        $admins = User::where('is_admin', true)->get();
        
        $message = '';
        if ($booking->is_weekly) {
            $startDate = $this->safeParseDate($booking->start_date)->format('F j, Y');
            $endDate = $this->safeParseDate($booking->end_date)->format('F j, Y');
            $message = "Weekly booking confirmed: {$booking->sitter->name} confirmed the booking with {$booking->user->name} from {$startDate} to {$endDate}.";
        } else {
            $date = $this->safeParseDate($booking->date)->format('F j, Y');
            $time = $this->safeParseTime($booking->time)->format('g:i A');
            $message = "Booking confirmed: {$booking->sitter->name} confirmed the booking with {$booking->user->name} for {$date} at {$time}.";
        }
        
        foreach ($admins as $admin) {
            Notification::create([
                'user_id' => $admin->id,
                'type' => 'booking',
                'title' => 'Booking Confirmed',
                'message' => $message
            ]);
        }
    }
} 