// API Configuration
export const API_CONFIG = {
  // For local development - use your computer's network IP address
  // Find your IP with: ifconfig | grep "inet " | grep -v 127.0.0.1
  BASE_URL: __DEV__ 
    ? 'http://192.168.100.164:8000'  // Local Laravel server (your computer's network IP)
    : 'https://your-production-domain.com',
  
  // API endpoints
  ENDPOINTS: {
    VERIFICATION: {
      SEND_CODE: '/api/send-verification-code',
      VERIFY_CODE: '/api/verify-phone-code',
      SKIP: '/api/verification/skip',
      SUBMIT_SIMPLE: '/api/verification/submit-simple',
      RESEND_CODE: '/api/resend-verification-code',
    },
    WALLET: {
      BALANCE: '/api/wallet/balance',
      PENDING_EARNINGS: '/api/wallet/pending_earnings',
      TRANSACTIONS: '/api/wallet/transactions',
      CASHOUT: '/api/wallet/cashout',
    },
    PAYMENT: '/api',
  },
  
  // Timeouts
  TIMEOUT: 30000, // 30 seconds (increased for better reliability)
  
  // Headers
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
};

// Helper function to get full API URL
export const getApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Helper function to get headers with auth token
export const getAuthHeaders = (token?: string) => {
  const headers = { ...API_CONFIG.DEFAULT_HEADERS };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

// Network configuration
export const NETWORK_CONFIG = {
  // Retry configuration
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1 second
  
  // Connection check
  CONNECTION_CHECK_URL: 'https://www.google.com',
  CONNECTION_TIMEOUT: 5000,
};

// Development helpers
export const DEV_CONFIG = {
  // Enable/disable features in development
  ENABLE_LOGGING: __DEV__,
  ENABLE_NETWORK_LOGGING: __DEV__,
  ENABLE_ERROR_BOUNDARIES: __DEV__,
  
  // Mock data for development
  USE_MOCK_DATA: false,
  MOCK_DELAY: 1000,
};

// Phone verification configuration
export const VERIFICATION_CONFIG = {
  // Code length
  CODE_LENGTH: 6,
  
  // Expiration time (in seconds)
  CODE_EXPIRATION: 300, // 5 minutes
  
  // Max attempts
  MAX_ATTEMPTS: 3,
  
  // Cooldown period (in seconds)
  COOLDOWN_PERIOD: 60, // 1 minute
}; 