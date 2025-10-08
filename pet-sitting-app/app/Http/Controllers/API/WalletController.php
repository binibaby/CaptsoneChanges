<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\WalletTransaction;
use App\Services\XenditService;
use App\Events\WalletUpdated;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;

class WalletController extends Controller
{
    protected $xenditService;

    public function __construct(XenditService $xenditService)
    {
        $this->xenditService = $xenditService;
    }

    /**
     * Get user's wallet information
     */
    public function getWallet()
    {
        $user = Auth::user();
        
        $walletTransactions = WalletTransaction::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->get();

        return response()->json([
            'balance' => $user->wallet_balance,
            'transactions' => $walletTransactions
        ]);
    }

    /**
     * Get wallet transaction history
     */
    public function getTransactionHistory(Request $request)
    {
        $user = Auth::user();
        
        $transactions = WalletTransaction::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json($transactions);
    }

    /**
     * Cash out from wallet
     */
    public function cashOut(Request $request)
    {
        $request->validate([
            'amount' => 'required|numeric|min:100|max:50000',
            'bank_code' => 'required|string',
            'account_holder_name' => 'required|string|max:255',
            'account_number' => 'required|string|max:50',
        ]);

        $user = Auth::user();
        $amount = $request->amount;

        // Check if user has sufficient balance
        if ($user->wallet_balance < $amount) {
            return response()->json(['error' => 'Insufficient wallet balance'], 400);
        }

        try {
            DB::transaction(function () use ($user, $amount, $request) {
                // Create disbursement parameters
                $disbursementParams = $this->xenditService->createDisbursementParams(
                    $user,
                    $amount,
                    [
                        'bank_code' => $request->bank_code,
                        'account_holder_name' => $request->account_holder_name,
                        'account_number' => $request->account_number,
                    ]
                );

                // Create disbursement with Xendit
                $disbursement = $this->xenditService->createDisbursement($disbursementParams);

                // Deduct amount from user's wallet
                $user->decrement('wallet_balance', $amount);

                // Create wallet transaction record
                WalletTransaction::create([
                    'user_id' => $user->id,
                    'type' => 'debit',
                    'amount' => $amount,
                    'bank_name' => $request->bank_code,
                    'account_number' => $request->account_number,
                    'status' => 'processing',
                    'reference_number' => $disbursement['id'],
                    'notes' => 'Cash out to bank account'
                ]);

                // Broadcast wallet update event
                broadcast(new WalletUpdated($user));

                Log::info('Cash out initiated successfully', [
                    'user_id' => $user->id,
                    'amount' => $amount,
                    'disbursement_id' => $disbursement['id']
                ]);
            });

            return response()->json([
                'success' => true,
                'message' => 'Cash out request submitted successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('Cash out failed', [
                'error' => $e->getMessage(),
                'user_id' => $user->id,
                'amount' => $amount
            ]);

            return response()->json(['error' => 'Cash out failed. Please try again.'], 500);
        }
    }

    /**
     * Handle disbursement webhook
     */
    public function disbursementWebhook(Request $request)
    {
        try {
            $payload = $request->getContent();
            $signature = $request->header('X-Xendit-Signature');

            // Verify webhook signature
            if (!$this->xenditService->verifyWebhook($payload, $signature)) {
                Log::warning('Invalid Xendit disbursement webhook signature');
                return response()->json(['error' => 'Invalid signature'], 400);
            }

            $data = json_decode($payload, true);
            $disbursementId = $data['id'] ?? null;

            if (!$disbursementId) {
                return response()->json(['error' => 'Invalid webhook data'], 400);
            }

            // Get disbursement details from Xendit
            $disbursement = $this->xenditService->getDisbursement($disbursementId);
            
            // Update wallet transaction status
            $transaction = WalletTransaction::where('reference_number', $disbursementId)->first();
            
            if ($transaction) {
                $status = $disbursement['status'] === 'COMPLETED' ? 'completed' : 'failed';
                $transaction->update([
                    'status' => $status,
                    'processed_at' => now(),
                ]);

                // If disbursement failed, refund the amount
                if ($disbursement['status'] === 'FAILED') {
                    $transaction->user->increment('wallet_balance', $transaction->amount);
                    broadcast(new WalletUpdated($transaction->user));
                }

                Log::info('Disbursement status updated', [
                    'disbursement_id' => $disbursementId,
                    'status' => $status,
                    'user_id' => $transaction->user_id
                ]);
            }

            return response()->json(['success' => true]);

        } catch (\Exception $e) {
            Log::error('Disbursement webhook processing failed', [
                'error' => $e->getMessage(),
                'payload' => $request->getContent()
            ]);

            return response()->json(['error' => 'Webhook processing failed'], 500);
        }
    }

    /**
     * Get available banks for disbursement
     */
    public function getAvailableBanks()
    {
        // Return common Philippine banks for Xendit disbursement
        $banks = [
            ['code' => 'BDO', 'name' => 'BDO Unibank'],
            ['code' => 'BPI', 'name' => 'Bank of the Philippine Islands'],
            ['code' => 'MBTC', 'name' => 'Metrobank'],
            ['code' => 'PNB', 'name' => 'Philippine National Bank'],
            ['code' => 'RCBC', 'name' => 'Rizal Commercial Banking Corporation'],
            ['code' => 'SECB', 'name' => 'Security Bank'],
            ['code' => 'UBP', 'name' => 'Union Bank of the Philippines'],
            ['code' => 'CHINABANK', 'name' => 'China Banking Corporation'],
            ['code' => 'EASTWEST', 'name' => 'EastWest Bank'],
            ['code' => 'LANDBANK', 'name' => 'Land Bank of the Philippines'],
        ];

        return response()->json($banks);
    }
}