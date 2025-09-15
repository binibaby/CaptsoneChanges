<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\Booking;
use App\Models\User;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PaymentController extends Controller
{
    protected $platformFeePercentage = 20; // 20% platform fee

    public function processPayment(Request $request)
    {
        $request->validate([
            'booking_id' => 'required|exists:bookings,id',
            'amount' => 'required|numeric|min:0',
            'payment_method' => 'required|in:gcash,maya',
            'payment_details' => 'required|array'
        ]);

        $user = $request->user();
        $booking = Booking::with(['user', 'sitter'])->find($request->booking_id);
        
        // Verify user owns this booking
        if ($booking->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized to pay for this booking.'
            ], 403);
        }

        // Check if payment already exists
        $existingPayment = Payment::where('booking_id', $booking->id)->first();
        if ($existingPayment && $existingPayment->status === 'paid') {
            return response()->json([
                'success' => false,
                'message' => 'Payment has already been processed for this booking.'
            ], 400);
        }

        DB::beginTransaction();
        
        try {
            // Calculate platform fee and sitter share
            $totalAmount = $request->amount;
            $platformFee = ($totalAmount * $this->platformFeePercentage) / 100;
            $sitterShare = $totalAmount - $platformFee;

            // Create payment record
            $payment = Payment::create([
                'booking_id' => $booking->id,
                'amount' => $totalAmount,
                'method' => $request->payment_method,
                'app_share' => $platformFee,
                'sitter_share' => $sitterShare,
                'status' => 'pending',
                'transaction_id' => 'TXN_' . time() . '_' . rand(1000, 9999)
            ]);

            // Process payment based on method
            $paymentResult = $this->processPaymentByMethod($payment, $request->payment_method, $request->payment_details);
            
            if (!$paymentResult['success']) {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => $paymentResult['message']
                ], 400);
            }

            // Update payment status
            $payment->update([
                'status' => 'paid',
                'processed_at' => now()
            ]);

            // Update booking status
            $booking->update(['status' => 'confirmed']);

            // Notify all parties
            $this->notifyPaymentSuccess($payment, $booking);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Payment processed successfully!',
                'payment' => [
                    'id' => $payment->id,
                    'amount' => $payment->amount,
                    'platform_fee' => $payment->app_share,
                    'sitter_amount' => $payment->sitter_share,
                    'status' => $payment->status,
                    'method' => $payment->method,
                    'transaction_id' => $payment->transaction_id,
                    'processed_at' => $payment->processed_at->format('Y-m-d H:i:s')
                ]
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Payment processing failed: ' . $e->getMessage()
            ], 500);
        }
    }


    public function processGcashPayment(Request $request)
    {
        $request->validate([
            'booking_id' => 'required|exists:bookings,id',
            'amount' => 'required|numeric|min:0',
            'phone_number' => 'required|string'
        ]);

        // Simulate GCash payment processing
        $booking = Booking::find($request->booking_id);
        $totalAmount = $request->amount;
        $platformFee = ($totalAmount * $this->platformFeePercentage) / 100;
        $sitterShare = $totalAmount - $platformFee;

        // In production, integrate with actual GCash API
        $payment = Payment::create([
            'booking_id' => $booking->id,
            'amount' => $totalAmount,
            'method' => 'gcash',
            'app_share' => $platformFee,
            'sitter_share' => $sitterShare,
            'status' => 'paid',
            'transaction_id' => 'GCASH_' . time() . '_' . rand(1000, 9999),
            'processed_at' => now()
        ]);

        $booking->update(['status' => 'confirmed']);
        $this->notifyPaymentSuccess($payment, $booking);

        return response()->json([
            'success' => true,
            'message' => 'GCash payment processed successfully!',
            'payment' => [
                'id' => $payment->id,
                'amount' => $payment->amount,
                'platform_fee' => $payment->app_share,
                'sitter_amount' => $payment->sitter_share,
                'status' => $payment->status,
                'transaction_id' => $payment->transaction_id
            ]
        ]);
    }

    public function processMayaPayment(Request $request)
    {
        $request->validate([
            'booking_id' => 'required|exists:bookings,id',
            'amount' => 'required|numeric|min:0',
            'phone_number' => 'required|string'
        ]);

        // Simulate Maya payment processing
        $booking = Booking::find($request->booking_id);
        $totalAmount = $request->amount;
        $platformFee = ($totalAmount * $this->platformFeePercentage) / 100;
        $sitterShare = $totalAmount - $platformFee;

        // In production, integrate with actual Maya API
        $payment = Payment::create([
            'booking_id' => $booking->id,
            'amount' => $totalAmount,
            'method' => 'maya',
            'app_share' => $platformFee,
            'sitter_share' => $sitterShare,
            'status' => 'paid',
            'transaction_id' => 'MAYA_' . time() . '_' . rand(1000, 9999),
            'processed_at' => now()
        ]);

        $booking->update(['status' => 'confirmed']);
        $this->notifyPaymentSuccess($payment, $booking);

        return response()->json([
            'success' => true,
            'message' => 'Maya payment processed successfully!',
            'payment' => [
                'id' => $payment->id,
                'amount' => $payment->amount,
                'platform_fee' => $payment->app_share,
                'sitter_amount' => $payment->sitter_share,
                'status' => $payment->status,
                'transaction_id' => $payment->transaction_id
            ]
        ]);
    }

    public function getPaymentHistory(Request $request)
    {
        $user = $request->user();
        
        $payments = Payment::with(['booking.user', 'booking.sitter'])
            ->whereHas('booking', function($query) use ($user) {
                $query->where('user_id', $user->id)
                      ->orWhere('sitter_id', $user->id);
            })
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'payments' => $payments->map(function($payment) {
                return [
                    'id' => $payment->id,
                    'amount' => $payment->amount,
                    'platform_fee' => $payment->app_share,
                    'sitter_amount' => $payment->sitter_share,
                    'status' => $payment->status,
                    'method' => $payment->method,
                    'transaction_id' => $payment->transaction_id,
                    'booking' => [
                        'id' => $payment->booking->id,
                        'date' => $payment->booking->date,
                        'time' => $payment->booking->time,
                        'pet_owner' => $payment->booking->user->name,
                        'pet_sitter' => $payment->booking->sitter->name
                    ],
                    'created_at' => $payment->created_at->format('Y-m-d H:i:s')
                ];
            })
        ]);
    }

    private function processPaymentByMethod($payment, $method, $details)
    {
        // Simulate payment processing - in production, integrate with actual APIs
        switch ($method) {
            case 'stripe':
                return ['success' => true, 'message' => 'Stripe payment successful'];
            case 'gcash':
                return ['success' => true, 'message' => 'GCash payment successful'];
            case 'maya':
                return ['success' => true, 'message' => 'Maya payment successful'];
            default:
                return ['success' => false, 'message' => 'Unsupported payment method'];
        }
    }

    private function notifyPaymentSuccess($payment, $booking)
    {
        // Notify pet owner
        Notification::create([
            'user_id' => $booking->user_id,
            'type' => 'payment',
            'message' => "Payment successful! ₱{$payment->amount} paid for booking with {$booking->sitter->name}. Platform fee: ₱{$payment->app_share}."
        ]);

        // Notify pet sitter
        Notification::create([
            'user_id' => $booking->sitter_id,
            'type' => 'payment',
            'message' => "Payment received! You will receive ₱{$payment->sitter_share} for your booking with {$booking->user->name}."
        ]);

        // Notify admins
        $admins = User::where('is_admin', true)->get();
        foreach ($admins as $admin) {
            Notification::create([
                'user_id' => $admin->id,
                'type' => 'payment',
                'message' => "Payment processed: ₱{$payment->amount} from {$booking->user->name} to {$booking->sitter->name}. Platform earned: ₱{$payment->app_share} (20%). Method: {$payment->method}. Transaction: {$payment->transaction_id}."
            ]);
        }
    }

    // Webhooks for payment confirmations
    public function stripeWebhook(Request $request)
    {
        // Handle Stripe webhook events
        return response()->json(['status' => 'success']);
    }

    public function gcashWebhook(Request $request)
    {
        // Handle GCash webhook events
        return response()->json(['status' => 'success']);
    }

    public function mayaWebhook(Request $request)
    {
        // Handle Maya webhook events
        return response()->json(['status' => 'success']);
    }
} 