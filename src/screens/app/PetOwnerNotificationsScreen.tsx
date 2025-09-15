import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    FlatList,
    Image,
    RefreshControl,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Notification, notificationService } from '../../services/notificationService';

const PetOwnerNotificationsScreen = () => {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Load notifications on mount
    loadNotifications();

    // Subscribe to notification updates
    const unsubscribe = notificationService.subscribe((updatedNotifications) => {
      console.log('🔄 Notification subscription update:', updatedNotifications.length);
      setNotifications(updatedNotifications);
    });

    return unsubscribe;
  }, []);

  // Reload notifications when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('🔄 Screen focused, refreshing notifications...');
      refreshNotifications();
    }, [])
  );

  const refreshNotifications = async () => {
    try {
      console.log('🔄 Refreshing notifications from API...');
      const refreshedNotifications = await notificationService.refreshNotifications();
      setNotifications(refreshedNotifications);
      console.log('📋 Refreshed notifications:', refreshedNotifications.length);
    } catch (error) {
      console.error('Error refreshing notifications:', error);
      // Fallback to regular load
      loadNotifications();
    }
  };

  const loadNotifications = async () => {
    console.log('🔔 Loading notifications in notification screen...');
    const loadedNotifications = await notificationService.getNotifications();
    console.log('📋 Loaded notifications:', loadedNotifications.length);
    loadedNotifications.forEach(notification => {
      console.log(`  - ${notification.type}: ${notification.title} (read: ${notification.isRead})`);
    });
    setNotifications(loadedNotifications);
  };

  const handleBack = () => {
    router.back();
  };

  const handleNotificationPress = async (notification: Notification) => {
    // Mark as read first
    await notificationService.markAsRead(notification.id);
    
    // Update local state immediately
    setNotifications(prev => 
      prev.map(n => 
        n.id === notification.id ? { ...n, isRead: true } : n
      )
    );

    // Handle different notification types
    switch (notification.type) {
      case 'booking':
        // For pet owners, booking notifications are confirmations/cancellations
        if (notification.action === 'Message') {
          // Navigate to messages to chat with the sitter
          router.push('/pet-owner-messages');
        } else if (notification.data?.status === 'cancelled' && notification.action === 'Find New Sitter') {
          router.push('/find-sitter-map');
        } else {
          router.push('/pet-owner-jobs');
        }
        break;
      case 'message':
        router.push('/pet-owner-messages');
        break;
      case 'system':
        router.push('/pet-owner-jobs');
        break;
      case 'review':
        // Navigate to reviews section
        console.log('Navigate to reviews');
        break;
      case 'system':
        if (notification.action === 'Get Started') {
          router.push('/find-sitter-map');
        } else if (notification.data?.type === 'payment_processed') {
          router.push('/pet-owner-jobs');
        }
        break;
    }
  };

  const handleMarkAllRead = async () => {
    await notificationService.markAllAsRead();
    
    // Update local state immediately
    setNotifications(prev => 
      prev.map(n => ({ ...n, isRead: true }))
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    console.log('🔄 Refreshing notifications from API...');
    await loadNotifications();
    setRefreshing(false);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'booking':
        return <Ionicons name="calendar" size={24} color="#4CAF50" />;
      case 'message':
        return <Ionicons name="mail" size={24} color="#3B82F6" />;
      case 'reminder':
        return <Ionicons name="alarm" size={24} color="#F59E0B" />;
      case 'review':
        return <Ionicons name="star" size={24} color="#FFD700" />;
      case 'system':
        return <Ionicons name="notifications" size={24} color="#9C27B0" />;
      default:
        return <Ionicons name="notifications" size={24} color="#666" />;
    }
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity 
      style={[styles.notificationItem, !item.isRead && styles.unreadNotification]} 
      onPress={() => handleNotificationPress(item)}
    >
      <View style={styles.notificationIcon}>
        {item.avatar ? (
          <Image source={item.avatar} style={styles.avatar} />
        ) : (
          getNotificationIcon(item.type)
        )}
      </View>
      
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Text style={[styles.notificationTitle, !item.isRead && styles.unreadTitle]}>
            {item.title}
          </Text>
          <Text style={styles.notificationTime}>{item.time}</Text>
        </View>
        
        <Text style={styles.notificationMessage}>{item.message}</Text>
        
        {item.action && (
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionText}>{item.action}</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {!item.isRead && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity style={styles.markAllButton} onPress={handleMarkAllRead}>
          <Text style={styles.markAllText}>Mark all read</Text>
        </TouchableOpacity>
      </View>

      {/* Notification Count */}
      {unreadCount > 0 && (
        <View style={styles.countContainer}>
          <Text style={styles.countText}>{unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}</Text>
        </View>
      )}

      {/* Notifications List */}
      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        style={styles.notificationsList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#3B82F6']}
            tintColor="#3B82F6"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>No notifications</Text>
            <Text style={styles.emptySubtitle}>You're all caught up!</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  markAllButton: {
    padding: 5,
  },
  markAllText: {
    color: '#F59E0B',
    fontSize: 14,
    fontWeight: '600',
  },
  countContainer: {
    backgroundColor: '#F59E0B',
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  countText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  notificationsList: {
    flex: 1,
  },
  notificationItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  unreadNotification: {
    backgroundColor: '#FFFBEB',
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 5,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  unreadTitle: {
    fontWeight: 'bold',
  },
  notificationTime: {
    fontSize: 12,
    color: '#666',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  actionButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  actionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F59E0B',
    marginLeft: 8,
    alignSelf: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 20,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
  },
});

export default PetOwnerNotificationsScreen; 