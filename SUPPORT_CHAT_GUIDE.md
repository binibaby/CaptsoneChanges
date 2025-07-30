# Support Chat Feature Implementation Guide

## Overview

The support chat feature allows pet sitters and pet owners to communicate directly with admin staff in real-time through both the mobile app and web admin interface.

## Features Implemented

### Mobile App (React Native)
- **Support Chat Button**: Added to both PetSitterMessagesScreen and PetOwnerMessagesScreen
- **Real-time Chat Interface**: Dedicated support chat UI with admin avatar
- **Message History**: Persistent chat sessions with message history
- **Error Handling**: Graceful error handling for API failures

### Backend API (Laravel)
- **Support Controller**: Complete API endpoints for chat functionality
- **Database Models**: SupportTicket and SupportMessage models for data persistence
- **Authentication**: Secured endpoints with user authentication
- **Notifications**: Admin notifications for support requests

### Admin Web Interface (Laravel Blade)
- **Live Chat Dashboard**: View all active support sessions
- **Real-time Messaging**: Send and receive messages with mobile users
- **Session Management**: Assign tickets to admin staff
- **Message History**: Complete conversation history

## API Endpoints

### Mobile App Endpoints
```
POST   /api/support/tickets              - Create new support ticket
GET    /api/support/tickets              - Get user's support tickets
GET    /api/support/chats/active         - Get active chat sessions
GET    /api/support/tickets/{id}/messages - Get messages for ticket
POST   /api/support/tickets/{id}/messages - Send message to ticket
PATCH  /api/support/tickets/{id}/close   - Close support ticket
```

### Admin Web Endpoints
```
GET    /admin/support/live-chat          - Live chat dashboard
GET    /admin/support/live-chat/{ticket} - Chat session view
POST   /admin/support/live-chat/{ticket}/message - Send admin message
GET    /admin/support/live-chat/{ticket}/messages - Get chat messages
```

## Database Schema

### Support Tickets Table
- `id` - Primary key
- `user_id` - Foreign key to users table
- `ticket_number` - Unique ticket identifier
- `subject` - Ticket subject
- `description` - Ticket description
- `category` - Support category (general, billing, technical, etc.)
- `priority` - Priority level (low, medium, high)
- `status` - Current status (open, in_progress, resolved, closed)
- `type` - Ticket type (chat, email, etc.)
- `assigned_to` - Assigned admin user ID
- `assigned_at` - Assignment timestamp
- `resolved_at` - Resolution timestamp
- `resolution_notes` - Admin resolution notes

### Support Messages Table
- `id` - Primary key
- `ticket_id` - Foreign key to support_tickets table
- `user_id` - Message sender user ID
- `message` - Message content
- `is_internal` - Internal admin note flag
- `is_read` - Message read status
- `created_at` - Message timestamp

## Implementation Details

### 1. Mobile App Integration

#### PetSitterMessagesScreen & PetOwnerMessagesScreen
```typescript
// Support chat button in header
<TouchableOpacity style={styles.supportButton} onPress={handleSupportChat}>
  <Ionicons name="headset" size={20} color="#4A90E2" />
  <Text style={styles.supportButtonText}>Support</Text>
</TouchableOpacity>

// Support chat interface with admin avatar
<View style={styles.supportAvatar}>
  <Ionicons name="headset" size={20} color="#fff" />
</View>
```

#### Support Service
```typescript
// Example usage
const chatSession = await supportService.startSupportChat();
await supportService.sendMessage(ticketId, message);
const messages = await supportService.getMessages(ticketId);
```

### 2. Backend API Implementation

#### SupportController (API)
```php
// Create support ticket
public function createTicket(Request $request)
{
    $ticket = SupportTicket::create([
        'user_id' => Auth::id(),
        'ticket_number' => 'CHAT_' . strtoupper(Str::random(8)),
        'type' => 'chat',
        // ... other fields
    ]);
}

// Send message
public function sendMessage(Request $request, $ticketId)
{
    $message = SupportMessage::create([
        'ticket_id' => $ticket->id,
        'user_id' => Auth::id(),
        'message' => $request->message,
    ]);
}
```

### 3. Admin Web Interface

#### Live Chat Dashboard
- Shows all active chat sessions from mobile users
- Displays unread message counts
- Real-time updates every 30 seconds
- Click to open individual chat sessions

#### Chat Session Management
- Send messages to mobile users
- View complete conversation history
- Assign tickets to specific admin staff
- Mark conversations as resolved

## Configuration Required

### 1. Backend Setup
```bash
# Run migrations
php artisan migrate

# Seed admin user
php artisan db:seed --class=AdminUserSeeder
```

### 2. API Base URL
Update the API_BASE_URL in `src/services/supportService.ts`:
```typescript
const API_BASE_URL = 'https://your-backend-domain.com/api';
```

### 3. Authentication Integration
Update the `getAuthToken()` method in supportService.ts to use your app's authentication system:
```typescript
private getAuthToken(): string | null {
  // Replace with your actual token storage method
  return SecureStore.getItemAsync('auth_token');
}
```

## Real-time Features

### Current Implementation
- **Polling**: Admin interface polls for new messages every 30 seconds
- **Auto-refresh**: Mobile app simulates real-time with timeout responses
- **Notifications**: Push notifications sent to mobile users when admin responds

### Enhanced Real-time (Future Enhancement)
For true real-time messaging, consider implementing:

#### WebSocket Integration (Laravel Echo + Pusher)
```php
// Install Laravel Echo Server or use Pusher
composer require pusher/pusher-php-server
npm install --save laravel-echo pusher-js
```

#### Broadcasting Events
```php
// Create event for new messages
php artisan make:event SupportMessageSent

// Broadcast in SupportController
broadcast(new SupportMessageSent($message));
```

#### Mobile WebSocket Client
```typescript
// Install react-native-pusher-push-notifications
npm install react-native-pusher-push-notifications

// Listen for real-time messages
const pusher = new Pusher(APP_KEY, {
  cluster: APP_CLUSTER,
  encrypted: true
});

const channel = pusher.subscribe(`support.${ticketId}`);
channel.bind('message.sent', (data) => {
  // Update messages in real-time
});
```

## Testing the Feature

### 1. Mobile App Testing
1. Open PetSitterMessagesScreen or PetOwnerMessagesScreen
2. Tap the "Support" button in the header
3. Send a test message
4. Verify the admin auto-response appears

### 2. Admin Testing
1. Login to admin panel: `/admin/login`
   - Email: admin@petsitconnect.com
   - Password: admin123
2. Navigate to Support > Live Chat
3. View active chat sessions from mobile users
4. Click on a session to respond
5. Send messages and verify they appear in mobile app

### 3. Database Testing
```sql
-- View support tickets
SELECT * FROM support_tickets WHERE type = 'chat';

-- View support messages
SELECT sm.*, u.name as sender_name 
FROM support_messages sm 
JOIN users u ON sm.user_id = u.id 
WHERE sm.ticket_id = [TICKET_ID];
```

## Troubleshooting

### Common Issues

1. **API Endpoints Not Working**
   - Verify Laravel routes are registered in `routes/api.php`
   - Check middleware authentication is working
   - Ensure database migrations are run

2. **Messages Not Appearing in Admin Panel**
   - Check if support tickets are created with `type = 'chat'`
   - Verify admin live chat is filtering for correct ticket types
   - Check database relationships are properly loaded

3. **Mobile App Not Connecting**
   - Update API_BASE_URL in supportService.ts
   - Verify authentication token is being sent
   - Check network connectivity and CORS settings

4. **Real-time Updates Not Working**
   - Current implementation uses polling every 30 seconds
   - For instant updates, implement WebSocket broadcasting
   - Check browser console for JavaScript errors

## Security Considerations

1. **Authentication**: All API endpoints require user authentication
2. **Authorization**: Users can only access their own support tickets
3. **Input Validation**: All message inputs are validated and sanitized
4. **Rate Limiting**: Consider implementing rate limiting for message sending
5. **Content Filtering**: Add profanity filters if needed

## Future Enhancements

1. **File Uploads**: Allow users to send images/documents
2. **Typing Indicators**: Show when admin/user is typing
3. **Message Status**: Read receipts and delivery confirmations
4. **Canned Responses**: Quick reply templates for admins
5. **Chat Routing**: Auto-assign chats based on admin availability
6. **Analytics**: Track response times and user satisfaction
7. **Multi-language**: Support for multiple languages
8. **Voice Messages**: Audio message support
9. **Screen Sharing**: For technical support sessions
10. **Chat Bots**: AI-powered initial responses

## Support

For technical support or questions about this implementation:
1. Check the Laravel logs: `storage/logs/laravel.log`
2. Monitor React Native console for errors
3. Test API endpoints using Postman or similar tools
4. Verify database entries for troubleshooting

---

*This support chat feature provides a foundation for real-time customer support. The implementation can be extended with additional features as needed.* 