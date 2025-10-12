# Semaphore API Configuration

## API Key Setup

Add these environment variables to your `.env` file in the `pet-sitting-app` directory:

```env
# Semaphore SMS API Configuration
SEMAPHORE_API_KEY=25e93be412c53c939cab90c41ea110c8
SEMAPHORE_ENABLED=true
SMS_SIMULATION_MODE=false

# Optional Semaphore Settings
SEMAPHORE_BASE_URL=https://api.semaphore.co/api/v4
SEMAPHORE_SENDER_NAME=PetsitConnect
```

## What Changed

### 1. Real API Integration
- ✅ **API Key**: `25e93be412c53c939cab90c41ea110c8`
- ✅ **Enabled**: Semaphore is now enabled by default
- ✅ **Simulation**: Disabled by default (can be enabled for testing)

### 2. SMS Message Format
- ✅ **Before**: "Petsit Connect code: 123456. Valid for 10 mins."
- ✅ **After**: "123456" (6-digit code only)

### 3. Configuration Changes
- ✅ **Default Mode**: Production (real SMS)
- ✅ **Fallback**: Simulation mode available for testing
- ✅ **API Endpoint**: Uses Semaphore OTP endpoint

## Testing

### Enable Real SMS (Production)
```env
SEMAPHORE_ENABLED=true
SMS_SIMULATION_MODE=false
```

### Enable Simulation Mode (Testing)
```env
SEMAPHORE_ENABLED=false
SMS_SIMULATION_MODE=true
```

## API Endpoint

The system now uses Semaphore's OTP endpoint:
- **URL**: `https://api.semaphore.co/api/v4/otp`
- **Method**: POST
- **Parameters**:
  - `apikey`: Your API key
  - `number`: Phone number (e.g., +639123456789)
  - `message`: 6-digit code only

## Benefits

- ✅ **Clean Messages**: Only 6-digit code sent
- ✅ **Cost Effective**: Shorter messages = lower cost
- ✅ **User Friendly**: Clean, simple verification
- ✅ **Reliable**: Real SMS delivery via Semaphore
- ✅ **Trackable**: Full logging and error handling

## Logs

Check these log files for SMS activity:
- **Main logs**: `storage/logs/laravel.log`
- **Verification logs**: `storage/logs/verification.log`

Look for these log entries:
- `📱 SEMAPHORE SMS - Attempting to send SMS via Semaphore`
- `✅ SEMAPHORE SMS - Message sent successfully via Semaphore`
- `❌ SEMAPHORE SMS - Failed to send via Semaphore`
