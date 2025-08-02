# Veriff Integration Setup Guide

## API Configuration

Add the following environment variables to your `.env` file:

```env
# Veriff Configuration
VERIFF_API_KEY=19ba73e1-810d-40c6-9167-2c35578d2889
VERIFF_SECRET_KEY=5d97f4aa-3350-4978-93c5-8e1254c74153
VERIFF_BASE_URL=https://api.veriff.me
VERIFF_WEBHOOK_URL=https://your-domain.com/api/verification/webhook/veriff
```

## Setup Steps

1. **✅ Veriff API Key**: `19ba73e1-810d-40c6-9167-2c35578d2889`
2. **✅ Veriff Secret Key**: `5d97f4aa-3350-4978-93c5-8e1254c74153`
3. **Configure Webhook URL**: Replace `your-domain.com` with your actual domain
4. **Test the Integration**: The system will automatically use Veriff when properly configured

## Features

- **Philippine ID Support**: All major Philippine government IDs are supported
- **Real-time Verification**: Uses Veriff's AI-powered document verification
- **Webhook Integration**: Automatic status updates via webhooks
- **Fallback Mode**: Simulation mode when Veriff is not configured

## Supported Philippine IDs

- Philippine National ID (PhilSys)
- Philippine Driver's License
- SSS ID
- PhilHealth ID
- TIN ID
- Postal ID
- Voter's ID
- PRC ID
- UMID
- OWWA ID

## API Endpoints

- `POST /api/verification/submit` - Submit verification
- `GET /api/verification/status` - Get verification status
- `GET /api/verification/session-status` - Get Veriff session status
- `POST /api/verification/webhook/veriff` - Veriff webhook endpoint
- `GET /api/verification/philippine-ids` - Get Philippine ID types 