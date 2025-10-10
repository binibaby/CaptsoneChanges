import { dashboardService } from './dashboardService';
import { paymentService } from './paymentService';

interface ReverbEvent {
  event: string;
  data: any;
  channel: string;
}

class RealtimeService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 5000;
  private isConnected = false;
  private userId: string | null = null;
  private listeners: Map<string, ((data: any) => void)[]> = new Map();

  /**
   * Initialize WebSocket connection
   */
  async initialize(userId: string): Promise<void> {
    this.userId = userId;
    await this.connect();
  }

  /**
   * Connect to Laravel Reverb WebSocket
   */
  private async connect(): Promise<void> {
    // Prevent multiple simultaneous connections
    if (this.isConnected || (this.ws && this.ws.readyState === WebSocket.CONNECTING)) {
      console.log('🔌 RealtimeService: Already connected or connecting');
      return;
    }
    
    // Clean up any existing connection
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    try {
      // Get the network service to get the correct base URL
      const { networkService } = require('./networkService');
      let baseUrl = networkService.getBaseUrl();
      
      // If baseUrl is empty or invalid, wait for network detection to complete
      if (!baseUrl || baseUrl.trim() === '') {
        console.log('🔄 Base URL not available, waiting for network detection...');
        baseUrl = await networkService.detectWorkingIP();
      }
      
      // Validate baseUrl before creating URL
      if (!baseUrl || baseUrl.trim() === '') {
        throw new Error('Unable to determine base URL for Reverb connection');
      }
      
      // Extract host and port from base URL
      let url: URL;
      let host: string;
      let wsUrl: string;
      
      try {
        url = new URL(baseUrl);
        host = url.hostname;
        wsUrl = `ws://${host}`;
      } catch (urlError) {
        console.error('❌ Invalid base URL:', baseUrl);
        throw new Error(`Invalid base URL: ${baseUrl}. Error: ${urlError}`);
      }
      
      // Connect to Laravel Reverb on port 8080
      const reverbUrl = `${wsUrl}:8080/app/${process.env.EXPO_PUBLIC_REVERB_APP_KEY || 'iycawpww023mjumkvwsj'}`;
      console.log('🔌 RealtimeService: Connecting to Reverb:', reverbUrl);
      console.log('🔌 RealtimeService: Base URL used:', baseUrl);
      console.log('🔌 RealtimeService: Host extracted:', host);
      
      this.ws = new WebSocket(reverbUrl);
      
      // Set up connection timeout
      const connectionTimeout = setTimeout(() => {
        if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
          console.log('⏰ RealtimeService: WebSocket connection timeout');
          this.ws.close();
        }
      }, 10000); // 10 second timeout

      this.ws.onopen = () => {
        clearTimeout(connectionTimeout);
        console.log('🔌 RealtimeService: Connected to Laravel Reverb');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.subscribeToUserChannel();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = (event) => {
        clearTimeout(connectionTimeout);
        console.log('🔌 RealtimeService: Connection closed');
        console.log('🔌 RealtimeService: Close code:', event.code, 'Reason:', event.reason);
        this.isConnected = false;
        this.ws = null;
        this.handleReconnect();
      };

      this.ws.onerror = (error) => {
        clearTimeout(connectionTimeout);
        console.warn('⚠️ RealtimeService: WebSocket connection failed - this is normal if Reverb server is not running');
        console.warn('⚠️ RealtimeService: WebSocket URL attempted:', reverbUrl);
        console.warn('⚠️ This error can be safely ignored - real-time features will use fallback methods');
        this.isConnected = false;
        
        // Don't schedule reconnect immediately on error - let onclose handle it
        // This prevents rapid reconnection attempts that can overwhelm the server
      };

    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
      this.handleReconnect();
    }
  }

  /**
   * Subscribe to user-specific channel
   */
  private subscribeToUserChannel(): void {
    if (!this.userId || !this.ws) return;

    const subscribeMessage = {
      event: 'pusher:subscribe',
      data: {
        channel: `private-user.${this.userId}`,
      },
    };

    this.ws.send(JSON.stringify(subscribeMessage));
    console.log(`🔌 RealtimeService: Subscribed to user.${this.userId} channel`);
  }

  /**
   * Handle incoming messages
   */
  private handleMessage(data: any): void {
    if (data.event === 'pusher:connection_established') {
      console.log('🔌 RealtimeService: Connection established');
      return;
    }

    if (data.event === 'pusher:subscription_succeeded') {
      console.log('🔌 RealtimeService: Subscription succeeded');
      return;
    }

    // Handle custom events
    if (data.event && data.data) {
      this.handleCustomEvent(data.event, data.data);
    }
  }

  /**
   * Handle custom events
   */
  private handleCustomEvent(eventName: string, data: any): void {
    console.log(`🔌 RealtimeService: Received event ${eventName}:`, data);

    switch (eventName) {
      case 'payment.received':
        this.handlePaymentReceived(data);
        break;
      case 'wallet.updated':
        this.handleWalletUpdated(data);
        break;
      case 'dashboard.updated':
        this.handleDashboardUpdated(data);
        break;
      case 'booking.status.changed':
        this.handleBookingStatusChanged(data);
        break;
      case 'session.started':
        this.handleSessionStarted(data);
        break;
      case 'booking.completed':
        this.handleBookingCompleted(data);
        break;
      case 'review.created':
        this.handleReviewCreated(data);
        break;
      default:
        // Notify generic listeners
        this.notifyListeners(eventName, data);
    }
  }

  /**
   * Handle payment received event
   */
  private handlePaymentReceived(data: any): void {
    console.log('💰 RealtimeService: Payment received:', data);
    
    // Update dashboard metrics
    dashboardService.onPaymentReceived(data.payment);
    
    // Show notification
    this.showNotification('Payment Received', `You received ${paymentService.formatCurrency(data.payment.sitter_share)}`);
    
    // Notify listeners
    this.notifyListeners('payment.received', data);
  }

  /**
   * Handle wallet updated event
   */
  private handleWalletUpdated(data: any): void {
    console.log('💳 RealtimeService: Wallet updated:', data);
    
    // Update dashboard metrics
    dashboardService.onWalletUpdated(data.wallet_balance);
    
    // Notify listeners
    this.notifyListeners('wallet.updated', data);
  }

  /**
   * Handle dashboard updated event
   */
  private handleDashboardUpdated(data: any): void {
    console.log('📊 RealtimeService: Dashboard updated:', data);
    
    // Update dashboard metrics
    dashboardService.updateMetrics(data);
    
    // Notify listeners
    this.notifyListeners('dashboard.updated', data);
  }

  /**
   * Handle booking status changed event
   */
  private handleBookingStatusChanged(data: any): void {
    console.log('📅 RealtimeService: Booking status changed:', data);
    
    // Update dashboard metrics
    dashboardService.onBookingStatusChanged(
      data.booking,
      data.old_status,
      data.new_status
    );
    
    // Show notification
    const statusMessages = {
      'confirmed': 'Booking Confirmed',
      'active': 'Booking Started',
      'completed': 'Booking Completed',
      'cancelled': 'Booking Cancelled',
    };
    
    const message = statusMessages[data.new_status as keyof typeof statusMessages];
    if (message) {
      this.showNotification(message, `Booking #${data.booking.id} is now ${data.new_status}`);
    }
    
    // Notify listeners
    this.notifyListeners('booking.status.changed', data);
  }

  /**
   * Handle session started event
   */
  private handleSessionStarted(data: any): void {
    console.log('🚀 RealtimeService: Session started:', data);
    
    // Show notification
    this.showNotification(
      'Session Started', 
      `Your sitter ${data.sitter_name} has started the session for your booking.`
    );
    
    // Notify listeners
    this.notifyListeners('session.started', data);
  }

  /**
   * Handle booking completed event
   */
  private handleBookingCompleted(data: any): void {
    console.log('✅ RealtimeService: Booking completed:', data);
    
    // Show notification
    this.showNotification(
      'Booking Completed', 
      `Your booking with ${data.sitter_name} is now completed. You can rate and review your sitter.`
    );
    
    // Notify listeners
    this.notifyListeners('booking.completed', data);
  }

  /**
   * Handle review created event
   */
  private handleReviewCreated(data: any): void {
    console.log('⭐ RealtimeService: Review created:', data);
    
    // Show notification
    this.showNotification(
      'New Review Received', 
      `You received a new ${data.rating}-star review from ${data.owner_name}.`
    );
    
    // Notify listeners
    this.notifyListeners('review.created', data);
  }

  /**
   * Subscribe to specific events
   */
  subscribe(eventName: string, callback: (data: any) => void): () => void {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, []);
    }
    
    this.listeners.get(eventName)!.push(callback);
    
    // Return unsubscribe function
    return () => {
      const eventListeners = this.listeners.get(eventName);
      if (eventListeners) {
        const index = eventListeners.indexOf(callback);
        if (index > -1) {
          eventListeners.splice(index, 1);
        }
      }
    };
  }

  /**
   * Notify listeners for a specific event
   */
  private notifyListeners(eventName: string, data: any): void {
    const eventListeners = this.listeners.get(eventName);
    if (eventListeners) {
      eventListeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error(`Error in event listener for ${eventName}:`, error);
        }
      });
    }
  }

  /**
   * Show notification (you can integrate with your notification service)
   */
  private showNotification(title: string, body: string): void {
    // This is a placeholder - integrate with your notification service
    console.log(`🔔 Notification: ${title} - ${body}`);
    
    // You can integrate with expo-notifications here
    // import * as Notifications from 'expo-notifications';
    // Notifications.scheduleNotificationAsync({
    //   content: { title, body },
    //   trigger: null,
    // });
  }

  /**
   * Handle reconnection
   */
  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('🔌 RealtimeService: Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    // Use exponential backoff with jitter to prevent thundering herd
    const baseDelay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    const jitter = Math.random() * 1000; // Add up to 1 second of jitter
    const delay = baseDelay + jitter;
    
    console.log(`🔌 RealtimeService: Attempting to reconnect in ${Math.round(delay)}ms (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(() => {
      if (this.userId) {
        this.connect();
      }
    }, delay);
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    this.listeners.clear();
  }

  /**
   * Check if connected
   */
  isWebSocketConnected(): boolean {
    return this.isConnected && this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Send message to server (if needed)
   */
  send(event: string, data: any): void {
    if (this.ws && this.isConnected) {
      const message = {
        event,
        data,
      };
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, cannot send message');
    }
  }

  /**
   * Force refresh connection
   */
  async forceRefresh(): Promise<void> {
    console.log('🔄 RealtimeService: Force refreshing connection...');
    this.disconnect();
    if (this.userId) {
      await this.initialize(this.userId);
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): { connected: boolean; userId: string | null } {
    return {
      connected: this.isConnected,
      userId: this.userId
    };
  }
}

export const realtimeService = new RealtimeService();
