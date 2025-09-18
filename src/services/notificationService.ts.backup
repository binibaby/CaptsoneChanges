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
  private lastApiCallTime: number = 0;
  private apiCallDebounceMs: number = 3000; // 3 second debounce for API calls
  private lastWeeklyBookingTime: number = 0;
  private readonly WEEKLY_BOOKING_PROTECTION_TIME = 15000; // 15 seconds

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
      // Check if we're in weekly booking protection mode
      const now = Date.now();
      const timeSinceLastWeeklyBooking = now - this.lastWeeklyBookingTime;
      if (timeSinceLastWeeklyBooking < this.WEEKLY_BOOKING_PROTECTION_TIME) {
        console.log('🛡️ Weekly booking protection active, using local notifications only');
        const stored = await AsyncStorage.getItem('notifications');
        const localNotifications = stored ? JSON.parse(stored) : [];
        return this.filterNotificationsByUserType(localNotifications);
      }
      
      // First try to get from API
      const apiNotifications = await this.fetchNotificationsFromAPI();
      if (apiNotifications.length > 0) {
        console.log('📱 Fetched notifications from API:', apiNotifications.length);
        
        // Get local notifications to merge with API ones (load BEFORE saving API notifications)
        const stored = await AsyncStorage.getItem('notifications');
        const localNotifications = stored ? JSON.parse(stored) : [];
        console.log('📱 Local notifications before merge:', localNotifications.length);
        console.log('🔍 Verification - loading from storage, found notifications:', localNotifications.length);
        console.log('🔍 Verification - loading from storage, notification IDs:', localNotifications.map(n => n.id));
        const loadingWeekly = localNotifications.filter(n => n.data?.isWeekly);
        console.log('🔍 Verification - loading from storage, weekly notifications:', loadingWeekly.length, loadingWeekly.map(n => ({ id: n.id, userId: n.userId })));
        
        // Debug: Check if the weekly booking notification we just created is in storage
        const weeklyBookingNotification = localNotifications.find(n => n.id === '1758167405431');
        console.log('🔍 Looking for specific weekly booking notification 1758167405431:', !!weeklyBookingNotification);
        if (weeklyBookingNotification) {
          console.log('🔍 Found weekly booking notification:', weeklyBookingNotification);
        }
        
        // Debug: Check all notifications in storage to see what we have
        console.log('🔍 All notifications in storage:', localNotifications.map(n => ({
          id: n.id,
          title: n.title,
          hasData: !!n.data,
          isWeekly: n.data?.isWeekly,
          userId: n.userId
        })));
        
        // If we have no local notifications but we should have weekly booking notifications, skip API merge
        if (localNotifications.length === 0) {
          console.log('📱 No local notifications found, skipping API merge');
          return this.filterNotificationsByUserType([]);
        }
        
        // Check if we have any notifications with userId that should be preserved
        const notificationsWithUserId = localNotifications.filter(n => n.userId);
        if (notificationsWithUserId.length > 0) {
          console.log('📱 Preserving notifications with userId:', notificationsWithUserId.length);
          console.log('📱 Notifications with userId IDs:', notificationsWithUserId.map(n => n.id));
          return this.filterNotificationsByUserType(localNotifications);
        }
        
        // Also check if we have more local notifications than API notifications
        if (localNotifications.length > apiNotifications.length) {
          console.log('📱 Preserving local notifications - more local than API:', localNotifications.length, 'vs', apiNotifications.length);
          return this.filterNotificationsByUserType(localNotifications);
        }
        
        // Also check if we have any notifications with data that should be preserved
        const notificationsWithData = localNotifications.filter(n => n.data && Object.keys(n.data).length > 0);
        if (notificationsWithData.length > 0) {
          console.log('📱 Preserving notifications with data:', notificationsWithData.length);
          console.log('📱 Notifications with data IDs:', notificationsWithData.map(n => n.id));
          return this.filterNotificationsByUserType(localNotifications);
        }
        
        // Also check if we have any notifications that are not in the API
        const localNotificationIds = localNotifications.map(n => n.id);
        const apiNotificationIds = apiNotifications.map(n => n.id);
        const notificationsNotInAPI = localNotifications.filter(n => !apiNotificationIds.includes(n.id));
        if (notificationsNotInAPI.length > 0) {
          console.log('📱 Preserving notifications not in API:', notificationsNotInAPI.length);
          console.log('📱 Notifications not in API IDs:', notificationsNotInAPI.map(n => n.id));
          return this.filterNotificationsByUserType(localNotifications);
        }
        
        // Also check if we have any notifications that are newer than the API notifications
        const localNotificationTimes = localNotifications.map(n => new Date(n.time || n.createdAt || 0).getTime());
        const apiNotificationTimes = apiNotifications.map(n => new Date(n.created_at || 0).getTime());
        const maxLocalTime = Math.max(...localNotificationTimes);
        const maxApiTime = Math.max(...apiNotificationTimes);
        if (maxLocalTime > maxApiTime) {
          console.log('📱 Preserving local notifications - newer than API:', maxLocalTime, 'vs', maxApiTime);
          return this.filterNotificationsByUserType(localNotifications);
        }
        
        // Also check if we have any notifications that are from today
        const today = new Date().toDateString();
        const todayNotifications = localNotifications.filter(n => {
          const notificationDate = new Date(n.time || n.createdAt || 0).toDateString();
          return notificationDate === today;
        });
        if (todayNotifications.length > 0) {
          console.log('📱 Preserving today\'s notifications:', todayNotifications.length);
          console.log('📱 Today\'s notification IDs:', todayNotifications.map(n => n.id));
          return this.filterNotificationsByUserType(localNotifications);
        }
        
        // Also check if we have any notifications that are from the last hour
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const recentNotifications = localNotifications.filter(n => {
          const notificationTime = new Date(n.time || n.createdAt || 0);
          return notificationTime > oneHourAgo;
        });
        if (recentNotifications.length > 0) {
          console.log('📱 Preserving recent notifications (last hour):', recentNotifications.length);
          console.log('📱 Recent notification IDs:', recentNotifications.map(n => n.id));
          return this.filterNotificationsByUserType(localNotifications);
        }
        
        // Also check if we have any notifications that are from the last 30 minutes
        const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
        const veryRecentNotifications = localNotifications.filter(n => {
          const notificationTime = new Date(n.time || n.createdAt || 0);
          return notificationTime > thirtyMinutesAgo;
        });
        if (veryRecentNotifications.length > 0) {
          console.log('📱 Preserving very recent notifications (last 30 minutes):', veryRecentNotifications.length);
          console.log('📱 Very recent notification IDs:', veryRecentNotifications.map(n => n.id));
          return this.filterNotificationsByUserType(localNotifications);
        }
        console.log('📱 Local notification IDs:', localNotifications.map(n => n.id));
        console.log('📱 API notification IDs:', apiNotifications.map(n => n.id));
        console.log('📱 Looking for weekly booking notifications in local storage...');
        const weeklyNotifications = localNotifications.filter(n => n.data?.isWeekly);
        console.log('📱 Found weekly notifications:', weeklyNotifications.length, weeklyNotifications.map(n => ({ id: n.id, userId: n.userId, title: n.title })));
        
        // Check if we have recent local notifications that shouldn't be overwritten
        const recentLocalNotifications = localNotifications.filter(n => {
          const notificationTime = new Date(n.time || n.createdAt || 0);
          const now = new Date();
          const timeDiff = now.getTime() - notificationTime.getTime();
          return timeDiff < 60000; // Less than 1 minute old
        });
        console.log('📱 Recent local notifications (less than 1 minute old):', recentLocalNotifications.length);
        
        // If we have recent local notifications, don't overwrite them with API notifications
        if (recentLocalNotifications.length > 0) {
          console.log('📱 Skipping API merge - preserving recent local notifications');
          return this.filterNotificationsByUserType(localNotifications);
        }
        
        // Also check if we have weekly booking notifications that should be preserved
        const weeklyBookingNotifications = localNotifications.filter(n => n.data?.isWeekly);
        if (weeklyBookingNotifications.length > 0) {
          console.log('📱 Preserving weekly booking notifications:', weeklyBookingNotifications.length);
          console.log('📱 Weekly booking notification IDs:', weeklyBookingNotifications.map(n => n.id));
          return this.filterNotificationsByUserType(localNotifications);
        }
        
        // Also check if we have any notifications with userId that should be preserved
        if (notificationsWithUserId.length > 0) {
          console.log('📱 Preserving notifications with userId:', notificationsWithUserId.length);
          console.log('📱 Notifications with userId IDs:', notificationsWithUserId.map(n => n.id));
          return this.filterNotificationsByUserType(localNotifications);
        }
        
        // Also check if we have more local notifications than API notifications
        if (localNotifications.length > apiNotifications.length) {
          console.log('📱 Preserving local notifications - more local than API:', localNotifications.length, 'vs', apiNotifications.length);
          return this.filterNotificationsByUserType(localNotifications);
        }
        
        // Also check if we have local notifications with data that should be preserved
        const localNotificationsWithData = localNotifications.filter(n => n.data && Object.keys(n.data).length > 0);
        if (localNotificationsWithData.length > 0) {
          console.log('📱 Preserving local notifications with data:', localNotificationsWithData.length);
          // Merge API notifications with local notifications, prioritizing local ones with data
          const allNotifications = [...apiNotifications];
          localNotifications.forEach(localNotif => {
            // Check if this local notification exists in API
            const existingApiNotif = apiNotifications.find(apiNotif => apiNotif.id === localNotif.id);
            
            if (!existingApiNotif) {
              // Local notification doesn't exist in API, add it
              console.log(`📱 Adding local notification ${localNotif.id} (not in API)`);
              allNotifications.push(localNotif);
            } else if (localNotif.data && !existingApiNotif.data) {
              // Local notification has data but API doesn't, replace it
              console.log(`📱 Replacing API notification ${localNotif.id} with local version (has data)`);
              const index = allNotifications.findIndex(n => n.id === localNotif.id);
              if (index !== -1) {
                allNotifications[index] = localNotif;
              }
            }
          });
          
          console.log('📱 Total notifications after data preservation merge:', allNotifications.length);
          await this.saveNotifications(allNotifications);
          return this.filterNotificationsByUserType(allNotifications);
        }
        
        // If we have more local notifications than API notifications, don't overwrite
        if (localNotifications.length > apiNotifications.length) {
          console.log('📱 Preserving local notifications - more local than API:', localNotifications.length, 'vs', apiNotifications.length);
          return this.filterNotificationsByUserType(localNotifications);
        }
        
        // Merge API and local notifications, prioritizing local ones with data
        const allNotifications = [...apiNotifications];
        localNotifications.forEach(localNotif => {
          // Check if this local notification exists in API
          const existingApiNotif = apiNotifications.find(apiNotif => apiNotif.id === localNotif.id);
          
          console.log(`📱 Processing local notification ${localNotif.id}:`, {
            existsInAPI: !!existingApiNotif,
            hasData: !!localNotif.data,
            apiHasData: existingApiNotif ? !!existingApiNotif.data : 'N/A'
          });
          
          if (!existingApiNotif) {
            // Local notification doesn't exist in API, add it
            console.log(`📱 Adding local notification ${localNotif.id} (not in API)`);
            allNotifications.push(localNotif);
          } else if (localNotif.data && !existingApiNotif.data) {
            // Local notification has data but API doesn't, replace it
            console.log(`📱 Replacing API notification ${localNotif.id} with local version (has data)`);
            const index = allNotifications.findIndex(n => n.id === localNotif.id);
            if (index !== -1) {
              allNotifications[index] = localNotif;
            }
          } else {
            console.log(`📱 Keeping API notification ${localNotif.id} (no local data advantage)`);
          }
        });
        
        console.log('📱 Total notifications after merge:', allNotifications.length);
        console.log('📱 Final notification IDs after merge:', allNotifications.map(n => n.id));
        const finalWeeklyNotifications = allNotifications.filter(n => n.data?.isWeekly);
        console.log('📱 Final weekly notifications after merge:', finalWeeklyNotifications.length, finalWeeklyNotifications.map(n => ({ id: n.id, userId: n.userId, title: n.title })));
        
        // Debug: Log notification data to see what we have
        allNotifications.forEach((notif, index) => {
          console.log(`📱 Notification ${index}:`, {
            id: notif.id,
            title: notif.title,
            hasData: !!notif.data,
            dataKeys: notif.data ? Object.keys(notif.data) : 'null'
          });
        });
        
        // Save merged notifications to local storage (this will overwrite, but we've already merged)
        await this.saveNotifications(allNotifications);
        console.log('💾 Saved merged notifications to storage');
        return this.filterNotificationsByUserType(allNotifications);
      }
      
      // Fallback to local storage
      const stored = await AsyncStorage.getItem('notifications');
      const localNotifications = stored ? JSON.parse(stored) : [];
      console.log('📱 Using local notifications:', localNotifications.length);
      
      // Debug: Log all notifications to see what we have
      console.log('📋 All local notifications:', localNotifications);
      
      return this.filterNotificationsByUserType(localNotifications);
    } catch (error) {
      console.error('Error getting notifications:', error);
      // Fallback to local storage on error
      try {
        const stored = await AsyncStorage.getItem('notifications');
        const notifications = stored ? JSON.parse(stored) : [];
        return this.filterNotificationsByUserType(notifications);
      } catch (localError) {
        console.error('Error getting local notifications:', localError);
        return [];
      }
    }
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
      
      // Debug: Log all notifications before filtering
      console.log('🔍 All notifications before filtering:');
      notifications.forEach((notif, index) => {
        console.log(`  ${index}: ID=${notif.id}, type=${notif.type}, userId=${notif.userId}, title=${notif.title}`);
      });
      
      const filtered = notifications.filter(notification => {
        // If notification has userId, only show to that specific user
        if (notification.userId) {
          const matches = String(notification.userId) === String(user.id);
          console.log(`🔍 Notification ${notification.id} has userId ${notification.userId} (${typeof notification.userId}), matches current user ${user.id} (${typeof user.id}): ${matches}`);
          if (notification.data?.isWeekly) {
            console.log(`🔍 WEEKLY NOTIFICATION ${notification.id}: userId=${notification.userId}, currentUser=${user.id}, matches=${matches}`);
          }
          return matches;
        }
        
        // Otherwise, use the old filtering logic
        if (isPetSitter) {
          // Pet sitters see: booking requests, messages, reviews, system notifications
          const matches = notification.type === 'booking' || 
                 notification.type === 'message' || 
                 notification.type === 'review' || 
                 notification.type === 'system';
          console.log(`🔍 Pet sitter notification ${notification.id} (${notification.type}): ${matches}`);
          return matches;
        } else {
          // Pet owners see: booking confirmations/cancellations, messages, system notifications
          // Check if it's a booking notification with status or if it's targeted to this user
          const isBookingWithStatus = notification.type === 'booking' && 
                 (notification.data?.status === 'confirmed' || 
                  notification.data?.status === 'cancelled' ||
                  notification.title?.includes('confirmed') ||
                  notification.title?.includes('cancelled'));
          const isMessageOrSystem = notification.type === 'message' || notification.type === 'system';
          const matches = isBookingWithStatus || isMessageOrSystem;
          console.log(`🔍 Pet owner notification ${notification.id} (${notification.type}): bookingWithStatus=${isBookingWithStatus}, messageOrSystem=${isMessageOrSystem}, matches=${matches}`);
          if (notification.type === 'booking') {
            console.log(`🔍   - Title: ${notification.title}`);
            console.log(`🔍   - Data status: ${notification.data?.status}`);
          }
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
      console.error('Error filtering notifications by user type:', error);
      return notifications;
    }
  }

  // Fetch notifications from API
  private async fetchNotificationsFromAPI(): Promise<Notification[]> {
    try {
      // Debounce API calls
      const now = Date.now();
      if (now - this.lastApiCallTime < this.apiCallDebounceMs) {
        console.log('🚫 Skipping notification API call due to debounce');
        return [];
      }
      this.lastApiCallTime = now;

      const user = await this.getCurrentUser();
      if (!user) {
        console.log('❌ No user found for API call');
        return [];
      }

      // Get auth token
      let token = user.token;
      if (!token) {
        // Fallback to hardcoded tokens for testing
        if (user.id === '5') {
          token = '64|dTO5Gio05Om1Buxtkta02gVpvQnetCTMrofsLjeudda0034b';
        } else if (user.id === '21') {
          token = '67|uCtobaBZatzbzDOeK8k1DytVHby0lpa07ERJJczu3cdfa507';
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
        
        if (data.success && data.notifications) {
          // Convert API format to local format
          const notifications: Notification[] = data.notifications.map((apiNotif: any) => ({
            id: apiNotif.id.toString(),
            type: apiNotif.type || 'system',
            title: apiNotif.title || 'Notification',
            message: apiNotif.message || '',
            time: apiNotif.created_at,
            isRead: !!apiNotif.read_at,
            data: apiNotif.data || null,
          }));
          
          console.log('✅ Converted API notifications:', notifications.length);
          return notifications;
        }
      } else {
        console.log('⚠️ API call failed:', response.status, response.statusText);
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

  // Mark notification as read on API
  private async markAsReadOnAPI(notificationId: string) {
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
      } else {
        console.log('❌ No token available for user:', user.id);
        return;
      }
    }

    console.log('🔑 Marking notification as read on API:', notificationId);

    const response = await makeApiCall(`/api/notifications/${notificationId}/read`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      console.log('✅ Successfully marked notification as read on API');
    } else {
      console.log('⚠️ Failed to mark notification as read on API:', response.status);
    }
  }

  // Mark all notifications as read on API
  private async markAllAsReadOnAPI() {
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
      } else {
        console.log('❌ No token available for user:', user.id);
        return;
      }
    }

    console.log('🔑 Marking all notifications as read on API');

    const response = await makeApiCall('/api/notifications/mark-all-read', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      console.log('✅ Successfully marked all notifications as read on API');
    } else {
      console.log('⚠️ Failed to mark all notifications as read on API:', response.status);
    }
  }

  // Save notifications to storage
  private async saveNotifications(notifications: Notification[]) {
    try {
      console.log('💾 Saving notifications to AsyncStorage:', notifications.length);
      console.log('💾 Notification IDs being saved:', notifications.map(n => n.id));
      const weeklyNotifications = notifications.filter(n => n.data?.isWeekly);
      console.log('💾 Weekly notifications being saved:', weeklyNotifications.length, weeklyNotifications.map(n => n.id));
      await AsyncStorage.setItem('notifications', JSON.stringify(notifications));
      console.log('📢 Notifying listeners:', this.listeners.length);
      this.notifyListeners(notifications);
    } catch (error) {
      console.error('Error saving notifications:', error);
    }
  }

  // Add a new notification
  async addNotification(notification: Omit<Notification, 'id' | 'time' | 'isRead'>) {
    console.log('🔔 Adding new notification:', notification.title);
    
    // Get all notifications from storage (unfiltered)
    const stored = await AsyncStorage.getItem('notifications');
    const allNotifications = stored ? JSON.parse(stored) : [];
    
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      time: new Date().toLocaleString(),
      isRead: false,
    };

    allNotifications.unshift(newNotification); // Add to beginning
    console.log('📋 Total notifications after adding:', allNotifications.length);
    
    // Save back to storage
    await AsyncStorage.setItem('notifications', JSON.stringify(allNotifications));
    console.log('💾 Saved weekly booking notification to storage. Total notifications:', allNotifications.length);
    console.log('💾 Saved notification IDs:', allNotifications.map(n => n.id));
    
    // Notify listeners with filtered notifications
    const filteredNotifications = await this.filterNotificationsByUserType(allNotifications);
    this.notifyListeners(filteredNotifications);
    
    return newNotification;
  }

  // Add notification for a specific user
  async addNotificationForUser(userId: string, notification: Omit<Notification, 'id' | 'time' | 'isRead' | 'userId'>) {
    console.log('🔔 ===== ADDING NOTIFICATION FOR USER =====');
    console.log('🔔 Adding notification for user:', userId, notification.title);
    console.log('🔔 Notification data:', notification.data);
    console.log('🔔 Is weekly booking:', notification.data?.isWeekly);
    
    // Get all notifications from storage (unfiltered)
    const stored = await AsyncStorage.getItem('notifications');
    const allNotifications = stored ? JSON.parse(stored) : [];
    
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      time: new Date().toLocaleString(),
      isRead: false,
      userId: userId, // Add userId to target specific user
    };

    console.log('🔔 New notification created:', newNotification);
    
    allNotifications.unshift(newNotification); // Add to beginning
    console.log('📋 Total notifications after adding for user:', allNotifications.length);
    
    // Save back to storage
    await AsyncStorage.setItem('notifications', JSON.stringify(allNotifications));
    console.log('💾 Saved notification for user to storage. Total notifications:', allNotifications.length);
    console.log('💾 Saved notification IDs for user:', allNotifications.map(n => n.id));
    
    // Verify the notification was actually saved
    const verifyStored = await AsyncStorage.getItem('notifications');
    const verifyNotifications = verifyStored ? JSON.parse(verifyStored) : [];
    console.log('🔍 Verification - stored notifications after save:', verifyNotifications.length);
    console.log('🔍 Verification - stored notification IDs after save:', verifyNotifications.map(n => n.id));
    const verifyWeekly = verifyNotifications.filter(n => n.data?.isWeekly);
    console.log('🔍 Verification - weekly notifications after save:', verifyWeekly.length, verifyWeekly.map(n => ({ id: n.id, userId: n.userId })));
    
    // Set protection flag for weekly booking notifications
    if (notification.data?.isWeekly) {
      this.lastWeeklyBookingTime = Date.now();
      console.log('🛡️ Weekly booking protection activated until:', new Date(this.lastWeeklyBookingTime + this.WEEKLY_BOOKING_PROTECTION_TIME));
    }
    
    // Add a small delay to prevent race conditions with API refresh
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Notify listeners with filtered notifications
    const filteredNotifications = await this.filterNotificationsByUserType(allNotifications);
    console.log('📋 Filtered notifications for listeners:', filteredNotifications.length);
    this.notifyListeners(filteredNotifications);
    
    return newNotification;
  }

  // Mark notification as read
  async markAsRead(notificationId: string) {
    try {
      // First, try to update on the backend API
      await this.markAsReadOnAPI(notificationId);
    } catch (error) {
      console.log('⚠️ Failed to mark as read on API, updating locally only:', error);
    }

    // Get all notifications from storage (unfiltered)
    const stored = await AsyncStorage.getItem('notifications');
    const allNotifications = stored ? JSON.parse(stored) : [];
    
    // Update the specific notification
    const updated = allNotifications.map((n: Notification) => 
      n.id === notificationId ? { ...n, isRead: true } : n
    );
    
    // Save back to storage
    await AsyncStorage.setItem('notifications', JSON.stringify(updated));
    
    // Notify listeners with filtered notifications
    const filteredNotifications = await this.filterNotificationsByUserType(updated);
    this.notifyListeners(filteredNotifications);
  }

  // Mark all notifications as read
  async markAllAsRead() {
    try {
      // First, try to update on the backend API
      await this.markAllAsReadOnAPI();
    } catch (error) {
      console.log('⚠️ Failed to mark all as read on API, updating locally only:', error);
    }

    // Get all notifications from storage (unfiltered)
    const stored = await AsyncStorage.getItem('notifications');
    const allNotifications = stored ? JSON.parse(stored) : [];
    
    // Update all notifications
    const updated = allNotifications.map((n: Notification) => ({ ...n, isRead: true }));
    
    // Save back to storage
    await AsyncStorage.setItem('notifications', JSON.stringify(updated));
    
    // Notify listeners with filtered notifications
    const filteredNotifications = await this.filterNotificationsByUserType(updated);
    this.notifyListeners(filteredNotifications);
  }

  // Delete notification
  async deleteNotification(notificationId: string) {
    // Get all notifications from storage (unfiltered)
    const stored = await AsyncStorage.getItem('notifications');
    const allNotifications = stored ? JSON.parse(stored) : [];
    
    // Remove the specific notification
    const updated = allNotifications.filter((n: Notification) => n.id !== notificationId);
    
    // Save back to storage
    await AsyncStorage.setItem('notifications', JSON.stringify(updated));
    
    // Notify listeners with filtered notifications
    const filteredNotifications = await this.filterNotificationsByUserType(updated);
    this.notifyListeners(filteredNotifications);
  }

  // Get unread count
  async getUnreadCount(): Promise<number> {
    const notifications = await this.getNotifications();
    return notifications.filter(n => !n.isRead).length;
  }

  // Clear all notifications (for testing)
  async clearAllNotifications(): Promise<void> {
    console.log('🗑️ Clearing all notifications...');
    await AsyncStorage.removeItem('notifications');
    this.notifyListeners([]);
  }

  // Refresh notifications from API and update local storage
  async refreshNotifications(): Promise<Notification[]> {
    try {
      // Check if we're in weekly booking protection mode
      const now = Date.now();
      const timeSinceLastWeeklyBooking = now - this.lastWeeklyBookingTime;
      if (timeSinceLastWeeklyBooking < this.WEEKLY_BOOKING_PROTECTION_TIME) {
        console.log('🛡️ Weekly booking protection active during refresh, using local notifications only');
        const stored = await AsyncStorage.getItem('notifications');
        const localNotifications = stored ? JSON.parse(stored) : [];
        return this.filterNotificationsByUserType(localNotifications);
      }
      
      // Clear cache to force fresh API call
      this.lastApiCallTime = 0;
      
      // Get fresh notifications from API
      const apiNotifications = await this.fetchNotificationsFromAPI();
      if (apiNotifications.length > 0) {
        console.log('🔄 Refreshed notifications from API:', apiNotifications.length);
        
        // Get existing local notifications to merge with API ones
        const stored = await AsyncStorage.getItem('notifications');
        const localNotifications = stored ? JSON.parse(stored) : [];
        console.log('🔄 Local notifications before refresh merge:', localNotifications.length);
        console.log('🔄 Local notification IDs before refresh:', localNotifications.map(n => n.id));
        console.log('🔄 Looking for weekly booking notifications in local storage...');
        const weeklyNotifications = localNotifications.filter(n => n.data?.isWeekly);
        console.log('🔄 Found weekly notifications:', weeklyNotifications.length, weeklyNotifications.map(n => ({ id: n.id, userId: n.userId, title: n.title })));
        
        // Check if we have any notifications with userId that should be preserved
        const notificationsWithUserId = localNotifications.filter(n => n.userId);
        if (notificationsWithUserId.length > 0) {
          console.log('🔄 Preserving notifications with userId:', notificationsWithUserId.length);
          console.log('🔄 Notifications with userId IDs:', notificationsWithUserId.map(n => n.id));
          return this.filterNotificationsByUserType(localNotifications);
        }
        
        // Also check if we have more local notifications than API notifications
        if (localNotifications.length > apiNotifications.length) {
          console.log('🔄 Preserving local notifications - more local than API:', localNotifications.length, 'vs', apiNotifications.length);
          return this.filterNotificationsByUserType(localNotifications);
        }
        
        // Also check if we have any notifications with data that should be preserved
        const notificationsWithData = localNotifications.filter(n => n.data && Object.keys(n.data).length > 0);
        if (notificationsWithData.length > 0) {
          console.log('🔄 Preserving notifications with data:', notificationsWithData.length);
          console.log('🔄 Notifications with data IDs:', notificationsWithData.map(n => n.id));
          return this.filterNotificationsByUserType(localNotifications);
        }
        
        // Also check if we have any notifications that are not in the API
        const localNotificationIds = localNotifications.map(n => n.id);
        const apiNotificationIds = apiNotifications.map(n => n.id);
        const notificationsNotInAPI = localNotifications.filter(n => !apiNotificationIds.includes(n.id));
        if (notificationsNotInAPI.length > 0) {
          console.log('🔄 Preserving notifications not in API:', notificationsNotInAPI.length);
          console.log('🔄 Notifications not in API IDs:', notificationsNotInAPI.map(n => n.id));
          return this.filterNotificationsByUserType(localNotifications);
        }
        
        // Also check if we have any notifications that are newer than the API notifications
        const localNotificationTimes = localNotifications.map(n => new Date(n.time || n.createdAt || 0).getTime());
        const apiNotificationTimes = apiNotifications.map(n => new Date(n.created_at || 0).getTime());
        const maxLocalTime = Math.max(...localNotificationTimes);
        const maxApiTime = Math.max(...apiNotificationTimes);
        if (maxLocalTime > maxApiTime) {
          console.log('🔄 Preserving local notifications - newer than API:', maxLocalTime, 'vs', maxApiTime);
          return this.filterNotificationsByUserType(localNotifications);
        }
        
        // Also check if we have any notifications that are from today
        const today = new Date().toDateString();
        const todayNotifications = localNotifications.filter(n => {
          const notificationDate = new Date(n.time || n.createdAt || 0).toDateString();
          return notificationDate === today;
        });
        if (todayNotifications.length > 0) {
          console.log('🔄 Preserving today\'s notifications:', todayNotifications.length);
          console.log('🔄 Today\'s notification IDs:', todayNotifications.map(n => n.id));
          return this.filterNotificationsByUserType(localNotifications);
        }
        
        // Also check if we have any notifications that are from the last hour
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const recentNotifications = localNotifications.filter(n => {
          const notificationTime = new Date(n.time || n.createdAt || 0);
          return notificationTime > oneHourAgo;
        });
        if (recentNotifications.length > 0) {
          console.log('🔄 Preserving recent notifications (last hour):', recentNotifications.length);
          console.log('🔄 Recent notification IDs:', recentNotifications.map(n => n.id));
          return this.filterNotificationsByUserType(localNotifications);
        }
        
        // Check if we have recent local notifications that shouldn't be overwritten
        const recentLocalNotifications = localNotifications.filter(n => {
          const notificationTime = new Date(n.time || n.createdAt || 0);
          const now = new Date();
          const timeDiff = now.getTime() - notificationTime.getTime();
          return timeDiff < 60000; // Less than 1 minute old
        });
        console.log('🔄 Recent local notifications (less than 1 minute old):', recentLocalNotifications.length);
        
        // If we have recent local notifications, don't overwrite them with API notifications
        if (recentLocalNotifications.length > 0) {
          console.log('🔄 Skipping API refresh - preserving recent local notifications');
          return this.filterNotificationsByUserType(localNotifications);
        }
        
        // Also check if we have weekly booking notifications that should be preserved
        const weeklyBookingNotifications = localNotifications.filter(n => n.data?.isWeekly);
        if (weeklyBookingNotifications.length > 0) {
          console.log('🔄 Preserving weekly booking notifications:', weeklyBookingNotifications.length);
          console.log('🔄 Weekly booking notification IDs:', weeklyBookingNotifications.map(n => n.id));
          return this.filterNotificationsByUserType(localNotifications);
        }
        
        // Also check if we have any notifications with userId that should be preserved
        if (notificationsWithUserId.length > 0) {
          console.log('🔄 Preserving notifications with userId:', notificationsWithUserId.length);
          console.log('🔄 Notifications with userId IDs:', notificationsWithUserId.map(n => n.id));
          return this.filterNotificationsByUserType(localNotifications);
        }
        
        // Also check if we have more local notifications than API notifications
        if (localNotifications.length > apiNotifications.length) {
          console.log('🔄 Preserving local notifications - more local than API:', localNotifications.length, 'vs', apiNotifications.length);
          return this.filterNotificationsByUserType(localNotifications);
        }
        
        // Also check if we have local notifications with data that should be preserved
        const localNotificationsWithData = localNotifications.filter(n => n.data && Object.keys(n.data).length > 0);
        if (localNotificationsWithData.length > 0) {
          console.log('🔄 Preserving local notifications with data:', localNotificationsWithData.length);
          // Merge API notifications with local notifications, prioritizing local ones with data
          const allNotifications = [...apiNotifications];
          localNotifications.forEach(localNotif => {
            // Check if this local notification exists in API
            const existingApiNotif = apiNotifications.find(apiNotif => apiNotif.id === localNotif.id);
            
            if (!existingApiNotif) {
              // Local notification doesn't exist in API, add it
              console.log(`🔄 Adding local notification ${localNotif.id} (not in API)`);
              allNotifications.push(localNotif);
            } else if (localNotif.data && !existingApiNotif.data) {
              // Local notification has data but API doesn't, replace it
              console.log(`🔄 Replacing API notification ${localNotif.id} with local version (has data)`);
              const index = allNotifications.findIndex(n => n.id === localNotif.id);
              if (index !== -1) {
                allNotifications[index] = localNotif;
              }
            }
          });
          
          console.log('🔄 Total notifications after data preservation merge:', allNotifications.length);
          await this.saveNotifications(allNotifications);
          return this.filterNotificationsByUserType(allNotifications);
        }
        
        // If we have more local notifications than API notifications, don't overwrite
        if (localNotifications.length > apiNotifications.length) {
          console.log('🔄 Preserving local notifications - more local than API:', localNotifications.length, 'vs', apiNotifications.length);
          return this.filterNotificationsByUserType(localNotifications);
        }
        
        // Merge API and local notifications, prioritizing local ones with data
        const allNotifications = [...apiNotifications];
        localNotifications.forEach(localNotif => {
          // Check if this local notification exists in API
          const existingApiNotif = apiNotifications.find(apiNotif => apiNotif.id === localNotif.id);
          
          if (!existingApiNotif) {
            // Local notification doesn't exist in API, add it
            console.log(`🔄 Adding local notification ${localNotif.id} during refresh (not in API)`);
            allNotifications.push(localNotif);
          } else if (localNotif.data && !existingApiNotif.data) {
            // Local notification has data but API doesn't, replace it
            console.log(`🔄 Replacing API notification ${localNotif.id} with local version during refresh (has data)`);
            const index = allNotifications.findIndex(n => n.id === localNotif.id);
            if (index !== -1) {
              allNotifications[index] = localNotif;
            }
          }
        });
        
        console.log('🔄 Total notifications after refresh merge:', allNotifications.length);
        console.log('🔄 Final notification IDs after merge:', allNotifications.map(n => n.id));
        const finalWeeklyNotifications = allNotifications.filter(n => n.data?.isWeekly);
        console.log('🔄 Final weekly notifications after merge:', finalWeeklyNotifications.length, finalWeeklyNotifications.map(n => ({ id: n.id, userId: n.userId, title: n.title })));
        
        // Save merged notifications to local storage
        await this.saveNotifications(allNotifications);
        return this.filterNotificationsByUserType(allNotifications);
      }
      
      // Fallback to local storage
      const stored = await AsyncStorage.getItem('notifications');
      const localNotifications = stored ? JSON.parse(stored) : [];
      return this.filterNotificationsByUserType(localNotifications);
    } catch (error) {
      console.error('Error refreshing notifications:', error);
      // Fallback to local storage
      const stored = await AsyncStorage.getItem('notifications');
      const notifications = stored ? JSON.parse(stored) : [];
      return this.filterNotificationsByUserType(notifications);
    }
  }

  // Create booking notification
  async createBookingNotification(bookingData: {
    sitterId: string;
    sitterName: string;
    petOwnerId: string;
    petOwnerName: string;
    bookingId: string;
    date: string;
    startTime: string;
    endTime: string;
    hourlyRate: number;
  }) {
    console.log('🔔 Creating booking notification with data:', bookingData);
    
    // Create notification specifically for the sitter
    const notification = await this.addNotificationForUser(bookingData.sitterId, {
      type: 'booking',
      title: 'New Booking Request',
      message: `${bookingData.petOwnerName} wants to book you for ${bookingData.date} from ${bookingData.startTime} to ${bookingData.endTime} at ₱${bookingData.hourlyRate}/hour`,
      action: 'View Request',
      data: {
        sitterId: bookingData.sitterId,
        sitterName: bookingData.sitterName,
        petOwnerId: bookingData.petOwnerId,
        petOwnerName: bookingData.petOwnerName,
        bookingId: bookingData.bookingId,
        date: bookingData.date,
        startTime: bookingData.startTime,
        endTime: bookingData.endTime,
        hourlyRate: bookingData.hourlyRate,
      }
    });
    
    console.log('✅ Booking notification created:', notification);
    return notification;
  }

  // Create booking confirmation notification
  async createBookingConfirmationNotification(bookingData: {
    sitterId: string;
    sitterName: string;
    petOwnerId: string;
    petOwnerName: string;
    bookingId: string;
    date: string;
    startTime: string;
    endTime: string;
    status: 'confirmed' | 'cancelled';
  }) {
    console.log('🔔 Creating booking confirmation notification for pet owner:', bookingData.petOwnerId);
    console.log('🔔 Booking data:', bookingData);
    
    const statusText = bookingData.status === 'confirmed' ? 'confirmed' : 'cancelled';
    const emoji = bookingData.status === 'confirmed' ? '✅' : '❌';
    
    // Different messages and actions for confirmed vs cancelled
    let message: string;
    let action: string;
    
    if (bookingData.status === 'confirmed') {
      message = `${emoji} Great news! ${bookingData.sitterName} has confirmed your booking for ${bookingData.date} from ${bookingData.startTime} to ${bookingData.endTime}. You can now message them to coordinate details.`;
      action = 'Message';
    } else {
      message = `${emoji} ${bookingData.sitterName} has cancelled your booking for ${bookingData.date} from ${bookingData.startTime} to ${bookingData.endTime}. Sorry for the inconvenience.`;
      action = 'View';
    }
    
    console.log('🔔 Notification message:', message);
    console.log('🔔 Notification action:', action);
    
    // Create notification specifically for the pet owner
    const notification = await this.addNotificationForUser(bookingData.petOwnerId, {
      type: 'booking',
      title: `Booking ${statusText.charAt(0).toUpperCase() + statusText.slice(1)}`,
      message,
      action,
      data: {
        sitterId: bookingData.sitterId,
        sitterName: bookingData.sitterName,
        petOwnerId: bookingData.petOwnerId,
        petOwnerName: bookingData.petOwnerName,
        bookingId: bookingData.bookingId,
        date: bookingData.date,
        startTime: bookingData.startTime,
        endTime: bookingData.endTime,
        status: bookingData.status,
      }
    });
    
    console.log('✅ Booking confirmation notification created:', notification);
    return notification;
  }

  // Create weekly booking notification
  async createWeeklyBookingNotification(bookingData: {
    sitterId: string;
    sitterName: string;
    petOwnerId: string;
    petOwnerName: string;
    bookingId: string;
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
    hourlyRate: number;
    totalAmount: number;
  }) {
    console.log('🔔 ===== WEEKLY BOOKING NOTIFICATION CREATION =====');
    console.log('🔔 Creating weekly booking notification for sitter:', bookingData.sitterId);
    console.log('🔔 Weekly booking data:', bookingData);
    
    const message = `📅 New Weekly Booking Request from ${bookingData.petOwnerName} for ${new Date(bookingData.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(bookingData.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} from ${bookingData.startTime} to ${bookingData.endTime}. Total: ₱${bookingData.totalAmount}`;
    
    console.log('🔔 Weekly booking notification message:', message);
    
    // Create notification specifically for the sitter
    const notification = await this.addNotificationForUser(bookingData.sitterId, {
      type: 'booking',
      title: 'New Weekly Booking Request',
      message,
      action: 'View Request',
      data: {
        bookingId: bookingData.bookingId,
        sitterId: bookingData.sitterId,
        sitterName: bookingData.sitterName,
        petOwnerId: bookingData.petOwnerId,
        petOwnerName: bookingData.petOwnerName,
        startDate: bookingData.startDate,
        endDate: bookingData.endDate,
        startTime: bookingData.startTime,
        endTime: bookingData.endTime,
        hourlyRate: bookingData.hourlyRate,
        totalAmount: bookingData.totalAmount,
        isWeekly: true
      }
    });

    console.log('✅ Weekly booking notification created:', notification);
    return notification;
  }

  // Create weekly booking confirmation notification
  async createWeeklyBookingConfirmationNotification(bookingData: {
    sitterId: string;
    sitterName: string;
    petOwnerId: string;
    petOwnerName: string;
    bookingId: string;
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
    totalAmount: number;
    status: 'confirmed' | 'cancelled';
  }) {
    console.log('🔔 Creating weekly booking confirmation notification for pet owner:', bookingData.petOwnerId);
    console.log('🔔 Weekly booking confirmation data:', bookingData);
    
    const statusText = bookingData.status === 'confirmed' ? 'confirmed' : 'cancelled';
    const emoji = bookingData.status === 'confirmed' ? '✅' : '❌';
    
    let message: string;
    let action: string;
    
    if (bookingData.status === 'confirmed') {
      message = `${emoji} Great news! ${bookingData.sitterName} has confirmed your weekly booking from ${new Date(bookingData.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} to ${new Date(bookingData.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} from ${bookingData.startTime} to ${bookingData.endTime}. Total: ₱${bookingData.totalAmount}. You can now message them to coordinate details.`;
      action = 'Message';
    } else {
      message = `${emoji} ${bookingData.sitterName} has cancelled your weekly booking from ${new Date(bookingData.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} to ${new Date(bookingData.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}. Sorry for the inconvenience.`;
      action = 'View';
    }
    
    console.log('🔔 Weekly booking confirmation message:', message);
    console.log('🔔 Weekly booking confirmation action:', action);
    
    // Create notification specifically for the pet owner
    const notification = await this.addNotification({
      type: 'booking',
      title: `Weekly Booking ${statusText.charAt(0).toUpperCase() + statusText.slice(1)}`,
      message,
      action,
      data: {
        bookingId: bookingData.bookingId,
        sitterId: bookingData.sitterId,
        sitterName: bookingData.sitterName,
        petOwnerId: bookingData.petOwnerId,
        petOwnerName: bookingData.petOwnerName,
        startDate: bookingData.startDate,
        endDate: bookingData.endDate,
        startTime: bookingData.startTime,
        endTime: bookingData.endTime,
        totalAmount: bookingData.totalAmount,
        status: bookingData.status,
        isWeekly: true
      }
    });

    console.log('✅ Weekly booking confirmation notification created:', notification);
    return notification;
  }

  // Create message notification
  async createMessageNotification(messageData: {
    senderId: string;
    senderName: string;
    message: string;
    isBookingRelated?: boolean;
  }) {
    const title = messageData.isBookingRelated ? 'New Message (Booking Related)' : 'New Message';
    
    return this.addNotification({
      type: 'message',
      title,
      message: `${messageData.senderName}: ${messageData.message.substring(0, 50)}${messageData.message.length > 50 ? '...' : ''}`,
      action: 'Reply',
      data: {
        senderId: messageData.senderId,
        senderName: messageData.senderName,
        message: messageData.message,
        isBookingRelated: messageData.isBookingRelated,
      }
    });
  }

  // Create sample notifications for testing
  private async createSampleNotifications(): Promise<Notification[]> {
    const now = new Date();
    
    // Get current user to determine user type
    const user = await this.getCurrentUser();
    const isPetSitter = user?.role === 'pet_sitter';
    
    let sampleNotifications: Notification[] = [];
    
    if (isPetSitter) {
      // Pet Sitter notifications - they receive booking requests, messages, reviews
      sampleNotifications = [
        {
          id: '1',
          type: 'booking',
          title: 'New Booking Request',
          message: 'Sarah Johnson wants to book you for tomorrow from 2:00 PM to 6:00 PM at $25/hour',
          time: new Date(now.getTime() - 2 * 60 * 60 * 1000).toLocaleString(), // 2 hours ago
          isRead: false,
          action: 'View Request',
          data: {
            bookingId: '123',
            petOwnerName: 'Sarah Johnson',
            date: 'Tomorrow',
            startTime: '2:00 PM',
            endTime: '6:00 PM',
            hourlyRate: 25
          }
        },
        {
          id: '2',
          type: 'message',
          title: 'New Message',
          message: 'Hi! I have a few questions about the booking. Can you confirm the location?',
          time: new Date(now.getTime() - 4 * 60 * 60 * 1000).toLocaleString(), // 4 hours ago
          isRead: false,
          action: 'Reply',
          data: {
            senderId: '456',
            senderName: 'Mike Wilson',
            message: 'Hi! I have a few questions about the booking. Can you confirm the location?'
          }
        },
        {
          id: '3',
          type: 'system',
          title: 'Profile Update Required',
          message: 'Please complete your profile verification to get more bookings',
          time: new Date(now.getTime() - 24 * 60 * 60 * 1000).toLocaleString(), // 1 day ago
          isRead: true,
          action: 'Update Profile',
          data: {
            type: 'profile_verification'
          }
        },
        {
          id: '4',
          type: 'review',
          title: 'New Review Received',
          message: 'You received a 5-star review from Emma Davis!',
          time: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toLocaleString(), // 2 days ago
          isRead: true,
          data: {
            reviewId: '789',
            rating: 5,
            reviewerName: 'Emma Davis'
          }
        }
      ];
    } else {
      // Pet Owner notifications - they only receive confirmations/cancellations from sitters
      sampleNotifications = [
        {
          id: '1',
          type: 'booking',
          title: 'Booking Confirmed!',
          message: 'John Smith has confirmed your booking for tomorrow from 2:00 PM to 6:00 PM',
          time: new Date(now.getTime() - 1 * 60 * 60 * 1000).toLocaleString(), // 1 hour ago
          isRead: false,
          action: 'View Details',
          data: {
            bookingId: '123',
            sitterName: 'John Smith',
            date: 'Tomorrow',
            startTime: '2:00 PM',
            endTime: '6:00 PM',
            status: 'confirmed'
          }
        },
        {
          id: '2',
          type: 'booking',
          title: 'Booking Cancelled',
          message: 'Lisa Brown has cancelled your booking for Friday due to an emergency',
          time: new Date(now.getTime() - 3 * 60 * 60 * 1000).toLocaleString(), // 3 hours ago
          isRead: false,
          action: 'Find New Sitter',
          data: {
            bookingId: '124',
            sitterName: 'Lisa Brown',
            date: 'Friday',
            startTime: '10:00 AM',
            endTime: '2:00 PM',
            status: 'cancelled',
            reason: 'emergency'
          }
        },
        {
          id: '3',
          type: 'message',
          title: 'New Message from Sitter',
          message: 'Hi! I\'m on my way to your location. I\'ll be there in 10 minutes.',
          time: new Date(now.getTime() - 6 * 60 * 60 * 1000).toLocaleString(), // 6 hours ago
          isRead: true,
          action: 'Reply',
          data: {
            senderId: '789',
            senderName: 'Alex Johnson',
            message: 'Hi! I\'m on my way to your location. I\'ll be there in 10 minutes.'
          }
        },
        {
          id: '4',
          type: 'system',
          title: 'Payment Processed',
          message: 'Your payment of $100 has been processed for the booking with John Smith',
          time: new Date(now.getTime() - 12 * 60 * 60 * 1000).toLocaleString(), // 12 hours ago
          isRead: true,
          data: {
            type: 'payment_processed',
            amount: 100,
            sitterName: 'John Smith'
          }
        }
      ];
    }

    console.log(`📱 Created sample notifications for ${isPetSitter ? 'Pet Sitter' : 'Pet Owner'}:`, sampleNotifications.length);
    return sampleNotifications;
  }
}

export const notificationService = NotificationService.getInstance();