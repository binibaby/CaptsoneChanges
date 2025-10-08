import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useAuth } from '../../contexts/AuthContext';
import { makeApiCall } from '../../services/networkService';

const XenditCheckoutScreen: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'success' | 'failed' | 'cancelled'>('pending');
  const [statusCheckInterval, setStatusCheckInterval] = useState<NodeJS.Timeout | null>(null);
  
  const { invoiceUrl, bookingId, paymentId } = useLocalSearchParams<{
    invoiceUrl: string;
    bookingId: string;
    paymentId: string;
  }>();

  const checkPaymentStatus = async () => {
    if (!paymentId) return;

    try {
      const response = await makeApiCall(`/payments/${paymentId}/status`, {
        method: 'GET',
      });
      const data = await response.json();

      if (data.payment?.status === 'completed') {
        setPaymentStatus('success');
        if (statusCheckInterval) {
          clearInterval(statusCheckInterval);
          setStatusCheckInterval(null);
        }
        
        // Show success message and redirect
        Alert.alert(
          'Payment Successful!',
          'Your payment has been processed successfully. The sitter will be notified.',
          [
            {
              text: 'OK',
              onPress: () => {
                router.replace('/pet-owner-dashboard');
              },
            },
          ]
        );
      } else if (data.payment?.status === 'failed') {
        setPaymentStatus('failed');
        if (statusCheckInterval) {
          clearInterval(statusCheckInterval);
          setStatusCheckInterval(null);
        }
        
        Alert.alert(
          'Payment Failed',
          'Your payment could not be processed. Please try again.',
          [
            {
              text: 'Try Again',
              onPress: () => {
                router.back();
              },
            },
            {
              text: 'Cancel',
              onPress: () => {
                router.replace('/pet-owner-dashboard');
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
    }
  };

  useEffect(() => {
    // Set up a timer to check payment status periodically
    const interval = setInterval(() => {
      checkPaymentStatus();
    }, 5000); // Check every 5 seconds

    setStatusCheckInterval(interval);

    return () => {
      clearInterval(interval);
      setStatusCheckInterval(null);
    };
  }, [paymentId]);

  const completeMockPayment = async () => {
    if (!paymentId) return;

    try {
      console.log('🔧 Completing mock payment for payment ID:', paymentId);
      const response = await makeApiCall(`/payments/${paymentId}/complete-mock`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user?.token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Mock payment completed successfully:', data);
        setPaymentStatus('success');
        setLoading(false);
        
        // Show success message and redirect
        Alert.alert(
          'Payment Successful!',
          'Your payment has been processed successfully. The sitter will be notified.',
          [
            {
              text: 'OK',
              onPress: () => {
                router.replace('/pet-owner-dashboard');
              },
            },
          ]
        );
      } else {
        console.error('❌ Failed to complete mock payment:', response.status);
        setPaymentStatus('failed');
        setLoading(false);
      }
    } catch (error) {
      console.error('❌ Error completing mock payment:', error);
      setPaymentStatus('failed');
      setLoading(false);
    }
  };

  const handleWebViewNavigationStateChange = (navState: any) => {
    const { url } = navState;
    
    // Check if user is being redirected back to our app
    if (url.includes('payment/success')) {
      setPaymentStatus('success');
      setLoading(false);
    } else if (url.includes('payment/failure')) {
      setPaymentStatus('failed');
      setLoading(false);
    }
    
    // Handle mock invoice URLs (for development)
    if (url.includes('mock_invoice_')) {
      console.log('🔧 Mock invoice detected, completing mock payment');
      // Complete the mock payment via API
      completeMockPayment();
    }
  };

  const handleBack = () => {
    Alert.alert(
      'Cancel Payment',
      'Are you sure you want to cancel this payment?',
      [
        {
          text: 'Continue Payment',
          style: 'cancel',
        },
        {
          text: 'Cancel',
          style: 'destructive',
          onPress: () => {
            router.back();
          },
        },
      ]
    );
  };

  const renderLoadingScreen = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#3B82F6" />
      <Text style={styles.loadingText}>Loading secure payment page...</Text>
      <Text style={styles.loadingSubtext}>
        You will be redirected to Xendit's secure payment gateway
      </Text>
      {invoiceUrl?.includes('mock_invoice_') && (
        <View style={styles.devNotice}>
          <Text style={styles.devNoticeText}>
            🔧 Development Mode: Using mock payment for testing
          </Text>
        </View>
      )}
    </View>
  );

  const renderSuccessScreen = () => (
    <View style={styles.statusContainer}>
      <View style={styles.successIcon}>
        <Ionicons name="checkmark-circle" size={80} color="#10B981" />
      </View>
      <Text style={styles.statusTitle}>Payment Successful!</Text>
      <Text style={styles.statusMessage}>
        Your payment has been processed successfully. The sitter will receive a notification and your booking is now active.
      </Text>
      <TouchableOpacity
        style={styles.continueButton}
        onPress={() => router.replace('/pet-owner-dashboard')}
      >
        <Text style={styles.continueButtonText}>Continue to Dashboard</Text>
      </TouchableOpacity>
    </View>
  );

  const renderFailedScreen = () => (
    <View style={styles.statusContainer}>
      <View style={styles.failedIcon}>
        <Ionicons name="close-circle" size={80} color="#EF4444" />
      </View>
      <Text style={styles.statusTitle}>Payment Failed</Text>
      <Text style={styles.statusMessage}>
        Your payment could not be processed. Please check your payment details and try again.
      </Text>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => router.back()}
        >
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.replace('/pet-owner-dashboard')}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (paymentStatus === 'success') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Payment Complete</Text>
        </View>
        {renderSuccessScreen()}
      </SafeAreaView>
    );
  }

  if (paymentStatus === 'failed') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payment Failed</Text>
          <View style={{ width: 24 }} />
        </View>
        {renderFailedScreen()}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Secure Payment</Text>
        <View style={styles.securityBadge}>
          <Ionicons name="shield-checkmark" size={16} color="#10B981" />
        </View>
      </View>

      {loading && renderLoadingScreen()}

      <WebView
        source={{ uri: invoiceUrl || '' }}
        style={styles.webview}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onNavigationStateChange={handleWebViewNavigationStateChange}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        renderLoading={() => renderLoadingScreen()}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('WebView error:', nativeEvent);
          setPaymentStatus('failed');
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  securityBadge: {
    padding: 4,
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  statusContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  successIcon: {
    marginBottom: 24,
  },
  failedIcon: {
    marginBottom: 24,
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  statusMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  continueButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  continueButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#6B7280',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
  },
  cancelButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  devNotice: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    marginHorizontal: 20,
  },
  devNoticeText: {
    color: '#92400E',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default XenditCheckoutScreen;
