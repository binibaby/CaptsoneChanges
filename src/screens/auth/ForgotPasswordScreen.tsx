import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { passwordResetService } from '../../services/passwordResetService';

interface ForgotPasswordScreenProps {
  onBack: () => void;
  onVerificationSuccess: (mobileNumber: string, email: string) => void;
}

const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({
  onBack,
  onVerificationSuccess,
}) => {
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [otpInputs, setOtpInputs] = useState(['', '', '', '', '', '']);
  const [userEmail, setUserEmail] = useState('');
  const [isEmailLoaded, setIsEmailLoaded] = useState(false);
  const [showEmailField, setShowEmailField] = useState(false);
  const otpInputRefs = useRef<TextInput[]>([]);

  // Countdown timer effect
  useEffect(() => {
    let timer: number;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const validateMobileNumber = (number: string): boolean => {
    // Remove all non-digit characters
    const cleanNumber = number.replace(/\D/g, '');
    
    // Check if it's a valid Philippine mobile number
    // Philippine mobile numbers start with 09 and have 11 digits total
    const philippineMobileRegex = /^09\d{9}$/;
    
    return philippineMobileRegex.test(cleanNumber);
  };

  const lookupUserEmail = async (mobileNumber: string, expectedEmail?: string): Promise<string | null> => {
    try {
      console.log('🔍 Looking up email for mobile number:', mobileNumber, 'expected email:', expectedEmail);
      const email = await passwordResetService.lookupUserEmail(mobileNumber, expectedEmail);
      console.log('📧 Email lookup result:', email);
      return email;
    } catch (error) {
      console.error('❌ Error looking up user email:', error);
      return null;
    }
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const sendOTP = async () => {
    if (!mobileNumber.trim()) {
      Alert.alert('Error', 'Please enter your mobile number');
      return;
    }

    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    const cleanNumber = mobileNumber.replace(/\D/g, '');
    
    if (!validateMobileNumber(cleanNumber)) {
      Alert.alert(
        'Invalid Mobile Number',
        'Please enter a valid Philippine mobile number (e.g., 09123456789)'
      );
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    
    try {
      // Verify that the email matches the mobile number
      const lookupEmail = await lookupUserEmail(cleanNumber, email);
      
      if (!lookupEmail) {
        Alert.alert(
          'Account Not Found',
          'No account found with this mobile number. Please check your number or contact support.'
        );
        return;
      }

      // Normalize emails for comparison (trim whitespace and convert to lowercase)
      const normalizedLookupEmail = lookupEmail.trim().toLowerCase();
      const normalizedInputEmail = email.trim().toLowerCase();

      console.log('📧 Email comparison:', {
        lookupEmail,
        inputEmail: email,
        normalizedLookupEmail,
        normalizedInputEmail,
        match: normalizedLookupEmail === normalizedInputEmail
      });

      if (normalizedLookupEmail !== normalizedInputEmail) {
        Alert.alert(
          'Email Mismatch',
          `The email address does not match the account associated with this mobile number.\n\n` +
          `Account email: ${lookupEmail}\n` +
          `You entered: ${email}\n\n` +
          `Please check your email or contact support.`
        );
        return;
      }
      
      setUserEmail(email);
      setIsEmailLoaded(true);
      
      // Send OTP via API
      const otpResult = await passwordResetService.sendPasswordResetOTP(cleanNumber, email);
      
      if (otpResult.success) {
        setIsCodeSent(true);
        setCountdown(60); // 60 seconds countdown
        Alert.alert('Success', otpResult.message);
      } else {
        Alert.alert('Error', otpResult.message);
        return;
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      Alert.alert('Error', 'Failed to send verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOTP = async () => {
    const enteredOtp = otpInputs.join('');
    
    if (enteredOtp.length !== 6) {
      Alert.alert('Error', 'Please enter the complete 6-digit verification code');
      return;
    }

    setIsLoading(true);
    
    try {
      const cleanNumber = mobileNumber.replace(/\D/g, '');
      
      // Verify OTP via API
      const verifyResult = await passwordResetService.verifyOTP(cleanNumber, userEmail, enteredOtp);
      
      if (verifyResult.success) {
        onVerificationSuccess(cleanNumber, userEmail);
      } else {
        Alert.alert('Error', verifyResult.message);
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      Alert.alert('Error', 'Invalid verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resendOTP = async () => {
    if (countdown > 0) return;
    
    await sendOTP();
  };

  const handleOtpChange = (value: string, index: number) => {
    const newOtpInputs = [...otpInputs];
    newOtpInputs[index] = value;
    setOtpInputs(newOtpInputs);

    // Auto-focus next input
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otpInputs[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const formatMobileNumber = (text: string) => {
    // Remove all non-digit characters
    const cleanNumber = text.replace(/\D/g, '');
    
    // Limit to 11 digits
    const limitedNumber = cleanNumber.slice(0, 11);
    
    // Format as 09XX XXX XXXX
    if (limitedNumber.length <= 4) {
      return limitedNumber;
    } else if (limitedNumber.length <= 7) {
      return `${limitedNumber.slice(0, 4)} ${limitedNumber.slice(4)}`;
    } else {
      return `${limitedNumber.slice(0, 4)} ${limitedNumber.slice(4, 7)} ${limitedNumber.slice(7)}`;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Forgot Password</Text>
      </View>

      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/images/logo.png')}
            style={styles.logo}
          />
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.title}>
            {isCodeSent ? 'Enter Verification Code' : 'Reset Your Password'}
          </Text>
          <Text style={styles.subtitle}>
            {isCodeSent 
              ? `We've sent a 6-digit verification code to +63 ${mobileNumber.slice(2, 5)} ${mobileNumber.slice(5, 8)} ${mobileNumber.slice(8)}`
              : 'Enter your mobile number and we\'ll send you a verification code to reset your password.'
            }
          </Text>
          
          {isCodeSent && isEmailLoaded && (
            <View style={styles.accountInfoContainer}>
              <Text style={styles.accountInfoTitle}>Account Found:</Text>
              <Text style={styles.accountInfoEmail}>{userEmail}</Text>
              <Text style={styles.accountInfoText}>
                We'll reset the password for this account
              </Text>
            </View>
          )}
        </View>

        {!isCodeSent ? (
          <>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Mobile Number</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.countryCode}>+63</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="912 345 6789"
                  value={mobileNumber}
                  onChangeText={(text) => setMobileNumber(formatMobileNumber(text))}
                  keyboardType="phone-pad"
                  maxLength={13} // 09XX XXX XXXX format
                  autoFocus
                />
              </View>
              <Text style={styles.helpText}>
                Enter your Philippine mobile number (e.g., 09123456789)
              </Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter your email address"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              <Text style={styles.helpText}>
                Enter the email address associated with your account
              </Text>
            </View>
          </>
        ) : (
          <View style={styles.otpContainer}>
            <Text style={styles.inputLabel}>Verification Code</Text>
            <View style={styles.otpInputsContainer}>
              {otpInputs.map((value, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => {
                    if (ref) {
                      otpInputRefs.current[index] = ref;
                    }
                  }}
                  style={[styles.otpInput, value && styles.otpInputFilled]}
                  value={value}
                  onChangeText={(text) => handleOtpChange(text, index)}
                  onKeyPress={({ nativeEvent }) => handleOtpKeyPress(nativeEvent.key, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  autoFocus={index === 0}
                />
              ))}
            </View>
            <Text style={styles.helpText}>
              Enter the 6-digit code sent to your mobile number
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.nextButton, isLoading && styles.nextButtonDisabled]}
          onPress={isCodeSent ? verifyOTP : sendOTP}
          disabled={isLoading}
        >
          <Text style={styles.nextButtonText}>
            {isLoading 
              ? (isCodeSent ? 'Verifying...' : 'Sending...') 
              : (isCodeSent ? 'Verify Code' : 'Send Verification Code')
            }
          </Text>
        </TouchableOpacity>

        {isCodeSent && (
          <View style={styles.resendContainer}>
            <Text style={styles.resendText}>
              Didn't receive the code?{' '}
            </Text>
            <TouchableOpacity 
              onPress={resendOTP} 
              disabled={countdown > 0}
              style={styles.resendButton}
            >
              <Text style={[styles.resendButtonText, countdown > 0 && styles.resendButtonDisabled]}>
                {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.helpContainer}>
          <Text style={styles.helpTitle}>Need Help?</Text>
          <Text style={styles.helpDescription}>
            Make sure you're using the mobile number associated with your account. 
            If you don't have access to this number, please contact support.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 5,
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
  },
  textContainer: {
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 15,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  inputContainer: {
    marginBottom: 30,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingHorizontal: 15,
    height: 56,
  },
  countryCode: {
    fontSize: 16,
    color: '#333',
    marginRight: 10,
    fontWeight: '500',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  helpText: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    marginLeft: 5,
  },
  nextButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 30,
  },
  nextButtonDisabled: {
    backgroundColor: '#ccc',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  helpContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  helpDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  otpContainer: {
    marginBottom: 30,
  },
  otpInputsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  otpInput: {
    width: 45,
    height: 56,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    backgroundColor: '#fff',
  },
  otpInputFilled: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  resendText: {
    fontSize: 14,
    color: '#666',
  },
  resendButton: {
    paddingVertical: 4,
  },
  resendButtonText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  resendButtonDisabled: {
    color: '#999',
  },
  accountInfoContainer: {
    backgroundColor: '#e8f4fd',
    borderRadius: 12,
    padding: 15,
    marginTop: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  accountInfoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  accountInfoEmail: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 5,
  },
  accountInfoText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
});

export default ForgotPasswordScreen;
