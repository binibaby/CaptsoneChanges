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
    console.log('🔍 Location permission button clicked');
    setIsRequesting(true);
    
    try {
      // Request foreground permissions directly
      const { status } = await Location.requestForegroundPermissionsAsync();
      console.log('Permission request result:', status);
      
      if (status === 'granted') {
        console.log('✅ Location permission granted');
        onPermissionGranted?.();
      } else {
        console.log('❌ Location permission denied');
        Alert.alert(
          'Location Permission Required',
          'Please enable location access in your device settings to use this feature.',
          [{ text: 'OK' }]
        );
        onPermissionDenied?.();
      }
    } catch (error) {
      console.error('❌ Error requesting location permissions:', error);
      Alert.alert('Error', 'Failed to request location permissions');
      onPermissionDenied?.();
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name="location" size={20} color="#F59E0B" />
      </View>
      
      <Text style={styles.title}>Enable Location</Text>
      <Text style={styles.description}>
        Allow location access to find nearby pet sitters.
      </Text>
      
      <TouchableOpacity
        style={[styles.button, isRequesting && styles.buttonDisabled]}
        onPress={requestLocationPermission}
        disabled={isRequesting}
        activeOpacity={0.7}
      >
        <Ionicons 
          name={isRequesting ? "hourglass" : "location"} 
          size={16} 
          color="#fff" 
        />
        <Text style={styles.buttonText}>
          {isRequesting ? 'Requesting...' : 'Enable Location'}
        </Text>
      </TouchableOpacity>
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
