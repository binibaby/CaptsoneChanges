import { Alert } from 'react-native';
import { User } from '../services/authService';

const ADMIN_EMAIL = 'petsitconnectph@gmail.com';

/**
 * Handle suspended or banned status from API response and show popup with logout
 * @param responseData The API response data containing status information
 * @param onLogout Callback function to handle logout
 * @returns true if user is blocked (suspended/banned), false otherwise
 */
export const handleSuspendedOrBannedStatus = async (
  responseData: any,
  onLogout: () => Promise<void>
): Promise<boolean> => {
  console.log('🚫 handleSuspendedOrBannedStatus - Called with data:', responseData);
  
  if (!responseData) {
    console.log('⚠️ handleSuspendedOrBannedStatus - No response data provided');
    return false;
  }

  if (!responseData.status) {
    console.log('⚠️ handleSuspendedOrBannedStatus - No status in response data:', responseData);
    return false;
  }

  const status = responseData.status;
  console.log('🚫 handleSuspendedOrBannedStatus - Status:', status);

  if (status === 'banned') {
    const message = responseData.message || `Your account has been permanently banned. You will not be able to use the platform anymore. Please contact the admin at ${ADMIN_EMAIL} if you have any questions.`;
    console.log('🚫 handleSuspendedOrBannedStatus - Showing banned popup with message:', message);
    
    Alert.alert(
      'Account Banned',
      message,
      [
        {
          text: 'OK',
          onPress: async () => {
            console.log('🚫 handleSuspendedOrBannedStatus - OK button pressed, logging out...');
            await onLogout();
          },
        },
      ],
      { cancelable: false }
    );
    console.log('🚫 handleSuspendedOrBannedStatus - Banned popup shown');
    return true;
  }

  if (status === 'suspended') {
    const message = responseData.message || `You have been suspended for 72 hours by the admin. Please email the admin at ${ADMIN_EMAIL} for assistance.`;
    console.log('🚫 handleSuspendedOrBannedStatus - Showing suspended popup with message:', message);
    
    Alert.alert(
      'Account Suspended',
      message,
      [
        {
          text: 'OK',
          onPress: async () => {
            console.log('🚫 handleSuspendedOrBannedStatus - OK button pressed, logging out...');
            await onLogout();
          },
        },
      ],
      { cancelable: false }
    );
    console.log('🚫 handleSuspendedOrBannedStatus - Suspended popup shown');
    return true;
  }

  console.log('⚠️ handleSuspendedOrBannedStatus - Unknown status:', status);
  return false;
};

/**
 * Check if user is suspended or banned and show appropriate alert
 * @param user The user object to check
 * @returns true if user is blocked (suspended/banned), false otherwise
 */
export const checkUserStatus = (user: User | null): boolean => {
  if (!user) {
    return false;
  }

  if (user.status === 'banned') {
    Alert.alert(
      'Account Banned',
      `Your account has been permanently banned. You will not be able to use the platform anymore. Please contact the admin at ${ADMIN_EMAIL} if you have any questions.`,
      [{ text: 'OK' }]
    );
    return true;
  }

  if (user.status === 'suspended') {
    Alert.alert(
      'Account Suspended',
      `You have been suspended for 72 hours by the admin. Please email the admin at ${ADMIN_EMAIL} for assistance.`,
      [{ text: 'OK' }]
    );
    return true;
  }

  return false;
};

/**
 * Check if user can perform actions (not suspended or banned)
 * @param user The user object to check
 * @returns true if user can perform actions, false otherwise
 */
export const canUserPerformActions = (user: User | null): boolean => {
  if (!user) {
    return false;
  }
  return user.status === 'active';
};
