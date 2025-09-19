// Debug script to check AsyncStorage data
import AsyncStorage from '@react-native-async-storage/async-storage';

const debugAsyncStorage = async () => {
  try {
    console.log('🔍 DEBUGGING ASYNC STORAGE...');
    
    // Check user data
    const userData = await AsyncStorage.getItem('user');
    console.log('📱 User data from AsyncStorage:', userData);
    
    if (userData) {
      const user = JSON.parse(userData);
      console.log('📱 Parsed user object:', user);
      console.log('📱 User firstName:', user.firstName);
      console.log('📱 User lastName:', user.lastName);
      console.log('📱 User name:', user.name);
      console.log('📱 User email:', user.email);
    }
    
    // Check profile data
    const profileData = await AsyncStorage.getItem('user_profile_data');
    console.log('📱 Profile data from AsyncStorage:', profileData);
    
    if (profileData) {
      const profile = JSON.parse(profileData);
      console.log('📱 Parsed profile object:', profile);
      console.log('📱 Profile firstName:', profile.firstName);
      console.log('📱 Profile lastName:', profile.lastName);
    }
    
  } catch (error) {
    console.error('❌ Error debugging AsyncStorage:', error);
  }
};

export default debugAsyncStorage;
