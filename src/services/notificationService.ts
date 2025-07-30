import * as Notifications from 'expo-notifications';

export interface NotificationData {
  title: string;
  body: string;
  data?: any;
  priority?: 'default' | 'high' | 'low';
  sound?: boolean;
  badge?: number;
}

export interface NotificationTemplate {
  id: string;
  title: string;
  body: string;
  type: 'booking' | 'payment' | 'verification' | 'admin' | 'system';
  triggers: string[];
}

class NotificationService {
  private static instance: NotificationService;
  private notificationTemplates: Map<string, NotificationTemplate> = new Map();

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  constructor() {
    this.initializeTemplates();
  }

  private initializeTemplates(): void {
    const templates: NotificationTemplate[] = [
      {
        id: 'booking_confirmation',
        title: 'Booking Confirmed!',
        body: '{{sitterName}} has confirmed your booking for {{petName}}.',
        type: 'booking',
        triggers: ['booking_confirmed'],
      },
      {
        id: 'booking_reminder',
        title: 'Upcoming Pet Sitting',
        body: 'Don\'t forget! You have a booking with {{petName}} in 1 hour.',
        type: 'booking',
        triggers: ['booking_reminder'],
      },
      {
        id: 'payment_success',
        title: 'Payment Successful!',
        body: 'Your payment of {{amount}} has been processed successfully.',
        type: 'payment',
        triggers: ['payment_success'],
      },
      {
        id: 'payment_failed',
        title: 'Payment Failed',
        body: 'Your payment of {{amount}} could not be processed. Please try again.',
        type: 'payment',
        triggers: ['payment_failed'],
      },
      {
        id: 'verification_approved',
        title: 'Verification Approved!',
        body: 'Congratulations! Your ID verification has been approved.',
        type: 'verification',
        triggers: ['verification_approved'],
      },
      {
        id: 'verification_rejected',
        title: 'Verification Update',
        body: 'Your verification was not approved. Please check the details and resubmit.',
        type: 'verification',
        triggers: ['verification_rejected'],
      },
      {
        id: 'admin_action',
        title: 'Account Update',
        body: '{{action}} - {{reason}}',
        type: 'admin',
        triggers: ['user_suspended', 'user_banned', 'user_approved'],
      },
      {
        id: 'new_booking_request',
        title: 'New Sitting Request',
        body: '{{ownerName}} wants to book your services for {{petName}}.',
        type: 'booking',
        triggers: ['new_booking_request'],
      },
      {
        id: 'booking_cancelled',
        title: 'Booking Cancelled',
        body: 'Your booking with {{sitterName}} for {{petName}} has been cancelled.',
        type: 'booking',
        triggers: ['booking_cancelled'],
      },
      {
        id: 'payment_received',
        title: 'Payment Received!',
        body: 'You received {{amount}} for your pet sitting service.',
        type: 'payment',
        triggers: ['payment_received'],
      },
    ];

    templates.forEach(template => {
      this.notificationTemplates.set(template.id, template);
    });
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
        sound: notification.sound !== false,
        badge: notification.badge,
        priority: notification.priority || 'default',
      },
      trigger: trigger || null, // null means send immediately
    });

    return notificationId;
  }

  async sendImmediateNotification(notification: NotificationData): Promise<string> {
    return this.scheduleLocalNotification(notification);
  }

  // Enhanced notification methods with templates
  async sendTemplateNotification(
    templateId: string,
    variables: Record<string, string>,
    options?: Partial<NotificationData>
  ): Promise<string> {
    const template = this.notificationTemplates.get(templateId);
    if (!template) {
      throw new Error(`Notification template ${templateId} not found`);
    }

    let title = template.title;
    let body = template.body;

    // Replace variables in template
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      title = title.replace(placeholder, value);
      body = body.replace(placeholder, value);
    });

    return this.sendImmediateNotification({
      title,
      body,
      data: { templateId, type: template.type, ...variables },
      ...options,
    });
  }

  // Booking-related notifications
  async sendBookingConfirmation(sitterName: string, petName: string): Promise<string> {
    return this.sendTemplateNotification('booking_confirmation', {
      sitterName,
      petName,
    });
  }

  async sendNewBookingRequest(ownerName: string, petName: string): Promise<string> {
    return this.sendTemplateNotification('new_booking_request', {
      ownerName,
      petName,
    });
  }

  async sendBookingCancellation(sitterName: string, petName: string): Promise<string> {
    return this.sendTemplateNotification('booking_cancelled', {
      sitterName,
      petName,
    });
  }

  async scheduleBookingReminder(bookingId: string, petName: string, date: Date): Promise<string> {
    const trigger = new Date(date.getTime() - 60 * 60 * 1000); // 1 hour before
    
    return this.scheduleLocalNotification({
      title: 'Upcoming Pet Sitting',
      body: `Don't forget! You have a booking with ${petName} in 1 hour.`,
      data: { bookingId, type: 'booking_reminder' },
      priority: 'high',
    }, trigger);
  }

  // Payment-related notifications
  async sendPaymentSuccess(amount: string): Promise<string> {
    return this.sendTemplateNotification('payment_success', { amount });
  }

  async sendPaymentFailed(amount: string): Promise<string> {
    return this.sendTemplateNotification('payment_failed', { amount });
  }

  async sendPaymentReceived(amount: string): Promise<string> {
    return this.sendTemplateNotification('payment_received', { amount });
  }

  // Verification-related notifications
  async sendVerificationApproved(): Promise<string> {
    return this.sendTemplateNotification('verification_approved', {});
  }

  async sendVerificationRejected(): Promise<string> {
    return this.sendTemplateNotification('verification_rejected', {});
  }

  // Admin action notifications
  async sendAdminAction(action: string, reason: string): Promise<string> {
    return this.sendTemplateNotification('admin_action', { action, reason });
  }

  // System notifications
  async sendSystemNotification(title: string, body: string, data?: any): Promise<string> {
    return this.sendImmediateNotification({
      title,
      body,
      data: { type: 'system', ...data },
      priority: 'high',
    });
  }

  // Bulk notifications for admin actions
  async sendBulkNotifications(
    userIds: string[],
    templateId: string,
    variables: Record<string, string>
  ): Promise<string[]> {
    const promises = userIds.map(() => this.sendTemplateNotification(templateId, variables));
    return Promise.all(promises);
  }

  // Scheduled notifications
  async scheduleRecurringNotification(
    notification: NotificationData,
    interval: 'daily' | 'weekly' | 'monthly'
  ): Promise<string> {
    const trigger = this.getRecurringTrigger(interval);
    return this.scheduleLocalNotification(notification, trigger);
  }

  private getRecurringTrigger(interval: 'daily' | 'weekly' | 'monthly'): any {
    switch (interval) {
      case 'daily':
        return {
          hour: 9,
          minute: 0,
          repeats: true,
        };
      case 'weekly':
        return {
          weekday: 1, // Monday
          hour: 9,
          minute: 0,
          repeats: true,
        };
      case 'monthly':
        return {
          day: 1,
          hour: 9,
          minute: 0,
          repeats: true,
        };
      default:
        return null;
    }
  }

  // Notification management
  async cancelNotification(notificationId: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }

  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  async getScheduledNotifications(): Promise<any[]> {
    return await Notifications.getAllScheduledNotificationsAsync();
  }

  // Get notification statistics
  async getNotificationStats(): Promise<{
    totalSent: number;
    totalScheduled: number;
    byType: Record<string, number>;
  }> {
    const scheduled = await this.getScheduledNotifications();
    
    return {
      totalSent: 1250, // Mock data
      totalScheduled: scheduled.length,
      byType: {
        booking: 450,
        payment: 300,
        verification: 200,
        admin: 150,
        system: 150,
      },
    };
  }
}

export default NotificationService.getInstance(); 