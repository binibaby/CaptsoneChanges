# Real-time Notifications Implementation Guide

## Overview
This guide covers the implementation of real-time notifications using Laravel Reverb for approval/rejection status changes in the pet sitting app.

## Features Implemented

### 1. Real-time Notification Service
- **File**: `src/services/realtimeNotificationService.ts`
- **Purpose**: Handles real-time notifications using Laravel Reverb/Echo
- **Events Supported**:
  - Profile change approvals/rejections
  - ID verification approvals/rejections
  - Booking status updates
  - General notifications

### 2. Updated Notification Screens
- **PetOwnerNotificationsScreen**: Enhanced with real-time capabilities
- **PetSitterNotificationsScreen**: Enhanced with real-time capabilities
- **Features Added**:
  - Real-time connection indicator ("Live" status)
  - Pull-to-refresh functionality
  - Manual refresh button
  - Automatic notification updates

## Setup Instructions

### 1. Backend Setup (Laravel Reverb)
```bash
# Install Laravel Reverb (if not already installed)
composer require laravel/reverb

# Publish Reverb configuration
php artisan reverb:install

# Start Reverb server
php artisan reverb:start
```

### 2. Environment Configuration
Add these to your `.env` file:
```env
REVERB_APP_ID=iycawpww023mjumkvwsj
REVERB_APP_KEY=iycawpww023mjumkvwsj
REVERB_APP_SECRET=iycawpww023mjumkvwsj
REVERB_HOST="0.0.0.0"
REVERB_PORT=8080
REVERB_SCHEME=http

BROADCAST_DRIVER=reverb
```

### 3. Mobile App Configuration
The app will automatically connect to Laravel Reverb using the configured endpoints.

## Testing Real-time Notifications

### 1. Start Required Services
```bash
# Terminal 1: Start Laravel Reverb
cd pet-sitting-app
php artisan reverb:start

# Terminal 2: Start Laravel API server
cd pet-sitting-app
php artisan serve --host=0.0.0.0 --port=8000

# Terminal 3: Start React Native app
cd /Users/jassy/Downloads/CapstoneApp
npx expo start
```

### 2. Test Notifications
Run the test script to simulate various notification events:
```bash
cd /Users/jassy/Downloads/CapstoneApp
php test_realtime_notifications.php
```

### 3. Manual Testing Steps

#### For Pet Owners:
1. Open the app and navigate to Notifications
2. Look for the "Live" indicator in the header
3. Run the test script to trigger profile change notifications
4. Verify notifications appear in real-time
5. Test pull-to-refresh functionality

#### For Pet Sitters:
1. Open the app and navigate to Notifications
2. Look for the "Live" indicator in the header
3. Run the test script to trigger ID verification notifications
4. Verify notifications appear in real-time
5. Test pull-to-refresh functionality

## Real-time Events Supported

### 1. Profile Change Events
- **Event**: `ProfileChangeApproved`
- **Channel**: `user.{user_id}`
- **Triggered**: When admin approves profile change request
- **Notification**: "Your profile update request has been approved!"

- **Event**: `ProfileChangeRejected`
- **Channel**: `user.{user_id}`
- **Triggered**: When admin rejects profile change request
- **Notification**: "Your profile update request has been rejected."

### 2. ID Verification Events
- **Event**: `IdVerificationStatusUpdated`
- **Channel**: `user.{user_id}`
- **Triggered**: When admin approves/rejects ID verification
- **Notifications**: 
  - Approved: "Your ID verification has been approved!"
  - Rejected: "Your ID verification has been rejected."

### 3. Booking Status Events
- **Event**: `BookingStatusUpdated` (to be implemented)
- **Channel**: `user.{user_id}`
- **Triggered**: When booking status changes
- **Notifications**: Various booking-related messages

## Troubleshooting

### Common Issues

1. **"Live" indicator not showing**
   - Check if Laravel Reverb is running
   - Verify network connectivity
   - Check console logs for connection errors

2. **Notifications not appearing in real-time**
   - Ensure user is authenticated
   - Check if events are being broadcasted
   - Verify channel subscriptions

3. **Connection errors**
   - Check Reverb server logs
   - Verify environment configuration
   - Ensure ports are not blocked

### Debug Steps

1. **Check Reverb Server Status**
   ```bash
   # Check if Reverb is running
   ps aux | grep reverb
   
   # Check Reverb logs
   tail -f storage/logs/laravel.log
   ```

2. **Check Mobile App Logs**
   - Open React Native debugger
   - Look for Echo connection messages
   - Check for WebSocket connection errors

3. **Test Event Broadcasting**
   ```bash
   # Run the test script
   php test_realtime_notifications.php
   
   # Check if events are logged
   tail -f storage/logs/laravel.log | grep "broadcast"
   ```

## Code Structure

### Real-time Notification Service
```typescript
// Key methods:
- initialize(userId, authToken): Promise<boolean>
- subscribe(listener): () => void
- disconnect(): void
- isServiceInitialized(): boolean
```

### Notification Screens
```typescript
// Key features:
- Real-time connection indicator
- Pull-to-refresh with RefreshControl
- Manual refresh button
- Automatic notification updates
- Real-time event listeners
```

## Future Enhancements

1. **Additional Event Types**
   - Message notifications
   - Review notifications
   - System announcements

2. **Enhanced UI**
   - Notification badges
   - Sound notifications
   - Push notifications

3. **Performance Optimizations**
   - Connection pooling
   - Event filtering
   - Caching strategies

## Support

If you encounter issues with real-time notifications:

1. Check the console logs for error messages
2. Verify all services are running correctly
3. Test network connectivity between mobile app and server
4. Review the Laravel Reverb documentation
5. Check the event broadcasting configuration

The implementation provides a solid foundation for real-time notifications and can be extended as needed for additional features.
