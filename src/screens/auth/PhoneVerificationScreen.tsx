import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { getAuthHeaders } from '../../constants/config';
import { useAuth } from '../../contexts/AuthContext';
import { networkService } from '../../services/networkService';

interface PhoneVerificationScreenProps {
  userData?: any;
  onPhoneVerified?: (phoneVerified: boolean, userData?: any) => void;
}

const PhoneVerificationScreen: React.FC<PhoneVerificationScreenProps> = ({ userData: propUserData, onPhoneVerified }) => {
  const router = useRouter();
  const { user } = useAuth();
  
  // Get userData from props (since we're using Expo Router)
  const userData = propUserData;
  
  console.log('PhoneVerificationScreen - propUserData:', propUserData);
  console.log('PhoneVerificationScreen - final userData:', userData);
  console.log('PhoneVerificationScreen - onPhoneVerified callback:', !!onPhoneVerified);

  const [phoneNumber, setPhoneNumber] = useState(userData?.phone || '');
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [lastError, setLastError] = useState<string | null>(null);

  const sendVerificationCode = async () => {
    if (!phoneNumber) {
      Alert.alert('Error', 'Please enter a phone number');
      return;
    }

    setIsLoading(true);
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let controller: AbortController | null = null;
    
    try {
      console.log('LOG PhoneVerificationScreen - Sending code to:', phoneNumber);
      
      // Ensure network service is initialized
      let baseUrl = networkService.getBaseUrl();
      if (!baseUrl) {
        console.log('Network service not initialized, detecting working IP...');
        baseUrl = await networkService.detectWorkingIP();
      }
      const apiUrl = `${baseUrl}/api/send-verification-code`;
      console.log('Using API URL:', apiUrl);
      console.log('Network check - testing connection...');
      
      // Test network connectivity first
      const isNetworkConnected = await checkNetworkStatus();
      console.log('Network status check result:', isNetworkConnected);
      
      if (!isNetworkConnected) {
        throw new Error('No internet connection detected');
      }
      
      // Test server connectivity
      console.log('Testing server connectivity...');
      try {
        const pingController = new AbortController();
        const pingTimeout = setTimeout(() => pingController.abort(), 15000);
        const pingResponse = await fetch(apiUrl.replace('/api/send-verification-code', '/'), {
          method: 'HEAD',
          mode: 'cors',
          signal: pingController.signal
        });
        clearTimeout(pingTimeout);
        console.log('Server ping successful:', pingResponse.status);
      } catch (pingError) {
        console.log('Server ping failed:', pingError);
        // Don't fail completely on ping - let the actual API call determine success
        console.log('Continuing with API call despite ping failure...');
      }
      
      // Create AbortController and set a longer timeout (30 seconds)
      controller = new AbortController();
      timeoutId = setTimeout(() => {
        if (controller) {
          console.log('Request timeout - aborting after 30 seconds');
          controller.abort();
        }
      }, 30000); // Increased to 30 seconds
      
      console.log('Making fetch request to:', apiUrl);
      console.log('Request payload:', { phone: phoneNumber });
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: getAuthHeaders(user?.token),
        mode: 'cors',
        credentials: 'omit',
        signal: controller.signal,
        body: JSON.stringify({
          phone: phoneNumber,
        }),
      });
      
      // Clear timeout if request completes successfully
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }

      console.log('API Response Status:', response.status);
      console.log('API Response Headers:', response.headers);
      
      const data = await response.json();
      console.log('API Response Data:', data);

      if (response.ok) {
        setCodeSent(true);
        
        // Show success message
        Alert.alert(
          'Verification Code Sent', 
          'Please check your SMS messages for the verification code.',
          [
            {
              text: 'OK',
              style: 'cancel'
            }
          ]
        );
      } else {
        console.error('API Error Response:', data);
        Alert.alert('Error', data.message || 'Failed to send verification code');
      }
    } catch (error: any) {
      console.error('Error sending verification code:', error);
      let errorMessage = 'Network error occurred. Please check your connection.';
      
      if (error.name === 'AbortError') {
        errorMessage = 'Request timed out. Please check your internet connection and try again.';
      } else if (error.message?.includes('Network request failed')) {
        errorMessage = 'Unable to connect to server. Please check:\n\n1. Your internet connection (WiFi or mobile data)\n2. Server is running and accessible';
      } else if (error.message?.includes('JSON')) {
        errorMessage = 'Invalid response from server. Please try again.';
      } else if (error.message?.includes('fetch')) {
        errorMessage = 'Connection failed. Please check your network and try again.';
      } else if (error.message?.includes('No internet connection')) {
        errorMessage = 'No internet connection detected. Please check your network settings.';
      } else if (error.message?.includes('Cannot reach server')) {
        errorMessage = error.message;
      }
      
      Alert.alert('Error', errorMessage);
      setLastError(errorMessage);
      setRetryCount(prev => prev + 1);
    } finally {
      // Clean up timeout and controller
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      controller = null;
      setIsLoading(false);
    }
  };

  const verifyCode = async () => {
    if (!verificationCode) {
      Alert.alert('Error', 'Please enter the verification code');
      return;
    }

    setIsLoading(true);
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let controller: AbortController | null = null;
    
    try {
      console.log('LOG PhoneVerificationScreen - Verifying code:', verificationCode);
      
      // Ensure network service is initialized
      let baseUrl = networkService.getBaseUrl();
      if (!baseUrl) {
        console.log('Network service not initialized, detecting working IP...');
        baseUrl = await networkService.detectWorkingIP();
      }
      const apiUrl = `${baseUrl}/api/verify-phone-code`;
      console.log('Using API URL:', apiUrl);
      
      // Create AbortController and set timeout (30 seconds)
      controller = new AbortController();
      timeoutId = setTimeout(() => {
        if (controller) {
          console.log('Verify request timeout - aborting after 30 seconds');
          controller.abort();
        }
      }, 30000);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: getAuthHeaders(user?.token),
        mode: 'cors',
        credentials: 'omit',
        signal: controller.signal,
        body: JSON.stringify({
          phone: phoneNumber,
          code: verificationCode,
        }),
      });

      // Clear timeout if request completes successfully
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }

      console.log('Verify API Response Status:', response.status);
      const data = await response.json();
      console.log('Verify API Response Data:', data);

      if (response.ok) {
        console.log('LOG PhoneVerificationScreen - Code verified successfully');
        console.log('LOG PhoneVerificationScreen - User data:', userData);
        console.log('LOG PhoneVerificationScreen - Response data:', data);
        
        // Check if user is fully verified (especially for pet owners)
        const isFullyVerified = data.is_fully_verified;
        const userRole = data.user?.role;
        
        console.log('LOG PhoneVerificationScreen - isFullyVerified:', isFullyVerified);
        console.log('LOG PhoneVerificationScreen - userRole:', userRole);
        
        if (isFullyVerified && userRole === 'pet_owner') {
          console.log('LOG PhoneVerificationScreen - Showing success popup for pet owner');
          // Show success popup for pet owners
          Alert.alert(
            '🎉 Verification Complete!',
            data.message || 'Congratulations! You are now fully verified and can use all features!',
            [
              {
                text: 'OK',
                onPress: () => {
                  console.log('LOG PhoneVerificationScreen - Redirecting to owner dashboard');
                  // Redirect to owner dashboard
                  router.replace('/pet-owner-dashboard');
                }
              }
            ]
          );
        } else {
          console.log('LOG PhoneVerificationScreen - Not a fully verified pet owner, using callback or staying on screen');
          // Use callback if available, otherwise use navigation
          if (onPhoneVerified) {
            console.log('Using callback for navigation with user data');
            onPhoneVerified(true, userData);
          } else {
            console.log('No callback available, staying on current screen');
            // If no callback is provided, we stay on the current screen
            // The parent component should handle navigation
          }
        }
      } else {
        console.log('LOG PhoneVerificationScreen - API response not OK:', response.status, data);
        Alert.alert('Error', data.message || 'Invalid verification code');
      }
    } catch (error: any) {
      console.error('Error verifying code:', error);
      
      let errorMessage = 'Network error occurred. Please check your connection.';
      
      if (error.name === 'AbortError') {
        errorMessage = 'Request timed out. Please check your internet connection and try again.';
      } else if (error.message?.includes('Network request failed')) {
        errorMessage = 'Unable to connect to server. Please check your internet connection.';
      } else if (error.message?.includes('JSON')) {
        errorMessage = 'Invalid response from server. Please try again.';
      } else if (error.message?.includes('fetch')) {
        errorMessage = 'Connection failed. Please check your network and try again.';
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      // Clean up timeout and controller
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      controller = null;
      setIsLoading(false);
    }
  };

  const retryRequest = () => {
    if (retryCount >= 3) {
      Alert.alert(
        'Too Many Retries', 
        'You have exceeded the maximum retry attempts. Please check your internet connection and try again later.',
        [
          {
            text: 'OK',
            onPress: () => {
              setRetryCount(0);
              setLastError(null);
            }
          }
        ]
      );
      return;
    }
    
    setRetryCount(prev => prev + 1);
    setLastError(null);
    sendVerificationCode();
  };

  const checkNetworkStatus = async () => {
    // Simple network check - in a production app, you might want to
    // use a library like 'react-native-network-info' or implement
    // a ping to your server to check connectivity
    try {
      console.log('Testing network connectivity...');
      
      // Try to make a simple request to check connectivity
      const networkController = new AbortController();
      const networkTimeout = setTimeout(() => networkController.abort(), 10000);
      const response = await fetch('https://www.google.com', { 
        method: 'HEAD',
        mode: 'no-cors',
        signal: networkController.signal
      });
      clearTimeout(networkTimeout);
      console.log('Network check successful - internet connection available');
      return true;
    } catch (error) {
      console.log('Network check failed:', error);
      // Don't fail completely on network check - let the actual API call determine connectivity
      return true; // Assume network is available and let the API call fail if needed
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Phone Verification</Text>
          <Text style={styles.subtitle}>
            We'll send a verification code to your phone number
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="Enter your phone number"
              placeholderTextColor="#999"
              keyboardType="phone-pad"
              editable={!codeSent}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="off"
              textContentType="none"
            />
          </View>

          {!codeSent ? (
            <>
              <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={sendVerificationCode}
                disabled={isLoading}
              >
                <Text style={styles.buttonText}>
                  {isLoading ? 'Sending...' : 'Send Verification Code'}
                </Text>
                {isLoading && (
                  <View style={styles.loadingIndicator}>
                    <Text style={styles.loadingText}>Please wait...</Text>
                  </View>
                )}
              </TouchableOpacity>
              
              {lastError && retryCount > 0 && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>
                    {lastError}
                  </Text>
                  <TouchableOpacity
                    style={styles.retryButton}
                    onPress={retryRequest}
                    disabled={isLoading}
                  >
                    <Text style={styles.retryButtonText}>
                      Retry ({retryCount}/3)
                    </Text>
                  </TouchableOpacity>
                  
                  <View style={styles.tipsContainer}>
                    <Text style={styles.tipsTitle}>💡 Troubleshooting Tips:</Text>
                    <Text style={styles.tipsText}>• Check your internet connection</Text>
                    <Text style={styles.tipsText}>• Ensure the phone number is correct</Text>
                    <Text style={styles.tipsText}>• Try switching between WiFi and mobile data</Text>
                    <Text style={styles.tipsText}>• Wait a few minutes before retrying</Text>
                    <Text style={styles.tipsText}>• Verify server is running and accessible</Text>
                    <Text style={styles.tipsText}>• Works on WiFi or mobile data</Text>
                  </View>
                </View>
              )}
            </>
          ) : (
            <>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Verification Code</Text>
                <TextInput
                  style={styles.input}
                  value={verificationCode}
                  onChangeText={setVerificationCode}
                  placeholder="Enter 6-digit code"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                  maxLength={6}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="off"
                  textContentType="none"
                  secureTextEntry={false}
                  returnKeyType="done"
                  blurOnSubmit={true}
                />
              </View>

              <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={verifyCode}
                disabled={isLoading}
              >
                <Text style={styles.buttonText}>
                  {isLoading ? 'Verifying...' : 'Verify Code'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.resendButton}
                onPress={sendVerificationCode}
                disabled={isLoading}
              >
                <Text style={styles.resendText}>Resend Code</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  form: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resendButton: {
    alignItems: 'center',
    padding: 10,
  },
  resendText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
  errorContainer: {
    backgroundColor: '#fdd',
    borderRadius: 8,
    padding: 15,
    marginTop: 15,
    alignItems: 'center',
  },
  errorText: {
    color: '#c00',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  tipsContainer: {
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 10,
    textAlign: 'center',
  },
  tipsText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
    textAlign: 'left',
  },
  loadingIndicator: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#555',
  },
  tipsText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
    textAlign: 'left',
  },
});

export default PhoneVerificationScreen; 