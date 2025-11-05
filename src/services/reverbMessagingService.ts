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
        const token = user.token || (user as any).access_token || (user as any).authToken || (user as any).api_token;
        console.log('🔍 Token candidates:', {
          token: user.token,
          access_token: (user as any).access_token,
          authToken: (user as any).authToken,
          api_token: (user as any).api_token
        });
        
        if (token) {
          this.authToken = token as string;
          console.log('🔑 Auth token loaded for Reverb service:', token.substring(0, 20) + '...');
          return this.authToken;
        } else {
          console.log('❌ No token found in user object. User object:', JSON.stringify(user, null, 2));
          console.log('❌ No token found in user object. Available properties:', Object.keys(user));
          
          // Try to get token directly from AsyncStorage as fallback
          try {
            console.log('🔍 Trying AsyncStorage fallback...');
            const AsyncStorage = require('@react-native-async-storage/async-storage').default;
            const storedUser = await AsyncStorage.getItem('user');
            if (storedUser) {
              const parsedUser = JSON.parse(storedUser);
              console.log('🔍 Stored user from AsyncStorage:', parsedUser);
              if (parsedUser.token) {
                this.authToken = parsedUser.token as string;
                console.log('🔑 Token found in AsyncStorage fallback:', parsedUser.token.substring(0, 20) + '...');
                return this.authToken;
              }
            }
          } catch (storageError) {
            console.error('❌ AsyncStorage fallback failed:', storageError);
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
    // Silently attempt WebSocket connection
    // console.log('🔌 Attempting WebSocket connection to Laravel Reverb...');
    
    if (this.isConnected || (this.ws && this.ws.readyState === WebSocket.CONNECTING)) {
      // Silently handle already connected
      // console.log('🔄 Already connected or connecting');
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
      
      // Check if we're in development mode and should skip Reverb connection
      if (__DEV__ && (host === 'localhost' || host === '127.0.0.1')) {
        // Silently skip in dev mode
        // console.log('🔌 Development mode detected - skipping Reverb connection to prevent errors');
        // console.log('🔌 Real-time features will use fallback methods');
        return;
      }
      
      // Connect to Laravel Reverb on port 8080 (without authentication in URL)
      const reverbUrl = `${wsUrl}:8080/app/${process.env.EXPO_PUBLIC_REVERB_APP_KEY || 'iycawpww023mjumkvwsj'}`;
      // Silently connect
      // console.log('🔌 Connecting to Reverb:', reverbUrl);
      // console.log('🔌 Base URL used:', baseUrl);
      // console.log('🔌 Host extracted:', host);
      
      this.ws = new WebSocket(reverbUrl);
      
      // Set up connection timeout
      const connectionTimeout = setTimeout(() => {
        if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
          // Silently handle timeout
          // console.log('⏰ WebSocket connection timeout');
          this.ws.close();
        }
      }, 10000); // 10 second timeout
      
      this.ws.onopen = () => {
        clearTimeout(connectionTimeout);
        // Silently handle connection
        // console.log('✅ Connected to Laravel Reverb');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.emit('connected');
        
        // Don't subscribe to channels immediately - let the app decide when to subscribe
        // console.log('🔌 WebSocket connected - ready for channel subscriptions');
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
        // Silently handle disconnection
        // console.log('🔌 Disconnected from Laravel Reverb');
        // console.log('🔌 Close code:', event.code, 'Reason:', event.reason);
        this.isConnected = false;
        this.ws = null;
        this.emit('disconnected');
        this.scheduleReconnect();
      };

      this.ws.onerror = (error) => {
        clearTimeout(connectionTimeout);
        // Silently handle WebSocket errors
        // console.warn('⚠️ Reverb WebSocket connection failed - this is normal if Reverb server is not running');
        // console.warn('⚠️ WebSocket URL attempted:', reverbUrl);
        // console.warn('⚠️ This error can be safely ignored - real-time features will use fallback methods');
        
        this.isConnected = false;
      };

    } catch (error) {
      console.error('❌ Error connecting to Reverb:', error);
      this.scheduleReconnect();
    }
  }

  private async subscribeToUserChannel() {
    if (!this.ws || !this.isConnected) return;

    try {
      // Get the actual user ID
      const { default: authService } = await import('./authService');
      const user = await authService.getCurrentUser();
      
      if (!user || !user.id) {
        console.error('❌ No user ID available for channel subscription');
        return;
      }
      
      // Subscribe to private channel for user-specific messages
      const subscribeMessage = {
        event: 'pusher:subscribe',
        data: {
          channel: `private-user.${user.id}` // Use private channel for proper filtering
        }
      };

      this.ws.send(JSON.stringify(subscribeMessage));
      console.log('📡 Subscribed to user channel for user:', user.id);
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

    if (data.event === 'pusher:error') {
      console.warn('⚠️ Reverb WebSocket error (this is normal if Reverb server is not configured):', data.data);
      // Don't try to reconnect on errors - just log them
      return;
    }

    if (data.event === 'MessageSent') {
      const message = data.data.message;
      this.handleNewMessage(message);
    }
  }

  private async handleNewMessage(message: ReverbMessage) {
    console.log('💬 New message received:', message);
    
    try {
      // Get current user to verify this message is intended for them
      const { default: authService } = await import('./authService');
      const currentUser = await authService.getCurrentUser();
      
      if (!currentUser || !currentUser.id) {
        console.log('⚠️ No current user found, ignoring message');
        return;
      }
      
      // Check if this message is intended for the current user
      const isForCurrentUser = message.receiver_id.toString() === currentUser.id.toString() || 
                               message.sender_id.toString() === currentUser.id.toString();
      
      if (!isForCurrentUser) {
        console.log('⚠️ Message not intended for current user, ignoring:', {
          messageReceiverId: message.receiver_id,
          messageSenderId: message.sender_id,
          currentUserId: currentUser.id,
          isForCurrentUser
        });
        return;
      }
      
      console.log('✅ Message is for current user, processing:', {
        messageId: message.id,
        conversationId: message.conversation_id,
        senderId: message.sender_id,
        receiverId: message.receiver_id,
        currentUserId: currentUser.id
      });

    // Emit event for UI updates
    this.emit('message', message);
    this.emit('conversationUpdated', message.conversation_id);
    } catch (error) {
      console.error('❌ Error processing message:', error);
      // If there's an error checking user, don't process the message to be safe
    }
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      // Silently handle max reconnection attempts
      // console.log('❌ Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    // Use exponential backoff with jitter to prevent thundering herd
    const baseDelay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    const jitter = Math.random() * 1000; // Add up to 1 second of jitter
    const delay = baseDelay + jitter;
    
    // Silently reconnect
    // console.log(`🔄 Reconnecting in ${Math.round(delay)}ms (attempt ${this.reconnectAttempts})`);
    
    this.reconnectInterval = setTimeout(() => {
      this.connect();
    }, delay) as unknown as NodeJS.Timeout;
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

  // Debug method to test token retrieval
  public async debugTokenRetrieval(): Promise<void> {
    try {
      console.log('🔍 DEBUG: Testing token retrieval...');
      const token = await this.ensureAuthToken();
      console.log('✅ DEBUG: Token retrieved successfully:', token ? token.substring(0, 20) + '...' : 'null');
    } catch (error) {
      console.error('❌ DEBUG: Token retrieval failed:', error);
    }
  }

  // Debug method to test API call
  public async debugApiCall(): Promise<void> {
    try {
      console.log('🔍 DEBUG: Testing API call...');
      const { networkService } = require('./networkService');
      const token = await this.ensureAuthToken();
      
      // Get and validate base URL
      let baseUrl = networkService.getBaseUrl();
      if (!baseUrl || baseUrl.trim() === '') {
        baseUrl = await networkService.detectWorkingIP();
      }
      
      if (!baseUrl || baseUrl.trim() === '') {
        console.error('❌ DEBUG: No valid base URL available for testing');
        return;
      }
      
      console.log('🔍 DEBUG: Making test API call to:', `${baseUrl}/api/messages/test`);
      console.log('🔑 DEBUG: Using token:', token ? token.substring(0, 20) + '...' : 'null');
      
      const response = await fetch(`${baseUrl}/api/messages/test`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      console.log('📡 DEBUG: Response status:', response.status);
      console.log('📡 DEBUG: Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ DEBUG: API call successful:', data);
      } else {
        const errorText = await response.text();
        console.error('❌ DEBUG: API call failed:', response.status, errorText);
      }
    } catch (error) {
      console.error('❌ DEBUG: API call error:', error);
    }
  }

  // Method to check if user is properly authenticated
  public async isUserAuthenticated(): Promise<boolean> {
    try {
      const { default: authService } = await import('./authService');
      const user = await authService.getCurrentUser();
      return !!(user && user.token);
    } catch (error) {
      console.error('❌ Error checking authentication status:', error);
      return false;
    }
  }

  // Method to test authentication with the API
  public async testAuthentication(): Promise<{ success: boolean; message: string; user?: any }> {
    try {
      const { networkService } = require('./networkService');
      const token = await this.ensureAuthToken();

      // Get and validate base URL
      let baseUrl = networkService.getBaseUrl();
      if (!baseUrl || baseUrl.trim() === '') {
        baseUrl = await networkService.detectWorkingIP();
      }
      
      if (!baseUrl || baseUrl.trim() === '') {
        return { success: false, message: 'Unable to determine base URL' };
      }

      if (!token) {
        return { success: false, message: 'No authentication token available' };
      }

      // Ensure token is properly formatted
      const authToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;

      console.log('🧪 Testing authentication with API...');
      console.log('  - URL:', `${baseUrl}/api/messages/test-auth-middleware`);
      console.log('  - Token:', authToken.substring(0, 30) + '...');

      const response = await fetch(`${baseUrl}/api/messages/test-auth-middleware`, {
        method: 'GET',
        headers: {
          'Authorization': authToken,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      console.log('🧪 Auth test response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Authentication successful:', data);
        return { success: true, message: 'Authentication successful', user: data };
      } else {
        const errorText = await response.text();
        console.error('❌ Authentication failed:', response.status, errorText);
        return { success: false, message: `Authentication failed: ${response.status} - ${errorText}` };
      }
    } catch (error) {
      console.error('❌ Authentication test error:', error);
      return { success: false, message: `Authentication test error: ${error}` };
    }
  }

  // Method to force reconnection with fresh authentication
  public async reconnectWithFreshAuth(): Promise<void> {
    console.log('🔄 Forcing reconnection with fresh authentication...');
    
    // Clear cached token
    this.authToken = null;
    
    // Disconnect current connection
    this.disconnect();
    
    // Wait a moment before reconnecting
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Try to reconnect
    await this.connect();
  }

  // Method to enable WebSocket subscription (call this when user wants to receive real-time messages)
  public async enableRealtimeMessaging(): Promise<void> {
    try {
      console.log('🔌 Enabling real-time messaging...');
      
      // First ensure we're connected
      if (!this.isConnected) {
        await this.connect();
      }
      
      // Wait a moment for connection to establish
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Subscribe to user channel
      await this.subscribeToUserChannel();
      
      console.log('✅ Real-time messaging enabled');
    } catch (error) {
      console.error('❌ Error enabling real-time messaging:', error);
    }
  }

  // Method to disable WebSocket subscription
  public disableRealtimeMessaging(): void {
    console.log('🔌 Disabling real-time messaging...');
    this.disconnect();
    console.log('✅ Real-time messaging disabled');
  }

  // Method to test WebSocket connection without authentication
  public async testWebSocketConnection(): Promise<boolean> {
    try {
      console.log('🧪 Testing WebSocket connection without authentication...');
      
      const { networkService } = require('./networkService');
      let baseUrl = networkService.getBaseUrl();
      if (!baseUrl || baseUrl.trim() === '') {
        baseUrl = await networkService.detectWorkingIP();
      }
      
      if (!baseUrl || baseUrl.trim() === '') {
        console.error('❌ No valid base URL for WebSocket test');
        return false;
      }
      
      const url = new URL(baseUrl);
      const host = url.hostname;
      const wsUrl = `ws://${host}`;
      const testReverbUrl = `${wsUrl}:8080/app/${process.env.EXPO_PUBLIC_REVERB_APP_KEY || 'iycawpww023mjumkvwsj'}`;
      
      console.log('🧪 Testing WebSocket URL:', testReverbUrl);
      
      return new Promise((resolve) => {
        const testWs = new WebSocket(testReverbUrl);
        let resolved = false;
        
        const cleanup = () => {
          if (!resolved) {
            resolved = true;
            testWs.close();
          }
        };
        
        const timeout = setTimeout(() => {
          console.log('🧪 WebSocket test timeout');
          cleanup();
          resolve(false);
        }, 5000);
        
        testWs.onopen = () => {
          console.log('✅ WebSocket test connection successful');
          clearTimeout(timeout);
          cleanup();
          resolve(true);
        };
        
        testWs.onerror = (error) => {
          console.log('❌ WebSocket test connection failed:', error);
          clearTimeout(timeout);
          cleanup();
          resolve(false);
        };
        
        testWs.onclose = () => {
          console.log('🔌 WebSocket test connection closed');
          clearTimeout(timeout);
          cleanup();
          resolve(false);
        };
      });
    } catch (error) {
      console.error('❌ WebSocket test error:', error);
      return false;
    }
  }

  // Debug method to check authentication status
  public async debugAuthStatus(): Promise<void> {
    try {
      console.log('🔍 DEBUG: Checking authentication status...');
      
      // Check if user is logged in
      const { default: authService } = await import('./authService');
      const user = await authService.getCurrentUser();
      
      console.log('🔍 DEBUG: User logged in:', !!user);
      console.log('🔍 DEBUG: User email:', user?.email || 'null');
      console.log('🔍 DEBUG: User token present:', !!user?.token);
      console.log('🔍 DEBUG: User token preview:', user?.token ? user.token.substring(0, 20) + '...' : 'null');
      
      if (!user) {
        console.log('❌ DEBUG: No user found - user needs to log in');
        return;
      }
      
      if (!user.token) {
        console.log('❌ DEBUG: User has no token - authentication may have failed');
        return;
      }
      
      // Test the token with a simple API call
      const { networkService } = require('./networkService');
      
      // Get and validate base URL
      let baseUrl = networkService.getBaseUrl();
      if (!baseUrl || baseUrl.trim() === '') {
        baseUrl = await networkService.detectWorkingIP();
      }
      
      if (!baseUrl || baseUrl.trim() === '') {
        console.error('❌ DEBUG: No valid base URL available for auth testing');
        return;
      }
      
      const response = await fetch(`${baseUrl}/api/messages/test-auth-middleware`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
      });
      
      console.log('📡 DEBUG: Auth test response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ DEBUG: Authentication successful:', data);
      } else {
        const errorText = await response.text();
        console.error('❌ DEBUG: Authentication failed:', response.status, errorText);
      }
    } catch (error) {
      console.error('❌ DEBUG: Auth status check error:', error);
    }
  }

  // Comprehensive debugging method for API issues
  public async debugApiIssues(): Promise<void> {
    let baseUrl: string = ''; // Declare baseUrl at the top level
    
    try {
      console.log('🔍 COMPREHENSIVE API DEBUG STARTING...');
      
      // 1. Check network service
      const { networkService } = require('./networkService');
      baseUrl = networkService.getBaseUrl();
      console.log('🌐 DEBUG: Base URL:', baseUrl);
      
      if (!baseUrl || baseUrl.trim() === '') {
        console.log('🔄 DEBUG: Base URL empty, detecting working IP...');
        baseUrl = await networkService.detectWorkingIP();
        console.log('🌐 DEBUG: Detected URL:', baseUrl);
      }
      
      // Ensure we have a valid baseUrl before proceeding
      if (!baseUrl || baseUrl.trim() === '') {
        console.error('❌ DEBUG: No valid base URL available for testing');
        return;
      }
      
      // 2. Check authentication
      console.log('🔍 DEBUG: Checking authentication...');
      const { default: authService } = await import('./authService');
      const user = await authService.getCurrentUser();
      console.log('👤 DEBUG: User:', user ? {
        id: user.id,
        email: user.email,
        hasToken: !!user.token,
        tokenPreview: user.token ? user.token.substring(0, 20) + '...' : 'null'
      } : 'null');
      
      if (!user || !user.token) {
        console.log('❌ DEBUG: No user or token - cannot proceed with API tests');
        return;
      }
      
      // 3. Test basic connectivity
      console.log('🧪 DEBUG: Testing basic connectivity...');
      try {
        if (!baseUrl) {
          console.error('❌ DEBUG: baseUrl is undefined, cannot test connectivity');
          return;
        }
        const testUrl = `${baseUrl}/api/messages/test`;
        console.log('🧪 DEBUG: Testing URL:', testUrl);
        
        const testResponse = await fetch(testUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        console.log('🧪 DEBUG: Test response status:', testResponse.status);
        if (testResponse.ok) {
          const testData = await testResponse.json();
          console.log('✅ DEBUG: Basic connectivity test passed:', testData);
        } else {
          const testError = await testResponse.text();
          console.error('❌ DEBUG: Basic connectivity test failed:', testResponse.status, testError);
        }
      } catch (testError) {
        console.error('❌ DEBUG: Basic connectivity test error:', testError);
      }
      
      // 4. Test authentication
      console.log('🔐 DEBUG: Testing authentication...');
      try {
        if (!baseUrl) {
          console.error('❌ DEBUG: baseUrl is undefined, cannot test authentication');
          return;
        }
        const authUrl = `${baseUrl}/api/messages/test-auth-middleware`;
        console.log('🔐 DEBUG: Auth test URL:', authUrl);
        
        const authResponse = await fetch(authUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${user.token}`,
            'Content-Type': 'application/json',
          },
        });
        
        console.log('🔐 DEBUG: Auth response status:', authResponse.status);
        if (authResponse.ok) {
          const authData = await authResponse.json();
          console.log('✅ DEBUG: Authentication test passed:', authData);
        } else {
          const authError = await authResponse.text();
          console.error('❌ DEBUG: Authentication test failed:', authResponse.status, authError);
        }
      } catch (authError) {
        console.error('❌ DEBUG: Authentication test error:', authError);
      }
      
      // 5. Test the actual conversations endpoint
      console.log('💬 DEBUG: Testing conversations endpoint...');
      try {
        if (!baseUrl) {
          console.error('❌ DEBUG: baseUrl is undefined, cannot test conversations');
          return;
        }
        const conversationsUrl = `${baseUrl}/api/messages/conversations`;
        console.log('💬 DEBUG: Conversations URL:', conversationsUrl);
        
        const conversationsResponse = await fetch(conversationsUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${user.token}`,
            'Content-Type': 'application/json',
          },
        });
        
        console.log('💬 DEBUG: Conversations response status:', conversationsResponse.status);
        console.log('💬 DEBUG: Conversations response headers:', Object.fromEntries(conversationsResponse.headers.entries()));
        
        if (conversationsResponse.ok) {
          const conversationsData = await conversationsResponse.json();
          console.log('✅ DEBUG: Conversations test passed:', conversationsData);
        } else {
          const conversationsError = await conversationsResponse.text();
          console.error('❌ DEBUG: Conversations test failed:', conversationsResponse.status, conversationsError);
        }
      } catch (conversationsError) {
        console.error('❌ DEBUG: Conversations test error:', conversationsError);
      }
      
      console.log('🔍 COMPREHENSIVE API DEBUG COMPLETED');
    } catch (error) {
      console.error('❌ DEBUG: Comprehensive debug error:', error);
    }
  }

  // API Methods
  public async getConversations(): Promise<ReverbConversation[]> {
    try {
      const { makeApiCall } = require('./networkService');

      console.log('🔍 GET CONVERSATIONS DEBUG:');
      console.log('  - Using makeApiCall helper for automatic token management');

      const response = await makeApiCall('/api/messages/conversations', {
        method: 'GET',
      });

      console.log('📡 GET CONVERSATIONS Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ GET CONVERSATIONS API Error Response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      console.log('📊 API Response data:', data);
      
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
      const { makeApiCall } = require('./networkService');
      
      console.log('🔍 GET MESSAGES DEBUG:');
      console.log('  - Using makeApiCall helper for automatic token management');
      console.log('  - Conversation ID:', conversationId);

      const response = await makeApiCall(`/api/messages/conversations/${conversationId}`, {
        method: 'GET',
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ GET MESSAGES API Error:', response.status, errorText);
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
      const { makeApiCall } = require('./networkService');

      console.log('🔍 SEND MESSAGE DEBUG:');
      console.log('  - receiverId:', receiverId);
      console.log('  - message:', message);
      console.log('  - type:', type);
      console.log('  - Using makeApiCall helper for automatic token management');

      const response = await makeApiCall('/api/messages/send', {
        method: 'POST',
        body: JSON.stringify({
          receiver_id: receiverId,
          message: message,
          type: type,
        }),
      });

      console.log('📡 SEND MESSAGE Response status:', response.status);

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
      
      // Return empty message instead of mock data
      throw error;
    }
  }

  public async startConversation(userId: string, userName?: string, userImage?: string): Promise<{ conversation_id: string; other_user: any }> {
    try {
      const { makeApiCall } = require('./networkService');
      
      console.log('🔍 START CONVERSATION DEBUG:');
      console.log('  - userId:', userId);
      console.log('  - userName:', userName);
      console.log('  - Using makeApiCall helper for automatic token management');

      const response = await makeApiCall('/api/messages/start-conversation', {
        method: 'POST',
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
      const { makeApiCall } = require('./networkService');
      
      console.log('🔍 MARK AS READ DEBUG:');
      console.log('  - conversationId:', conversationId);
      console.log('  - Using makeApiCall helper for automatic token management');

      const response = await makeApiCall(`/api/messages/conversations/${conversationId}/read`, {
        method: 'POST',
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
      const { makeApiCall } = require('./networkService');
      
      console.log('🔍 GET UNREAD COUNT DEBUG:');
      console.log('  - Using makeApiCall helper for automatic token management');

      const response = await makeApiCall('/api/messages/unread-count', {
        method: 'GET',
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

  // Clear authentication cache
  public clearAuthCache() {
    console.log('🧹 Clearing Reverb messaging service auth cache...');
    this.authToken = null;
    console.log('✅ Auth cache cleared');
  }
}

// Export singleton instance
export const reverbMessagingService = ReverbMessagingService.getInstance();
export default reverbMessagingService;
