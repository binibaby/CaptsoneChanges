import { NETWORK_FALLBACK, API_BASE_URL } from '../constants/config';

// Network detection and fallback service
export class NetworkService {
  private static instance: NetworkService;
  private currentBaseUrl: string = '';
  private isConnected: boolean = false;

  private constructor() {
    // In production, use Render URL directly - no local IP detection needed
    if (!__DEV__) {
      this.currentBaseUrl = API_BASE_URL;
      this.isConnected = true;
      return;
    }
    // Only detect local IPs in development mode
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
      
      // Silently test connection
      // if (isWorking) {
      //   console.log(`✅ IP ${ip}:8000 is reachable (status: ${response.status})`);
      // } else {
      //   console.log(`❌ IP ${ip}:8000 returned error status: ${response.status}`);
      // }
      
      return isWorking;
    } catch (error) {
      // Silently handle connection failure
      // const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      // console.log(`❌ IP ${ip}:8000 connection failed:`, errorMessage);
      return false;
    }
  }

  // Detect which IP address is currently working (optimized for WiFi connection)
  public async detectWorkingIP(): Promise<string> {
    // In production, always use Render URL - no local IP detection
    if (!__DEV__) {
      this.currentBaseUrl = API_BASE_URL;
      this.isConnected = true;
      return API_BASE_URL;
    }
    // Silently detect working IP
    // console.log('🔍 Detecting working IP address for WiFi connection...');

    // Try the most likely IPs first (prioritize current WiFi)
    const priorityIPs = [
      '192.168.100.215',  // Current WiFi IP (primary)
      '172.20.10.2',      // Mobile data IP (fallback)
      '172.20.10.1',      // Mobile hotspot gateway
      '192.168.100.197',  // Previous WiFi IP (fallback)
      '127.0.0.1',        // Local development
      'localhost',         // Local development
    ];

    // Try priority IPs first with parallel testing for faster detection
    const priorityPromises = priorityIPs.map(async (ip) => {
      // Silently test IPs
      // console.log(`🌐 Testing priority IP: ${ip}:8000`);
      const isWorking = await this.testIPConnection(ip);
      return { ip, isWorking };
    });

    const priorityResults = await Promise.all(priorityPromises);
    
    // Find first working IP
    const workingIP = priorityResults.find(result => result.isWorking);
    if (workingIP) {
      this.currentBaseUrl = `http://${workingIP.ip}:8000`;
      this.isConnected = true;
      // Silently connect
      // console.log(`✅ Connected to: ${this.currentBaseUrl} (${this.getNetworkType(workingIP.ip)})`);
      return this.currentBaseUrl;
    }

    // If priority IPs fail, try all possible IPs from config
    const allIPs = [
      ...NETWORK_FALLBACK.PRIMARY_IPS,
      ...NETWORK_FALLBACK.FALLBACK_IPS,
    ];

    // Remove duplicates and priority IPs
    const uniqueIPs = Array.from(new Set(allIPs)).filter(ip => !priorityIPs.includes(ip));
    
    // Silently try additional IPs
    // console.log(`🔄 Trying ${uniqueIPs.length} additional IPs...`);
    
    for (const ip of uniqueIPs) {
      // Silently test IPs
      // console.log(`🌐 Testing IP: ${ip}:8000`);
      const isWorking = await this.testIPConnection(ip);
      if (isWorking) {
        this.currentBaseUrl = `http://${ip}:8000`;
        this.isConnected = true;
        // Silently connect
        // console.log(`✅ Connected to: ${this.currentBaseUrl} (${this.getNetworkType(ip)})`);
        return this.currentBaseUrl;
      } else {
        // Silently fail
        // console.log(`❌ Failed to connect to: ${ip}:8000`);
      }
    }

    // If all fail, use the current WiFi IP as default but mark as disconnected
    this.currentBaseUrl = `http://192.168.100.215:8000`;
    this.isConnected = false;
    // Silently use default
    // console.log(`⚠️ All IPs failed. Using current WiFi IP as default: ${this.currentBaseUrl}`);
    // console.log(`⚠️ Please ensure your server is running and accessible on both WiFi and mobile data`);
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
    // In production, always return Render URL
    if (!__DEV__) {
      return API_BASE_URL;
    }
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
    // In production, no need to reconnect - always use Render URL
    if (!__DEV__) {
      this.currentBaseUrl = API_BASE_URL;
      this.isConnected = true;
      return API_BASE_URL;
    }
    // Silently force reconnect
    // console.log('🔄 Forcing network re-detection...');
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
    // Silently make API call
    // console.log(`🌐 Making API call to: ${url}`);
    
    // Get user token if no Authorization header is provided
    // IMPORTANT: Preserve Authorization header from options.headers if provided
    // Convert headers to plain object if it's a Headers object or undefined
    let providedHeaders: Record<string, string> = {};
    if (options.headers) {
      if (options.headers instanceof Headers) {
        // Convert Headers object to plain object
        options.headers.forEach((value, key) => {
          providedHeaders[key] = value;
        });
      } else if (typeof options.headers === 'object') {
        providedHeaders = options.headers as Record<string, string>;
      }
    }
    
    let headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...providedHeaders,
    };
    
    // Only add token from authService if Authorization header is not already provided
    if (!headers['Authorization'] && !headers['authorization']) {
      try {
        const { default: authService } = await import('./authService');
        const user = await authService.getCurrentUser();
        if (user?.token) {
          headers['Authorization'] = `Bearer ${user.token}`;
          console.log(`🔑 makeApiCall - Added auth token for user: ${user.id}`);
        } else {
          console.log('⚠️ makeApiCall - No user token available for API call');
        }
      } catch (error) {
        console.log('⚠️ makeApiCall - Could not get user token:', error);
      }
    } else {
      // Log that Authorization header was already provided
      const authHeader = headers['Authorization'] || headers['authorization'];
      console.log('🔑 makeApiCall - Using provided Authorization header:', authHeader ? `${authHeader.substring(0, 20)}...` : 'empty');
    }
    
    // Create new options without headers to avoid conflicts
    const { headers: _, ...optionsWithoutHeaders } = options;
    
    const response = await fetch(url, {
      ...optionsWithoutHeaders,
      headers,
    });

    // Check response and handle authentication errors
    const responseStatus = response.status;
    console.log(`📡 makeApiCall - Response status: ${responseStatus} for ${endpoint}`);

    // Handle 401 Unauthorized or 500 with "Unauthenticated" - try to refresh token and retry
    let isAuthError = false;
    let responseData: any = null;
    
    if (responseStatus === 401) {
      isAuthError = true;
    } else if (responseStatus === 500) {
      // Check if response contains "Unauthenticated" error
      try {
        const clonedResponse = response.clone();
        responseData = await clonedResponse.json().catch(() => null);
        if (responseData && (responseData?.error === 'Unauthenticated.' || responseData?.message === 'Unauthenticated.')) {
          isAuthError = true;
          console.log('🔐 makeApiCall - Detected 500 with Unauthenticated error, treating as auth error');
        }
      } catch (e) {
        // If we can't parse the response, don't treat it as auth error
      }
    }

    if (isAuthError && !hasTriedTokenRefresh) {
      console.log('🔄 Authentication error detected - attempting token refresh');
      try {
        const { default: authService } = await import('./authService');
        await authService.refreshUserToken();
        
        // Get updated user data with new token
        const refreshedUser = await authService.getCurrentUser();
        if (refreshedUser?.token) {
          console.log('✅ Token refreshed successfully, retrying API call');
          
          // Update headers with new token, preserving other headers
          const updatedHeaders = {
            ...headers,
              'Authorization': `Bearer ${refreshedUser.token}`,
          };
          
          // Retry with new token
          return makeApiCall(endpoint, {
            ...optionsWithoutHeaders,
            headers: updatedHeaders,
          }, retryCount, true);
        } else {
          console.error('❌ Token refresh failed - no new token available');
          throw new Error('Authentication failed: Token refresh unsuccessful');
        }
      } catch (refreshError) {
        console.error('❌ Token refresh failed:', refreshError);
        throw new Error('Authentication failed: Please log in again');
      }
    }

    if (!response.ok && retryCount < 1 && !isAuthError) {
      console.log(`⚠️ API call failed (${response.status}), retrying... (${retryCount + 1}/1)`);
      // Force network re-detection on failure
      await networkService.forceReconnect();
      // Preserve headers when retrying
      return makeApiCall(endpoint, {
        ...optionsWithoutHeaders,
        headers: headers,
      }, retryCount + 1, hasTriedTokenRefresh);
    }

    return response;
  } catch (error) {
    // Silently handle network errors
    // console.error(`❌ Network error for ${endpoint}:`, error);
    
    if (retryCount < 1) {
      // Silently retry without logging
      // Force network re-detection on error
      await networkService.forceReconnect();
      return makeApiCall(endpoint, options, retryCount + 1, hasTriedTokenRefresh);
    }
    
    // Silently fail after retries
    // console.error(`❌ All retries failed for ${endpoint}. Network service status:`, networkService.getNetworkStatus());
    throw error;
  }
};

// API Methods - Updated to remove aboutMe field
export const submitProfileUpdateRequest = async (data: {
  firstName: string;
  lastName: string;
  phone: string;
  hourlyRate: string;
  experience: string;
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
      // Silently handle error
      // console.error('Error submitting profile update request:', error);
      throw error;
    }
};
