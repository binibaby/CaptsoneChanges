import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    Image,
    Modal,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { bookingService } from '../../services/bookingService';
import { messagingService } from '../../services/messagingService';
import { Notification, notificationService } from '../../services/notificationService';

const PetSitterNotificationsScreen = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Notification | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);

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
      console.log('🔄 Screen focused, loading notifications...');
      loadNotifications();
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
    console.log('🔔 Current user:', user?.id, user?.email);
    const loadedNotifications = await notificationService.getNotifications();
    console.log('📋 Loaded notifications:', loadedNotifications.length);
    loadedNotifications.forEach(notification => {
      console.log(`  - ${notification.type}: ${notification.title} (read: ${notification.isRead})`);
      if (notification.data?.isWeekly) {
        console.log(`  - WEEKLY NOTIFICATION: ${notification.id} - ${notification.title}`);
        console.log(`  - Weekly data:`, notification.data);
        console.log(`  - Weekly userId:`, notification.userId);
      }
    });
    setNotifications(loadedNotifications);
  };

  const handleBack = () => {
    router.back();
  };

  const handleNotificationPress = async (notification: Notification) => {
    console.log('🔔 Notification pressed:', notification);
    console.log('🔔 Notification data:', notification.data);
    
    // Mark as read first
    await notificationService.markAsRead(notification.id);
    
    // Update local state to reflect the read status immediately
    setNotifications(prev => 
      prev.map(n => 
        n.id === notification.id ? { ...n, isRead: true } : n
      )
    );

    // Handle different notification types
    switch (notification.type) {
      case 'booking':
        // For pet sitters, booking notifications are new requests from owners
        // Always show the specific booking details in a modal
        console.log('🔔 Setting selected booking:', notification);
        setSelectedBooking(notification);
        setShowBookingModal(true);
        break;
      case 'message':
        router.push('/pet-sitter-messages');
        break;
      case 'review':
        // Navigate to reviews section
        console.log('Navigate to reviews');
        break;
      case 'system':
        if (notification.action === 'View Profile' || notification.action === 'Update Profile') {
          router.push('/pet-sitter-profile');
        }
        break;
    }
  };

  const handleBookingResponse = (status: 'confirmed' | 'cancelled') => {
    if (!selectedBooking) return;
    
    // Close modal first
    setShowBookingModal(false);
    
    // Then handle the response
    handleBookingResponseAction(selectedBooking, status);
  };

  const showBookingConfirmationDialog = (notification: Notification) => {
    const bookingData = notification.data;
    if (!bookingData) return;

    Alert.alert(
      'Booking Request',
      `${bookingData.petOwnerName} wants to book you for ${bookingData.date} from ${bookingData.startTime} to ${bookingData.endTime} at $${bookingData.hourlyRate}/hour`,
      [
        {
          text: 'Decline',
          style: 'destructive',
          onPress: () => handleBookingResponseAction(notification, 'cancelled')
        },
        {
          text: 'Accept',
          style: 'default',
          onPress: () => handleBookingResponseAction(notification, 'confirmed')
        }
      ],
      { cancelable: true }
    );
  };

  const handleBookingResponseAction = async (notification: Notification, status: 'confirmed' | 'cancelled') => {
    try {
      const bookingData = notification.data;
      if (!bookingData) return;

      // Update booking status
      await bookingService.updateBookingStatus(bookingData.bookingId, status);

      // Create confirmation message for pet owner
      const statusText = status === 'confirmed' ? 'confirmed' : 'cancelled';
      let messageText: string;
      
      if (bookingData.isWeekly) {
        // Weekly booking message
        messageText = status === 'confirmed' 
          ? `Great news! I've confirmed your weekly booking from ${new Date(bookingData.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} to ${new Date(bookingData.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} from ${bookingData.startTime} to ${bookingData.endTime}. Total: ₱${bookingData.totalAmount}. Looking forward to taking care of your pet!`
          : `I'm sorry, but I won't be able to take care of your pet for the weekly booking from ${new Date(bookingData.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} to ${new Date(bookingData.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}. I hope you can find another sitter.`;
      } else {
        // Regular booking message
        messageText = status === 'confirmed' 
          ? `Great news! I've confirmed your booking for ${bookingData.date} from ${bookingData.startTime} to ${bookingData.endTime}. Looking forward to taking care of your pet!`
          : `I'm sorry, but I won't be able to take care of your pet on ${bookingData.date} from ${bookingData.startTime} to ${bookingData.endTime}. I hope you can find another sitter.`;
      }

      // Create message
      await messagingService.createMessage({
        senderId: user?.id || '', // Current sitter ID from auth context
        receiverId: bookingData.petOwnerId || '', // Pet owner ID from booking data
        message: messageText,
        isBookingRelated: true,
        bookingId: bookingData.bookingId
      });

      // Create notification for pet owner
      if (bookingData.isWeekly) {
        // Weekly booking confirmation notification
        await notificationService.createWeeklyBookingConfirmationNotification({
          sitterId: user?.id || '',
          sitterName: user?.name || 'Pet Sitter',
          petOwnerId: bookingData.petOwnerId || '',
          petOwnerName: bookingData.petOwnerName,
          bookingId: bookingData.bookingId,
          startDate: bookingData.startDate,
          endDate: bookingData.endDate,
          startTime: bookingData.startTime,
          endTime: bookingData.endTime,
          totalAmount: bookingData.totalAmount,
          status: status
        });
      } else {
        // Regular booking confirmation notification
        await notificationService.createBookingConfirmationNotification({
          sitterId: user?.id || '', // Current sitter ID from auth context
          sitterName: user?.name || 'Pet Sitter', // Current sitter name from auth context
          petOwnerId: bookingData.petOwnerId || '',
          petOwnerName: bookingData.petOwnerName,
          bookingId: bookingData.bookingId,
          date: bookingData.date,
          startTime: bookingData.startTime,
          endTime: bookingData.endTime,
          status: status
        });
      }

      // Remove the notification from the list since it's been handled
      // For cancelled bookings, remove immediately. For confirmed, keep for reference
      if (status === 'cancelled') {
        setNotifications(prev => 
          prev.filter(n => n.id !== notification.id)
        );
        // Also remove from storage
        await notificationService.deleteNotification(notification.id);
      } else {
        // For confirmed bookings, just remove from current view but keep in storage
        setNotifications(prev => 
          prev.filter(n => n.id !== notification.id)
        );
      }

      // Show success message
      Alert.alert(
        'Success',
        `Booking ${statusText} successfully! The pet owner has been notified.`,
        [{ text: 'OK' }]
      );

    } catch (error) {
      console.error('Error handling booking response:', error);
      Alert.alert(
        'Error',
        'Failed to process booking response. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleMarkAllRead = async () => {
    await notificationService.markAllAsRead();
    
    // Update local state to reflect all notifications as read
    setNotifications(prev => 
      prev.map(n => ({ ...n, isRead: true }))
    );
  };

  const handleClearAll = async () => {
    Alert.alert(
      'Clear All Notifications',
      'Are you sure you want to clear all notifications? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear All', 
          style: 'destructive',
          onPress: async () => {
            await notificationService.clearAllNotifications();
            setNotifications([]);
          }
        }
      ]
    );
  };

  const handleTestNotification = async () => {
    if (!user) {
      Alert.alert('Error', 'No user found');
      return;
    }

    console.log('🧪 Creating test notification for user:', user.id, user.role);

    // Create a test notification for the current user
    await notificationService.addNotificationForUser(user.id, {
      type: 'booking',
      title: 'Test Booking Request',
      message: 'This is a test notification to verify the system is working.',
      action: 'View Request',
      data: {
        sitterId: user.id,
        sitterName: user.name || 'Test Sitter',
        petOwnerId: 'test-owner',
        petOwnerName: 'Test Owner',
        bookingId: 'test-booking-123',
        date: new Date().toISOString().split('T')[0],
        startTime: '10:00 AM',
        endTime: '2:00 PM',
        hourlyRate: 25,
        test: true
      }
    });

    // Reload notifications to see the new one
    await loadNotifications();

    Alert.alert('Test', 'Test notification created! Check your notifications.');
  };

  // Format time from 24-hour to 12-hour AM/PM format
  const formatTime = (timeString: string): string => {
    if (!timeString) return '8:00 AM';
    
    // Handle different time formats
    let time = timeString;
    if (timeString.includes(':')) {
      const [hours, minutes] = timeString.split(':');
      const hour24 = parseInt(hours);
      const mins = minutes || '00';
      
      if (hour24 === 0) {
        return `12:${mins} AM`;
      } else if (hour24 < 12) {
        return `${hour24}:${mins} AM`;
      } else if (hour24 === 12) {
        return `12:${mins} PM`;
      } else {
        return `${hour24 - 12}:${mins} PM`;
      }
    }
    
    return timeString;
  };

  // Calculate total cost based on time duration and hourly rate
  const calculateTotalCost = (startTime: string, endTime: string, hourlyRate: number): string => {
    if (!startTime || !endTime || !hourlyRate) return '225';
    
    try {
      const start = new Date(`2000-01-01 ${startTime}`);
      const end = new Date(`2000-01-01 ${endTime}`);
      
      // Handle case where end time is next day
      if (end <= start) {
        end.setDate(end.getDate() + 1);
      }
      
      const diffMs = end.getTime() - start.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      const totalCost = Math.ceil(diffHours * hourlyRate);
      
      return totalCost.toLocaleString();
    } catch (error) {
      return '225'; // Default fallback
    }
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
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.testButton} onPress={handleTestNotification}>
            <Ionicons name="flask" size={20} color="#10B981" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.markAllButton} onPress={handleMarkAllRead}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.clearButton} onPress={handleClearAll}>
            <Ionicons name="trash" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
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

      {/* Booking Details Modal */}
      <Modal
        visible={showBookingModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowBookingModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Booking Request</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowBookingModal(false)}
            >
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.modalScrollView}
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={true}
          >
            {selectedBooking && (
              <View style={styles.bookingDetails}>
                {console.log('🔔 Rendering booking modal with selectedBooking:', selectedBooking)}
                {console.log('🔔 Selected booking data:', selectedBooking.data)}
              
              {/* Header with booking icon */}
              <View style={styles.bookingHeader}>
                <View style={styles.bookingIconContainer}>
                  <Ionicons name="calendar" size={32} color="#F59E0B" />
                </View>
                <Text style={styles.bookingTitle}>New Booking Request</Text>
                <Text style={styles.bookingSubtitle}>Review the details below</Text>
                <View style={styles.statusBadge}>
                  <Ionicons name="time" size={16} color="#F59E0B" />
                  <Text style={styles.statusText}>Pending Response</Text>
                </View>
                <View style={styles.urgencyIndicator}>
                  <Ionicons name="flash" size={14} color="#EF4444" />
                  <Text style={styles.urgencyText}>Response needed within 24 hours</Text>
                </View>
              </View>

              {/* Booking Information Card */}
              <View style={styles.bookingCard}>
                <View style={styles.bookingInfoRow}>
                  <View style={styles.infoIconContainer}>
                    <Ionicons name="person" size={20} color="#6B7280" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Pet Owner</Text>
                    <Text style={styles.infoValue}>
                      {(() => {
                        console.log('🔔 Pet Owner data:', selectedBooking.data?.petOwnerName);
                        return selectedBooking.data?.petOwnerName || 'Unknown Owner';
                      })()}
                    </Text>
                  </View>
                </View>

                <View style={styles.bookingInfoRow}>
                  <View style={styles.infoIconContainer}>
                    <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Date</Text>
                    <Text style={styles.infoValue}>
                      {(() => {
                        console.log('🔔 Date data:', selectedBooking.data?.date);
                        console.log('🔔 Start/End date data:', selectedBooking.data?.startDate, selectedBooking.data?.endDate);
                        console.log('🔔 Is weekly:', selectedBooking.data?.isWeekly);
                        return selectedBooking.data?.isWeekly 
                          ? `${selectedBooking.data.startDate} - ${selectedBooking.data.endDate}`
                          : selectedBooking.data?.date || 'Not specified';
                      })()}
                    </Text>
                  </View>
                </View>

                <View style={styles.bookingInfoRow}>
                  <View style={styles.infoIconContainer}>
                    <Ionicons name="time" size={20} color="#6B7280" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Time</Text>
                    <Text style={styles.infoValue}>
                      {selectedBooking.data?.startTime && selectedBooking.data?.endTime 
                        ? `${formatTime(selectedBooking.data.startTime)} - ${formatTime(selectedBooking.data.endTime)}`
                        : 'Not specified'
                      }
                    </Text>
                  </View>
                </View>

                <View style={styles.bookingInfoRow}>
                  <View style={styles.infoIconContainer}>
                    <Ionicons name="cash" size={20} color="#6B7280" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Rate</Text>
                    <Text style={styles.infoValue}>
                      {selectedBooking.data?.hourlyRate 
                        ? `₱${selectedBooking.data.hourlyRate}/hour`
                        : 'Not specified'
                      }
                    </Text>
                  </View>
                </View>

              </View>

              {/* Message Card */}
              <View style={styles.messageCard}>
                <View style={styles.messageHeader}>
                  <View style={styles.messageIconContainer}>
                    <Ionicons name="chatbubble" size={20} color="#3B82F6" />
                  </View>
                  <Text style={styles.messageTitle}>Message from Pet Owner</Text>
                </View>
                <View style={styles.messageContent}>
                  <Text style={styles.messageText}>{selectedBooking.message}</Text>
                </View>
              </View>

            </View>
            )}
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity 
              style={[styles.modalActionButton, styles.declineButton]}
              onPress={() => handleBookingResponse('cancelled')}
            >
              <View style={styles.buttonContent}>
                <Ionicons name="close-circle" size={24} color="#fff" />
                <Text style={styles.actionButtonText}>Decline</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.modalActionButton, styles.acceptButton]}
              onPress={() => handleBookingResponse('confirmed')}
            >
              <View style={styles.buttonContent}>
                <Ionicons name="checkmark-circle" size={24} color="#fff" />
                <Text style={styles.actionButtonText}>Accept</Text>
              </View>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  testButton: {
    padding: 5,
  },
  markAllButton: {
    padding: 5,
  },
  markAllText: {
    color: '#F59E0B',
    fontSize: 14,
    fontWeight: '600',
  },
  clearButton: {
    padding: 6,
    backgroundColor: '#FEF2F2',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FECACA',
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
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  modalScrollView: {
    flex: 1,
  },
  modalScrollContent: {
    paddingBottom: 20,
  },
  bookingDetails: {
    padding: 20,
  },
  bookingHeader: {
    alignItems: 'center',
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  bookingIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  bookingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 5,
  },
  bookingSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 15,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F59E0B',
    marginLeft: 6,
  },
  urgencyIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginTop: 8,
  },
  urgencyText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#EF4444',
    marginLeft: 4,
  },
  bookingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  bookingInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  infoIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 15,
  },
  totalCostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0FDF4',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  totalCostContainer: {
    flex: 1,
  },
  totalCostLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
    marginBottom: 4,
  },
  totalCostValue: {
    fontSize: 20,
    color: '#047857',
    fontWeight: 'bold',
  },
  totalCostIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  messageIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EBF4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  messageTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  messageContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 15,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  messageText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 22,
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 15,
  },
  modalActionButton: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  declineButton: {
    backgroundColor: '#EF4444',
  },
  acceptButton: {
    backgroundColor: '#10B981',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default PetSitterNotificationsScreen; 