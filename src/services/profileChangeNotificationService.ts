import { Alert } from 'react-native';
import echoService from './echoService';
import echoServiceFallback from './echoServiceFallback';
import { EchoServiceInterface } from './echoServiceInterface';

interface ProfileChangeNotification {
  id: number;
  field_name: string;
  field_display_name: string;
  old_value: string;
  new_value: string;
  admin_notes?: string;
  reviewed_by: string;
  status: 'approved' | 'rejected';
  reviewed_at: string;
  message: string;
}

class ProfileChangeNotificationService {
  private static instance: ProfileChangeNotificationService;
  private isConnected = false;
  private currentService: EchoServiceInterface | null = null;

  private constructor() {}

  public static getInstance(): ProfileChangeNotificationService {
    if (!ProfileChangeNotificationService.instance) {
      ProfileChangeNotificationService.instance = new ProfileChangeNotificationService();
    }
    return ProfileChangeNotificationService.instance;
  }

  /**
   * Initialize the notification service
   */
  public async initialize(userId: string, authToken: string): Promise<boolean> {
    try {
      // Set auth token for private channels
      echoService.setAuthToken(authToken);
      echoServiceFallback.setAuthToken(authToken);

      // Try main Echo service first
      let connected = await echoService.connect();
      let service: EchoServiceInterface = echoService;

      // If main service fails, use fallback
      if (!connected) {
        console.warn('Main Echo service failed, using fallback polling service for profile change notifications');
        connected = await echoServiceFallback.connect();
        service = echoServiceFallback;
      }

      this.isConnected = connected;
      this.currentService = service;

      if (connected) {
        // Listen for profile change notifications
        this.setupProfileChangeListeners(userId, service);
        console.log('✅ Profile change notification service initialized successfully');
      } else {
        console.error('❌ Failed to initialize profile change notification service');
      }

      return connected;
    } catch (error) {
      console.error('❌ Error initializing profile change notification service:', error);
      return false;
    }
  }

  /**
   * Setup listeners for profile change notifications
   */
  private setupProfileChangeListeners(userId: string, service: EchoServiceInterface): void {
    // Listen for profile change approved notifications
    const approvedChannel = service.listenToUserNotifications(userId, (data: ProfileChangeNotification) => {
      console.log('📢 Profile change approved notification received:', data);
      this.handleProfileChangeApproved(data);
    });

    // Listen for profile change rejected notifications
    const rejectedChannel = service.listenToUserNotifications(userId, (data: ProfileChangeNotification) => {
      console.log('📢 Profile change rejected notification received:', data);
      this.handleProfileChangeRejected(data);
    });

    if (approvedChannel && rejectedChannel) {
      console.log('👂 Profile change notification listeners set up successfully');
    }
  }

  /**
   * Handle profile change approved notification
   */
  private handleProfileChangeApproved(notification: ProfileChangeNotification): void {
    Alert.alert(
      '✅ Profile Change Approved',
      `Your request to change your ${notification.field_display_name} has been approved!\n\n` +
      `Changed from: ${notification.old_value}\n` +
      `Changed to: ${notification.new_value}\n\n` +
      (notification.admin_notes ? `Admin notes: ${notification.admin_notes}` : ''),
      [{ text: 'OK' }]
    );
  }

  /**
   * Handle profile change rejected notification
   */
  private handleProfileChangeRejected(notification: ProfileChangeNotification): void {
    Alert.alert(
      '❌ Profile Change Rejected',
      `Your request to change your ${notification.field_display_name} has been rejected.\n\n` +
      `Reason: ${notification.admin_notes || 'No reason provided'}\n\n` +
      `Reviewed by: ${notification.reviewed_by}`,
      [{ text: 'OK' }]
    );
  }

  /**
   * Disconnect from notification service
   */
  public disconnect(): void {
    if (this.currentService) {
      this.currentService.disconnect();
      this.currentService = null;
    }
    this.isConnected = false;
    console.log('🔌 Profile change notification service disconnected');
  }

  /**
   * Check if service is connected
   */
  public isServiceConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Get connection status
   */
  public getConnectionStatus(): { connected: boolean; service: string } {
    return {
      connected: this.isConnected,
      service: this.currentService === echoService ? 'main' : 'fallback'
    };
  }
}

// Export singleton instance
const profileChangeNotificationService = ProfileChangeNotificationService.getInstance();
export default profileChangeNotificationService;
