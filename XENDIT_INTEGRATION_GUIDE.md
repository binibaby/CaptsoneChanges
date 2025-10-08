# Xendit Payment Integration Guide

This guide covers the complete Xendit Sandbox integration for the Pet Sitting App, including payment processing, E-Wallet functionality, and real-time updates.

## 🏗️ Architecture Overview

The integration consists of:

### Backend (Laravel)
- **XenditService**: Handles Xendit API calls for invoices and disbursements
- **PaymentController**: Manages payment creation and webhook handling
- **WalletController**: Handles E-Wallet operations and cash out
- **Events**: Laravel Reverb events for real-time updates
- **Models**: Updated User model with wallet_balance field

### Frontend (React Native)
- **BookingSummaryScreen**: Shows booking details before payment
- **XenditCheckoutScreen**: Handles Xendit payment redirect
- **EWalletScreen**: Displays wallet balance and transaction history
- **PaymentService**: Frontend API service for payment operations
- **RealtimeService**: WebSocket connection for real-time updates
- **DashboardService**: Manages dashboard metrics with real-time updates

## 🔧 Setup Instructions

### 1. Backend Configuration

#### Environment Variables
Add these to your Laravel `.env` file:

```env
# Xendit Configuration
XENDIT_SECRET_KEY=xnd_development_5Uj7sP7dHMTl0wbSemPCvL1OmGEorDCWkzAiLdKjPXvBfnleEza1M3mVTnRhyD
XENDIT_PUBLIC_KEY=xnd_public_development_5Uj7sP7dHMTl0wbSemPCvL1OmGEorDCWkzAiLdKjPXvBfnleEza1M3mVTnRhyD
XENDIT_WEBHOOK_TOKEN=your_webhook_token_here

# Laravel Reverb Configuration
REVERB_APP_ID=your_app_id
REVERB_APP_KEY=your_app_key
REVERB_APP_SECRET=your_app_secret
REVERB_HOST="localhost"
REVERB_PORT=8080
REVERB_SCHEME=http
```

#### Database Migration
Run the migration to add wallet_balance to users table:

```bash
php artisan migrate
```

#### Install Xendit Package
```bash
composer require xendit/xendit-php
```

### 2. Frontend Configuration

#### Install Required Packages
```bash
npm install react-native-webview
```

#### Update Network Service
Ensure your `networkService.ts` has the correct base URL for your Laravel backend.

## 🚀 Payment Flow

### 1. Booking Creation
1. User selects sitter and time slot in `BookingScreen`
2. Clicks "Book Now" → redirects to `BookingSummaryScreen`
3. Shows booking details and total amount
4. User clicks "Proceed to Payment"

### 2. Payment Processing
1. Frontend calls `/api/payments/create-invoice`
2. Backend creates Xendit invoice
3. User redirected to Xendit Sandbox checkout page
4. After payment, Xendit sends webhook to `/api/webhooks/xendit/payment`

### 3. Payment Completion
1. Webhook handler processes payment
2. Updates booking status to "active"
3. Adds money to sitter's wallet (90% of total)
4. Broadcasts `PaymentReceived` and `WalletUpdated` events
5. Real-time updates sent to both owner and sitter dashboards

## 💳 E-Wallet Features

### For Sitters
- **View Balance**: Current wallet balance displayed on dashboard
- **Transaction History**: List of all incoming payments and cash outs
- **Cash Out**: Withdraw money to bank account using Xendit disbursement API

### Cash Out Process
1. Sitter clicks "Cash Out" in E-Wallet screen
2. Enters amount, selects bank, and provides account details
3. Frontend calls `/api/wallet/cash-out`
4. Backend creates Xendit disbursement
5. Money deducted from wallet immediately
6. Real-time notification when disbursement completes

## 📊 Real-Time Dashboard Updates

### Metrics Updated in Real-Time
- **Pet Owners**: Total Spent, Active Bookings, This Week Spending
- **Pet Sitters**: Total Income, Jobs Completed, Upcoming Jobs, This Week Income, Wallet Balance

### WebSocket Events
- `payment.received`: New payment received by sitter
- `wallet.updated`: Wallet balance changed
- `dashboard.updated`: Dashboard metrics updated
- `booking.status.changed`: Booking status changed

## 🔗 API Endpoints

### Payment Endpoints
- `POST /api/payments/create-invoice` - Create payment invoice
- `GET /api/payments/{id}/status` - Get payment status
- `GET /api/payments/history` - Get payment history

### Wallet Endpoints
- `GET /api/wallet` - Get wallet information
- `GET /api/wallet/transactions` - Get transaction history
- `POST /api/wallet/cash-out` - Cash out to bank account
- `GET /api/wallet/banks` - Get available banks

### Webhook Endpoints
- `POST /api/webhooks/xendit/payment` - Payment webhook
- `POST /api/webhooks/xendit/disbursement` - Disbursement webhook

## 🧪 Testing with Xendit Sandbox

### Test Cards
Use these test card numbers in Xendit Sandbox:
- **Visa**: 4111111111111111
- **Mastercard**: 5555555555554444
- **Expiry**: Any future date
- **CVV**: Any 3 digits

### Test Bank Accounts
For disbursement testing, use these test bank details:
- **Bank Code**: BCA, BNI, BRI, MANDIRI, PERMATA
- **Account Number**: Any valid format
- **Account Holder**: Any name

## 🔒 Security Features

### Webhook Verification
- All Xendit webhooks are verified using HMAC signature
- Invalid signatures are rejected

### Authentication
- All API endpoints require authentication
- User can only access their own data

### Input Validation
- All inputs are validated on both frontend and backend
- Amount limits enforced (₱100 - ₱50,000 for cash out)

## 📱 User Experience

### Payment Flow
1. **Seamless**: Users stay in the app throughout the process
2. **Secure**: Redirected to Xendit's secure payment page
3. **Real-time**: Instant updates when payment completes
4. **Notifications**: Users receive notifications for all events

### E-Wallet Experience
1. **Intuitive**: Clear balance display and transaction history
2. **Fast**: Real-time balance updates
3. **Reliable**: Secure cash out process with status tracking

## 🐛 Troubleshooting

### Common Issues

#### WebSocket Connection Failed
- Check if Laravel Reverb is running: `php artisan reverb:start`
- Verify REVERB_* environment variables
- Check firewall settings for port 8080

#### Payment Webhook Not Received
- Verify webhook URL is accessible from Xendit
- Check webhook signature verification
- Ensure webhook endpoint is not behind authentication

#### Xendit API Errors
- Verify XENDIT_SECRET_KEY is correct
- Check if using sandbox keys for testing
- Ensure sufficient balance for disbursements

### Debug Mode
Enable debug logging in Laravel:
```env
LOG_LEVEL=debug
```

Check logs in `storage/logs/laravel.log` for detailed error information.

## 🚀 Production Deployment

### Environment Variables
Update to production Xendit keys:
```env
XENDIT_SECRET_KEY=xnd_production_your_production_key
XENDIT_PUBLIC_KEY=xnd_public_production_your_public_key
```

### Webhook URLs
Update Xendit webhook URLs to your production domain:
- Payment webhook: `https://yourdomain.com/api/webhooks/xendit/payment`
- Disbursement webhook: `https://yourdomain.com/api/webhooks/xendit/disbursement`

### SSL Certificate
Ensure your production server has a valid SSL certificate for secure webhook communication.

## 📈 Monitoring

### Key Metrics to Monitor
- Payment success rate
- Webhook delivery success rate
- Average payment processing time
- Cash out processing time
- Real-time update delivery rate

### Logging
All payment and wallet operations are logged with:
- User ID
- Transaction ID
- Amount
- Status
- Timestamp

## 🔄 Maintenance

### Regular Tasks
- Monitor webhook delivery logs
- Check for failed disbursements
- Update Xendit SDK when new versions are released
- Review and update test cases

### Backup Strategy
- Regular database backups including wallet transactions
- Webhook event logs for audit trail
- User wallet balance snapshots

This integration provides a complete payment solution with real-time updates, ensuring a smooth user experience for both pet owners and sitters in your pet sitting application.
