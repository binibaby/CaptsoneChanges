<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\Booking;
use App\Models\User;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;
use Stripe\Stripe;
use Stripe\Refund;

class PaymentController extends Controller
{
    public function __construct()
    {
        // Only set Stripe API key if it's configured
        if (config('services.stripe.secret')) {
            Stripe::setApiKey(config('services.stripe.secret'));
        }
    }

    public function index(Request $request)
    {
        $query = Payment::with(['booking.user']);

        // Apply filters
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('payment_method')) {
            $query->where('payment_method', $request->payment_method);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('transaction_id', 'like', "%{$search}%")
                  ->orWhere('payment_intent_id', 'like', "%{$search}%")
                  ->orWhereHas('user', function ($userQuery) use ($search) {
                      $userQuery->where('name', 'like', "%{$search}%")
                               ->orWhere('email', 'like', "%{$search}%");
                  });
            });
        }

        $payments = $query->orderBy('created_at', 'desc')->paginate(20);

        return view('admin.payments.index', compact('payments'));
    }

    public function show(Payment $payment)
    {
        $payment->load(['user', 'booking']);
        
        return view('admin.payments.show', compact('payment'));
    }

    public function processPayment(Request $request)
    {
        $request->validate([
            'booking_id' => 'required|exists:bookings,id',
            'amount' => 'required|numeric|min:0',
            'payment_method' => 'required|in:stripe,gcash,maya',
            'currency' => 'required|in:PHP,USD',
        ]);

        try {
            DB::beginTransaction();

            $booking = Booking::findOrFail($request->booking_id);
            
            // Calculate platform fee (20%)
            $platformFee = $request->amount * 0.20;
            $sitterAmount = $request->amount - $platformFee;

            $payment = Payment::create([
                'user_id' => $booking->pet_owner_id,
                'booking_id' => $booking->id,
                'amount' => $request->amount,
                'currency' => $request->currency,
                'payment_method' => $request->payment_method,
                'platform_fee' => $platformFee,
                'sitter_amount' => $sitterAmount,
                'status' => 'pending',
                'transaction_id' => 'TXN_' . time() . '_' . rand(1000, 9999),
            ]);

            // Process payment based on method
            switch ($request->payment_method) {
                case 'stripe':
                    $result = $this->processStripePayment($payment, $request);
                    break;
                case 'gcash':
                    $result = $this->processGCashPayment($payment, $request);
                    break;
                case 'maya':
                    $result = $this->processMayaPayment($payment, $request);
                    break;
                default:
                    throw new \Exception('Unsupported payment method');
            }

            if ($result['success']) {
                $payment->update([
                    'status' => 'completed',
                    'payment_intent_id' => $result['payment_intent_id'] ?? null,
                    'processed_at' => now(),
                ]);

                // Update booking status
                $booking->update(['status' => 'confirmed']);

                // Send notifications
                $this->sendPaymentSuccessNotifications($payment);

                DB::commit();

                return redirect()->back()->with('success', 'Payment processed successfully.');
            } else {
                throw new \Exception($result['error']);
            }

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Payment processing failed: ' . $e->getMessage());
            
            return redirect()->back()->with('error', 'Payment processing failed: ' . $e->getMessage());
        }
    }

    public function processRefund(Request $request, Payment $payment)
    {
        $request->validate([
            'amount' => 'required|numeric|min:0|max:' . $payment->amount,
            'reason' => 'required|string|max:500',
        ]);

        try {
            DB::beginTransaction();

            $refundAmount = $request->amount;
            $refundPlatformFee = $refundAmount * 0.20; // Refund 20% platform fee proportionally
            $refundSitterAmount = $refundAmount - $refundPlatformFee;

            // Process refund based on payment method
            switch ($payment->payment_method) {
                case 'stripe':
                    $result = $this->processStripeRefund($payment, $refundAmount);
                    break;
                case 'gcash':
                    $result = $this->processGCashRefund($payment, $refundAmount);
                    break;
                case 'maya':
                    $result = $this->processMayaRefund($payment, $refundAmount);
                    break;
                default:
                    throw new \Exception('Unsupported payment method for refund');
            }

            if ($result['success']) {
                // Create refund record
                $refund = Payment::create([
                    'user_id' => $payment->user_id,
                    'booking_id' => $payment->booking_id,
                    'amount' => -$refundAmount, // Negative amount for refund
                    'currency' => $payment->currency,
                    'payment_method' => $payment->payment_method,
                    'platform_fee' => -$refundPlatformFee,
                    'sitter_amount' => -$refundSitterAmount,
                    'status' => 'completed',
                    'transaction_id' => 'REFUND_' . time() . '_' . rand(1000, 9999),
                    'refund_of' => $payment->id,
                    'refund_reason' => $request->reason,
                    'processed_at' => now(),
                ]);

                // Update original payment
                $payment->update([
                    'refunded_amount' => $payment->refunded_amount + $refundAmount,
                    'refunded_at' => now(),
                ]);

                // Send refund notifications
                $this->sendRefundNotifications($refund);

                DB::commit();

                return redirect()->back()->with('success', 'Refund processed successfully.');
            } else {
                throw new \Exception($result['error']);
            }

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Refund processing failed: ' . $e->getMessage());
            
            return redirect()->back()->with('error', 'Refund processing failed: ' . $e->getMessage());
        }
    }

    public function analytics(Request $request)
    {
        $dateRange = $request->get('date_range', 'last_30_days');
        $startDate = $this->getStartDate($dateRange);
        $endDate = Carbon::now();

        $analytics = [
            'total_revenue' => Payment::where('status', 'completed')
                ->whereBetween('created_at', [$startDate, $endDate])
                ->sum('amount'),
            'total_transactions' => Payment::whereBetween('created_at', [$startDate, $endDate])->count(),
            'platform_fees' => Payment::where('status', 'completed')
                ->whereBetween('created_at', [$startDate, $endDate])
                ->sum('platform_fee'),
            'refunds' => Payment::where('status', 'completed')
                ->where('amount', '<', 0)
                ->whereBetween('created_at', [$startDate, $endDate])
                ->sum(DB::raw('ABS(amount)')),
            'average_transaction' => Payment::where('status', 'completed')
                ->whereBetween('created_at', [$startDate, $endDate])
                ->avg('amount'),
            'payment_methods' => Payment::whereBetween('created_at', [$startDate, $endDate])
                ->select('payment_method', DB::raw('count(*) as count'), DB::raw('sum(amount) as total'))
                ->groupBy('payment_method')
                ->get(),
            'daily_stats' => $this->getDailyPaymentStats($startDate, $endDate),
            'monthly_stats' => $this->getMonthlyPaymentStats($startDate, $endDate),
        ];

        return view('admin.payments.analytics', compact('analytics', 'dateRange'));
    }

    public function export(Request $request)
    {
        $query = Payment::with(['user', 'booking']);

        // Apply same filters as index
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('payment_method')) {
            $query->where('payment_method', $request->payment_method);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $payments = $query->get();

        $filename = 'payments_export_' . now()->format('Y-m-d_H-i-s') . '.csv';
        
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ];

        $callback = function() use ($payments) {
            $file = fopen('php://output', 'w');
            
            // Add headers
            fputcsv($file, [
                'ID', 'Transaction ID', 'User', 'Booking ID', 'Amount', 'Currency',
                'Payment Method', 'Platform Fee', 'Sitter Amount', 'Status', 'Created At'
            ]);

            // Add data
            foreach ($payments as $payment) {
                fputcsv($file, [
                    $payment->id,
                    $payment->transaction_id,
                    $payment->user->name ?? 'N/A',
                    $payment->booking_id,
                    $payment->amount,
                    $payment->currency,
                    $payment->payment_method,
                    $payment->platform_fee,
                    $payment->sitter_amount,
                    $payment->status,
                    $payment->created_at->format('Y-m-d H:i:s'),
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    private function processStripePayment(Payment $payment, Request $request)
    {
        try {
            // Create payment intent with Stripe
            $paymentIntent = \Stripe\PaymentIntent::create([
                'amount' => $payment->amount * 100, // Convert to cents
                'currency' => strtolower($payment->currency),
                'metadata' => [
                    'payment_id' => $payment->id,
                    'booking_id' => $payment->booking_id,
                ],
            ]);

            return [
                'success' => true,
                'payment_intent_id' => $paymentIntent->id,
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    private function processGCashPayment(Payment $payment, Request $request)
    {
        // Simulate GCash API integration
        try {
            // Here you would integrate with actual GCash API
            $paymentIntentId = 'GCASH_' . time() . '_' . rand(1000, 9999);
            
            return [
                'success' => true,
                'payment_intent_id' => $paymentIntentId,
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    private function processMayaPayment(Payment $payment, Request $request)
    {
        // Simulate Maya API integration
        try {
            // Here you would integrate with actual Maya API
            $paymentIntentId = 'MAYA_' . time() . '_' . rand(1000, 9999);
            
            return [
                'success' => true,
                'payment_intent_id' => $paymentIntentId,
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    private function processStripeRefund(Payment $payment, $amount)
    {
        try {
            $refund = Refund::create([
                'payment_intent' => $payment->payment_intent_id,
                'amount' => $amount * 100, // Convert to cents
            ]);

            return [
                'success' => true,
                'refund_id' => $refund->id,
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    private function processGCashRefund(Payment $payment, $amount)
    {
        // Simulate GCash refund API
        try {
            return [
                'success' => true,
                'refund_id' => 'GCASH_REFUND_' . time(),
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    private function processMayaRefund(Payment $payment, $amount)
    {
        // Simulate Maya refund API
        try {
            return [
                'success' => true,
                'refund_id' => 'MAYA_REFUND_' . time(),
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    private function sendPaymentSuccessNotifications(Payment $payment)
    {
        // Notify pet owner
        Notification::create([
            'user_id' => $payment->user_id,
            'title' => 'Payment Successful',
            'message' => "Your payment of {$payment->currency} {$payment->amount} has been processed successfully.",
            'type' => 'payment',
            'data' => ['payment_id' => $payment->id],
        ]);

        // Notify pet sitter
        if ($payment->booking && $payment->booking->pet_sitter_id) {
            Notification::create([
                'user_id' => $payment->booking->pet_sitter_id,
                'title' => 'Payment Received',
                'message' => "You received {$payment->currency} {$payment->sitter_amount} for your pet sitting service.",
                'type' => 'payment',
                'data' => ['payment_id' => $payment->id],
            ]);
        }
    }

    private function sendRefundNotifications(Payment $refund)
    {
        $amount = abs($refund->amount);
        
        Notification::create([
            'user_id' => $refund->user_id,
            'title' => 'Refund Processed',
            'message' => "Your refund of {$refund->currency} {$amount} has been processed. Reason: {$refund->refund_reason}",
            'type' => 'payment',
            'data' => ['refund_id' => $refund->id],
        ]);
    }

    private function getStartDate($dateRange)
    {
        switch ($dateRange) {
            case 'last_7_days':
                return Carbon::now()->subDays(7);
            case 'last_30_days':
                return Carbon::now()->subDays(30);
            case 'last_90_days':
                return Carbon::now()->subDays(90);
            case 'this_year':
                return Carbon::now()->startOfYear();
            default:
                return Carbon::now()->subDays(30);
        }
    }

    private function getDailyPaymentStats($startDate, $endDate)
    {
        return Payment::where('status', 'completed')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('COUNT(*) as count'),
                DB::raw('SUM(amount) as total_amount'),
                DB::raw('SUM(platform_fee) as total_fees')
            )
            ->groupBy('date')
            ->orderBy('date')
            ->get();
    }

    private function getMonthlyPaymentStats($startDate, $endDate)
    {
        return Payment::where('status', 'completed')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->select(
                DB::raw('YEAR(created_at) as year'),
                DB::raw('MONTH(created_at) as month'),
                DB::raw('COUNT(*) as count'),
                DB::raw('SUM(amount) as total_amount'),
                DB::raw('SUM(platform_fee) as total_fees')
            )
            ->groupBy('year', 'month')
            ->orderBy('year')
            ->orderBy('month')
            ->get();
    }
}
