import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    FlatList,
    Image,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface Notification {
  id: string;
  type: 'booking' | 'message' | 'review' | 'system';
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  avatar?: any;
  action?: string;
}

const PetSitterNotificationsScreen = () => {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'booking',
      title: 'New Booking Request',
      message: 'John D. wants to book you for Max (Golden Retriever) on Saturday',
      time: '2 minutes ago',
      isRead: false,
      avatar: require('../../assets/images/default-avatar.png'),
      action: 'View Request'
    },
    {
      id: '2',
      type: 'message',
      title: 'New Message',
      message: 'Sarah J. sent you a message about her cat Luna',
      time: '15 minutes ago',
      isRead: false,
      avatar: require('../../assets/images/default-avatar.png'),
      action: 'Reply'
    },
    {
      id: '3',
      type: 'review',
      title: 'New Review',
      message: 'You received a 5-star review from Mike C.',
      time: '1 hour ago',
      isRead: true,
      avatar: require('../../assets/images/default-avatar.png'),
      action: 'View Review'
    },
    {
      id: '4',
      type: 'system',
      title: 'Profile Verification',
      message: 'Your profile has been verified successfully!',
      time: '2 hours ago',
      isRead: true,
      action: 'View Profile'
    },
    {
      id: '5',
      type: 'booking',
      title: 'Booking Confirmed',
      message: 'Your booking with Emma D. for Saturday has been confirmed',
      time: '3 hours ago',
      isRead: true,
      avatar: require('../../assets/images/default-avatar.png'),
      action: 'View Details'
    },
    {
      id: '6',
      type: 'system',
      title: 'Payment Received',
      message: 'You received $50.00 for your recent booking',
      time: '1 day ago',
      isRead: true,
      action: 'View Payment'
    }
  ]);

  const handleBack = () => {
    router.back();
  };

  const handleNotificationPress = (notification: Notification) => {
    // Mark as read
    setNotifications(prev => 
      prev.map(n => 
        n.id === notification.id ? { ...n, isRead: true } : n
      )
    );

    // Handle different notification types
    switch (notification.type) {
      case 'booking':
        router.push('/pet-sitter-requests');
        break;
      case 'message':
        router.push('/pet-sitter-messages');
        break;
      case 'review':
        // Navigate to reviews section
        console.log('Navigate to reviews');
        break;
      case 'system':
        if (notification.action === 'View Profile') {
          router.push('/pet-sitter-profile');
        }
        break;
    }
  };

  const handleMarkAllRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, isRead: true }))
    );
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'booking':
        return <Ionicons name="calendar" size={24} color="#F59E0B" />;
      case 'message':
        return <Ionicons name="mail" size={24} color="#4CAF50" />;
      case 'review':
        return <Ionicons name="star" size={24} color="#FFD700" />;
      case 'system':
        return <Ionicons name="notifications" size={24} color="#3B82F6" />;
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

export default PetSitterNotificationsScreen; 