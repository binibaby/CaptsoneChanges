import { NETWORK_FALLBACK } from '../constants/config';

// Network detection and fallback service
export class NetworkService {
  private static instance: NetworkService;
  private currentBaseUrl: string = '';
  private isConnected: boolean = false;

  private constructor() {
    this.initializeNetwork();
  }

  public static getInstance(): NetworkService {
    if (!NetworkService.instance) {
      NetworkService.instance = new NetworkService();
    }
    return NetworkService.instance;
  }

  // Initialize network detection
  private async initializeNetwork() {
    await this.detectWorkingIP();
  }

  // Test if an IP address is reachable (optimized for speed)
  private async testIPConnection(ip: string): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), NETWORK_FALLBACK.CONNECTION_TIMEOUT);

      // Use a simple endpoint that's likely to exist
      const response = await fetch(`http://${ip}:8000/`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      clearTimeout(timeoutId);
      
      // Accept any response (even 404) as long as we can reach the server
      // Also accept redirects (3xx) as they indicate server is running
      const isWorking = response.status < 500;
      
      if (isWorking) {
        console.log(`✅ IP ${ip}:8000 is reachable (status: ${response.status})`);
      } else {
        console.log(`❌ IP ${ip}:8000 returned error status: ${response.status}`);
      }
      
      return isWorking;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.log(`❌ IP ${ip}:8000 connection failed:`, errorMessage);
      return false;
    }
  }

  // Detect which IP address is currently working (optimized for WiFi connection)
  public async detectWorkingIP(): Promise<string> {
    console.log('🔍 Detecting working IP address for WiFi connection...');

    // Try the most likely IPs first (prioritize WiFi)
    const priorityIPs = [
      '192.168.100.197',  // Current WiFi IP (most likely)
      '127.0.0.1',        // Local development
      'localhost',         // Local development
      '172.20.10.2',      // Mobile data IP (fallback)
      '172.20.10.1',      // Mobile hotspot gateway
    ];

    // Try priority IPs first with parallel testing for faster detection
    const priorityPromises = priorityIPs.map(async (ip) => {
      console.log(`🌐 Testing priority IP: ${ip}:8000`);
      const isWorking = await this.testIPConnection(ip);
      return { ip, isWorking };
    });

    const priorityResults = await Promise.all(priorityPromises);
    
    // Find first working IP
    const workingIP = priorityResults.find(result => result.isWorking);
    if (workingIP) {
      this.currentBaseUrl = `http://${workingIP.ip}:8000`;
      this.isConnected = true;
      console.log(`✅ Connected to: ${this.currentBaseUrl} (${this.getNetworkType(workingIP.ip)})`);
      return this.currentBaseUrl;
    }

    // If priority IPs fail, try all possible IPs from config
    const allIPs = [
      ...NETWORK_FALLBACK.PRIMARY_IPS,
      ...NETWORK_FALLBACK.FALLBACK_IPS,
    ];

    // Remove duplicates and priority IPs
    const uniqueIPs = Array.from(new Set(allIPs)).filter(ip => !priorityIPs.includes(ip));
    
    console.log(`🔄 Trying ${uniqueIPs.length} additional IPs...`);
    
    for (const ip of uniqueIPs) {
      console.log(`🌐 Testing IP: ${ip}:8000`);
      const isWorking = await this.testIPConnection(ip);
      if (isWorking) {
        this.currentBaseUrl = `http://${ip}:8000`;
        this.isConnected = true;
        console.log(`✅ Connected to: ${this.currentBaseUrl} (${this.getNetworkType(ip)})`);
        return this.currentBaseUrl;
      } else {
        console.log(`❌ Failed to connect to: ${ip}:8000`);
      }
    }

    // If all fail, use the mobile data IP as default but mark as disconnected
    this.currentBaseUrl = `http://172.20.10.2:8000`;
    this.isConnected = false;
    console.log(`⚠️ All IPs failed. Using default IP: ${this.currentBaseUrl}`);
    console.log(`⚠️ Please ensure your server is running and accessible on both WiFi and mobile data`);
    return this.currentBaseUrl;
  }

  // Helper method to determine network type
  private getNetworkType(ip: string): string {
    if (ip.includes('192.168.') || ip.includes('10.0.0.') || ip.includes('172.16.') || ip.includes('172.17.') || ip.includes('172.18.') || ip.includes('172.19.')) {
      return 'WiFi';
    } else if (ip.includes('172.20.10.') || ip.includes('172.20.11.') || ip.includes('172.20.12.') || ip.includes('172.20.13.')) {
      return 'Mobile Data';
    } else if (ip.includes('192.168.43.') || ip.includes('192.168.137.')) {
      return 'Hotspot';
    } else if (ip === 'localhost' || ip === '127.0.0.1') {
      return 'Local Development';
    }
    return 'Unknown';
  }

  // Get current working base URL
  public getBaseUrl(): string {
    return this.currentBaseUrl;
  }

  // Helper function to get full image URL
  public getImageUrl(imagePath: string): string {
    if (!imagePath) return '';
    if (imagePath.startsWith('http')) return imagePath;
    if (imagePath.startsWith('/storage/')) {
      return `${this.currentBaseUrl}${imagePath}`;
    }
    return imagePath;
  }

  // Check if currently connected
  public isNetworkConnected(): boolean {
    return this.isConnected;
  }

  // Retry connection with exponential backoff
  public async retryConnection(attempt: number = 1): Promise<string> {
    if (attempt > NETWORK_FALLBACK.MAX_RETRIES) {
      throw new Error('Max retry attempts reached');
    }

    console.log(`🔄 Retry attempt ${attempt}/${NETWORK_FALLBACK.MAX_RETRIES}`);
    
    // Wait before retry (exponential backoff)
    const delay = Math.pow(2, attempt) * 1000;
    await new Promise(resolve => setTimeout(resolve, delay));

    return await this.detectWorkingIP();
  }

  // Get network status info
  public getNetworkStatus() {
    return {
      baseUrl: this.currentBaseUrl,
      isConnected: this.isConnected,
      primaryIPs: NETWORK_FALLBACK.PRIMARY_IPS,
      fallbackIPs: NETWORK_FALLBACK.FALLBACK_IPS,
    };
  }

  // Force network re-detection (useful when switching networks)
  public async forceReconnect(): Promise<string> {
    console.log('🔄 Forcing network re-detection...');
    this.isConnected = false;
    return await this.detectWorkingIP();
  }
}

// Export singleton instance
export const networkService = NetworkService.getInstance();

// Helper function to get API URL with automatic network detection
export const getApiUrl = async (endpoint: string): Promise<string> => {
  const baseUrl = networkService.getBaseUrl();
  // Ensure endpoint starts with /api if it doesn't already
  const apiEndpoint = endpoint.startsWith('/api') ? endpoint : `/api${endpoint}`;
  return `${baseUrl}${apiEndpoint}`;
};

// Helper function for making API calls with automatic retry and token refresh
export const makeApiCall = async (
  endpoint: string,
  options: RequestInit = {},
  retryCount: number = 0,
  hasTriedTokenRefresh: boolean = false
): Promise<Response> => {
  try {
    const url = await getApiUrl(endpoint);
    console.log(`🌐 Making API call to: ${url}`);
    
    // Get user token if no Authorization header is provided
    let headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(options.headers as Record<string, string>),
    };
    
    if (!headers['Authorization'] && !headers['authorization']) {
      try {
        const { default: authService } = await import('./authService');
        const user = await authService.getCurrentUser();
        console.log('🔍 makeApiCall - User from authService:', user);
        console.log('🔍 makeApiCall - User ID:', user?.id);
        console.log('🔍 makeApiCall - User token available:', !!user?.token);
        if (user?.token) {
          headers['Authorization'] = `Bearer ${user.token}`;
          console.log(`🔑 Added auth token for user: ${user.id}`);
        } else {
          console.log('⚠️ No user token available for API call');
        }
      } catch (error) {
        console.log('⚠️ Could not get user token:', error);
      }
    }
    
    const response = await fetch(url, {
      ...options,
      headers,
    });

    console.log(`📡 API response status: ${response.status} for ${url}`);

    // Handle 401 Unauthorized - try to refresh token and retry
    if (response.status === 401 && !hasTriedTokenRefresh) {
      console.log('🔄 401 Unauthorized - attempting token refresh');
      try {
        const { default: authService } = await import('./authService');
        await authService.refreshUserToken();
        
        // Get updated user data with new token
        const refreshedUser = await authService.getCurrentUser();
        if (refreshedUser?.token) {
          console.log('✅ Token refreshed successfully, retrying API call');
          
          // Update headers with new token
          const newOptions = {
            ...options,
            headers: {
              ...options.headers,
              'Authorization': `Bearer ${refreshedUser.token}`,
            },
          };
          
          // Retry with new token
          return makeApiCall(endpoint, newOptions, retryCount, true);
        } else {
          console.error('❌ Token refresh failed - no new token available');
          throw new Error('Authentication failed: Token refresh unsuccessful');
        }
      } catch (refreshError) {
        console.error('❌ Token refresh failed:', refreshError);
        throw new Error('Authentication failed: Please log in again');
      }
    }

    if (!response.ok && retryCount < 1) {
      console.log(`⚠️ API call failed (${response.status}), retrying... (${retryCount + 1}/1)`);
      // Force network re-detection on failure
      await networkService.forceReconnect();
      return makeApiCall(endpoint, options, retryCount + 1, hasTriedTokenRefresh);
    }

    return response;
  } catch (error) {
    console.error(`❌ Network error for ${endpoint}:`, error);
    
    if (retryCount < 1) {
      console.log(`⚠️ Network error, retrying with fresh IP detection... (${retryCount + 1}/1)`);
      // Force network re-detection on error
      await networkService.forceReconnect();
      return makeApiCall(endpoint, options, retryCount + 1, hasTriedTokenRefresh);
    }
    
    console.error(`❌ All retries failed for ${endpoint}. Network service status:`, networkService.getNetworkStatus());
    throw error;
  }
};

// API Methods
export const submitProfileUpdateRequest = async (data: {
  firstName: string;
  lastName: string;
  phone: string;
  hourlyRate: string;
  experience: string;
  aboutMe: string;
  reason: string;
}, token: string, userRole?: string) => {
  try {
    console.log('submitProfileUpdateRequest: Token received:', token);
    console.log('submitProfileUpdateRequest: Data:', data);
    console.log('submitProfileUpdateRequest: User role:', userRole);
    
    // Build the request body based on user role
    const requestBody: any = {
      first_name: data.firstName,
      last_name: data.lastName,
      phone: data.phone,
      reason: data.reason,
    };
    
    // Only include hourly_rate for pet sitters and if it's not empty
    if (userRole === 'pet_sitter' && data.hourlyRate && data.hourlyRate.trim() !== '') {
      requestBody.hourly_rate = parseFloat(data.hourlyRate);
    }
    
    const response = await makeApiCall('/api/profile/update-request', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error submitting profile update request:', error);
    throw error;
  }
};
