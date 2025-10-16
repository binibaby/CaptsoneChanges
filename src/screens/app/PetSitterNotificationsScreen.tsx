import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { bookingService } from '../../services/bookingService';
import { notificationService } from '../../services/notificationService';
import { RealtimeNotificationData, realtimeNotificationService } from '../../services/realtimeNotificationService';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  time: string;
  isRead: boolean;
  action?: string;
  data?: any;
}

const PetSitterNotificationsScreen: React.FC = () => {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [realtimeConnected, setRealtimeConnected] = useState(false);


  // Load notifications
  const loadNotifications = useCallback(async () => {
    if (!user) return;

    try {
      console.log('🔔 Loading notifications for pet sitter:', user.id);
      setLoading(true);
      
      const fetchedNotifications = await notificationService.forceRefreshFromAPI();
      console.log('📱 Fetched notifications:', fetchedNotifications.length);
      
      setNotifications(fetchedNotifications);
      
      // Update unread count
      const unread = fetchedNotifications.filter(n => !n.isRead).length;
      // Removed unread count setting
      
    } catch (error) {
      console.error('❌ Error loading notifications:', error);
      Alert.alert('Error', 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [user]);


  // Auto-refresh notifications when screen is focused
  useFocusEffect(
    useCallback(() => {
      console.log('🔄 PetSitterNotificationsScreen: Screen focused, loading notifications');
      loadNotifications();
    }, [loadNotifications])
  );



  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      console.log('📖 Marking notification as read:', notificationId);
      await notificationService.markAsRead(notificationId);
      
      // Update local state immediately
      setNotifications(prev => {
        const updated = prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, isRead: true }
            : notif
        );
        return updated;
      });
      
      // Update unread count immediately
      // Removed unread count update
      
      console.log('📖 Notification marked as read, UI updated');
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      
      // Update local state immediately
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, isRead: true }))
      );
      
      // Update unread count immediately
      // Removed unread count reset
      
      Alert.alert('Success', 'All notifications marked as read');
    } catch (error) {
      console.error('❌ Error marking all as read:', error);
      Alert.alert('Error', 'Failed to mark all notifications as read');
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId: string) => {
    try {
      await notificationService.deleteNotification(notificationId);
      await loadNotifications(); // Reload to update UI
    } catch (error) {
      console.error('❌ Error deleting notification:', error);
      Alert.alert('Error', 'Failed to delete notification');
    }
  };

  // Handle notification press (mark as read)
  const handleNotificationPress = async (notification: Notification) => {
    console.log('🔔 Notification clicked:', {
      id: notification.id,
      title: notification.title,
      type: notification.type,
      data: notification.data,
      isRead: notification.isRead
    });
    
    // Mark as read when notification is pressed
    if (!notification.isRead) {
      console.log('📖 Marking notification as read:', notification.id);
      
      // Update local state immediately for instant UI feedback
      setNotifications(prev => 
        prev.map(n => 
          n.id === notification.id ? { ...n, isRead: true } : n
        )
      );
      
      // Mark as read via API in background
      try {
        await markAsRead(notification.id);
        console.log('✅ Notification marked as read successfully');
      } catch (error) {
        console.error('❌ Error marking notification as read:', error);
        // Revert the local state if API call fails
        setNotifications(prev => 
          prev.map(n => 
            n.id === notification.id ? { ...n, isRead: false } : n
          )
        );
      }
    }
  };

  // Handle booking confirm/decline
  const handleBookingAction = async (notification: Notification, action: 'confirm' | 'decline') => {
    try {
      // Get booking ID from notification data, or fallback to notification ID
      const bookingId = notification.data?.booking_id || notification.data?.bookingId || notification.id;
      console.log(`${action} booking:`, bookingId);
      console.log('🔍 Notification data:', notification.data);
      
      // Mark as read FIRST (immediate UI update)
      await markAsRead(notification.id);
      
      // Call the appropriate booking service method
      if (action === 'confirm') {
        await bookingService.confirmBooking(bookingId);
        Alert.alert(
          'Success', 
          'Booking confirmed successfully! The pet owner has been notified.'
        );
      } else {
        await bookingService.cancelBooking(bookingId);
        Alert.alert(
          'Success', 
          'Booking cancelled successfully! The pet owner has been notified.'
        );
      }
      
    } catch (error) {
      console.error(`Error ${action}ing booking:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      Alert.alert('Error', `Failed to ${action} booking: ${errorMessage}`);
    }
  };


  // Initialize real-time notifications
  useEffect(() => {
    if (!user) return;

    const initializeRealtime = async () => {
      try {
        console.log('🔔 Initializing real-time notifications for pet sitter:', user.id);
        const token = user.token || '';
        const connected = await realtimeNotificationService.initialize(user.id, token);
        setRealtimeConnected(connected);
        
        if (connected) {
          console.log('✅ Real-time notifications connected for pet sitter');
        } else {
          console.warn('⚠️ Real-time notifications not available for pet sitter');
        }
      } catch (error) {
        console.error('❌ Error initializing real-time notifications:', error);
        setRealtimeConnected(false);
      }
    };

    initializeRealtime();

    // Set up real-time notification listener
    const unsubscribe = realtimeNotificationService.subscribe((notification: RealtimeNotificationData) => {
      console.log('🔔 Real-time notification received in PetSitterNotificationsScreen:', notification);
      
      // Show immediate feedback to user
      Alert.alert(
        notification.title,
        notification.message,
        [
          { text: 'OK', onPress: () => loadNotifications() }
        ]
      );
    });

    return () => {
      unsubscribe();
    };
  }, [user, loadNotifications]);

  // Load notifications when screen focuses
  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [loadNotifications])
  );

  // Render notification item
  const renderNotification = ({ item }: { item: Notification }) => {
    return (
    <TouchableOpacity 
      style={[
        styles.notificationItem,
        !item.isRead && styles.unreadNotification
      ]}
      onPress={() => {
        console.log('🔔 TouchableOpacity pressed for notification:', item.id);
        handleNotificationPress(item);
      }}
    >
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Text style={styles.notificationTitle}>{item.title}</Text>
          <View style={styles.notificationActions}>
            {!item.isRead && <View style={styles.unreadDot} />}
          </View>
        </View>
        
        <Text style={styles.notificationMessage}>{item.message}</Text>
        
        <View style={styles.notificationFooter}>
          <Text style={styles.notificationTime}>{item.time}</Text>
        </View>
      </View>
    </TouchableOpacity>
    );
  };

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="notifications-outline" size={64} color="#ccc" />
      <Text style={styles.emptyStateTitle}>No Notifications</Text>
      <Text style={styles.emptyStateMessage}>
        You'll receive notifications for booking requests and updates here.
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading notifications...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {realtimeConnected && (
            <View style={styles.realtimeIndicator}>
              <Ionicons name="radio" size={12} color="#4CAF50" />
              <Text style={styles.realtimeText}>Live</Text>
            </View>
          )}
        </View>
        
        {/* Spacer to balance the back button */}
        <View style={styles.headerSpacer} />
      </View>

      {/* Unread count banner */}
      {/* Removed unread count banner for fresh start */}

      {/* Notifications list */}
      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
          </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    marginTop: 50,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    marginTop: 50,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
    width: 40,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  realtimeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 4,
  },
  realtimeText: {
    fontSize: 10,
    color: '#4CAF50',
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  refreshButton: {
    padding: 8,
  },
  markAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#007AFF',
    borderRadius: 6,
  },
  markAllText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  unreadBanner: {
    backgroundColor: '#ff9500',
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  unreadBannerText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  listContainer: {
    flexGrow: 1,
    padding: 16,
  },
  notificationItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 60, // Ensure minimum touchable area
  },
  notificationContent: {
    padding: 16,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  notificationActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff9500',
  },
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  notificationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notificationTime: {
    fontSize: 12,
    color: '#999',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default PetSitterNotificationsScreen; 