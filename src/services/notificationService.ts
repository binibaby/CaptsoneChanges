import AsyncStorage from '@react-native-async-storage/async-storage';
import { makeApiCall } from './networkService';

export interface Notification {
  id: string;
  type: 'booking' | 'message' | 'review' | 'system';
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  avatar?: any;
  action?: string;
  data?: any; // Additional data for the notification
  userId?: string; // Optional userId to target specific user
}

class NotificationService {
  private static instance: NotificationService;
  private listeners: ((notifications: Notification[]) => void)[] = [];

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Subscribe to notification updates
  subscribe(listener: (notifications: Notification[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Notify all listeners
  private notifyListeners(notifications: Notification[]) {
    this.listeners.forEach(listener => listener(notifications));
  }

  // Get all notifications
  async getNotifications(): Promise<Notification[]> {
    try {
      console.log('🔔 Getting notifications...');
      
      // First try to get from API
      const apiNotifications = await this.fetchNotificationsFromAPI();
      console.log('📱 API notifications fetched:', apiNotifications.length);
        
      // Get local notifications
        const stored = await AsyncStorage.getItem('notifications');
        const localNotifications = stored ? JSON.parse(stored) : [];
      console.log('📱 Local notifications:', localNotifications.length);
      
      // Merge API and local notifications, preserving read status from local storage
      const allNotifications = [...apiNotifications];
      
      // Update API notifications with read status from local storage
      allNotifications.forEach(apiNotif => {
        const localNotif = localNotifications.find(local => local.id === apiNotif.id);
        if (localNotif && localNotif.isRead) {
          console.log(`📱 Preserving read status for notification ${apiNotif.id}`);
          apiNotif.isRead = true;
        }
      });
      
      // Add local notifications that don't exist in API
      localNotifications.forEach(localNotif => {
        const existsInAPI = apiNotifications.some(apiNotif => apiNotif.id === localNotif.id);
        if (!existsInAPI) {
          console.log(`📱 Adding local notification ${localNotif.id} (not in API)`);
          allNotifications.push(localNotif);
        }
      });
        
        console.log('📱 Total notifications after merge:', allNotifications.length);
      
      // Save merged notifications to local storage
        await this.saveNotifications(allNotifications);
      
      // Filter and return notifications for current user
      const filtered = await this.filterNotificationsByUserType(allNotifications);
      console.log('📱 Filtered notifications for user:', filtered.length);
      
      return filtered;
    } catch (error) {
      console.error('❌ Error getting notifications:', error);
      // Fallback to local storage
      const stored = await AsyncStorage.getItem('notifications');
      const localNotifications = stored ? JSON.parse(stored) : [];
      return this.filterNotificationsByUserType(localNotifications);
    }
  }

  // Fetch notifications from API
  private async fetchNotificationsFromAPI(): Promise<Notification[]> {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        console.log('❌ No user found for API call');
        return [];
      }

      // Get auth token
      let token = user.token;
      console.log('🔍 User details for notifications:', {
        id: user.id,
        role: user.userRole,
        hasToken: !!token
      });
      
      if (!token) {
        // Fallback to hardcoded tokens for testing
        if (user.id === '5') {
          token = '64|dTO5Gio05Om1Buxtkta02gVpvQnetCTMrofsLjeudda0034b';
        } else if (user.id === '21') {
          token = '67|uCtobaBZatzbzDOeK8k1DytVHby0lpa07ERJJczu3cdfa507';
        } else if (user.id === '112') {
          token = '467|hyK770TmWQmZL6ihSgR4X8WOhGfVLRGCPogYrSLL5fd4ebb5';
        } else if (user.id === '113') {
          token = '471|GuG3QSUmuW9rvB7nuBgsM3R8nuBgMzivYRr2H0Lr3d105e12';
        } else if (user.id === '120') {
          token = '7bc9a143a60b74b47e37f717ecf37f8d08d72f89809bc5718431a8dd65cab9ff';
        } else if (user.id === '121') {
          token = '616|Mh2WHZIp1aFUXtMKiilSU84KTP3Snege7zRjE2bM00a52108';
        } else if (user.id === '126') {
          token = '688|fg2lyoMmhIR8BGBwHgVp9MuohtviVQJ911IUJBrb4be87cba';
        } else {
          console.log('❌ No token available for user:', user.id);
          return [];
        }
      }

      console.log('🔑 Fetching notifications from API for user:', user.id);

      const response = await makeApiCall('/api/notifications/', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('📱 API notifications response:', data);
        
        if (data.success && data.notifications && Array.isArray(data.notifications)) {
          // Convert API format to local format
          const notifications: Notification[] = data.notifications.map((apiNotif: any) => ({
            id: apiNotif.id.toString(),
            type: apiNotif.type || 'system',
            title: apiNotif.title || 'Notification',
            message: apiNotif.message || '',
            time: this.formatTimeTo24Hour(apiNotif.created_at),
            isRead: !!apiNotif.read_at,
            action: apiNotif.action || 'View Request', // Add action field
            data: apiNotif.data || null,
            userId: user.id, // Add userId field for proper filtering
          }));
          
          console.log('✅ Converted API notifications:', notifications.length);
          console.log('📋 Notification details:', notifications.map(n => ({ id: n.id, type: n.type, title: n.title, isRead: n.isRead })));
          return notifications;
        } else {
          console.log('⚠️ API response missing notifications array:', {
            success: data.success,
            hasNotifications: !!data.notifications,
            notificationsType: typeof data.notifications,
            notificationsIsArray: Array.isArray(data.notifications),
            fullResponse: data
          });
          
          // If notifications exists but is not an array, return empty array
          if (data.notifications && !Array.isArray(data.notifications)) {
            console.log('⚠️ notifications is not an array, returning empty array');
            return [];
          }
        }
      } else {
        console.log('⚠️ API call failed:', response.status, response.statusText);
        const errorData = await response.json().catch(() => ({}));
        console.log('⚠️ Error response data:', errorData);
      }
    } catch (error) {
      console.error('Error fetching notifications from API:', error);
    }
    
    return [];
  }

  // Get current user (import from auth service)
  private async getCurrentUser() {
    const { default: authService } = await import('./authService');
    return await authService.getCurrentUser();
  }

  // Filter notifications based on user type
  private async filterNotificationsByUserType(notifications: Notification[]): Promise<Notification[]> {
    try {
    const user = await this.getCurrentUser();
    if (!user) {
        console.log('🔍 No user found, returning all notifications');
        return notifications;
      }

      const isPetSitter = user.role === 'pet_sitter';
      console.log('🔍 Filtering notifications for user:', user.id, 'isPetSitter:', isPetSitter);
      console.log('🔍 Total notifications to filter:', notifications.length);
      
      const filtered = notifications.filter(notification => {
        // If notification has userId, only show to that specific user
        if (notification.userId) {
          const matches = String(notification.userId) === String(user.id);
          console.log(`🔍 Notification ${notification.id} has userId ${notification.userId}, matches current user ${user.id}: ${matches}`);
          return matches;
        }
        
        // Otherwise, use the old filtering logic
        if (isPetSitter) {
          // Pet sitters see: booking requests, messages, reviews, system notifications, profile updates, ID verification
          const matches = notification.type === 'booking' || 
                 notification.type === 'message' || 
                 notification.type === 'review' || 
                 notification.type === 'system' ||
                 notification.type === 'profile_update_approved' || 
                 notification.type === 'profile_update_rejected' ||
                 notification.type === 'id_verification_approved' || 
                 notification.type === 'id_verification_rejected';
          console.log(`🔍 Pet sitter notification ${notification.id} (${notification.type}): ${matches}`);
          return matches;
        } else {
          // Pet owners see: booking confirmations/cancellations, messages, system notifications, profile updates
          const isBookingWithStatus = notification.type === 'booking' && 
                 (notification.data?.status === 'confirmed' || 
                  notification.data?.status === 'cancelled' ||
                  notification.title?.includes('confirmed') ||
                  notification.title?.includes('cancelled'));
          const isMessageOrSystem = notification.type === 'message' || notification.type === 'system';
          const isProfileUpdate = notification.type === 'profile_update_approved' || notification.type === 'profile_update_rejected';
          const matches = isBookingWithStatus || isMessageOrSystem || isProfileUpdate;
          console.log(`🔍 Pet owner notification ${notification.id} (${notification.type}): ${matches}`);
          return matches;
        }
      });
      
      console.log('🔍 Filtered notifications result:', filtered.length);
      console.log('🔍 Filtered notifications:');
      filtered.forEach((notif, index) => {
        console.log(`  ${index}: ID=${notif.id}, type=${notif.type}, userId=${notif.userId}, title=${notif.title}`);
      });
      
      return filtered;
    } catch (error) {
      console.error('❌ Error filtering notifications:', error);
      return notifications;
    }
  }

  // Save notifications to local storage
  private async saveNotifications(notifications: Notification[]) {
    try {
      await AsyncStorage.setItem('notifications', JSON.stringify(notifications));
      console.log('💾 Saved notifications to storage:', notifications.length);
    } catch (error) {
      console.error('❌ Error saving notifications:', error);
    }
  }

  // Format time to 24-hour format
  private formatTimeTo24Hour(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false // Use 24-hour format
      });
    } catch (error) {
      console.error('❌ Error formatting time:', error);
      return dateString; // Return original if formatting fails
    }
  }

  // Add notification for specific user
  async addNotificationForUser(userId: string, notificationData: Omit<Notification, 'id' | 'time' | 'isRead'>) {
    try {
      console.log('🔔 Adding notification for user:', userId, notificationData.title);
    
    const newNotification: Notification = {
        ...notificationData,
      id: Date.now().toString(),
      time: this.formatTimeTo24Hour(new Date().toISOString()),
      isRead: false,
        userId: userId,
      };

      console.log('🔔 New notification created:', newNotification);

      // Get existing notifications
    const stored = await AsyncStorage.getItem('notifications');
      const notifications = stored ? JSON.parse(stored) : [];
      
      // Add new notification
      notifications.push(newNotification);
      
      // Save to storage
      await this.saveNotifications(notifications);
      
      // Notify listeners
      this.notifyListeners(notifications);
      
      console.log('📋 Total notifications after adding for user:', notifications.length);
    return newNotification;
    } catch (error) {
      console.error('❌ Error adding notification for user:', error);
    }
  }

  // Create booking notification
  async createBookingNotification(bookingData: any) {
    try {
      console.log('🔔 Creating booking notification for sitter:', bookingData.sitterId);
      console.log('🔔 Booking data received:', {
        date: bookingData.date,
        startTime: bookingData.startTime,
        endTime: bookingData.endTime,
        petOwnerName: bookingData.petOwnerName
      });
      
      // Import time utilities
      const { formatTime24To12, formatDate } = await import('../utils/timeUtils');

      const formattedStartTime = formatTime24To12(bookingData.startTime);
      const formattedEndTime = formatTime24To12(bookingData.endTime);
      const bookingType = bookingData.isWeekly ? 'Weekly' : 'Daily';
      const formattedDate = formatDate(bookingData.date);
      
      const notificationData = {
        type: 'booking' as const,
        title: `New ${bookingType} Booking Request`,
        message: `You have a new booking from ${bookingData.petOwnerName}. Please check your schedule for details.`,
        action: 'View Request',
        data: {
          bookingId: bookingData.bookingId,
          petOwnerId: bookingData.petOwnerId,
          petOwnerName: bookingData.petOwnerName,
          sitterId: bookingData.sitterId,
          sitterName: bookingData.sitterName,
          date: bookingData.date,
          startTime: bookingData.startTime,
          endTime: bookingData.endTime,
          formattedStartTime,
          formattedEndTime,
          hourlyRate: bookingData.hourlyRate,
          isWeekly: bookingData.isWeekly || false,
          bookingType,
          status: 'pending'
        }
      };

      console.log('🔔 Notification data:', notificationData.data);
      console.log('🔔 Is weekly booking:', notificationData.data.isWeekly);

      return await this.addNotificationForUser(bookingData.sitterId, notificationData);
    } catch (error) {
      console.error('❌ Error creating booking notification:', error);
    }
  }

  // Create weekly booking notification
  async createWeeklyBookingNotification(bookingData: any) {
    try {
      console.log('🔔 Creating weekly booking notification for sitter:', bookingData.sitterId);
      
      // Format time properly
      const formatTime = (time: string) => {
        if (!time) return 'Invalid Time';
        try {
          const [hours, minutes] = time.split(':');
          const hour = parseInt(hours, 10);
          const minute = parseInt(minutes, 10);
          return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        } catch (error) {
          return time;
        }
      };

      const formattedStartTime = formatTime(bookingData.startTime);
      const formattedEndTime = formatTime(bookingData.endTime);
      
      // Format dates properly
      const formatDate = (dateString: string) => {
        if (!dateString) return 'Invalid Date';
        try {
          const date = new Date(dateString);
          const options: Intl.DateTimeFormatOptions = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          };
          return date.toLocaleDateString('en-US', options);
        } catch (error) {
          return dateString;
        }
      };

      const formattedStartDate = formatDate(bookingData.startDate);
      const formattedEndDate = formatDate(bookingData.endDate);
      
      const notificationData = {
        type: 'booking' as const,
        title: 'New Weekly Booking Request',
        message: `You have a new booking from ${bookingData.petOwnerName}. Please check your schedule for details.`,
        action: 'View Request',
        data: {
          bookingId: bookingData.bookingId,
          petOwnerId: bookingData.petOwnerId,
          petOwnerName: bookingData.petOwnerName,
          sitterId: bookingData.sitterId,
          sitterName: bookingData.sitterName,
          startDate: bookingData.startDate,
          endDate: bookingData.endDate,
          startTime: bookingData.startTime,
          endTime: bookingData.endTime,
          formattedStartTime,
          formattedEndTime,
          hourlyRate: bookingData.hourlyRate,
          totalAmount: bookingData.totalAmount,
          isWeekly: true,
          bookingType: 'Weekly',
          status: 'pending'
        }
      };

      console.log('🔔 Weekly notification data:', notificationData.data);

      return await this.addNotificationForUser(bookingData.sitterId, notificationData);
    } catch (error) {
      console.error('❌ Error creating weekly booking notification:', error);
    }
  }

  // Mark notification as read
  async markAsRead(notificationId: string) {
    try {
      console.log('📖 Marking notification as read:', notificationId);
      
      // Update local storage first (immediate UI update)
      const stored = await AsyncStorage.getItem('notifications');
      const notifications = stored ? JSON.parse(stored) : [];
      
      const notification = notifications.find((n: Notification) => n.id === notificationId);
      if (notification) {
        notification.isRead = true;
        await this.saveNotifications(notifications);
        this.notifyListeners(notifications);
        console.log('📖 Notification marked as read locally');
      }
      
      // Try to mark as read via API (in background)
      this.markAsReadViaAPI(notificationId).catch(error => {
        console.log('⚠️ API call failed, but local update succeeded:', error);
      });
      
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
    }
  }

  // Mark notification as read via API
  private async markAsReadViaAPI(notificationId: string) {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        console.log('❌ No user found for API call');
        return;
      }

      // Get auth token
      let token = user.token;
      if (!token) {
        // Fallback to hardcoded tokens for testing
        if (user.id === '5') {
          token = '64|dTO5Gio05Om1Buxtkta02gVpvQnetCTMrofsLjeudda0034b';
        } else if (user.id === '21') {
          token = '67|uCtobaBZatzbzDOeK8k1DytVHby0lpa07ERJJczu3cdfa507';
        } else if (user.id === '74') {
          token = '287|HOTtxWRw3lHKLL7j2e6GQbvORaLsbq2W5lS0vWJcfdab31c9';
        } else {
          console.log('❌ No token available for user:', user.id);
          return;
        }
      }

      console.log('🔑 Marking notification as read via API for user:', user.id);

      const response = await makeApiCall(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        console.log('✅ Notification marked as read via API');
      } else {
        console.log('⚠️ API call failed:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error marking notification as read via API:', error);
    }
  }

  // Mark all notifications as read
  async markAllAsRead() {
    try {
      console.log('📖 Marking all notifications as read');
      
      // Update local storage first (immediate UI update)
      const stored = await AsyncStorage.getItem('notifications');
      const notifications = stored ? JSON.parse(stored) : [];
      
      notifications.forEach((notification: Notification) => {
        notification.isRead = true;
      });
      
      await this.saveNotifications(notifications);
      this.notifyListeners(notifications);
      console.log('📖 All notifications marked as read locally');
      
      // Try to mark all as read via API (in background)
      this.markAllAsReadViaAPI().catch(error => {
        console.log('⚠️ API call failed, but local update succeeded:', error);
      });
      
    } catch (error) {
      console.error('❌ Error marking all notifications as read:', error);
    }
  }

  // Mark all notifications as read via API
  private async markAllAsReadViaAPI() {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        console.log('❌ No user found for API call');
        return;
      }

      // Get auth token
      let token = user.token;
      if (!token) {
        // Fallback to hardcoded tokens for testing
        if (user.id === '5') {
          token = '64|dTO5Gio05Om1Buxtkta02gVpvQnetCTMrofsLjeudda0034b';
        } else if (user.id === '21') {
          token = '67|uCtobaBZatzbzDOeK8k1DytVHby0lpa07ERJJczu3cdfa507';
        } else if (user.id === '74') {
          token = '287|HOTtxWRw3lHKLL7j2e6GQbvORaLsbq2W5lS0vWJcfdab31c9';
        } else {
          console.log('❌ No token available for user:', user.id);
          return;
        }
      }

      console.log('🔑 Marking all notifications as read via API for user:', user.id);

      const response = await makeApiCall('/api/notifications/read-all', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        console.log('✅ All notifications marked as read via API');
      } else {
        console.log('⚠️ API call failed:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error marking all notifications as read via API:', error);
    }
  }

  // Delete notification
  async deleteNotification(notificationId: string) {
    try {
      const stored = await AsyncStorage.getItem('notifications');
      const notifications = stored ? JSON.parse(stored) : [];
      
      const filteredNotifications = notifications.filter((n: Notification) => n.id !== notificationId);
      await this.saveNotifications(filteredNotifications);
      this.notifyListeners(filteredNotifications);
    } catch (error) {
      console.error('❌ Error deleting notification:', error);
    }
  }

  // Get unread count
  async getUnreadCount(): Promise<number> {
    try {
      // Clear all notifications for fresh start
      await AsyncStorage.removeItem('notifications');
      console.log('🧹 Cleared all notifications for fresh start');
      return 0;
    } catch (error) {
      console.error('❌ Error getting unread count:', error);
      return 0;
    }
  }

  // Create booking confirmation notification for pet owner
  async createBookingConfirmationNotification(bookingData: any) {
    try {
      console.log('🔔 Creating booking confirmation notification for owner:', bookingData.petOwnerId);
      
      const bookingType = bookingData.isWeekly ? 'Weekly' : 'Daily';
      const dateRange = bookingData.isWeekly 
        ? `from ${bookingData.startDate} to ${bookingData.endDate}`
        : `for ${bookingData.date}`;
      
      const notificationData = {
        type: 'booking' as const,
        title: `${bookingType} Booking Confirmed`,
        message: `Your ${bookingType.toLowerCase()} booking with ${bookingData.sitterName} ${dateRange} has been confirmed!`,
        action: 'View Booking',
      data: {
        bookingId: bookingData.bookingId,
        petOwnerId: bookingData.petOwnerId,
        petOwnerName: bookingData.petOwnerName,
          sitterId: bookingData.sitterId,
          sitterName: bookingData.sitterName,
          date: bookingData.date,
        startDate: bookingData.startDate,
        endDate: bookingData.endDate,
        startTime: bookingData.startTime,
        endTime: bookingData.endTime,
        hourlyRate: bookingData.hourlyRate,
          isWeekly: bookingData.isWeekly || false,
          bookingType,
          status: 'confirmed'
        }
      };

      return await this.addNotificationForUser(bookingData.petOwnerId, notificationData);
    } catch (error) {
      console.error('❌ Error creating booking confirmation notification:', error);
    }
  }

  // Create booking cancellation notification for pet owner
  async createBookingCancellationNotification(bookingData: any) {
    try {
      console.log('🔔 Creating booking cancellation notification for owner:', bookingData.petOwnerId);
      
      const bookingType = bookingData.isWeekly ? 'Weekly' : 'Daily';
      const dateRange = bookingData.isWeekly 
        ? `from ${bookingData.startDate} to ${bookingData.endDate}`
        : `for ${bookingData.date}`;
      
      const notificationData = {
        type: 'booking' as const,
        title: `${bookingType} Booking Cancelled`,
        message: `Your ${bookingType.toLowerCase()} booking with ${bookingData.sitterName} ${dateRange} has been cancelled.`,
        action: 'View Details',
      data: {
        bookingId: bookingData.bookingId,
        petOwnerId: bookingData.petOwnerId,
        petOwnerName: bookingData.petOwnerName,
          sitterId: bookingData.sitterId,
          sitterName: bookingData.sitterName,
          date: bookingData.date,
        startDate: bookingData.startDate,
        endDate: bookingData.endDate,
        startTime: bookingData.startTime,
        endTime: bookingData.endTime,
          hourlyRate: bookingData.hourlyRate,
          isWeekly: bookingData.isWeekly || false,
          bookingType,
          status: 'cancelled'
        }
      };

      return await this.addNotificationForUser(bookingData.petOwnerId, notificationData);
    } catch (error) {
      console.error('❌ Error creating booking cancellation notification:', error);
    }
  }

  // Create session started notification for pet owner
  async createSessionStartedNotification(bookingData: any) {
    try {
      console.log('🔔 Creating session started notification for owner:', bookingData.petOwnerId);
      
      const bookingType = bookingData.isWeekly ? 'Weekly' : 'Daily';
      const dateRange = bookingData.isWeekly 
        ? `from ${bookingData.startDate} to ${bookingData.endDate}`
        : `for ${bookingData.date}`;
      
      const notificationData = {
        type: 'booking' as const,
        title: 'Session Started',
        message: `Your sitter ${bookingData.sitterName} has started the session for your ${bookingType.toLowerCase()} booking ${dateRange}.`,
        action: 'View Session',
        data: {
          bookingId: bookingData.bookingId,
          petOwnerId: bookingData.petOwnerId,
          petOwnerName: bookingData.petOwnerName,
          sitterId: bookingData.sitterId,
          sitterName: bookingData.sitterName,
          date: bookingData.date,
          startDate: bookingData.startDate,
          endDate: bookingData.endDate,
          startTime: bookingData.startTime,
          endTime: bookingData.endTime,
          hourlyRate: bookingData.hourlyRate,
          isWeekly: bookingData.isWeekly || false,
          bookingType,
          status: 'active'
        }
      };

      return await this.addNotificationForUser(bookingData.petOwnerId, notificationData);
    } catch (error) {
      console.error('❌ Error creating session started notification:', error);
    }
  }

  // Refresh notifications from API
  async refreshNotifications() {
    try {
      console.log('🔄 Refreshing notifications from API...');
      const notifications = await this.getNotifications();
      this.notifyListeners(notifications);
      return notifications;
    } catch (error) {
      console.error('❌ Error refreshing notifications:', error);
      return [];
    }
  }
}

export const notificationService = NotificationService.getInstance();
export default notificationService;
