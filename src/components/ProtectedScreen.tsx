import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

interface ProtectedScreenProps {
  children: React.ReactNode;
  screenName?: string;
}

export default function ProtectedScreen({ children, screenName }: ProtectedScreenProps) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [isLoggedOut, setIsLoggedOut] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const loggedOut = await AsyncStorage.getItem('user_logged_out');
        if (loggedOut === 'true') {
          console.log(`ProtectedScreen (${screenName}): User is logged out, redirecting to onboarding`);
          setIsLoggedOut(true);
          router.replace('/onboarding');
          return;
        }
        setIsLoggedOut(false);
      } catch (error) {
        console.error(`ProtectedScreen (${screenName}): Error checking access:`, error);
        // On error, redirect to onboarding for safety
        router.replace('/onboarding');
      } finally {
        setIsChecking(false);
      }
    };

    checkAccess();

    // Set up interval to continuously check logout status
    const interval = setInterval(checkAccess, 1000);

    return () => clearInterval(interval);
  }, [router, screenName]);

  // Show loading while checking
  if (isChecking) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // If logged out, don't render children (will redirect)
  if (isLoggedOut) {
    return null;
  }

  // If access is allowed, render children
  return <>{children}</>;
}
