<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Payment;
use App\Models\User;
use App\Models\WalletTransaction;
use App\Services\XenditService;
use App\Events\PaymentReceived;
use App\Events\WalletUpdated;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;

class PaymentController extends Controller
{
    protected $xenditService;

    public function __construct(XenditService $xenditService)
    {
        $this->xenditService = $xenditService;
    }

    /**
     * Create payment invoice for booking
     */
    public function createInvoice(Request $request)
    {
        $request->validate([
            'booking_id' => 'required|exists:bookings,id',
        ]);

        try {
            $booking = Booking::with(['user', 'sitter'])->findOrFail($request->booking_id);
            
            // Check if user owns this booking
            if ($booking->user_id !== Auth::id()) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            // Check if booking already has a payment
            if ($booking->payment) {
                return response()->json(['error' => 'Payment already exists for this booking'], 400);
            }

            // Create Xendit invoice
            $invoiceParams = $this->xenditService->createBookingInvoiceParams($booking, $booking->user);
            $invoice = $this->xenditService->createInvoice($invoiceParams);

            // Create payment record
            $payment = Payment::create([
                'booking_id' => $booking->id,
                'amount' => $booking->total_amount,
                'method' => 'xendit',
                'app_share' => $booking->total_amount * 0.1, // 10% app fee
                'sitter_share' => $booking->total_amount * 0.9, // 90% to sitter
                'status' => 'pending',
                'transaction_id' => $invoice['id'],
            ]);

            return response()->json([
                'success' => true,
                'payment' => $payment,
                'invoice_url' => $invoice['invoice_url'],
                'invoice_id' => $invoice['id']
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to create payment invoice', [
                'error' => $e->getMessage(),
                'booking_id' => $request->booking_id,
                'user_id' => Auth::id()
            ]);

            return response()->json(['error' => 'Failed to create payment invoice'], 500);
        }
    }

    /**
     * Handle Xendit webhook
     */
    public function webhook(Request $request)
    {
        try {
            $payload = $request->getContent();
            $signature = $request->header('X-Xendit-Signature');

            // Verify webhook signature
            if (!$this->xenditService->verifyWebhook($payload, $signature)) {
                Log::warning('Invalid Xendit webhook signature');
                return response()->json(['error' => 'Invalid signature'], 400);
            }

            $data = json_decode($payload, true);
            $invoiceId = $data['id'] ?? null;

            if (!$invoiceId) {
                return response()->json(['error' => 'Invalid webhook data'], 400);
            }

            // Get invoice details from Xendit
            $invoice = $this->xenditService->getInvoice($invoiceId);
            
            if ($invoice['status'] === 'PAID') {
                $this->processPayment($invoice);
            }

            return response()->json(['success' => true]);

        } catch (\Exception $e) {
            Log::error('Webhook processing failed', [
                'error' => $e->getMessage(),
                'payload' => $request->getContent()
            ]);

            return response()->json(['error' => 'Webhook processing failed'], 500);
        }
    }

    /**
     * Process mock payment completion
     */
    private function processMockPayment($payment)
    {
        DB::transaction(function () use ($payment) {
            // Update payment status
            $payment->update([
                'status' => 'completed',
                'processed_at' => now(),
            ]);

            $booking = $payment->booking;
            $sitter = $booking->sitter;

            // Update booking status to active
            $booking->update(['status' => 'active']);

            // Add money to sitter's wallet
            $sitter->increment('wallet_balance', $payment->sitter_share);

            // Create wallet transaction record
            WalletTransaction::create([
                'user_id' => $sitter->id,
                'type' => 'credit',
                'amount' => $payment->sitter_share,
                'status' => 'completed',
                'reference_number' => $payment->transaction_id,
                'processed_at' => now(),
                'notes' => "Payment from booking #{$booking->id}"
            ]);

            // Broadcast events for real-time updates
            broadcast(new PaymentReceived($sitter, $payment));
            broadcast(new WalletUpdated($sitter));

            Log::info('Mock payment processed successfully', [
                'payment_id' => $payment->id,
                'booking_id' => $booking->id,
                'sitter_id' => $sitter->id,
                'amount' => $payment->sitter_share
            ]);
        });
    }

    /**
     * Process successful payment
     */
    private function processPayment($invoice)
    {
        DB::transaction(function () use ($invoice) {
            // Find payment by transaction_id
            $payment = Payment::where('transaction_id', $invoice['id'])->first();
            
            if (!$payment) {
                Log::error('Payment not found for invoice', ['invoice_id' => $invoice['id']]);
                return;
            }

            // Update payment status
            $payment->update([
                'status' => 'completed',
                'processed_at' => now(),
            ]);

            $booking = $payment->booking;
            $sitter = $booking->sitter;

            // Update booking status to active
            $booking->update(['status' => 'active']);

            // Add money to sitter's wallet
            $sitter->increment('wallet_balance', $payment->sitter_share);

            // Create wallet transaction record
            WalletTransaction::create([
                'user_id' => $sitter->id,
                'type' => 'credit',
                'amount' => $payment->sitter_share,
                'status' => 'completed',
                'reference_number' => $invoice['id'],
                'processed_at' => now(),
                'notes' => "Payment from booking #{$booking->id}"
            ]);

            // Broadcast events for real-time updates
            broadcast(new PaymentReceived($sitter, $payment));
            broadcast(new WalletUpdated($sitter));

            Log::info('Payment processed successfully', [
                'payment_id' => $payment->id,
                'booking_id' => $booking->id,
                'sitter_id' => $sitter->id,
                'amount' => $payment->sitter_share
            ]);
        });
    }

    /**
     * Get payment status
     */
    public function getPaymentStatus($paymentId)
    {
        try {
            $payment = Payment::with(['booking.user', 'booking.sitter'])->findOrFail($paymentId);
            
            // Check if user has access to this payment
            if ($payment->booking->user_id !== Auth::id() && $payment->booking->sitter_id !== Auth::id()) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            // Handle mock invoices
            if (strpos($payment->transaction_id, 'mock_invoice_') === 0) {
                // For mock invoices, simulate payment completion after a delay
                $createdAt = $payment->created_at;
                $timeSinceCreation = now()->diffInSeconds($createdAt);
                
                // Simulate payment completion after 10 seconds
                if ($timeSinceCreation >= 10 && $payment->status === 'pending') {
                    $this->processMockPayment($payment);
                    $payment->refresh();
                }
                
                return response()->json([
                    'payment' => $payment,
                    'invoice_status' => $payment->status === 'completed' ? 'PAID' : 'PENDING',
                    'invoice_url' => 'https://checkout.xendit.co/web/' . $payment->transaction_id
                ]);
            }

            // Get latest invoice status from Xendit for real invoices
            try {
                $invoice = $this->xenditService->getInvoice($payment->transaction_id);
                return response()->json([
                    'payment' => $payment,
                    'invoice_status' => $invoice['status'],
                    'invoice_url' => $invoice['invoice_url'] ?? null
                ]);
            } catch (\Exception $e) {
                Log::warning('Could not get Xendit invoice status, returning payment status', [
                    'payment_id' => $paymentId,
                    'error' => $e->getMessage()
                ]);
                
                return response()->json([
                    'payment' => $payment,
                    'invoice_status' => $payment->status === 'completed' ? 'PAID' : 'PENDING',
                    'invoice_url' => null
                ]);
            }

        } catch (\Exception $e) {
            Log::error('Failed to get payment status', [
                'error' => $e->getMessage(),
                'payment_id' => $paymentId
            ]);

            return response()->json(['error' => 'Failed to get payment status'], 500);
        }
    }

    /**
     * Complete mock payment (for development/testing)
     */
    public function completeMockPayment($paymentId)
    {
        try {
            $payment = Payment::with(['booking.user', 'booking.sitter'])->findOrFail($paymentId);
            
            // Check if user has access to this payment
            if ($payment->booking->user_id !== Auth::id() && $payment->booking->sitter_id !== Auth::id()) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            // Only allow completion of mock payments
            if (strpos($payment->transaction_id, 'mock_invoice_') !== 0) {
                return response()->json(['error' => 'Only mock payments can be completed manually'], 400);
            }

            // Only allow completion of pending payments
            if ($payment->status !== 'pending') {
                return response()->json(['error' => 'Payment is not pending'], 400);
            }

            $this->processMockPayment($payment);
            $payment->refresh();

            return response()->json([
                'success' => true,
                'message' => 'Mock payment completed successfully',
                'payment' => $payment
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to complete mock payment', [
                'error' => $e->getMessage(),
                'payment_id' => $paymentId
            ]);

            return response()->json(['error' => 'Failed to complete mock payment'], 500);
        }
    }

    /**
     * Get user's payment history
     */
    public function getPaymentHistory(Request $request)
    {
        $user = Auth::user();
        
        // Filter payments based on user role
        if ($user->role === 'pet_owner') {
            // Pet owners only see payments they made (as the booking owner)
            $payments = Payment::with(['booking.sitter', 'booking.user'])
                ->whereHas('booking', function ($query) use ($user) {
                    $query->where('user_id', $user->id);
                })
                ->orderBy('created_at', 'desc')
                ->paginate(20);
        } else {
            // Pet sitters only see payments they received (as the booking sitter)
            $payments = Payment::with(['booking.sitter', 'booking.user'])
                ->whereHas('booking', function ($query) use ($user) {
                    $query->where('sitter_id', $user->id);
                })
                ->orderBy('created_at', 'desc')
                ->paginate(20);
        }

        return response()->json($payments);
    }
}