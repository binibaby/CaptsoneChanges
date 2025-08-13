import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
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
import { getApiUrl, getAuthHeaders } from '../../constants/config';
import { RootStackParamList } from '../../navigation/types';

type PhoneVerificationScreenNavigationProp = StackNavigationProp<RootStackParamList, 'PhoneVerification'>;
type PhoneVerificationScreenRouteProp = {
  params?: {
    userData: any;
  };
};

interface PhoneVerificationScreenProps {
  userData?: any;
  onPhoneVerified?: (phoneVerified: boolean) => void;
}

const PhoneVerificationScreen: React.FC<PhoneVerificationScreenProps> = ({ userData: propUserData, onPhoneVerified }) => {
  const navigation = useNavigation<PhoneVerificationScreenNavigationProp>();
  const route = useRoute<PhoneVerificationScreenRouteProp>();
  
  // Get userData from either props or route params
  const userData = propUserData || route.params?.userData;
  
  console.log('PhoneVerificationScreen - propUserData:', propUserData);
  console.log('PhoneVerificationScreen - route.params:', route.params);
  console.log('PhoneVerificationScreen - final userData:', userData);
  console.log('PhoneVerificationScreen - onPhoneVerified callback:', !!onPhoneVerified);

  const [phoneNumber, setPhoneNumber] = useState(userData?.phone || '');
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);

  const sendVerificationCode = async () => {
    if (!phoneNumber) {
      Alert.alert('Error', 'Please enter a phone number');
      return;
    }

    setIsLoading(true);
    try {
      console.log('LOG PhoneVerificationScreen - Sending code to:', phoneNumber);
      
      console.log('Using API URL:', getApiUrl('/api/send-verification-code'));
      
      const response = await fetch(getApiUrl('/api/send-verification-code'), {
        method: 'POST',
        headers: getAuthHeaders(),
        mode: 'cors',
        credentials: 'omit',
        body: JSON.stringify({
          phone: phoneNumber,
        }),
      });

      console.log('API Response Status:', response.status);
      console.log('API Response Headers:', response.headers);
      
      const data = await response.json();
      console.log('API Response Data:', data);

      if (response.ok) {
        setCodeSent(true);
        
        // Show the verification code in the alert for easy access
        const code = data.debug_code || 'Check logs for code';
        Alert.alert(
          'Verification Code Sent', 
          `Code: ${code}\n\nUse this code to verify your phone number`,
          [
            {
              text: 'Copy Code',
              onPress: () => {
                // In a real app, you would copy to clipboard
                Alert.alert('Code Copied', `Code ${code} copied to clipboard`);
              }
            },
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
    } catch (error) {
      console.error('Error sending verification code:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      Alert.alert('Error', `Network error: ${error.message}. Please check your connection.`);
    } finally {
      setIsLoading(false);
    }
  };

  const verifyCode = async () => {
    if (!verificationCode) {
      Alert.alert('Error', 'Please enter the verification code');
      return;
    }

    setIsLoading(true);
    try {
      console.log('LOG PhoneVerificationScreen - Verifying code:', verificationCode);
      
      console.log('Using API URL:', getApiUrl('/api/verify-phone-code'));
      
      const response = await fetch(getApiUrl('/api/verify-phone-code'), {
        method: 'POST',
        headers: getAuthHeaders(),
        mode: 'cors',
        credentials: 'omit',
        body: JSON.stringify({
          phone: phoneNumber,
          code: verificationCode,
        }),
      });

      console.log('Verify API Response Status:', response.status);
      const data = await response.json();
      console.log('Verify API Response Data:', data);

      if (response.ok) {
        console.log('LOG PhoneVerificationScreen - Code verified successfully');
        console.log('LOG PhoneVerificationScreen - User data:', userData);
        
        // Use callback if available, otherwise use navigation
        if (onPhoneVerified) {
          console.log('Using callback for navigation');
          onPhoneVerified(true);
        } else {
          console.log('Using navigation prop');
          // Navigate to front ID screen with all collected data
          navigation.navigate('FrontID', {
            userData: userData,
            phoneVerified: true,
          });
        }
      } else {
        Alert.alert('Error', data.message || 'Invalid verification code');
      }
    } catch (error) {
      console.error('Error verifying code:', error);
      Alert.alert('Error', 'Network error. Please check your connection.');
    } finally {
      setIsLoading(false);
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
              keyboardType="phone-pad"
              editable={!codeSent}
            />
          </View>

          {!codeSent ? (
            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={sendVerificationCode}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>
                {isLoading ? 'Sending...' : 'Send Verification Code'}
              </Text>
            </TouchableOpacity>
          ) : (
            <>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Verification Code</Text>
                <TextInput
                  style={styles.input}
                  value={verificationCode}
                  onChangeText={setVerificationCode}
                  placeholder="Enter 6-digit code"
                  keyboardType="number-pad"
                  maxLength={6}
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
});

export default PhoneVerificationScreen; 