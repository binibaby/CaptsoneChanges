// Fallback Echo Service for React Native
// This version uses a simpler approach without complex Pusher configuration

import { API_BASE_URL } from '../constants/config';
import { EchoServiceInterface } from './echoServiceInterface';

interface VerificationUpdateData {
  verification_id: number;
  user_id: number;
  status: string;
  message: string;
  verification: {
    id: number;
    verification_status: string;
    is_legit_sitter: boolean;
    badges_earned: any[];
    review_deadline?: string;
  };
  timestamp: string;
}

class EchoServiceFallback implements EchoServiceInterface {
  private authToken: string | null = null;
  private isConnected: boolean = false;
  private pollingInterval: ReturnType<typeof setInterval> | null = null;
  private verificationCallbacks: Map<string, (data: VerificationUpdateData) => void> = new Map();
  private consecutiveFailures: number = 0;
  private readonly MAX_FAILURES = 5; // Stop polling after 5 consecutive failures

  setAuthToken(token: string) {
    this.authToken = token;
    // Reset failure counter when setting new token
    this.consecutiveFailures = 0;
  }

  async connect(): Promise<boolean> {
    console.log('📡 Echo Service Fallback: Starting polling-based verification updates');
    this.isConnected = true;
    // Reset failure counter when connecting
    this.consecutiveFailures = 0;
    return true;
  }

  disconnect() {
    this.isConnected = false;
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    console.log('📡 Echo Service Fallback: Disconnected');
  }

  listenToVerificationUpdates(userId: string, callback: (data: VerificationUpdateData) => void) {
    if (!this.isConnected) {
      console.warn('Echo Service Fallback not connected. Cannot listen to verification updates.');
      return null;
    }

    console.log(`👂 Echo Service Fallback: Listening to verification updates for user ${userId}`);
    
    // Store the callback
    this.verificationCallbacks.set(userId, callback);

    // Start polling for verification updates
    this.startPolling(userId);

    return {
      stopListening: () => this.stopListeningToVerificationUpdates(userId)
    };
  }

  stopListeningToVerificationUpdates(userId: string) {
    this.verificationCallbacks.delete(userId);
    console.log(`🔇 Echo Service Fallback: Stopped listening to verification updates for user ${userId}`);
    
    // Stop polling if no more callbacks
    if (this.verificationCallbacks.size === 0 && this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      console.log('🔇 Echo Service Fallback: Stopped polling - no active listeners');
    }
  }

  listenToUserNotifications(userId: string, callback: (data: any) => void) {
    // For fallback service, we'll use the same polling mechanism
    // but listen for different event types
    console.log(`Echo Service Fallback: Listening to user notifications for user ${userId}`);
    this.verificationCallbacks.set(userId, callback);
    
    if (this.verificationCallbacks.size === 1) {
      this.startPolling(userId);
    }
    
    return { stop: () => this.stopListeningToUserNotifications(userId) };
  }

  stopListeningToUserNotifications(userId: string) {
    this.verificationCallbacks.delete(userId);
    console.log(`Echo Service Fallback: Stopped listening to user notifications for user ${userId}`);
    
    // Stop polling if no more callbacks
    if (this.verificationCallbacks.size === 0 && this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      console.log('🔇 Echo Service Fallback: Stopped polling - no active listeners');
    }
  }

  listenToAdminNotifications(callback: (data: any) => void) {
    // For fallback service, we'll use a separate polling mechanism for admin notifications
    console.log(`Echo Service Fallback: Listening to admin notifications`);
    // Note: This would need a separate polling mechanism for admin notifications
    // For now, we'll just log that it's not implemented in fallback
    console.warn('Echo Service Fallback: Admin notifications not implemented in fallback mode');
    return { stop: () => this.stopListeningToAdminNotifications() };
  }

  stopListeningToAdminNotifications() {
    console.log(`Echo Service Fallback: Stopped listening to admin notifications`);
  }

  // Get the Echo instance (returns null for fallback service)
  getEcho(): any {
    return null; // Fallback service doesn't use Echo
  }

  // Initialize method for compatibility
  async initialize(): Promise<boolean> {
    return this.connect();
  }

  private startPolling(userId: string) {
    // Poll every 15 seconds for verification updates (further reduced frequency)
    this.pollingInterval = setInterval(async () => {
      try {
        // Only poll if we have callbacks registered
        if (this.verificationCallbacks.size === 0) {
          return;
        }

        // Stop polling if we've had too many consecutive failures
        if (this.consecutiveFailures >= this.MAX_FAILURES) {
          console.warn('Echo Service Fallback: Too many consecutive failures, stopping polling');
          this.disconnect();
          return;
        }

        // Check if we have auth token
        if (!this.authToken) {
          console.warn('Echo Service Fallback: No auth token available for polling');
          this.consecutiveFailures++;
          return;
        }

        // Create timeout promise
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout')), 8000); // Increased timeout
        });

        const response = await Promise.race([
          fetch(`${API_BASE_URL}/api/verification/status`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${this.authToken}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
          }),
          timeoutPromise
        ]) as Response;

        if (response.ok) {
          // Reset failure counter on success
          this.consecutiveFailures = 0;
          
          const data = await response.json();
          const callback = this.verificationCallbacks.get(userId);
          
          if (callback && data.verification) {
            // Simulate real-time update format
            const updateData: VerificationUpdateData = {
              verification_id: data.verification.id,
              user_id: parseInt(userId),
              status: data.verification.verification_status || data.verification.status,
              message: `Verification status updated to ${data.verification.verification_status || data.verification.status}`,
              verification: {
                id: data.verification.id,
                verification_status: data.verification.verification_status || data.verification.status,
                is_legit_sitter: data.verification.is_legit_sitter || false,
                badges_earned: data.verification.badges_earned || [],
                review_deadline: data.verification.review_deadline,
              },
              timestamp: new Date().toISOString(),
            };

            callback(updateData);
          }
        } else if (response.status === 401) {
          console.warn('Echo Service Fallback: Authentication failed - token may be expired');
          this.consecutiveFailures++;
        } else if (response.status === 404) {
          console.warn('Echo Service Fallback: Verification endpoint not found');
          this.consecutiveFailures++;
        } else {
          console.warn(`Echo Service Fallback: API returned ${response.status} for user ${userId}`);
          this.consecutiveFailures++;
        }
      } catch (error) {
        // Increment failure counter
        this.consecutiveFailures++;
        
        // Only log errors if we have active callbacks and it's not a timeout
        if (this.verificationCallbacks.size > 0) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          if (errorMsg === 'Request timeout') {
            console.warn('Echo Service Fallback: Request timeout - server may be slow');
          } else {
            console.warn('Echo Service Fallback: Error polling verification status:', errorMsg);
          }
        }
      }
    }, 15000); // Increased to 15 seconds to reduce network load
  }
}

export default new EchoServiceFallback();
