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
      return response.status < 500;
    } catch (error) {
      return false;
    }
  }

  // Detect which IP address is currently working (optimized for speed)
  public async detectWorkingIP(): Promise<string> {
    console.log('🔍 Detecting working IP address...');

    // Fast path: Try mobile data IP first (current network)
    const mobileIP = '172.20.10.2';
    console.log(`🌐 Testing mobile data IP: ${mobileIP}`);
    
    const isMobileWorking = await this.testIPConnection(mobileIP);
    if (isMobileWorking) {
      this.currentBaseUrl = `http://${mobileIP}:8000`;
      this.isConnected = true;
      console.log(`✅ Connected to mobile data: ${this.currentBaseUrl}`);
      return this.currentBaseUrl;
    }

    // Try localhost for development
    const localhostIP = 'localhost';
    console.log(`🌐 Testing localhost: ${localhostIP}`);
    
    const isWorking = await this.testIPConnection(localhostIP);
    if (isWorking) {
      this.currentBaseUrl = `http://${localhostIP}:8000`;
      this.isConnected = true;
      console.log(`✅ Connected to: ${this.currentBaseUrl}`);
      return this.currentBaseUrl;
    }

    // Try the configured network IP
    const networkIP = '192.168.100.179';
    console.log(`🌐 Testing network IP: ${networkIP}`);
    
    const isNetworkWorking = await this.testIPConnection(networkIP);
    if (isNetworkWorking) {
      this.currentBaseUrl = `http://${networkIP}:8000`;
      this.isConnected = true;
      console.log(`✅ Connected to network: ${this.currentBaseUrl}`);
      return this.currentBaseUrl;
    }

    // If both fail, use the primary IP as default (don't test all fallbacks)
    const primaryIP = NETWORK_FALLBACK.PRIMARY_IPS[0];
    this.currentBaseUrl = `http://${primaryIP}:8000`;
    this.isConnected = false;
    console.log(`⚠️ Using default IP: ${this.currentBaseUrl}`);
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
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok && retryCount < 1) { // Reduced retries to 1 for speed
      console.log(`⚠️ API call failed, retrying... (${retryCount + 1}/1)`);
      return makeApiCall(endpoint, options, retryCount + 1);
    }

    return response;
  } catch (error) {
    if (retryCount < 1) { // Reduced retries to 1 for speed
      console.log(`⚠️ Network error, retrying... (${retryCount + 1}/1)`);
      return makeApiCall(endpoint, options, retryCount + 1);
    }
    throw error;
  }
};
