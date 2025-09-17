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
      console.log(`❌ IP ${ip}:8000 connection failed:`, error.message || 'Unknown error');
      return false;
    }
  }

  // Detect which IP address is currently working (optimized for speed)
  public async detectWorkingIP(): Promise<string> {
    console.log('🔍 Detecting working IP address...');

    // Try the most likely IPs first (prioritize current network)
    const priorityIPs = [
      '192.168.100.184',  // Current WiFi IP (most likely)
      'localhost',         // Local development
      '127.0.0.1',        // Local development
    ];

    // Try priority IPs first
    for (const ip of priorityIPs) {
      console.log(`🌐 Testing IP: ${ip}:8000`);
      const isWorking = await this.testIPConnection(ip);
      if (isWorking) {
        this.currentBaseUrl = `http://${ip}:8000`;
        this.isConnected = true;
        console.log(`✅ Connected to: ${this.currentBaseUrl}`);
        return this.currentBaseUrl;
      } else {
        console.log(`❌ Failed to connect to: ${ip}:8000`);
      }
    }

    // If priority IPs fail, try all possible IPs from config
    const allIPs = [
      ...NETWORK_FALLBACK.PRIMARY_IPS,
      ...NETWORK_FALLBACK.FALLBACK_IPS,
    ];

    // Remove duplicates and priority IPs
    const uniqueIPs = [...new Set(allIPs)].filter(ip => !priorityIPs.includes(ip));
    
    for (const ip of uniqueIPs) {
      console.log(`🌐 Testing IP: ${ip}:8000`);
      const isWorking = await this.testIPConnection(ip);
      if (isWorking) {
        this.currentBaseUrl = `http://${ip}:8000`;
        this.isConnected = true;
        console.log(`✅ Connected to: ${this.currentBaseUrl}`);
        return this.currentBaseUrl;
      } else {
        console.log(`❌ Failed to connect to: ${ip}:8000`);
      }
    }

    // If all fail, use the current IP as default but mark as disconnected
    this.currentBaseUrl = `http://192.168.100.184:8000`;
    this.isConnected = false;
    console.log(`⚠️ All IPs failed. Using default IP: ${this.currentBaseUrl}`);
    console.log(`⚠️ Please ensure your server is running and accessible`);
    return this.currentBaseUrl;
  }

  // Get current working base URL
  public getBaseUrl(): string {
    return this.currentBaseUrl;
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
  return `${baseUrl}${endpoint}`;
};

// Helper function for making API calls with automatic retry (optimized for speed)
export const makeApiCall = async (
  endpoint: string,
  options: RequestInit = {},
  retryCount: number = 0
): Promise<Response> => {
  try {
    const url = await getApiUrl(endpoint);
    console.log(`🌐 Making API call to: ${url}`);
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
      },
    });

    console.log(`📡 API response status: ${response.status} for ${url}`);

    if (!response.ok && retryCount < 1) {
      console.log(`⚠️ API call failed (${response.status}), retrying... (${retryCount + 1}/1)`);
      // Force network re-detection on failure
      await networkService.forceReconnect();
      return makeApiCall(endpoint, options, retryCount + 1);
    }

    return response;
  } catch (error) {
    console.error(`❌ Network error for ${endpoint}:`, error);
    
    if (retryCount < 1) {
      console.log(`⚠️ Network error, retrying with fresh IP detection... (${retryCount + 1}/1)`);
      // Force network re-detection on error
      await networkService.forceReconnect();
      return makeApiCall(endpoint, options, retryCount + 1);
    }
    
    console.error(`❌ All retries failed for ${endpoint}. Network service status:`, networkService.getNetworkStatus());
    throw error;
  }
};
