import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../src/contexts/AuthContext';

export default function App() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.replace('/onboarding');
      } else {
        if (user?.userRole === 'Pet Owner') {
          router.replace('/pet-owner-dashboard');
        } else {
          router.replace('/pet-sitter-dashboard');
        }
      }
    }
  }, [isAuthenticated, isLoading, user, router]);

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
      <Text style={{ marginTop: 16 }}>Loading...</Text>
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