import { Stack } from 'expo-router';
import { AuthProvider } from '../src/contexts/AuthContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="pet-owner-dashboard" />
        <Stack.Screen name="pet-sitter-dashboard" />
        <Stack.Screen name="find-sitter-map" />
        
        {/* Pet Sitter Routes */}
        <Stack.Screen name="pet-sitter-profile" />
        <Stack.Screen name="pet-sitter-notifications" />
        <Stack.Screen name="pet-sitter-availability" />
        <Stack.Screen name="pet-sitter-requests" />
        <Stack.Screen name="pet-sitter-schedule" />
        <Stack.Screen name="pet-sitter-messages" />
        <Stack.Screen name="e-wallet" />
        
        {/* Pet Owner Routes */}
        <Stack.Screen name="pet-owner-profile" />
        <Stack.Screen name="pet-owner-notifications" />
        <Stack.Screen name="pet-owner-jobs" />
        <Stack.Screen name="pet-owner-messages" />
        
        <Stack.Screen name="admin" />
      </Stack>
    </AuthProvider>
  );
} 