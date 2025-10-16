import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import WelcomeScreen from '../screens/onboarding/WelcomeScreen';

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
            console.log('🚫 LogoutBarrier: USER LOGGED OUT - BLOCKING ALL NAVIGATION');
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

    // Continuous monitoring every 300ms for immediate response
    const interval = setInterval(checkLogoutStatus, 300);

    return () => clearInterval(interval);
  }, [isLoggedOut, isChecking]);

  // Show loading while checking
  if (isChecking) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      </View>
    );
  }

  // If logged out, show ONLY the welcome screen with NO navigation
  if (isLoggedOut) {
    console.log('🚫 LogoutBarrier: Rendering LOCKED welcome screen');
    return (
      <View style={styles.lockedContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <WelcomeScreen onGetStarted={() => {}} />
      </View>
    );
  }

  // If not logged out, render children (normal app with navigation)
  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  lockedContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    // Disable any touch interactions outside the welcome screen
  },
});
