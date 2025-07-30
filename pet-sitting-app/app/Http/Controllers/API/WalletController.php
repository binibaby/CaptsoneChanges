<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Payment;
use App\Models\WalletTransaction;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class WalletController extends Controller
{
    public function getWalletData(Request $request)
    {
        $user = $request->user();
        
        if ($user->role !== 'pet_sitter') {
            return response()->json([
                'success' => false,
                'message' => 'E-wallet is only available for pet sitters.'
            ], 403);
        }

        // Calculate available balance (completed payments - cashouts)
        $totalEarnings = Payment::whereHas('booking', function($query) use ($user) {
            $query->where('sitter_id', $user->id);
        })->where('status', 'paid')->sum('sitter_share');

        $totalCashouts = WalletTransaction::where('user_id', $user->id)
            ->where('type', 'cashout')
            ->where('status', 'completed')
            ->sum('amount');

        $availableBalance = $totalEarnings - $totalCashouts;

        // Calculate pending earnings (confirmed bookings with payments not yet released)
        $pendingEarnings = Payment::whereHas('booking', function($query) use ($user) {
            $query->where('sitter_id', $user->id)->where('status', 'confirmed');
        })->where('status', 'paid')
        ->where('created_at', '>', Carbon::now()->subDays(3)) // Payments held for 3 days
        ->sum('sitter_share');

        return response()->json([
            'success' => true,
            'wallet' => [
                'available_balance' => round($availableBalance, 2),
                'pending_earnings' => round($pendingEarnings, 2),
                'total_earnings' => round($totalEarnings, 2),
                'total_cashouts' => round($totalCashouts, 2),
                'last_updated' => now()->format('Y-m-d H:i:s')
            ]
        ]);
    }

    public function getTransactions(Request $request)
    {
        $user = $request->user();
        
        if ($user->role !== 'pet_sitter') {
            return response()->json([
                'success' => false,
                'message' => 'E-wallet is only available for pet sitters.'
            ], 403);
        }

        $limit = $request->get('limit', 20);
        $page = $request->get('page', 1);

        // Get earnings from payments
        $earnings = Payment::with(['booking.user'])
            ->whereHas('booking', function($query) use ($user) {
                $query->where('sitter_id', $user->id);
            })
            ->where('status', 'paid')
            ->get()
            ->map(function($payment) {
                return [
                    'id' => 'earning_' . $payment->id,
                    'type' => 'earning',
                    'amount' => $payment->sitter_share,
                    'description' => "Pet sitting for {$payment->booking->user->name}",
                    'date' => $payment->created_at->format('Y-m-d'),
                    'status' => 'completed',
                    'created_at' => $payment->created_at
                ];
            });

        // Get cashout transactions
        $cashouts = WalletTransaction::where('user_id', $user->id)
            ->get()
            ->map(function($transaction) {
                return [
                    'id' => 'cashout_' . $transaction->id,
                    'type' => 'cashout',
                    'amount' => -$transaction->amount,
                    'description' => "Cash out to {$transaction->bank_name}",
                    'date' => $transaction->created_at->format('Y-m-d'),
                    'status' => $transaction->status,
                    'created_at' => $transaction->created_at
                ];
            });

        // Combine and sort transactions
        $allTransactions = $earnings->concat($cashouts)
            ->sortByDesc('created_at')
            ->take($limit)
            ->values();

        return response()->json([
            'success' => true,
            'transactions' => $allTransactions
        ]);
    }

    public function getEarnings(Request $request)
    {
        $user = $request->user();
        
        if ($user->role !== 'pet_sitter') {
            return response()->json([
                'success' => false,
                'message' => 'E-wallet is only available for pet sitters.'
            ], 403);
        }

        $period = $request->get('period', 'month'); // week, month, year

        $startDate = match($period) {
            'week' => Carbon::now()->startOfWeek(),
            'month' => Carbon::now()->startOfMonth(),
            'year' => Carbon::now()->startOfYear(),
            default => Carbon::now()->startOfMonth()
        };

        $earnings = Payment::whereHas('booking', function($query) use ($user) {
            $query->where('sitter_id', $user->id);
        })
        ->where('status', 'paid')
        ->where('created_at', '>=', $startDate)
        ->sum('sitter_share');

        $bookingsCount = Payment::whereHas('booking', function($query) use ($user) {
            $query->where('sitter_id', $user->id);
        })
        ->where('status', 'paid')
        ->where('created_at', '>=', $startDate)
        ->count();

        return response()->json([
            'success' => true,
            'earnings' => [
                'period' => $period,
                'total_earnings' => round($earnings, 2),
                'bookings_count' => $bookingsCount,
                'average_per_booking' => $bookingsCount > 0 ? round($earnings / $bookingsCount, 2) : 0,
                'start_date' => $startDate->format('Y-m-d'),
                'end_date' => Carbon::now()->format('Y-m-d')
            ]
        ]);
    }

    public function processCashout(Request $request)
    {
        $request->validate([
            'amount' => 'required|numeric|min:100',
            'bank' => 'required|string',
            'account_number' => 'required|string'
        ]);

        $user = $request->user();
        
        if ($user->role !== 'pet_sitter') {
            return response()->json([
                'success' => false,
                'message' => 'E-wallet is only available for pet sitters.'
            ], 403);
        }

        $amount = $request->amount;

        // Calculate available balance
        $totalEarnings = Payment::whereHas('booking', function($query) use ($user) {
            $query->where('sitter_id', $user->id);
        })->where('status', 'paid')->sum('sitter_share');

        $totalCashouts = WalletTransaction::where('user_id', $user->id)
            ->where('type', 'cashout')
            ->whereIn('status', ['completed', 'pending'])
            ->sum('amount');

        $availableBalance = $totalEarnings - $totalCashouts;

        if ($amount > $availableBalance) {
            return response()->json([
                'success' => false,
                'message' => 'Insufficient balance. Available balance: ₱' . number_format($availableBalance, 2)
            ], 400);
        }

        DB::beginTransaction();

        try {
            // Create cashout transaction
            $transaction = WalletTransaction::create([
                'user_id' => $user->id,
                'type' => 'cashout',
                'amount' => $amount,
                'bank_name' => $request->bank,
                'account_number' => $request->account_number,
                'status' => 'pending',
                'reference_number' => 'CO_' . time() . '_' . rand(1000, 9999),
                'processed_at' => null
            ]);

            // Notify user
            Notification::create([
                'user_id' => $user->id,
                'type' => 'wallet',
                'message' => "Cashout request of ₱{$amount} submitted successfully. Processing may take 1-3 business days. Reference: {$transaction->reference_number}"
            ]);

            // Notify admins
            $admins = User::where('is_admin', true)->get();
            foreach ($admins as $admin) {
                Notification::create([
                    'user_id' => $admin->id,
                    'type' => 'wallet',
                    'message' => "New cashout request: {$user->name} requested ₱{$amount} to {$request->bank}. Reference: {$transaction->reference_number}"
                ]);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Cashout request submitted successfully!',
                'transaction' => [
                    'id' => $transaction->id,
                    'amount' => $transaction->amount,
                    'bank' => $transaction->bank_name,
                    'reference_number' => $transaction->reference_number,
                    'status' => $transaction->status,
                    'created_at' => $transaction->created_at->format('Y-m-d H:i:s')
                ]
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Cashout request failed. Please try again.'
            ], 500);
        }
    }
} 