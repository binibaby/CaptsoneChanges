import { Alert } from 'react-native';
import echoService from './echoService';
import echoServiceFallback from './echoServiceFallback';
import { EchoServiceInterface } from './echoServiceInterface';

interface AdminProfileChangeNotification {
  id: number;
  user_name: string;
  user_email: string;
  field_name: string;
  field_display_name: string;
  old_value: string;
  new_value: string;
  reason: string;
  status: 'pending';
  created_at: string;
  message: string;
}

class AdminNotificationService {
  private static instance: AdminNotificationService;
  private isConnected = false;
  private currentService: EchoServiceInterface | null = null;

  private constructor() {}

  public static getInstance(): AdminNotificationService {
    if (!AdminNotificationService.instance) {
      AdminNotificationService.instance = new AdminNotificationService();
    }
    return AdminNotificationService.instance;
  }

  /**
   * Initialize the admin notification service
   */
  public async initialize(authToken: string): Promise<boolean> {
    try {
      // Set auth token for private channels
      echoService.setAuthToken(authToken);
      echoServiceFallback.setAuthToken(authToken);

      // Try main Echo service first
      let connected = await echoService.connect();
      let service: EchoServiceInterface = echoService;

      // If main service fails, use fallback
      if (!connected) {
        console.warn('Main Echo service failed, using fallback polling service for admin notifications');
        connected = await echoServiceFallback.connect();
        service = echoServiceFallback;
      }

      this.isConnected = connected;
      this.currentService = service;

      if (connected) {
        // Listen for admin notifications
        this.setupAdminListeners(service);
        console.log('✅ Admin notification service initialized successfully');
      } else {
        console.error('❌ Failed to initialize admin notification service');
      }

      return connected;
    } catch (error) {
      console.error('❌ Error initializing admin notification service:', error);
      return false;
    }
  }

  /**
   * Setup listeners for admin notifications
   */
  private setupAdminListeners(service: EchoServiceInterface): void {
    // Listen for profile change request notifications
    const adminChannel = service.listenToAdminNotifications((data: AdminProfileChangeNotification) => {
      console.log('📢 Admin profile change request notification received:', data);
      this.handleProfileChangeRequest(data);
    });

    if (adminChannel) {
      console.log('👂 Admin notification listeners set up successfully');
    }
  }

  /**
   * Handle profile change request notification
   */
  private handleProfileChangeRequest(notification: AdminProfileChangeNotification): void {
    Alert.alert(
      '📝 New Profile Change Request',
      `${notification.user_name} (${notification.user_email}) has submitted a request to change their ${notification.field_display_name}.\n\n` +
      `From: ${notification.old_value || 'Not set'}\n` +
      `To: ${notification.new_value}\n\n` +
      `Reason: ${notification.reason || 'No reason provided'}`,
      [
        { text: 'View Later', style: 'cancel' },
        { 
          text: 'Review Now', 
          onPress: () => {
            // Navigate to admin page - this would need to be implemented
            console.log('Navigate to admin profile change requests page');
          }
        }
      ]
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
    console.log('🔌 Admin notification service disconnected');
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
const adminNotificationService = AdminNotificationService.getInstance();
export default adminNotificationService;
