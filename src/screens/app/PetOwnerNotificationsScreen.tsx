import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { notificationService } from '../../services/notificationService';

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

const PetOwnerNotificationsScreen: React.FC = () => {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  // Removed unread count for fresh start

  // Load notifications
  const loadNotifications = useCallback(async () => {
    if (!user) return;

    try {
      console.log('🔔 Loading notifications for pet owner:', user.id);
      setLoading(true);
      
      const fetchedNotifications = await notificationService.getNotifications();
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

  // Refresh notifications
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  }, [loadNotifications]);

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      await loadNotifications(); // Reload to update UI
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      await loadNotifications(); // Reload to update UI
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

  // Handle notification action
  const handleNotificationAction = (notification: Notification) => {
    if (notification.action === 'View Booking' || notification.action === 'View' || notification.action === 'View Details') {
      // Handle booking confirmation/update
      if (notification.data?.bookingId) {
        const bookingType = notification.data.bookingType || (notification.data.isWeekly ? 'Weekly' : 'Daily');
        const dateInfo = notification.data.isWeekly 
          ? `${notification.data.startDate} to ${notification.data.endDate}`
          : notification.data.date;
        const timeInfo = notification.data.formattedStartTime && notification.data.formattedEndTime
          ? `${notification.data.formattedStartTime} - ${notification.data.formattedEndTime}`
          : `${notification.data.startTime} - ${notification.data.endTime}`;
        
        Alert.alert(
          `${bookingType} Booking ${notification.data.status?.charAt(0).toUpperCase() + notification.data.status?.slice(1)}`,
          `Sitter: ${notification.data.sitterName}\nDate: ${dateInfo}\nTime: ${timeInfo}\nStatus: ${notification.data.status}`,
          [
            { text: 'OK', onPress: () => console.log('View booking details') }
          ]
        );
      }
    }
    
    // Mark as read when action is taken
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
  };

  // Create test notification
  const createTestNotification = async () => {
    if (!user) {
      Alert.alert('Error', 'No user found');
      return;
    }

    try {
      await notificationService.addNotificationForUser(user.id, {
        type: 'booking',
        title: 'Booking Confirmed',
        message: 'Your booking has been confirmed by the pet sitter.',
        action: 'View Booking',
        data: {
          bookingId: `test-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          status: 'confirmed',
          sitterName: 'Test Sitter',
          test: true
        }
      });

      Alert.alert('Test', 'Test notification created! Check your notifications.');
      await loadNotifications(); // Reload to show new notification
    } catch (error) {
      console.error('❌ Error creating test notification:', error);
      Alert.alert('Error', 'Failed to create test notification');
    }
  };

  // Load notifications when screen focuses
  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [loadNotifications])
  );

  // Render notification item
  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity 
      style={[
        styles.notificationItem,
        !item.isRead && styles.unreadNotification
      ]}
      onPress={() => handleNotificationAction(item)}
    >
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Text style={styles.notificationTitle}>{item.title}</Text>
          <View style={styles.notificationActions}>
            {!item.isRead && <View style={styles.unreadDot} />}
            <TouchableOpacity
              onPress={() => deleteNotification(item.id)}
              style={styles.deleteButton}
            >
              <Ionicons name="trash-outline" size={16} color="#ff4444" />
            </TouchableOpacity>
          </View>
        </View>
        
        <Text style={styles.notificationMessage}>{item.message}</Text>
        
        <View style={styles.notificationFooter}>
          <Text style={styles.notificationTime}>{item.time}</Text>
        {item.action && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleNotificationAction(item)}
            >
              <Text style={styles.actionButtonText}>{item.action}</Text>
          </TouchableOpacity>
        )}
        </View>
      </View>
    </TouchableOpacity>
  );

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="notifications-outline" size={64} color="#ccc" />
      <Text style={styles.emptyStateTitle}>No Notifications</Text>
      <Text style={styles.emptyStateMessage}>
        You'll receive notifications for booking confirmations and updates here.
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
        
        <Text style={styles.headerTitle}>Notifications</Text>
        
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={createTestNotification}
            style={styles.testButton}
          >
            <Ionicons name="flask-outline" size={20} color="#007AFF" />
          </TouchableOpacity>
          
          {/* Removed mark all read button for fresh start */}
          
          <TouchableOpacity
            onPress={() => Alert.alert('Delete All', 'This feature will be implemented')}
            style={styles.deleteAllButton}
          >
            <Ionicons name="trash-outline" size={20} color="#ff4444" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Unread count banner */}
      {/* Removed unread count banner for fresh start */}

      {/* Notifications list */}
      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#007AFF']}
            tintColor="#007AFF"
          />
        }
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
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  testButton: {
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
  deleteAllButton: {
    padding: 8,
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
  },
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
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
  deleteButton: {
    padding: 4,
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
  actionButton: {
    backgroundColor: '#ff9500',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
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

export default PetOwnerNotificationsScreen; 