import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

interface LogoutBarrierProps {
  children: React.ReactNode;
}

export default function LogoutBarrier({ children }: LogoutBarrierProps) {
  const [isLoggedOut, setIsLoggedOut] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkLogoutStatus = async () => {
      try {
        const loggedOut = await AsyncStorage.getItem('user_logged_out');
        const wasLoggedOut = loggedOut === 'true';
        
        if (wasLoggedOut !== isLoggedOut) {
          setIsLoggedOut(wasLoggedOut);
          if (wasLoggedOut) {
            console.log('🚫 LogoutBarrier: USER LOGGED OUT - Allowing normal navigation to onboarding');
          } else {
            console.log('✅ LogoutBarrier: User logged in - Navigation allowed');
          }
        }
      } catch (error) {
        console.error('LogoutBarrier: Error checking logout status:', error);
      } finally {
        if (isChecking) {
          setIsChecking(false);
        }
      }
    };

    // Initial check
    checkLogoutStatus();

    // Continuous monitoring every 1000ms (reduced frequency)
    const interval = setInterval(checkLogoutStatus, 1000);

    return () => clearInterval(interval);
  }, [isLoggedOut, isChecking]);

  // Always render children - let the app's normal navigation handle onboarding/auth screens
  // The LogoutBarrier just monitors logout status but doesn't block navigation
  return <>{children}</>;
}

