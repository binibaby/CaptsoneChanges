import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';

interface NavigationGuardProps {
  children: React.ReactNode;
}

export default function NavigationGuard({ children }: NavigationGuardProps) {
  const router = useRouter();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const checkLogoutStatus = async () => {
      try {
        const loggedOut = await AsyncStorage.getItem('user_logged_out');
        if (loggedOut === 'true') {
          console.log('NavigationGuard: User is logged out, forcing redirect to onboarding');
          router.replace('/onboarding');
        }
      } catch (error) {
        console.error('NavigationGuard: Error checking logout status:', error);
      }
    };

    // Initial check
    checkLogoutStatus();

    // Set up interval to check logout status every 500ms
    intervalRef.current = setInterval(checkLogoutStatus, 500);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [router]);

  return <>{children}</>;
}
