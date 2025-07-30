# SMS Service Setup for Phone Verification

This document explains how to set up SMS services for phone verification in the Petsit Connect app.

## Current Implementation

The phone verification system is currently set up to:
1. Generate a 6-digit verification code
2. Store the code in cache for 10 minutes
3. Send the code via SMS (currently logging for development)
4. Verify the code against the stored value

## SMS Service Options

### Option 1: Twilio (Recommended)

1. **Sign up for Twilio**: Go to [twilio.com](https://www.twilio.com) and create an account
2. **Get your credentials**: 
   - Account SID
   - Auth Token
   - Phone number for sending SMS
3. **Install Twilio SDK**:
   ```bash
   composer require twilio/sdk
   ```
4. **Add environment variables** to your `.env` file:
   ```
   TWILIO_SID=your_account_sid
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_FROM_NUMBER=your_twilio_phone_number
   ```
5. **Uncomment Twilio code** in `app/Http/Controllers/API/AuthController.php`:
   ```php
   $twilio = new \Twilio\Rest\Client(
       config('services.twilio.sid'),
       config('services.twilio.token')
   );
   
   $twilio->messages->create(
       $phoneNumber,
       [
           'from' => config('services.twilio.from'),
           'body' => $message
       ]
   );
   ```

### Option 2: Vonage (formerly Nexmo)

1. **Sign up for Vonage**: Go to [vonage.com](https://www.vonage.com) and create an account
2. **Get your credentials**:
   - API Key
   - API Secret
   - Phone number for sending SMS
3. **Install Vonage SDK**:
   ```bash
   composer require vonage/client
   ```
4. **Add environment variables** to your `.env` file:
   ```
   VONAGE_KEY=your_api_key
   VONAGE_SECRET=your_api_secret
   VONAGE_FROM_NUMBER=your_vonage_phone_number
   ```
5. **Uncomment Vonage code** in `app/Http/Controllers/API/AuthController.php`:
   ```php
   $basic = new \Vonage\Client\Credentials\Basic(
       config('services.vonage.key'),
       config('services.vonage.secret')
   );
   
   $client = new \Vonage\Client($basic);
   
   $response = $client->sms()->send(
       new \Vonage\SMS\Message\SMS($phoneNumber, config('services.vonage.from'), $message)
   );
   ```

## Development Mode

In development mode, the system will:
1. Log the SMS message to the Laravel log file
2. Return the verification code in the API response (for testing)

To check the verification codes in development:
```bash
tail -f storage/logs/laravel.log | grep "SMS to"
```

## Production Setup

For production:
1. Choose and configure an SMS service (Twilio or Vonage recommended)
2. Remove the `'code' => $verificationCode` from the API response
3. Ensure proper error handling for SMS failures
4. Set up monitoring for SMS delivery rates

## Testing

To test phone verification:
1. Use a real phone number
2. Check the Laravel logs for the verification code
3. Enter the code in the app
4. Verify the code is accepted

## Troubleshooting

### SMS not being sent
- Check if SMS service credentials are configured
- Verify phone number format (should include country code)
- Check Laravel logs for errors

### Verification code not working
- Check if code is stored in cache
- Verify code format (6 digits)
- Check if code has expired (10 minutes)

### Development mode
- Codes are logged to `storage/logs/laravel.log`
- Codes are returned in API response for testing
- Remove code from response in production 