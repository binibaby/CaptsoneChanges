# Real-Time ID Verification - Usage Examples

This document provides practical examples of how to use the real-time ID verification system.

## 📱 React Native Usage

### 1. Basic Verification Screen

```typescript
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import verificationService from '../services/verificationService';
import echoService from '../services/echoService';

const VerificationScreen = () => {
  const { user } = useAuth();
  const [verification, setVerification] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    setupRealTimeConnection();
    loadVerificationStatus();
    
    return () => {
      if (user?.id) {
        echoService.stopListeningToVerificationUpdates(user.id);
      }
      echoService.disconnect();
    };
  }, []);

  const setupRealTimeConnection = async () => {
    try {
      const connected = await echoService.connect();
      setIsConnected(connected);
      
      if (connected && user?.id) {
        echoService.listenToVerificationUpdates(user.id, (data) => {
          console.log('Real-time update received:', data);
          setVerification(data.verification);
          
          if (data.status === 'approved') {
            Alert.alert('🎉 Approved!', 'Your verification has been approved!');
          } else if (data.status === 'rejected') {
            Alert.alert('❌ Rejected', data.message || 'Your verification was rejected.');
          }
        });
      }
    } catch (error) {
      console.error('Connection failed:', error);
    }
  };

  const loadVerificationStatus = async () => {
    try {
      const response = await verificationService.getVerificationStatusFromAPI();
      setVerification(response.verification);
    } catch (error) {
      console.error('Failed to load verification:', error);
    }
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text>Connection Status: {isConnected ? '✅ Connected' : '❌ Disconnected'}</Text>
      <Text>Verification Status: {verification?.status || 'Not submitted'}</Text>
    </View>
  );
};
```

### 2. Submit Enhanced Verification

```typescript
const submitVerification = async () => {
  try {
    const verificationData = {
      front_id_image: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...', // Base64 image
      back_id_image: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...', // Base64 image
      selfie_image: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...', // Base64 image
      location: {
        latitude: 14.5995,
        longitude: 120.9842,
        address: 'Manila, Philippines',
        accuracy: 10
      },
      document_type: 'ph_national_id'
    };

    const response = await verificationService.submitEnhancedVerification(verificationData);
    
    if (response.success) {
      Alert.alert('Success!', 'Verification submitted successfully!');
    }
  } catch (error) {
    Alert.alert('Error', 'Failed to submit verification');
  }
};
```

### 3. Pull-to-Refresh Implementation

```typescript
import PullToRefreshWrapper from '../components/PullToRefreshWrapper';

const ProfileScreen = () => {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadVerificationStatus();
    setRefreshing(false);
  }, []);

  return (
    <PullToRefreshWrapper onRefresh={onRefresh} refreshing={refreshing}>
      {/* Your content here */}
    </PullToRefreshWrapper>
  );
};
```

## 🔧 Laravel Backend Usage

### 1. Admin Approval/Rejection

```php
// In Admin\VerificationController

public function approve(Request $request, $id)
{
    $verification = Verification::find($id);
    
    // Update verification status
    $verification->update([
        'status' => 'approved',
        'verification_status' => 'approved',
        'admin_decision' => 'approved',
        'verified_at' => now(),
        'verified_by' => auth()->id(),
    ]);

    // Broadcast real-time update
    broadcast(new IdVerificationStatusUpdated(
        $verification,
        $verification->user,
        'approved',
        '🎉 Congratulations! Your ID verification has been approved!'
    ));

    return response()->json([
        'success' => true,
        'message' => 'Verification approved successfully'
    ]);
}
```

### 2. Custom Verification Event

```php
// Create a custom event
use App\Events\IdVerificationStatusUpdated;

// Dispatch the event
broadcast(new IdVerificationStatusUpdated(
    $verification,
    $user,
    'approved', // or 'rejected', 'pending'
    'Custom message for the user'
));
```

### 3. API Endpoint for Verification Status

```php
// In API\VerificationController

public function getVerificationStatus(Request $request)
{
    $user = $request->user();
    
    $verification = Verification::where('user_id', $user->id)
        ->orderBy('created_at', 'desc')
        ->first();

    return response()->json([
        'success' => true,
        'verification' => $verification,
        'badges' => $verification?->badges_earned ?? []
    ]);
}
```

## 🎨 UI Components

### 1. Connection Status Indicator

```typescript
const ConnectionIndicator = ({ isConnected, lastUpdate }) => (
  <View style={styles.connectionIndicator}>
    <View style={[styles.dot, { backgroundColor: isConnected ? '#10B981' : '#EF4444' }]} />
    <Text>{isConnected ? 'Connected' : 'Disconnected'}</Text>
    {lastUpdate && <Text>Last update: {lastUpdate.toLocaleTimeString()}</Text>}
  </View>
);
```

### 2. Verification Status Badge

```typescript
const VerificationBadge = ({ status }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return '#10B981';
      case 'rejected': return '#EF4444';
      case 'pending': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  return (
    <View style={[styles.badge, { backgroundColor: getStatusColor(status) }]}>
      <Text style={styles.badgeText}>
        {status === 'approved' ? '✅ Verified' : 
         status === 'rejected' ? '❌ Rejected' : 
         status === 'pending' ? '⏳ Pending' : '❓ Not Submitted'}
      </Text>
    </View>
  );
};
```

## 🔄 Real-Time Event Handling

### 1. Listen for Verification Updates

```typescript
// Setup real-time listener
const setupVerificationListener = (userId) => {
  const channel = echoService.listenToVerificationUpdates(userId, (data) => {
    console.log('Verification update received:', data);
    
    // Update UI based on status
    switch (data.status) {
      case 'approved':
        showSuccessMessage('Verification approved!');
        updateVerificationStatus('approved');
        break;
      case 'rejected':
        showErrorMessage(data.message || 'Verification rejected');
        updateVerificationStatus('rejected');
        break;
      case 'pending':
        updateVerificationStatus('pending');
        break;
    }
  });
  
  return channel;
};
```

### 2. Handle Connection Errors

```typescript
const handleConnectionError = (error) => {
  console.error('Real-time connection error:', error);
  
  // Show user-friendly message
  Alert.alert(
    'Connection Error',
    'Unable to connect to real-time updates. Please check your internet connection.',
    [
      { text: 'Retry', onPress: () => setupRealTimeConnection() },
      { text: 'Continue Offline', onPress: () => {} }
    ]
  );
};
```

## 🧪 Testing

### 1. Test Real-Time Connection

```typescript
const testRealTimeConnection = async () => {
  try {
    const connected = await echoService.connect();
    console.log('Connection status:', connected);
    
    if (connected) {
      console.log('✅ Real-time connection successful');
    } else {
      console.log('❌ Real-time connection failed');
    }
  } catch (error) {
    console.error('Connection test failed:', error);
  }
};
```

### 2. Test Verification Submission

```typescript
const testVerificationSubmission = async () => {
  try {
    const testData = {
      front_id_image: 'test_front_base64',
      back_id_image: 'test_back_base64',
      selfie_image: 'test_selfie_base64',
      location: {
        latitude: 14.5995,
        longitude: 120.9842,
        address: 'Test Location',
        accuracy: 10
      },
      document_type: 'ph_national_id'
    };

    const response = await verificationService.submitEnhancedVerification(testData);
    console.log('Submission result:', response);
  } catch (error) {
    console.error('Submission test failed:', error);
  }
};
```

## 📊 Monitoring and Debugging

### 1. Debug Real-Time Events

```typescript
// Add debug logging to Echo service
const debugEchoService = {
  listenToVerificationUpdates: (userId, callback) => {
    console.log(`🔍 Setting up listener for user ${userId}`);
    
    const channel = echoService.listenToVerificationUpdates(userId, (data) => {
      console.log('📡 Real-time event received:', {
        userId,
        timestamp: new Date().toISOString(),
        data
      });
      callback(data);
    });
    
    return channel;
  }
};
```

### 2. Monitor Connection Status

```typescript
const monitorConnection = () => {
  setInterval(() => {
    const isConnected = echoService.getConnectionStatus();
    console.log('Connection status:', isConnected ? 'Connected' : 'Disconnected');
  }, 5000);
};
```

## 🚀 Production Considerations

### 1. Error Handling

```typescript
const robustVerificationService = {
  submitVerification: async (data) => {
    try {
      return await verificationService.submitEnhancedVerification(data);
    } catch (error) {
      console.error('Verification submission failed:', error);
      
      // Retry logic
      if (error.retryable) {
        return await retrySubmission(data);
      }
      
      throw error;
    }
  }
};
```

### 2. Offline Support

```typescript
const offlineVerificationService = {
  submitVerification: async (data) => {
    if (navigator.onLine) {
      return await verificationService.submitEnhancedVerification(data);
    } else {
      // Store for later submission
      await storeOfflineVerification(data);
      return { success: false, message: 'Stored for offline submission' };
    }
  }
};
```

This comprehensive example shows how to implement and use the real-time ID verification system in both React Native and Laravel.
