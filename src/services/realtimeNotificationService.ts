// RealtimeNotificationService - Real-time notifications using Laravel Reverb
// This service handles real-time notifications for profile changes, booking updates, etc.

import EchoService from './echoService';
import { notificationService } from './notificationService';

export interface RealtimeNotificationData {
  type: 'profile_change_approved' | 'profile_change_rejected' | 'id_verification_approved' | 'id_verification_rejected' | 'booking_confirmed' | 'booking_cancelled' | 'booking_updated' | 'session_started' | 'booking_completed' | 'new_review';
  message: string;
  title: string;
  data?: any;
  user_id?: string;
  timestamp: string;
}

class RealtimeNotificationService {
  private static instance: RealtimeNotificationService;
  private echoService: EchoService;
  private isInitialized = false;
  private listeners: ((notification: RealtimeNotificationData) => void)[] = [];

  private constructor() {
    // Initialize EchoService lazily to avoid circular dependencies
    try {
      this.echoService = EchoService;
    } catch (error) {
      console.warn('⚠️ EchoService not available:', error);
      this.echoService = null;
    }
  }

  static getInstance(): RealtimeNotificationService {
    if (!RealtimeNotificationService.instance) {
      RealtimeNotificationService.instance = new RealtimeNotificationService();
    }
    return RealtimeNotificationService.instance;
  }

  // Initialize the service with user authentication
  async initialize(userId: string, authToken: string): Promise<boolean> {
    try {
      console.log('🔔 Initializing RealtimeNotificationService for user:', userId);
      
      // Check if EchoService is available
      if (!this.echoService) {
        console.warn('⚠️ EchoService not available, real-time notifications disabled');
        return false;
      }
      
      // Set auth token for Echo service
      this.echoService.setAuthToken(authToken);
      
      // Initialize Echo service
      const echoInitialized = await this.echoService.initialize();
      if (!echoInitialized) {
        console.warn('⚠️ Echo service not initialized, real-time notifications disabled');
        return false;
      }

      // Set up real-time listeners
      this.setupRealtimeListeners(userId);
      
      this.isInitialized = true;
      console.log('✅ RealtimeNotificationService initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize RealtimeNotificationService:', error);
      return false;
    }
  }

  // Set up real-time event listeners
  private setupRealtimeListeners(userId: string) {
    if (!this.echoService) {
      console.warn('⚠️ EchoService not available, cannot set up real-time listeners');
      return;
    }
    
    const echo = this.echoService.getEcho();
    if (!echo) {
      console.warn('⚠️ Echo not available for real-time listeners');
      return;
    }

    console.log('🔔 Setting up real-time notification listeners for user:', userId);

    // Listen for profile change approvals
    echo.private(`user.${userId}`)
      .listen('profile-change-approved', (data: any) => {
        console.log('🔔 Profile change approved notification received:', data);
        this.handleRealtimeNotification({
          type: 'profile_change_approved',
          title: 'Profile Update Approved',
          message: data.message || 'Your profile update request has been approved!',
          data: data.profile_request || data,
          user_id: userId,
          timestamp: new Date().toISOString()
        });
      });

    // Listen for profile change rejections
    echo.private(`user.${userId}`)
      .listen('profile-change-rejected', (data: any) => {
        console.log('🔔 Profile change rejected notification received:', data);
        this.handleRealtimeNotification({
          type: 'profile_change_rejected',
          title: 'Profile Update Rejected',
          message: data.message || 'Your profile update request has been rejected. Please email the admin at petsitconnectph@gmail.com for assistance.',
          data: data.profile_request || data,
          user_id: userId,
          timestamp: new Date().toISOString()
        });
      });

    // Listen for ID verification status updates
    echo.private(`user.${userId}`)
      .listen('id.verification.updated', (data: any) => {
        console.log('🔔 ID verification status updated notification received:', data);
        const isApproved = data.status === 'approved' || data.verification?.status === 'approved';
        this.handleRealtimeNotification({
          type: isApproved ? 'id_verification_approved' : 'id_verification_rejected',
          title: isApproved ? 'ID Verification Approved' : 'ID Verification Rejected',
          message: data.message || (isApproved ? '🎉 Congratulations! Your ID verification has been approved! You can now start accepting jobs and bookings.' : 'Your ID verification has been rejected. Please contact the admin at petsitconnectph@gmail.com for further assistance in resolving this issue.'),
          data: data.verification || data,
          user_id: userId,
          timestamp: new Date().toISOString()
        });
      });

    // Listen for booking status updates
    echo.private(`user.${userId}`)
      .listen('booking.status.updated', (data: any) => {
        console.log('🔔 Booking status updated notification received:', data);
        const status = data.status || data.booking?.status;
        let type: RealtimeNotificationData['type'];
        let title: string;
        let message: string;

        switch (status) {
          case 'confirmed':
            type = 'booking_confirmed';
            title = 'Booking Confirmed';
            message = 'Your booking has been confirmed by the pet sitter!';
            break;
          case 'cancelled':
            type = 'booking_cancelled';
            title = 'Booking Cancelled';
            message = 'Your booking has been cancelled.';
            break;
          default:
            type = 'booking_updated';
            title = 'Booking Updated';
            message = 'Your booking status has been updated.';
        }

        this.handleRealtimeNotification({
          type,
          title,
          message,
          data: data.booking || data,
          user_id: userId,
          timestamp: new Date().toISOString()
        });
      });

    // Listen for ID verification status updates
    echo.private(`user.${userId}`)
      .listen('id.verification.updated', (data: any) => {
        console.log('🔔 ID verification status updated notification received:', data);
        const status = data.status || data.verification?.status;
        let type: RealtimeNotificationData['type'];
        let title: string;
        let message: string;

        switch (status) {
          case 'approved':
            type = 'id_verification_approved';
            title = 'ID Verification Approved';
            message = data.message || '🎉 Congratulations! Your ID verification has been approved! Your account is now verified.';
            break;
          case 'rejected':
            type = 'id_verification_rejected';
            title = 'ID Verification Rejected';
            message = data.message || 'Your ID verification has been rejected. Please email admin at petsitconnectph@gmail.com to fix it.';
            break;
          default:
            type = 'id_verification_updated';
            title = 'ID Verification Updated';
            message = data.message || 'Your ID verification status has been updated.';
        }

        this.handleRealtimeNotification({
          type,
          title,
          message,
          data: data.verification || data,
          user_id: userId,
          timestamp: new Date().toISOString()
        });
      });

    // Listen for session started notifications
    echo.private(`user.${userId}`)
      .listen('session.started', (data: any) => {
        console.log('🔔 Session started notification received:', data);
        this.handleRealtimeNotification({
          type: 'session_started',
          title: 'Session Started',
          message: data.message || 'Your sitter has started the session.',
          data: data,
          user_id: userId,
          timestamp: new Date().toISOString()
        });
      });

    // Listen for booking completed notifications
    echo.private(`user.${userId}`)
      .listen('booking.completed', (data: any) => {
        console.log('🔔 Booking completed notification received:', data);
        this.handleRealtimeNotification({
          type: 'booking_completed',
          title: 'Booking Completed',
          message: data.message || 'Your booking has been completed.',
          data: data,
          user_id: userId,
          timestamp: new Date().toISOString()
        });
      });

    // Listen for new review notifications
    echo.private(`user.${userId}`)
      .listen('review.created', (data: any) => {
        console.log('🔔 New review notification received:', data);
        this.handleRealtimeNotification({
          type: 'new_review',
          title: 'New Review Received',
          message: data.message || 'You received a new review!',
          data: data,
          user_id: userId,
          timestamp: new Date().toISOString()
        });
      });

    // Listen for payment success notifications
    echo.private(`user.${userId}`)
      .listen('payment.success', (data: any) => {
        console.log('🔔 Payment success notification received:', data);
        this.handleRealtimeNotification({
          type: 'payment_success',
          title: 'Payment Successful',
          message: data.message || 'Your payment has been processed successfully!',
          data: data,
          user_id: userId,
          timestamp: new Date().toISOString()
        });
      });

    // Listen for payment received notifications (for sitters)
    echo.private(`user.${userId}`)
      .listen('payment.received', (data: any) => {
        console.log('🔔 Payment received notification received:', data);
        this.handleRealtimeNotification({
          type: 'payment_received',
          title: 'Payment Received',
          message: data.message || `You received ₱${data.payment?.sitter_share || data.payment?.amount || '0'} for your service!`,
          data: data,
          user_id: userId,
          timestamp: new Date().toISOString()
        });
      });

    // Listen for wallet updated notifications (for sitters)
    echo.private(`user.${userId}`)
      .listen('wallet.updated', (data: any) => {
        console.log('🔔 Wallet updated notification received:', data);
        this.handleRealtimeNotification({
          type: 'wallet_updated',
          title: 'Wallet Updated',
          message: data.message || `Your wallet balance is now ₱${data.wallet_balance || '0'}`,
          data: data,
          user_id: userId,
          timestamp: new Date().toISOString()
        });
      });

    // Listen for dashboard updated notifications (for sitters)
    echo.private(`user.${userId}`)
      .listen('dashboard.updated', (data: any) => {
        console.log('🔔 Dashboard updated notification received:', data);
        this.handleRealtimeNotification({
          type: 'dashboard_updated',
          title: 'Dashboard Updated',
          message: data.message || 'Your dashboard has been updated with new information.',
          data: data,
          user_id: userId,
          timestamp: new Date().toISOString()
        });
      });

    // Listen for booking confirmed notifications (for sitters)
    echo.private(`user.${userId}`)
      .listen('booking.confirmed', (data: any) => {
        console.log('🔔 Booking confirmed notification received:', data);
        this.handleRealtimeNotification({
          type: 'booking_confirmed',
          title: 'Booking Confirmed',
          message: data.message || 'A new booking has been confirmed for you!',
          data: data,
          user_id: userId,
          timestamp: new Date().toISOString()
        });
      });

    // Listen for session started notifications (for pet owners)
    echo.private(`user.${userId}`)
      .listen('session.started', (data: any) => {
        console.log('🔔 Session started notification received:', data);
        this.handleRealtimeNotification({
          type: 'session_started',
          title: 'Session Started',
          message: data.message || 'Your sitter has started the session!',
          data: data,
          user_id: userId,
          timestamp: new Date().toISOString()
        });
      });

    // Listen for general notifications
    echo.private(`user.${userId}`)
      .listen('notification.received', (data: any) => {
        console.log('🔔 General notification received:', data);
        this.handleRealtimeNotification({
          type: data.type || 'booking_updated',
          title: data.title || 'Notification',
          message: data.message || 'You have a new notification.',
          data: data.data || data,
          user_id: userId,
          timestamp: new Date().toISOString()
        });
      });

    console.log('✅ Real-time notification listeners set up successfully');
  }

  // Handle incoming real-time notifications
  private async handleRealtimeNotification(notificationData: RealtimeNotificationData) {
    try {
      console.log('🔔 Processing real-time notification:', notificationData);

      // Add notification to local storage via notification service
      await notificationService.addNotificationForUser(notificationData.user_id!, {
        type: this.mapNotificationType(notificationData.type),
        title: notificationData.title,
        message: notificationData.message,
        action: this.getActionForType(notificationData.type),
        data: notificationData.data
      });

      // Notify all listeners
      this.listeners.forEach(listener => {
        try {
          listener(notificationData);
        } catch (error) {
          console.error('❌ Error in notification listener:', error);
        }
      });

      console.log('✅ Real-time notification processed successfully');
    } catch (error) {
      console.error('❌ Error handling real-time notification:', error);
    }
  }

  // Map real-time notification type to local notification type
  private mapNotificationType(type: RealtimeNotificationData['type']): 'booking' | 'message' | 'review' | 'system' {
    switch (type) {
      case 'profile_change_approved':
      case 'profile_change_rejected':
      case 'id_verification_approved':
      case 'id_verification_rejected':
        return 'system';
      case 'booking_confirmed':
      case 'booking_cancelled':
      case 'booking_updated':
      case 'session_started':
      case 'booking_completed':
        return 'booking';
      case 'new_review':
        return 'review';
      default:
        return 'system';
    }
  }

  // Get action text for notification type
  private getActionForType(type: RealtimeNotificationData['type']): string {
    switch (type) {
      case 'profile_change_approved':
      case 'profile_change_rejected':
        return 'View Profile';
      case 'id_verification_approved':
      case 'id_verification_rejected':
        return 'View Verification';
      case 'booking_confirmed':
      case 'booking_cancelled':
      case 'booking_updated':
      case 'session_started':
      case 'booking_completed':
        return 'View Booking';
      case 'new_review':
        return 'View Reviews';
      default:
        return 'View Details';
    }
  }

  // Subscribe to real-time notifications
  subscribe(listener: (notification: RealtimeNotificationData) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Check if service is initialized
  isServiceInitialized(): boolean {
    return this.isInitialized;
  }

  // Disconnect from real-time service
  disconnect() {
    try {
      if (this.echoService) {
        const echo = this.echoService.getEcho();
        if (echo) {
          echo.disconnect();
        }
      }
      this.isInitialized = false;
      this.listeners = [];
      console.log('🔌 RealtimeNotificationService disconnected');
    } catch (error) {
      console.error('❌ Error disconnecting RealtimeNotificationService:', error);
    }
  }
}

export const realtimeNotificationService = RealtimeNotificationService.getInstance();
