# Semaphore SMS Integration Guide

This guide explains how to integrate Semaphore SMS service into your Petsit Connect application for sending verification codes and notifications.

## Overview

Semaphore is a Philippine-based SMS service provider that offers reliable SMS delivery at competitive rates. This integration replaces the previous simulation mode with real SMS sending capabilities.

## Features

- ✅ Real SMS sending via Semaphore API
- ✅ Automatic phone number formatting for Philippine numbers
- ✅ Fallback to simulation mode if Semaphore fails
- ✅ Comprehensive logging and error handling
- ✅ Account balance monitoring
- ✅ Transaction history tracking
- ✅ Custom sender name support

## Prerequisites

1. **Semaphore Account**: Sign up at [semaphore.co](https://www.semaphore.co)
2. **API Key**: Obtain your API key from the Semaphore dashboard
3. **Credits**: Ensure you have sufficient credits in your Semaphore account
4. **Sender Name**: Register a sender name (optional, defaults to "PetsitConnect")

## Installation & Setup

### Step 1: Configure Environment Variables

Add the following variables to your `.env` file:

```env
# Semaphore SMS Configuration
SEMAPHORE_API_KEY=your_semaphore_api_key_here
SEMAPHORE_BASE_URL=https://api.semaphore.co/api/v4
SEMAPHORE_SENDER_NAME=PetsitConnect
```

### Step 2: Verify Configuration

The Semaphore configuration is already added to `config/services.php`:

```php
'semaphore' => [
    'api_key' => env('SEMAPHORE_API_KEY'),
    'base_url' => env('SEMAPHORE_BASE_URL', 'https://api.semaphore.co/api/v4'),
    'sender_name' => env('SEMAPHORE_SENDER_NAME', 'PetsitConnect'),
],
```

### Step 3: Test the Integration

Run the test script to verify everything is working:

```bash
cd /path/to/your/pet-sitting-app
php test_semaphore_integration.php
```

## API Endpoints

### Send Phone Verification Code

**Endpoint**: `POST /api/send-phone-verification-code`

**Request Body**:
```json
{
    "phone": "+639639283365"
}
```

**Response**:
```json
{
    "success": true,
    "message": "Verification code sent successfully via SMS!",
    "debug_code": "123456",
    "provider": "semaphore",
    "timestamp": "2024-01-15 10:30:00"
}
```

### Verify Phone Code

**Endpoint**: `POST /api/verify-phone-code`

**Request Body**:
```json
{
    "phone": "+639639283365",
    "code": "123456"
}
```

**Response**:
```json
{
    "success": true,
    "message": "Phone number verified successfully!"
}
```

## Service Class Usage

### Basic SMS Sending

```php
use App\Services\SemaphoreService;

$semaphoreService = new SemaphoreService();
$result = $semaphoreService->sendSMS('+639639283365', 'Your verification code is: 123456');

if ($result['success']) {
    echo "SMS sent successfully!";
} else {
    echo "Failed to send SMS: " . $result['error'];
}
```

### Check Account Balance

```php
$accountInfo = $semaphoreService->getAccountInfo();
if ($accountInfo['success']) {
    $balance = $accountInfo['data']['credit_balance'];
    echo "Current balance: " . $balance . " credits";
}
```

### Get Transaction History

```php
$transactions = $semaphoreService->getTransactions();
if ($transactions['success']) {
    foreach ($transactions['data'] as $transaction) {
        echo "Transaction: " . json_encode($transaction);
    }
}
```

## Phone Number Formatting

The service automatically formats phone numbers for Semaphore:

- `09639283365` → `+639639283365`
- `639639283365` → `+639639283365`
- `+639639283365` → `+639639283365` (no change)

## Error Handling

The integration includes comprehensive error handling:

1. **API Failures**: Falls back to simulation mode
2. **Network Issues**: Retries with timeout handling
3. **Invalid Credentials**: Logs detailed error information
4. **Rate Limiting**: Handles Semaphore rate limits gracefully

## Logging

All SMS operations are logged with detailed information:

- 📱 SMS sending attempts
- ✅ Success confirmations
- ❌ Error details
- 📊 API responses
- 🔍 Debug information

View logs with:
```bash
tail -f storage/logs/laravel.log | grep "SEMAPHORE"
```

## Monitoring & Maintenance

### Check Credit Balance

```bash
php artisan tinker
>>> $service = new App\Services\SemaphoreService();
>>> $service->getAccountInfo();
```

### Monitor SMS Usage

```bash
# View SMS logs
tail -f storage/logs/laravel.log | grep "📱 SEMAPHORE"

# Count successful sends
grep -c "✅ SEMAPHORE SMS - Message sent successfully" storage/logs/laravel.log

# Count failures
grep -c "❌ SEMAPHORE SMS - Failed to send" storage/logs/laravel.log
```

## Troubleshooting

### Common Issues

1. **"Invalid API Key"**
   - Verify your API key in the `.env` file
   - Check that the key is correctly copied from Semaphore dashboard

2. **"Insufficient Credits"**
   - Add credits to your Semaphore account
   - Check balance using the account info endpoint

3. **"Invalid Phone Number"**
   - Ensure phone numbers include country code (+63 for Philippines)
   - Check phone number formatting

4. **"Sender Name Not Approved"**
   - Sender name approval can take up to 5 business days
   - Use default sender name or wait for approval

### Debug Mode

Enable detailed logging by setting in `.env`:
```env
LOG_LEVEL=debug
```

### Test Connection

```bash
php -r "
require 'vendor/autoload.php';
\$app = require 'bootstrap/app.php';
\$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();
\$service = new App\Services\SemaphoreService();
var_dump(\$service->testConnection());
"
```

## Cost Management

### Credit Usage
- Each SMS typically costs 1 credit
- Monitor usage through the Semaphore dashboard
- Set up low balance alerts

### Optimization Tips
1. Use appropriate message lengths
2. Avoid sending duplicate messages
3. Implement proper rate limiting
4. Monitor failed delivery attempts

## Security Considerations

1. **API Key Protection**: Never commit API keys to version control
2. **Rate Limiting**: Implement proper rate limiting for SMS endpoints
3. **Input Validation**: Always validate phone numbers before sending
4. **Logging**: Be careful not to log sensitive information

## Support

- **Semaphore Documentation**: [semaphore.co/docs](https://www.semaphore.co/docs)
- **API Reference**: [api.semaphore.co](https://api.semaphore.co)
- **Support Contact**: Check Semaphore dashboard for support options

## Migration from Simulation Mode

The integration automatically falls back to simulation mode if Semaphore is unavailable, ensuring your application continues to work during development or if there are service issues.

To force simulation mode, simply don't set the `SEMAPHORE_API_KEY` in your `.env` file.

## Performance Considerations

- SMS sending is asynchronous and non-blocking
- Failed SMS attempts are logged but don't break the user flow
- The service includes proper timeout handling (30 seconds)
- Connection pooling is handled by Laravel's HTTP client

---

**Last Updated**: January 2024  
**Version**: 1.0  
**Compatibility**: Laravel 12.x, PHP 8.2+
