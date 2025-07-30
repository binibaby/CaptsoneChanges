# Twilio SMS Setup Guide

## Step 1: Sign Up for Twilio
1. Go to [twilio.com](https://www.twilio.com)
2. Click "Sign up for free"
3. Create your account (you'll get free credits)

## Step 2: Get Your Twilio Credentials
1. **Log into your Twilio Console**
2. **Find your Account SID** (starts with "AC...")
3. **Find your Auth Token** (click "show" to reveal)
4. **Get a phone number** (click "Get a trial number")

## Step 3: Add Credentials to Your App
Add these lines to your `.env` file:

```env
TWILIO_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_FROM_NUMBER=your_twilio_phone_number_here
```

## Step 4: Test the SMS
1. **Restart your Laravel server**:
   ```bash
   php artisan serve
   ```

2. **Test the API**:
   ```bash
   curl -X POST http://127.0.0.1:8000/api/send-verification-code \
     -H "Content-Type: application/json" \
     -d '{"phone":"09639283365"}'
   ```

3. **Check your phone** - you should receive an SMS!

## Troubleshooting

### If SMS doesn't send:
- Check your Twilio account has credits
- Verify the phone number format (should include country code)
- Check Laravel logs: `tail -f storage/logs/laravel.log`

### For Philippine numbers:
- Make sure to include country code: `+639639283365`
- Twilio trial accounts may have restrictions on international SMS

### Free Trial Limits:
- Twilio trial accounts have limitations
- You may need to verify your phone number in Twilio
- Some countries may have restrictions

## Alternative: Use a Different SMS Service

If Twilio doesn't work, you can try:
- **Vonage** (formerly Nexmo)
- **MessageBird**
- **AWS SNS**

Just update the `sendSMS` method in `AuthController.php` with the appropriate SDK. 