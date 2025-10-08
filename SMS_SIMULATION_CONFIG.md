# SMS Simulation Mode Configuration

## Overview
This configuration allows you to use simulation mode for SMS verification while waiting for your Semaphore API to be approved.

## Environment Variables

Add these to your `.env` file in the `pet-sitting-app` directory:

```env
# SMS Simulation Mode Configuration
# Set to true to enable SMS simulation mode (for development/testing)
SMS_SIMULATION_MODE=true

# Set to false to disable Semaphore SMS (until API is approved)
SEMAPHORE_ENABLED=false
```

## How It Works

1. **Simulation Mode is enabled when:**
   - `SMS_SIMULATION_MODE=true`, OR
   - `SEMAPHORE_ENABLED=false`

2. **In Simulation Mode:**
   - SMS codes are generated and logged to the console
   - No actual SMS is sent via Semaphore
   - Verification codes are visible in the logs
   - The system works exactly like production but without real SMS

3. **When Semaphore is approved:**
   - Set `SMS_SIMULATION_MODE=false`
   - Set `SEMAPHORE_ENABLED=true`
   - The system will automatically switch to real SMS sending

## Testing the Simulation

1. **Send Verification Code:**
   - Request a verification code
   - Check the logs for the generated code
   - The code will be displayed in a clear format

2. **Verify Code:**
   - Use the code from the logs
   - The verification will work normally

## Log Locations

- **Main logs:** `pet-sitting-app/storage/logs/laravel.log`
- **Verification codes:** `pet-sitting-app/storage/logs/verification.log`

## Example Log Output

```
🎭 ========================================
🎭 SMS SIMULATION - VERIFICATION CODE
🎭 ========================================
🎭 Phone: +639123456789
🎭 Code: 123456
🎭 Message: Petsit Connect code: 123456. Valid for 10 mins.
🎭 ========================================
```

## Benefits

- ✅ Test phone verification without SMS costs
- ✅ No dependency on external SMS services
- ✅ Easy debugging with visible codes
- ✅ Seamless switch to production when ready
- ✅ Works exactly like the real system
