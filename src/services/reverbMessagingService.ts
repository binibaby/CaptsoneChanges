// ReverbMessagingService - Real-time messaging using Laravel Reverb
// This service provides real-time messaging functionality using WebSockets

export interface ReverbMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  is_read: boolean;
  type: string;
  booking_id?: string;
  created_at: string;
  sender: {
    id: string;
    name: string;
    profile_image: string | null;
  };
}

export interface ReverbConversation {
  conversation_id: string;
  other_user: {
    id: string;
    name: string;
    profile_image: string | null;
  };
  last_message: ReverbMessage | null;
  unread_count: number;
  updated_at: string;
}

// Simple EventEmitter implementation for React Native
class EventEmitter {
  private events: { [key: string]: Function[] } = {};

  on(event: string, listener: Function) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
  }

  off(event: string, listener: Function) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(l => l !== listener);
  }

  emit(event: string, ...args: any[]) {
    if (!this.events[event]) return;
    this.events[event].forEach(listener => listener(...args));
  }
}

class ReverbMessagingService extends EventEmitter {
  private static instance: ReverbMessagingService;
  private ws: WebSocket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval: NodeJS.Timeout | null = null;
  // No in-memory storage - use real API only
  private authToken: string | null = null;

  static getInstance(): ReverbMessagingService {
    if (!ReverbMessagingService.instance) {
      console.log('🔄 Creating new ReverbMessagingService instance');
      ReverbMessagingService.instance = new ReverbMessagingService();
    } else {
      console.log('♻️ Returning existing ReverbMessagingService instance');
    }
    return ReverbMessagingService.instance;
  }

  private constructor() {
    super();
    console.log('✅ ReverbMessagingService initialized');
    this.initializeAuth();
  }

  private async initializeAuth() {
    try {
      // Get auth token from auth service
      const { default: authService } = await import('./authService');
      const user = await authService.getCurrentUser(); // Make sure to await this
      if (user && user.token) {
        this.authToken = user.token;
        console.log('🔑 Auth token loaded for Reverb service');
        this.connect();
      } else {
        console.log('⚠️ No auth token available for Reverb service - will retry on first API call');
      }
    } catch (error) {
      console.error('❌ Error initializing auth for Reverb:', error);
    }
  }

  private async ensureAuthToken(): Promise<string> {
    if (this.authToken) {
      console.log('🔑 Using cached auth token');
      return this.authToken;
    }

    try {
      console.log('🔍 Attempting to get auth token...');
      const { default: authService } = await import('./authService');
      // authService is already an instance (AuthService.getInstance())
      const user = await authService.getCurrentUser();
      console.log('🔍 User object for token:', user);
      console.log('🔍 User type:', typeof user);
      console.log('🔍 User keys:', user ? Object.keys(user) : 'null');
      
      if (user) {
        // Try different possible token properties
        const token = user.token || user.access_token || user.authToken || user.api_token;
        console.log('🔍 Token candidates:', {
          token: user.token,
          access_token: user.access_token,
          authToken: user.authToken,
          api_token: user.api_token
        });
        
        if (token) {
          this.authToken = token;
          console.log('🔑 Auth token loaded for Reverb service:', token.substring(0, 20) + '...');
          return this.authToken;
        } else {
          console.log('❌ No token found in user object. Available properties:', Object.keys(user));
          
          // Try to get token directly from AsyncStorage as fallback
          try {
            console.log('🔍 Trying AsyncStorage fallback...');
            const AsyncStorage = require('@react-native-async-storage/async-storage').default;
            const storedUser = await AsyncStorage.getItem('user');
            console.log('🔍 Stored user from AsyncStorage:', storedUser ? 'found' : 'not found');
            
            if (storedUser) {
              const parsedUser = JSON.parse(storedUser);
              console.log('🔍 Parsed user from AsyncStorage:', parsedUser);
              const storedToken = parsedUser.token;
              if (storedToken) {
                this.authToken = storedToken;
                console.log('🔑 Auth token loaded from AsyncStorage fallback:', storedToken.substring(0, 20) + '...');
                return this.authToken;
              } else {
                console.log('❌ No token in AsyncStorage user data');
              }
            }
          } catch (storageError) {
            console.error('❌ Error getting token from AsyncStorage:', storageError);
          }
          
          throw new Error('No auth token found in user object');
        }
      } else {
        console.log('❌ No user found from authService');
        throw new Error('No authenticated user found');
      }
    } catch (error) {
      console.error('❌ Error getting auth token:', error);
      throw new Error('Authentication required. Please log in again.');
    }
  }

  public async connect() {
    console.log('🔌 Attempting WebSocket connection to Laravel Reverb...');
    // Re-enabled WebSocket connection for real-time notifications
    
    if (this.isConnected || (this.ws && this.ws.readyState === WebSocket.CONNECTING)) {
      console.log('🔄 Already connected or connecting');
      return;
    }
    
    // Clean up any existing connection
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    try {
      // Ensure we have an auth token
      const token = await this.ensureAuthToken();
      
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
      
      // Check if we're in development mode and should skip Reverb connection
      if (__DEV__ && (host === 'localhost' || host === '127.0.0.1')) {
        console.log('🔌 Development mode detected - skipping Reverb connection to prevent errors');
        console.log('🔌 Real-time features will use fallback methods');
        return;
      }
      
      // Connect to Laravel Reverb on port 8080
      const reverbUrl = `${wsUrl}:8080/app/${process.env.EXPO_PUBLIC_REVERB_APP_KEY || 'iycawpww023mjumkvwsj'}`;
      console.log('🔌 Connecting to Reverb:', reverbUrl);
      console.log('🔌 Base URL used:', baseUrl);
      console.log('🔌 Host extracted:', host);
      
      this.ws = new WebSocket(reverbUrl);
      
      // Set up connection timeout
      const connectionTimeout = setTimeout(() => {
        if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
          console.log('⏰ WebSocket connection timeout');
          this.ws.close();
        }
      }, 10000); // 10 second timeout
      
      this.ws.onopen = () => {
        clearTimeout(connectionTimeout);
        console.log('✅ Connected to Laravel Reverb');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.emit('connected');
        
        // Subscribe to user's private channel
        this.subscribeToUserChannel();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('❌ Error parsing Reverb message:', error);
        }
      };

      this.ws.onclose = (event) => {
        clearTimeout(connectionTimeout);
        console.log('🔌 Disconnected from Laravel Reverb');
        console.log('🔌 Close code:', event.code, 'Reason:', event.reason);
        this.isConnected = false;
        this.ws = null;
        this.emit('disconnected');
        this.scheduleReconnect();
      };

      this.ws.onerror = (error) => {
        clearTimeout(connectionTimeout);
        console.warn('⚠️ Reverb WebSocket connection failed - this is normal if Reverb server is not running');
        console.warn('⚠️ WebSocket URL attempted:', reverbUrl);
        console.warn('⚠️ This error can be safely ignored - real-time features will use fallback methods');
        
        // Don't emit error to prevent console spam - this is expected behavior
        // when Reverb server is not running
        this.isConnected = false;
        
        // Don't schedule reconnect immediately on error - let onclose handle it
        // This prevents rapid reconnection attempts that can overwhelm the server
      };

    } catch (error) {
      console.error('❌ Error connecting to Reverb:', error);
      this.scheduleReconnect();
    }
  }

  private async subscribeToUserChannel() {
    if (!this.ws || !this.isConnected) return;

    try {
      const token = await this.ensureAuthToken();
      
      // Subscribe to user's private channel for messages
      const subscribeMessage = {
        event: 'pusher:subscribe',
        data: {
          channel: `private-user.${token}` // Using token as user ID for now
        }
      };

      this.ws.send(JSON.stringify(subscribeMessage));
      console.log('📡 Subscribed to user channel');
    } catch (error) {
      console.error('❌ Error subscribing to user channel:', error);
    }
  }

  private handleMessage(data: any) {
    console.log('📨 Received Reverb message:', data);

    if (data.event === 'pusher:subscription_succeeded') {
      console.log('✅ Successfully subscribed to channel');
      return;
    }

    if (data.event === 'MessageSent') {
      const message = data.data.message;
      this.handleNewMessage(message);
    }
  }

  private handleNewMessage(message: ReverbMessage) {
    console.log('💬 New message received:', message);
    
    // Just emit the message - no local storage
    console.log('💬 New message received via WebSocket:', message);

    // Emit event for UI updates
    this.emit('message', message);
    this.emit('conversationUpdated', message.conversation_id);
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('❌ Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    // Use exponential backoff with jitter to prevent thundering herd
    const baseDelay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    const jitter = Math.random() * 1000; // Add up to 1 second of jitter
    const delay = baseDelay + jitter;
    
    console.log(`🔄 Reconnecting in ${Math.round(delay)}ms (attempt ${this.reconnectAttempts})`);
    
    this.reconnectInterval = setTimeout(() => {
      this.connect();
    }, delay);
  }

  public disconnect() {
    if (this.reconnectInterval) {
      clearTimeout(this.reconnectInterval);
      this.reconnectInterval = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.isConnected = false;
    console.log('🔌 Disconnected from Reverb');
  }

  public isWebSocketConnected(): boolean {
    return this.isConnected && this.ws?.readyState === WebSocket.OPEN;
  }

  // Debug method to get connection status
  public getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      readyState: this.ws?.readyState,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts,
      hasAuthToken: !!this.authToken,
      wsUrl: this.ws ? this.ws.url : 'No WebSocket instance'
    };
  }

  // Method to manually test connection
  public async testConnection(): Promise<boolean> {
    try {
      console.log('🧪 Testing WebSocket connection...');
      const status = this.getConnectionStatus();
      console.log('🧪 Connection status:', status);
      
      if (this.isWebSocketConnected()) {
        console.log('✅ WebSocket is already connected');
        return true;
      }
      
      // Try to connect
      await this.connect();
      
      // Wait a bit for connection to establish
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const finalStatus = this.getConnectionStatus();
      console.log('🧪 Final connection status:', finalStatus);
      
      return this.isWebSocketConnected();
    } catch (error) {
      console.error('❌ Connection test failed:', error);
      return false;
    }
  }

  // API Methods
  public async getConversations(): Promise<ReverbConversation[]> {
    try {
      const { networkService } = require('./networkService');
      const token = await this.ensureAuthToken();

      const response = await fetch(`${networkService.getBaseUrl()}/api/messages/conversations`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Conversations loaded via API:', data.conversations.length);
        return data.conversations;
      } else {
        throw new Error(data.message || 'Failed to load conversations');
      }
    } catch (error) {
      console.error('❌ Error loading conversations via API:', error);
      
      // Return empty array instead of test data
      console.log('⚠️ Returning empty conversations array');
      return [];
    }
  }

  public async getMessages(conversationId: string): Promise<ReverbMessage[]> {
    try {
      const { networkService } = require('./networkService');
      const token = await this.ensureAuthToken();

      const response = await fetch(`${networkService.getBaseUrl()}/api/messages/conversations/${conversationId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Messages loaded via API:', data.messages.length);
        return data.messages;
      } else {
        throw new Error(data.message || 'Failed to load messages');
      }
    } catch (error) {
      console.error('❌ Error loading messages via API:', error);
      
      // Return empty array instead of test data
      console.log('⚠️ Returning empty messages array');
      return [];
    }
  }

  public async sendMessage(receiverId: string, message: string, type: string = 'text'): Promise<ReverbMessage> {
    try {
      const { networkService } = require('./networkService');
      const token = await this.ensureAuthToken();

      const response = await fetch(`${networkService.getBaseUrl()}/api/messages/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receiver_id: receiverId,
          message: message,
          type: type,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Send Message API Error ${response.status}:`, errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Message sent via API:', data.message.id);
        return data.message;
      } else {
        throw new Error(data.message || 'Failed to send message');
      }
    } catch (error) {
      console.error('❌ Error sending message via API:', error);
      
      // Temporary fallback - create message locally for testing
      console.log('⚠️ Creating message locally for testing');
      const conversationId = `temp_${receiverId}_${Date.now()}`;
      const mockMessage: ReverbMessage = {
        id: `msg_${Date.now()}`,
        conversation_id: conversationId,
        sender_id: 'owner',
        receiver_id: receiverId,
        message: message,
        is_read: false,
        type: type,
        created_at: new Date().toISOString(),
        sender: {
          id: 'owner',
          name: 'Pet Owner',
          profile_image: null
        }
      };
      
      console.log('✅ Local message created:', mockMessage.id);
      return mockMessage;
    }
  }

  public async startConversation(userId: string, userName?: string, userImage?: string): Promise<{ conversation_id: string; other_user: any }> {
    try {
      const { networkService } = require('./networkService');
      const token = await this.ensureAuthToken();

      const response = await fetch(`${networkService.getBaseUrl()}/api/messages/start-conversation`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          user_name: userName,
          user_image: userImage,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Start Conversation API Error ${response.status}:`, errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Conversation started via API:', data.conversation_id);
        return {
          conversation_id: data.conversation_id,
          other_user: data.other_user,
        };
      } else {
        throw new Error(data.message || 'Failed to start conversation');
      }
    } catch (error) {
      console.error('❌ Error starting conversation via API:', error);
      
      // Temporary fallback - create conversation locally for testing
      console.log('⚠️ Creating conversation locally for testing');
      const conversationId = `temp_${userId}_${Date.now()}`;
      const otherUser = {
        id: userId,
        name: userName || `Sitter ${userId}`,
        profile_image: userImage || null
      };
      
      console.log('✅ Local conversation created:', conversationId);
      return {
        conversation_id: conversationId,
        other_user: otherUser,
      };
    }
  }

  public async markAsRead(conversationId: string): Promise<void> {
    try {
      const { networkService } = require('./networkService');
      const token = await this.ensureAuthToken();

      const response = await fetch(`${networkService.getBaseUrl()}/api/messages/conversations/${conversationId}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // No local storage - just mark as read on server
      console.log(`✅ Conversation ${conversationId} marked as read on server`);
    } catch (error) {
      console.error('❌ Error marking as read:', error);
    }
  }

  public async getUnreadCount(): Promise<number> {
    try {
      const { networkService } = require('./networkService');
      const token = await this.ensureAuthToken();

      const response = await fetch(`${networkService.getBaseUrl()}/api/messages/unread-count`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        return data.unread_count;
      } else {
        throw new Error(data.message || 'Failed to get unread count');
      }
    } catch (error) {
      console.error('❌ Error getting unread count:', error);
      throw error; // Don't fallback to mock data
    }
  }

  // Event listeners
  public onMessage(callback: (message: ReverbMessage) => void) {
    this.on('message', callback);
  }

  public onConversationUpdated(callback: (conversationId: string) => void) {
    this.on('conversationUpdated', callback);
  }

  public onConnected(callback: () => void) {
    this.on('connected', callback);
  }

  public onDisconnected(callback: () => void) {
    this.on('disconnected', callback);
  }

  public onError(callback: (error: any) => void) {
    this.on('error', callback);
  }
}

// Export singleton instance
export const reverbMessagingService = ReverbMessagingService.getInstance();
export default reverbMessagingService;
