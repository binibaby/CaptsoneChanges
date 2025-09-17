import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../src/contexts/AuthContext';

export default function App() {
  const [isContextReady, setIsContextReady] = useState(false);
  const router = useRouter();

  // Wait for component to mount and context to be ready
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsContextReady(true);
    }, 200); // Increased delay to ensure context is ready
    return () => clearTimeout(timer);
  }, []);

  if (!isContextReady) {
    return (
      <View style={styles.container}>
        <Image
          source={require('../src/assets/images/logo.png')}
          style={styles.logo}
        />
        <Text style={styles.title}>Petsit Connect</Text>
        <Text style={styles.subtitle}>Connecting pets with loving care</Text>
        <ActivityIndicator size="large" color="#FFFFFF" style={styles.spinner} />
      </View>
    );
  }

  return <AppContent />;
}

function AppContent() {
  const { isLoading, user, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      try {
        // Check logout status first
        const checkLogoutStatus = async () => {
          try {
            const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
            const loggedOut = await AsyncStorage.getItem('user_logged_out');
            if (loggedOut === 'true') {
              console.log('App started - User was logged out, redirecting to onboarding');
              router.replace('/onboarding');
              return;
            }
          } catch (error) {
            console.error('Error checking logout status:', error);
          }
          
          // Always redirect to onboarding on app restart for fresh start
          console.log('App started - Always redirecting to onboarding for fresh start');
          router.replace('/onboarding');
        };
        
        checkLogoutStatus();
      } catch (error) {
        console.error('Navigation error:', error);
        // Fallback to onboarding on error
        router.replace('/onboarding');
      }
    }
  }, [isLoading, router]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Image
          source={require('../src/assets/images/logo.png')}
          style={styles.logo}
        />
        <Text style={styles.title}>Petsit Connect</Text>
        <Text style={styles.subtitle}>Connecting pets with loving care</Text>
        <ActivityIndicator size="large" color="#FFFFFF" style={styles.spinner} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#007AFF" />
      <Text style={{ marginTop: 16 }}>Redirecting to onboarding...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 50,
  },
  spinner: {
    marginTop: 20,
  },
}); 