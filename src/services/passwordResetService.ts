import { makeApiCall } from './networkService';

export interface PasswordResetRequest {
  mobile_number: string;
  email: string;
  otp: string;
  new_password: string;
}

export interface PasswordResetResponse {
  success: boolean;
  message: string;
  data?: any;
}

class PasswordResetService {
  private static instance: PasswordResetService;

  private constructor() {}

  static getInstance(): PasswordResetService {
    if (!PasswordResetService.instance) {
      PasswordResetService.instance = new PasswordResetService();
    }
    return PasswordResetService.instance;
  }

  /**
   * Send OTP to mobile number for password reset
   */
  async sendPasswordResetOTP(mobileNumber: string, email: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log('📱 Sending password reset OTP to:', mobileNumber, email);
      
      const response = await makeApiCall('/api/password-reset/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mobile_number: mobileNumber,
          email: email,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ OTP sent successfully:', data);
        return {
          success: true,
          message: data.message || 'Verification code sent successfully'
        };
      } else {
        const errorData = await response.json();
        console.error('❌ Failed to send OTP:', errorData);
        return {
          success: false,
          message: errorData.message || 'Failed to send verification code'
        };
      }
    } catch (error) {
      console.error('❌ Error sending OTP:', error);
      return {
        success: false,
        message: 'Network error. Please try again.'
      };
    }
  }

  /**
   * Verify OTP and reset password
   */
  async resetPassword(request: PasswordResetRequest): Promise<PasswordResetResponse> {
    try {
      console.log('🔐 Resetting password for:', request.email);
      
      const response = await makeApiCall('/api/password-reset/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Password reset successfully:', data);
        return {
          success: true,
          message: data.message || 'Password reset successfully',
          data: data.data
        };
      } else {
        const errorData = await response.json();
        console.error('❌ Failed to reset password:', errorData);
        return {
          success: false,
          message: errorData.message || 'Failed to reset password'
        };
      }
    } catch (error) {
      console.error('❌ Error resetting password:', error);
      return {
        success: false,
        message: 'Network error. Please try again.'
      };
    }
  }

  /**
   * Verify OTP without resetting password
   */
  async verifyOTP(mobileNumber: string, email: string, otp: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log('🔍 Verifying OTP for:', mobileNumber, email);
      
      const response = await makeApiCall('/api/password-reset/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mobile_number: mobileNumber,
          email: email,
          otp: otp,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ OTP verified successfully:', data);
        return {
          success: true,
          message: data.message || 'OTP verified successfully'
        };
      } else {
        const errorData = await response.json();
        console.error('❌ Failed to verify OTP:', errorData);
        return {
          success: false,
          message: errorData.message || 'Invalid verification code'
        };
      }
    } catch (error) {
      console.error('❌ Error verifying OTP:', error);
      return {
        success: false,
        message: 'Network error. Please try again.'
      };
    }
  }

  /**
   * Lookup user email by mobile number
   */
  async lookupUserEmail(mobileNumber: string, expectedEmail?: string): Promise<string | null> {
    try {
      console.log('🔍 Looking up email for mobile number:', mobileNumber, 'expected email:', expectedEmail);
      
      // Build URL with email parameter if provided
      let url = `/api/password-reset/lookup-email/${mobileNumber}`;
      if (expectedEmail) {
        url += `?email=${encodeURIComponent(expectedEmail)}`;
      }
      
      const response = await makeApiCall(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Email lookup successful:', data);
        return data.email || null;
      } else {
        console.log('❌ No account found for mobile number:', mobileNumber);
        return null;
      }
    } catch (error) {
      console.error('❌ Error looking up email:', error);
      return null;
    }
  }
}

export const passwordResetService = PasswordResetService.getInstance();
