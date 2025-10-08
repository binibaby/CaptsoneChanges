// Debug script to check user context
console.log('=== USER CONTEXT DEBUG ===');

// Check if we can access the auth service
import authService from './src/services/authService';

async function debugUserContext() {
  try {
    console.log('1. Getting current user from authService...');
    const user = await authService.getCurrentUser();
    
    if (user) {
      console.log('✅ User found:', {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        hasToken: !!user.token,
        tokenPreview: user.token ? user.token.substring(0, 20) + '...' : 'No token'
      });
    } else {
      console.log('❌ No user found in authService');
    }
    
    // Check AsyncStorage
    console.log('2. Checking AsyncStorage...');
    const AsyncStorage = require('@react-native-async-storage/async-storage');
    const storedUser = await AsyncStorage.getItem('user');
    
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      console.log('✅ User in AsyncStorage:', {
        id: parsedUser.id,
        name: parsedUser.name,
        email: parsedUser.email,
        role: parsedUser.role,
        hasToken: !!parsedUser.token,
        tokenPreview: parsedUser.token ? parsedUser.token.substring(0, 20) + '...' : 'No token'
      });
    } else {
      console.log('❌ No user in AsyncStorage');
    }
    
  } catch (error) {
    console.error('❌ Error debugging user context:', error);
  }
}

debugUserContext();
