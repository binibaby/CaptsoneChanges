import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import React, { useState } from 'react';
import {
  Alert,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface LocationPermissionHelperProps {
  onPermissionGranted?: () => void;
  onPermissionDenied?: () => void;
}

const LocationPermissionHelper: React.FC<LocationPermissionHelperProps> = ({
  onPermissionGranted,
  onPermissionDenied,
}) => {
  const [isRequesting, setIsRequesting] = useState(false);

  const requestLocationPermission = async () => {
    setIsRequesting(true);
    
    try {
      console.log('🔍 Requesting location permissions...');
      
      // Check current permission status
      const { status: currentStatus } = await Location.getForegroundPermissionsAsync();
      console.log('Current permission status:', currentStatus);
      
      if (currentStatus === 'granted') {
        console.log('✅ Location permission already granted');
        onPermissionGranted?.();
        setIsRequesting(false);
        return;
      }

      // Request foreground permissions
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      console.log('Foreground permission result:', foregroundStatus);
      
      if (foregroundStatus !== 'granted') {
        console.log('❌ Foreground location permission denied');
        Alert.alert(
          'Location Permission Required',
          'This app needs location access to show nearby pet sitters and provide location-based services. Please enable location permissions in your device settings.',
          [
            { text: 'Cancel', style: 'cancel', onPress: () => onPermissionDenied?.() },
            { text: 'Open Settings', onPress: () => {
              // In a real app, you would use Linking.openSettings()
              console.log('Would open device settings');
              onPermissionDenied?.();
            }}
          ]
        );
        setIsRequesting(false);
        return;
      }

      // Request background permissions for iOS
      if (Platform.OS === 'ios') {
        try {
          const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
          console.log('Background permission result:', backgroundStatus);
          
          if (backgroundStatus !== 'granted') {
            console.log('⚠️ Background location permission denied, using foreground only');
          }
        } catch (backgroundError) {
          console.log('Background permission request failed:', backgroundError);
          // Continue with foreground only
        }
      }

      console.log('✅ Location permissions granted successfully');
      onPermissionGranted?.();
      
    } catch (error) {
      console.error('❌ Error requesting location permissions:', error);
      Alert.alert(
        'Permission Error',
        'Failed to request location permissions. Please check your device settings and try again.',
        [{ text: 'OK', onPress: () => onPermissionDenied?.() }]
      );
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name="location" size={32} color="#F59E0B" />
      </View>
      
      <Text style={styles.title}>Location Access Required</Text>
      <Text style={styles.description}>
        To find nearby pet sitters and share your location, we need access to your device's location services.
      </Text>
      
      <TouchableOpacity
        style={[styles.button, isRequesting && styles.buttonDisabled]}
        onPress={requestLocationPermission}
        disabled={isRequesting}
      >
        <Ionicons 
          name={isRequesting ? "hourglass" : "location"} 
          size={20} 
          color="#fff" 
        />
        <Text style={styles.buttonText}>
          {isRequesting ? 'Requesting...' : 'Enable Location Access'}
        </Text>
      </TouchableOpacity>
      
      <Text style={styles.note}>
        Your location data is only used to provide pet sitting services and is not shared with third parties.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    margin: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F59E0B',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 16,
  },
  buttonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  note: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default LocationPermissionHelper;
