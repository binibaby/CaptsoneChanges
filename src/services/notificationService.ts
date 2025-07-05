import * as Notifications from 'expo-notifications';

export interface NotificationData {
  title: string;
  body: string;
  data?: any;
}

class NotificationService {
  private static instance: NotificationService;

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async requestPermissions(): Promise<boolean> {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    return finalStatus === 'granted';
  }

  async scheduleLocalNotification(notification: NotificationData, trigger?: any): Promise<string> {
    const hasPermission = await this.requestPermissions();
    
    if (!hasPermission) {
      console.log('Notification permissions not granted');
      return '';
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: notification.title,
        body: notification.body,
        data: notification.data || {},
      },
      trigger: trigger || null, // null means send immediately
    });

    return notificationId;
  }

  async sendImmediateNotification(notification: NotificationData): Promise<string> {
    return this.scheduleLocalNotification(notification);
  }

  async scheduleBookingReminder(bookingId: string, petName: string, date: Date): Promise<string> {
    const trigger = new Date(date.getTime() - 60 * 60 * 1000); // 1 hour before
    
    return this.scheduleLocalNotification({
      title: 'Upcoming Pet Sitting',
      body: `Don't forget! You have a booking with ${petName} in 1 hour.`,
      data: { bookingId, type: 'booking_reminder' },
    }, trigger);
  }

  async sendBookingConfirmation(sitterName: string, petName: string): Promise<string> {
    return this.sendImmediateNotification({
      title: 'Booking Confirmed!',
      body: `${sitterName} has confirmed your booking for ${petName}.`,
      data: { type: 'booking_confirmation' },
    });
  }

  async sendNewRequest(sitterName: string, petName: string): Promise<string> {
    return this.sendImmediateNotification({
      title: 'New Sitting Request',
      body: `${sitterName} wants to sit for ${petName}.`,
      data: { type: 'new_request' },
    });
  }

  async cancelNotification(notificationId: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }

  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }
}

export default NotificationService.getInstance(); 