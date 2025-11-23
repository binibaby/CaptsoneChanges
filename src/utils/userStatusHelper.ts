import { Alert } from 'react-native';
import { User } from '../services/authService';

const ADMIN_EMAIL = 'petsitconnectph@gmail.com';

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
