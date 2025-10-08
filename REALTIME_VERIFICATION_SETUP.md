# Real-Time ID Verification Setup Guide

This guide explains how to set up and test the real-time ID verification feature using Laravel Reverb and React Native.

## 🎯 Overview

The real-time ID verification system allows:
- Sitters to upload 3 images (front ID, back ID, selfie) for verification
- Admins to approve/reject verifications in the admin panel
- Real-time updates to sitters when their verification status changes
- Pull-to-refresh functionality as a fallback

## 🚀 Backend Setup (Laravel)

### 1. Install Dependencies

Laravel Reverb is already installed in your project. If not, run:

```bash
cd pet-sitting-app
composer require laravel/reverb
php artisan reverb:install
```

### 2. Configure Environment Variables

Add these to your `.env` file:

```env
# Broadcasting Configuration
BROADCAST_CONNECTION=reverb

# Reverb Configuration
REVERB_APP_ID=your-app-id
REVERB_APP_KEY=your-app-key
REVERB_APP_SECRET=your-app-secret
REVERB_HOST=localhost
REVERB_PORT=8080
REVERB_SCHEME=http

# Reverb Server Configuration
REVERB_SERVER_HOST=0.0.0.0
REVERB_SERVER_PORT=8080
```

### 3. Start Reverb Server

```bash
cd pet-sitting-app
php artisan reverb:start
```

### 4. Start Laravel Queue Worker

```bash
php artisan queue:work
```

### 5. Start Laravel Development Server

```bash
php artisan serve
```

## 📱 Frontend Setup (React Native)

### 1. Install Dependencies

```bash
npm install laravel-echo pusher-js
```

### 2. Configure Echo Service

Update `src/services/echoService.ts` with your actual Reverb configuration:

```typescript
const echo = new Echo({
  broadcaster: 'pusher',
  key: 'your-reverb-app-key',
  wsHost: 'localhost',
  wsPort: 8080,
  forceTLS: false,
  // ... other config
});
```

### 3. Update API Base URL

Ensure your API base URL in `src/services/networkService.ts` points to your Laravel backend:

```typescript
const API_BASE_URL = 'http://localhost:8000/api';
```

## 🧪 Testing the Complete Flow

### 1. Test Backend API Endpoints

```bash
# Test health check
curl http://localhost:8000/api/health

# Test verification status (requires auth token)
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8000/api/verification/status
```

### 2. Test Real-Time Connection

1. Start the React Native app
2. Navigate to the Pet Sitter Profile screen
3. Check the connection indicator at the top
4. Should show "Real-time connected" with a green dot

### 3. Test Verification Submission

1. In the React Native app, go to the Enhanced Verification screen
2. Fill out the form with:
   - Select an ID type
   - Take/select front ID image
   - Take/select back ID image
   - Take/select selfie image
   - Get current location
3. Submit the verification
4. Check that it appears in the admin panel

### 4. Test Admin Approval/Rejection

1. Open the admin panel at `http://localhost:8000/admin`
2. Navigate to Verifications
3. Find the submitted verification
4. Click "Approve" or "Reject"
5. Check that the sitter receives real-time notification

### 5. Test Pull-to-Refresh

1. In the Pet Sitter Profile screen
2. Pull down to refresh
3. Verify that verification status updates

## 🔧 Troubleshooting

### Common Issues

1. **Real-time connection fails**
   - Check that Reverb server is running on port 8080
   - Verify WebSocket connection in browser dev tools
   - Check firewall settings

2. **Images not uploading**
   - Verify file permissions in `storage/app/public/verifications/`
   - Check image size limits (5MB max)
   - Ensure base64 encoding is working

3. **Admin panel not showing verifications**
   - Check database for verification records
   - Verify admin user has correct permissions
   - Check Laravel logs for errors

4. **Real-time updates not working**
   - Verify broadcasting is enabled in Laravel
   - Check that events are being dispatched
   - Verify Echo service configuration

### Debug Commands

```bash
# Check Reverb server status
php artisan reverb:status

# View Laravel logs
tail -f storage/logs/laravel.log

# Test broadcasting
php artisan tinker
>>> broadcast(new App\Events\IdVerificationStatusUpdated($verification, $user, 'test', 'Test message'));
```

## 📋 API Endpoints

### Verification Endpoints

- `POST /api/verification/submit-enhanced` - Submit enhanced verification
- `GET /api/verification/status` - Get verification status
- `GET /api/verification/philippine-id-types` - Get Philippine ID types

### Admin Endpoints

- `GET /admin/verifications` - List all verifications
- `POST /admin/verifications/{id}/approve` - Approve verification
- `POST /admin/verifications/{id}/reject` - Reject verification

## 🎨 UI Components

### React Native Components

- `EnhancedVerificationScreen` - Main verification screen with real-time updates
- `PullToRefreshWrapper` - Reusable pull-to-refresh component
- `PetSitterProfileScreen` - Updated with real-time connection indicator

### Laravel Components

- `IdVerificationStatusUpdated` - Broadcasting event
- `VerificationController` - API endpoints
- `Admin\VerificationController` - Admin panel functionality

## 🔒 Security Considerations

1. **Authentication**: All API endpoints require valid auth tokens
2. **File Uploads**: Images are validated and stored securely
3. **Real-time Channels**: Private channels require authentication
4. **Admin Actions**: All admin actions are logged and audited

## 📊 Monitoring

### Key Metrics to Monitor

1. **Real-time Connection Status**
   - Connection success rate
   - Message delivery rate
   - Connection drop frequency

2. **Verification Processing**
   - Submission success rate
   - Admin review time
   - Approval/rejection rates

3. **System Performance**
   - API response times
   - Image upload success rate
   - Database query performance

## 🚀 Production Deployment

### Backend (Laravel)

1. Set up Redis for queue management
2. Configure Reverb with SSL/TLS
3. Set up proper file storage (S3, etc.)
4. Configure proper CORS settings

### Frontend (React Native)

1. Update API URLs for production
2. Configure proper WebSocket URLs
3. Set up proper error handling
4. Test on real devices

## 📝 Next Steps

1. **Enhanced Security**: Add image validation and fraud detection
2. **Analytics**: Add detailed analytics and reporting
3. **Notifications**: Add push notifications for mobile
4. **Multi-language**: Add support for multiple languages
5. **Advanced Features**: Add video verification, document scanning

## 🆘 Support

If you encounter issues:

1. Check the Laravel logs: `storage/logs/laravel.log`
2. Check the React Native logs in your development environment
3. Verify all services are running (Laravel, Reverb, Queue Worker)
4. Test API endpoints individually
5. Check network connectivity and firewall settings

## 📚 Additional Resources

- [Laravel Reverb Documentation](https://laravel.com/docs/reverb)
- [Laravel Broadcasting Documentation](https://laravel.com/docs/broadcasting)
- [Laravel Echo Documentation](https://laravel.com/docs/echo)
- [React Native WebSocket Documentation](https://reactnative.dev/docs/network)
