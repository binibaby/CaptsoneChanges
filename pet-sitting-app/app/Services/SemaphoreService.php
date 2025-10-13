<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SemaphoreService
{
    protected $apiKey;
    protected $baseUrl;
    protected $senderName;

    public function __construct()
    {
        $this->apiKey = config('services.semaphore.api_key');
        $this->baseUrl = config('services.semaphore.base_url', 'https://api.semaphore.co/api/v4');
        $this->senderName = config('services.semaphore.sender_name', 'PetsitConnect');
    }

    /**
     * Send SMS message using Semaphore API
     *
     * @param string $phoneNumber
     * @param string $message
     * @return array
     */
    public function sendSMS($phoneNumber, $message)
    {
        try {
            Log::info("📱 SEMAPHORE SMS - Sending SMS to: {$phoneNumber}");
            Log::info("📱 SEMAPHORE SMS - Message: {$message}");
            Log::info("📱 SEMAPHORE SMS - Sender: {$this->senderName}");

            // Format phone number for Semaphore (ensure it starts with +)
            $formattedPhone = $this->formatPhoneNumber($phoneNumber);
            
            // Prepare the request data for OTP endpoint
            $data = [
                'apikey' => $this->apiKey,
                'number' => $formattedPhone,
                'message' => $message
            ];
            
            // Don't include sender name if it's not registered
            // Semaphore will use their default sender name

            Log::info("📱 SEMAPHORE SMS - Request data: " . json_encode($data));

            // Send the request to Semaphore API messages endpoint
            $response = Http::timeout(30)->post($this->baseUrl . '/messages', $data);

            Log::info("📱 SEMAPHORE SMS - Response status: " . $response->status());
            Log::info("📱 SEMAPHORE SMS - Response body: " . $response->body());

            if ($response->successful()) {
                $responseData = $response->json();
                
                // Check if there are any errors in the response
                if (isset($responseData['sendername']) || isset($responseData['number'])) {
                    // There are validation errors
                    Log::error("❌ SEMAPHORE SMS - Validation errors in response");
                    Log::error("❌ SEMAPHORE SMS - Errors: " . json_encode($responseData));
                    
                    return [
                        'success' => false,
                        'message' => 'SMS validation failed',
                        'error' => $responseData,
                        'provider' => 'semaphore'
                    ];
                }
                
                Log::info("✅ SEMAPHORE SMS - Message sent successfully");
                Log::info("📊 SEMAPHORE SMS - Response: " . json_encode($responseData));

                return [
                    'success' => true,
                    'message' => 'SMS sent successfully via Semaphore',
                    'response' => $responseData,
                    'provider' => 'semaphore'
                ];
            } else {
                Log::error("❌ SEMAPHORE SMS - Failed to send message");
                Log::error("❌ SEMAPHORE SMS - Status: " . $response->status());
                Log::error("❌ SEMAPHORE SMS - Error: " . $response->body());

                return [
                    'success' => false,
                    'message' => 'Failed to send SMS via Semaphore',
                    'error' => $response->body(),
                    'status' => $response->status(),
                    'provider' => 'semaphore'
                ];
            }

        } catch (\Exception $e) {
            Log::error("❌ SEMAPHORE SMS - Exception occurred: " . $e->getMessage());
            Log::error("❌ SEMAPHORE SMS - Stack trace: " . $e->getTraceAsString());

            return [
                'success' => false,
                'message' => 'Exception occurred while sending SMS',
                'error' => $e->getMessage(),
                'provider' => 'semaphore'
            ];
        }
    }

    /**
     * Check account balance and credits
     *
     * @return array
     */
    public function getAccountInfo()
    {
        try {
            Log::info("📊 SEMAPHORE SMS - Checking account information");

            $response = Http::timeout(30)->get($this->baseUrl . '/account', [
                'apikey' => $this->apiKey
            ]);

            Log::info("📊 SEMAPHORE SMS - Account info response status: " . $response->status());
            Log::info("📊 SEMAPHORE SMS - Account info response: " . $response->body());

            if ($response->successful()) {
                $accountData = $response->json();
                
                Log::info("✅ SEMAPHORE SMS - Account info retrieved successfully");
                Log::info("💰 SEMAPHORE SMS - Credit balance: " . ($accountData['credit_balance'] ?? 'Unknown'));

                return [
                    'success' => true,
                    'data' => $accountData,
                    'provider' => 'semaphore'
                ];
            } else {
                Log::error("❌ SEMAPHORE SMS - Failed to get account info");
                Log::error("❌ SEMAPHORE SMS - Status: " . $response->status());
                Log::error("❌ SEMAPHORE SMS - Error: " . $response->body());

                return [
                    'success' => false,
                    'message' => 'Failed to get account information',
                    'error' => $response->body(),
                    'status' => $response->status(),
                    'provider' => 'semaphore'
                ];
            }

        } catch (\Exception $e) {
            Log::error("❌ SEMAPHORE SMS - Exception getting account info: " . $e->getMessage());

            return [
                'success' => false,
                'message' => 'Exception occurred while getting account info',
                'error' => $e->getMessage(),
                'provider' => 'semaphore'
            ];
        }
    }

    /**
     * Get account transactions
     *
     * @return array
     */
    public function getTransactions()
    {
        try {
            Log::info("📊 SEMAPHORE SMS - Getting account transactions");

            $response = Http::timeout(30)->get($this->baseUrl . '/account/transactions', [
                'apikey' => $this->apiKey
            ]);

            Log::info("📊 SEMAPHORE SMS - Transactions response status: " . $response->status());
            Log::info("📊 SEMAPHORE SMS - Transactions response: " . $response->body());

            if ($response->successful()) {
                $transactions = $response->json();
                
                Log::info("✅ SEMAPHORE SMS - Transactions retrieved successfully");
                Log::info("📊 SEMAPHORE SMS - Transaction count: " . count($transactions));

                return [
                    'success' => true,
                    'data' => $transactions,
                    'provider' => 'semaphore'
                ];
            } else {
                Log::error("❌ SEMAPHORE SMS - Failed to get transactions");
                Log::error("❌ SEMAPHORE SMS - Status: " . $response->status());
                Log::error("❌ SEMAPHORE SMS - Error: " . $response->body());

                return [
                    'success' => false,
                    'message' => 'Failed to get transactions',
                    'error' => $response->body(),
                    'status' => $response->status(),
                    'provider' => 'semaphore'
                ];
            }

        } catch (\Exception $e) {
            Log::error("❌ SEMAPHORE SMS - Exception getting transactions: " . $e->getMessage());

            return [
                'success' => false,
                'message' => 'Exception occurred while getting transactions',
                'error' => $e->getMessage(),
                'provider' => 'semaphore'
            ];
        }
    }

    /**
     * Format phone number for Semaphore API
     *
     * @param string $phoneNumber
     * @return string
     */
    private function formatPhoneNumber($phoneNumber)
    {
        // Remove any non-digit characters
        $phone = preg_replace('/[^0-9]/', '', $phoneNumber);
        
        // For Philippine numbers, ensure proper format without + prefix
        if (str_starts_with($phone, '63')) {
            // Already properly formatted for Semaphore (63XXXXXXXXX)
            return $phone;
        } elseif (str_starts_with($phone, '0')) {
            // Remove leading 0 and add 63
            $phone = substr($phone, 1);
            return '63' . $phone;
        }
        
        // If it doesn't start with 63, assume it's a Philippine number and add 63
        if (!str_starts_with($phone, '63')) {
            $phone = '63' . $phone;
        }
        
        return $phone;
    }

    /**
     * Test the Semaphore service
     *
     * @return array
     */
    public function testConnection()
    {
        Log::info("🧪 SEMAPHORE SMS - Testing connection");
        
        try {
            // Test with a simple API call to messages endpoint
            $testPhone = '639123456789'; // Test phone number
            $testMessage = 'Test connection';
            
            $data = [
                'apikey' => $this->apiKey,
                'number' => $testPhone,
                'message' => $testMessage
            ];
            
            Log::info("🧪 SEMAPHORE SMS - Testing with messages endpoint");
            $response = Http::timeout(30)->post($this->baseUrl . '/messages', $data);
            
            Log::info("🧪 SEMAPHORE SMS - Test response status: " . $response->status());
            Log::info("🧪 SEMAPHORE SMS - Test response body: " . $response->body());
            
            if ($response->successful()) {
                $responseData = $response->json();
                Log::info("✅ SEMAPHORE SMS - Connection test successful");
                return [
                    'success' => true,
                    'message' => 'Semaphore connection test successful',
                    'test_response' => $responseData,
                    'provider' => 'semaphore'
                ];
            } else {
                Log::error("❌ SEMAPHORE SMS - Connection test failed");
                return [
                    'success' => false,
                    'message' => 'Semaphore connection test failed',
                    'error' => $response->body(),
                    'status' => $response->status(),
                    'provider' => 'semaphore'
                ];
            }
        } catch (\Exception $e) {
            Log::error("❌ SEMAPHORE SMS - Connection test exception: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Semaphore connection test failed',
                'error' => $e->getMessage(),
                'provider' => 'semaphore'
            ];
        }
    }
}
