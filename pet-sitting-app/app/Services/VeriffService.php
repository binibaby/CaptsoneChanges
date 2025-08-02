<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class VeriffService
{
    private $apiKey;
    private $secretKey;
    private $baseUrl;
    private $webhookUrl;

    public function __construct()
    {
        $this->apiKey = env('VERIFF_API_KEY');
        $this->secretKey = env('VERIFF_SECRET_KEY');
        $this->baseUrl = env('VERIFF_BASE_URL', 'https://api.veriff.me');
        $this->webhookUrl = env('VERIFF_WEBHOOK_URL');
    }

    /**
     * Create a Veriff session for ID verification
     */
    public function createSession($userData)
    {
        try {
            $payload = [
                'verification' => [
                    'callback' => $this->webhookUrl,
                    'person' => [
                        'givenName' => $userData['first_name'],
                        'lastName' => $userData['last_name'],
                        'nationality' => 'PHL', // Philippines
                        'idNumber' => $userData['id_number'] ?? null,
                    ],
                    'document' => [
                        'type' => $this->mapDocumentType($userData['document_type']),
                        'country' => 'PHL', // Philippines
                    ],
                    'timestamp' => now()->toISOString(),
                ]
            ];

            Log::info('🔔 VERIFF SESSION CREATION - Starting session creation', [
                'user_id' => $userData['user_id'],
                'document_type' => $userData['document_type'],
                'api_key_present' => !empty($this->apiKey)
            ]);

            $response = Http::withHeaders([
                'X-AUTH-CLIENT' => $this->apiKey,
                'Content-Type' => 'application/json',
            ])->post($this->baseUrl . '/v1/sessions', $payload);

            if ($response->successful()) {
                $data = $response->json();
                Log::info('✅ VERIFF SESSION CREATED', [
                    'session_id' => $data['verification']['id'],
                    'status' => $data['verification']['status']
                ]);
                return $data;
            } else {
                Log::error('❌ VERIFF SESSION CREATION FAILED', [
                    'status_code' => $response->status(),
                    'response' => $response->body()
                ]);
                return null;
            }
        } catch (\Exception $e) {
            Log::error('❌ VERIFF SESSION CREATION EXCEPTION', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return null;
        }
    }

    /**
     * Get session status from Veriff
     */
    public function getSessionStatus($sessionId)
    {
        try {
            $response = Http::withHeaders([
                'X-AUTH-CLIENT' => $this->apiKey,
            ])->get($this->baseUrl . '/v1/sessions/' . $sessionId);

            if ($response->successful()) {
                return $response->json();
            } else {
                Log::error('❌ VERIFF SESSION STATUS FAILED', [
                    'session_id' => $sessionId,
                    'status_code' => $response->status()
                ]);
                return null;
            }
        } catch (\Exception $e) {
            Log::error('❌ VERIFF SESSION STATUS EXCEPTION', [
                'session_id' => $sessionId,
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }

    /**
     * Get verification decision from Veriff
     */
    public function getVerificationDecision($sessionId)
    {
        try {
            $response = Http::withHeaders([
                'X-AUTH-CLIENT' => $this->apiKey,
            ])->get($this->baseUrl . '/v1/sessions/' . $sessionId . '/decision');

            if ($response->successful()) {
                $data = $response->json();
                Log::info('✅ VERIFF DECISION RETRIEVED', [
                    'session_id' => $sessionId,
                    'status' => $data['verification']['status'],
                    'code' => $data['verification']['code'] ?? null
                ]);
                return $data;
            } else {
                Log::error('❌ VERIFF DECISION FAILED', [
                    'session_id' => $sessionId,
                    'status_code' => $response->status()
                ]);
                return null;
            }
        } catch (\Exception $e) {
            Log::error('❌ VERIFF DECISION EXCEPTION', [
                'session_id' => $sessionId,
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }

    /**
     * Map our document types to Veriff document types
     */
    private function mapDocumentType($documentType)
    {
        $mapping = [
            'ph_national_id' => 'NATIONAL_ID',
            'ph_drivers_license' => 'DRIVERS_LICENSE',
            'sss_id' => 'NATIONAL_ID',
            'philhealth_id' => 'NATIONAL_ID',
            'tin_id' => 'NATIONAL_ID',
            'postal_id' => 'NATIONAL_ID',
            'voters_id' => 'NATIONAL_ID',
            'prc_id' => 'NATIONAL_ID',
            'umid' => 'NATIONAL_ID',
            'owwa_id' => 'NATIONAL_ID',
            'national_id' => 'NATIONAL_ID',
            'drivers_license' => 'DRIVERS_LICENSE',
            'passport' => 'PASSPORT',
            'other' => 'NATIONAL_ID'
        ];

        return $mapping[$documentType] ?? 'NATIONAL_ID';
    }

    /**
     * Validate webhook signature
     */
    public function validateWebhookSignature($payload, $signature)
    {
        $expectedSignature = hash_hmac('sha256', $payload, $this->secretKey);
        return hash_equals($expectedSignature, $signature);
    }

    /**
     * Process webhook data
     */
    public function processWebhook($data)
    {
        Log::info('🔔 VERIFF WEBHOOK RECEIVED', [
            'session_id' => $data['verification']['id'],
            'status' => $data['verification']['status']
        ]);

        // Extract document information from Veriff response
        $documentInfo = $this->extractDocumentInfo($data);
        
        return [
            'session_id' => $data['verification']['id'],
            'status' => $data['verification']['status'],
            'code' => $data['verification']['code'] ?? null,
            'reason' => $data['verification']['reason'] ?? null,
            'person' => $data['verification']['person'] ?? null,
            'document' => $data['verification']['document'] ?? null,
            'detected_document_type' => $documentInfo['detected_type'],
            'detected_document_name' => $documentInfo['detected_name'],
            'document_country' => $documentInfo['country'],
            'verification_score' => $data['verification']['score'] ?? null,
        ];
    }

    /**
     * Extract and detect document information from Veriff response
     */
    private function extractDocumentInfo($data)
    {
        $document = $data['verification']['document'] ?? [];
        $person = $data['verification']['person'] ?? [];
        
        // Get document type from Veriff
        $veriffDocumentType = $document['type'] ?? 'NATIONAL_ID';
        $country = $document['country'] ?? 'PHL';
        
        // Map Veriff document types to our system
        $detectedType = $this->mapVeriffDocumentType($veriffDocumentType, $country);
        $detectedName = $this->getDocumentDisplayName($detectedType);
        
        Log::info('🔍 DOCUMENT DETECTION', [
            'veriff_type' => $veriffDocumentType,
            'detected_type' => $detectedType,
            'detected_name' => $detectedName,
            'country' => $country
        ]);
        
        return [
            'detected_type' => $detectedType,
            'detected_name' => $detectedName,
            'country' => $country,
            'veriff_type' => $veriffDocumentType
        ];
    }

    /**
     * Map Veriff document types to our system
     */
    private function mapVeriffDocumentType($veriffType, $country = 'PHL')
    {
        $mapping = [
            'NATIONAL_ID' => 'ph_national_id',
            'DRIVERS_LICENSE' => 'ph_drivers_license',
            'PASSPORT' => 'passport',
            'RESIDENCE_PERMIT' => 'residence_permit',
            'VISA' => 'visa',
            'ID_CARD' => 'ph_national_id',
            'UTILITY_BILL' => 'utility_bill',
            'BANK_STATEMENT' => 'bank_statement',
        ];

        // Special handling for Philippine documents
        if ($country === 'PHL') {
            $philippineMapping = [
                'NATIONAL_ID' => 'ph_national_id',
                'DRIVERS_LICENSE' => 'ph_drivers_license',
                'SSS_ID' => 'sss_id',
                'PHILHEALTH_ID' => 'philhealth_id',
                'TIN_ID' => 'tin_id',
                'POSTAL_ID' => 'postal_id',
                'VOTERS_ID' => 'voters_id',
                'PRC_ID' => 'prc_id',
                'UMID' => 'umid',
                'OWWA_ID' => 'owwa_id',
            ];
            
            return $philippineMapping[$veriffType] ?? $mapping[$veriffType] ?? 'ph_national_id';
        }

        return $mapping[$veriffType] ?? 'national_id';
    }

    /**
     * Get display name for document type
     */
    private function getDocumentDisplayName($documentType)
    {
        $names = [
            'ph_national_id' => 'Philippine National ID',
            'ph_drivers_license' => "Philippine Driver's License",
            'sss_id' => 'SSS ID',
            'philhealth_id' => 'PhilHealth ID',
            'tin_id' => 'TIN ID',
            'postal_id' => 'Postal ID',
            'voters_id' => "Voter's ID",
            'prc_id' => 'PRC ID',
            'umid' => 'UMID',
            'owwa_id' => 'OWWA ID',
            'passport' => 'Passport',
            'residence_permit' => 'Residence Permit',
            'visa' => 'Visa',
            'utility_bill' => 'Utility Bill',
            'bank_statement' => 'Bank Statement',
            'national_id' => 'National ID',
            'drivers_license' => "Driver's License",
        ];

        return $names[$documentType] ?? 'Government ID';
    }

    /**
     * Check if Veriff is properly configured
     */
    public function isConfigured()
    {
        return !empty($this->apiKey) && !empty($this->secretKey);
    }

    /**
     * Get Philippine ID validation patterns
     */
    public function getPhilippineIdPatterns()
    {
        return [
            'ph_national_id' => [
                'pattern' => '/^\d{4}-\d{7}-\d{1}$/',
                'placeholder' => '1234-5678901-2',
                'description' => 'Philippine National ID (PhilSys)'
            ],
            'ph_drivers_license' => [
                'pattern' => '/^[A-Z]\d{2}-\d{2}-\d{6}$/',
                'placeholder' => 'A12-34-567890',
                'description' => "Philippine Driver's License"
            ],
            'sss_id' => [
                'pattern' => '/^\d{2}-\d{7}-\d{1}$/',
                'placeholder' => '12-3456789-0',
                'description' => 'Social Security System ID'
            ],
            'philhealth_id' => [
                'pattern' => '/^\d{2}-\d{9}-\d{1}$/',
                'placeholder' => '12-345678901-2',
                'description' => 'PhilHealth ID'
            ],
            'tin_id' => [
                'pattern' => '/^\d{3}-\d{3}-\d{3}-\d{3}$/',
                'placeholder' => '123-456-789-000',
                'description' => 'Tax Identification Number'
            ],
            'postal_id' => [
                'pattern' => '/^[A-Z]{3}\d{7}$/',
                'placeholder' => 'ABC1234567',
                'description' => 'Postal ID'
            ],
            'voters_id' => [
                'pattern' => '/^\d{4}-\d{4}-\d{4}-\d{4}$/',
                'placeholder' => '1234-5678-9012-3456',
                'description' => "Voter's ID"
            ],
            'prc_id' => [
                'pattern' => '/^\d{7}$/',
                'placeholder' => '1234567',
                'description' => 'Professional Regulation Commission ID'
            ],
            'umid' => [
                'pattern' => '/^\d{4}-\d{7}-\d{1}$/',
                'placeholder' => '1234-5678901-2',
                'description' => 'Unified Multi-Purpose ID'
            ],
            'owwa_id' => [
                'pattern' => '/^[A-Z]{2}\d{8}$/',
                'placeholder' => 'AB12345678',
                'description' => 'Overseas Workers Welfare Administration ID'
            ]
        ];
    }

    /**
     * Validate Philippine ID number format
     */
    public function validatePhilippineId($documentType, $documentNumber)
    {
        $patterns = $this->getPhilippineIdPatterns();
        
        if (!isset($patterns[$documentType])) {
            return false;
        }

        return preg_match($patterns[$documentType]['pattern'], $documentNumber);
    }
} 