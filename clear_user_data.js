// Script to clear all user data for current user
const AsyncStorage = require('@react-native-async-storage/async-storage').default;

async function clearCurrentUserData() {
  try {
    console.log('🧹 Clearing all data for current user...');
    
    // Clear all booking data
    await AsyncStorage.removeItem('bookings');
    console.log('✅ Cleared bookings');
    
    // Clear all availability data
    await AsyncStorage.removeItem('petSitterAvailabilities');
    await AsyncStorage.removeItem('petSitterWeeklyAvailabilities');
    console.log('✅ Cleared availability data');
    
    // Get all keys and clear user-specific data
    const keys = await AsyncStorage.getAllKeys();
    console.log('📋 All keys found:', keys);
    
    // Clear user-specific availability data
    const availabilityKeys = keys.filter(key => 
      key.startsWith('petSitterAvailabilities_') || 
      key.startsWith('petSitterWeeklyAvailabilities_')
    );
    
    for (const key of availabilityKeys) {
      await AsyncStorage.removeItem(key);
      console.log(`✅ Cleared ${key}`);
    }
    
    // Clear sitter initialization flags
    const sitterKeys = keys.filter(key => key.startsWith('sitter_') && key.endsWith('_availability_initialized'));
    
    for (const key of sitterKeys) {
      await AsyncStorage.removeItem(key);
      console.log(`✅ Cleared ${key}`);
    }
    
    // Clear notification data
    await AsyncStorage.removeItem('notifications');
    console.log('✅ Cleared notifications');
    
    // Clear location data
    await AsyncStorage.removeItem('user_location');
    await AsyncStorage.removeItem('user_address');
    console.log('✅ Cleared location data');
    
    console.log('🎉 All user data cleared successfully!');
    
  } catch (error) {
    console.error('❌ Error clearing user data:', error);
  }
}

// Run the function
clearCurrentUserData();



