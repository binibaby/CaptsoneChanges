import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import realtimeLocationService from '../services/realtimeLocationService';
import LocationPermissionHelper from './LocationPermissionHelper';

interface SitterLocationSharingProps {
  onLocationShared?: (isSharing: boolean) => void;
}

const SitterLocationSharing: React.FC<SitterLocationSharingProps> = ({
  onLocationShared,
}) => {
  const { user, currentLocation, userAddress } = useAuth();
  const [isSharing, setIsSharing] = useState(false);
  const [sharingStatus, setSharingStatus] = useState<string>('Not sharing location');

  useEffect(() => {
    if (user && user.userRole === 'Pet Sitter' && currentLocation) {
      // Auto-start sharing when component mounts and location is available
      startLocationSharing();
    }
  }, [user, currentLocation]);

  const startLocationSharing = async () => {
    if (!user || user.userRole !== 'Pet Sitter') {
      Alert.alert('Error', 'Only pet sitters can share their location');
      return;
    }

    if (!currentLocation) {
      Alert.alert(
        'Location Required', 
        'Location services are not available. Please:\n\n1. Enable location services in your device settings\n2. Grant location permissions to this app\n3. Make sure you\'re not in airplane mode',
        [
          { text: 'OK', style: 'default' },
          { text: 'Open Settings', onPress: () => {
            // This would open device settings in a real app
            console.log('Would open device settings');
          }}
        ]
      );
      return;
    }

    try {
      const sitterData = {
        id: user.id,
        userId: user.id,
        name: user.name,
        email: user.email,
        location: {
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
          address: userAddress || 'Location not available',
        },
        specialties: user.specialties || ['General Pet Care'],
        experience: user.experience || '1 year',
        petTypes: user.selectedPetTypes || ['dogs', 'cats'],
        selectedBreeds: user.selectedBreeds || ['All breeds welcome'],
        hourlyRate: parseFloat(user.hourlyRate || '25'),
        rating: 4.5, // Default rating
        reviews: 0, // Default reviews
        bio: user.aboutMe || 'Professional pet sitter ready to help!',
        isOnline: true,
        lastSeen: new Date(),
      };

      await realtimeLocationService.updateSitterLocation(sitterData);
      await realtimeLocationService.setSitterOnline(user.id, true);
      realtimeLocationService.startRealtimeUpdates();

      setIsSharing(true);
      setSharingStatus('Sharing location - Pet owners can find you!');
      onLocationShared?.(true);

      console.log('✅ Pet sitter location sharing started:', {
        name: user.name,
        location: sitterData.location,
      });
    } catch (error) {
      console.error('Failed to start location sharing:', error);
      Alert.alert('Error', 'Failed to start location sharing');
    }
  };

  const stopLocationSharing = async () => {
    if (!user) return;

    await realtimeLocationService.setSitterOnline(user.id, false);
    realtimeLocationService.removeSitter(user.id);

    setIsSharing(false);
    setSharingStatus('Location sharing stopped');
    onLocationShared?.(false);

    console.log('⏹️ Pet sitter location sharing stopped');
  };

  const toggleLocationSharing = () => {
    if (isSharing) {
      stopLocationSharing();
    } else {
      startLocationSharing();
    }
  };

  if (!user || user.userRole !== 'Pet Sitter') {
    return null;
  }

  // Show permission helper if location is not available
  if (!currentLocation) {
    return (
      <LocationPermissionHelper
        onPermissionGranted={() => {
          console.log('Location permission granted, retrying location sharing...');
          // The useEffect will automatically retry when currentLocation becomes available
        }}
        onPermissionDenied={() => {
          console.log('Location permission denied');
        }}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.statusContainer}>
        <View style={[styles.statusIndicator, { backgroundColor: isSharing ? '#10B981' : '#EF4444' }]} />
        <Text style={styles.statusText}>{isSharing ? 'Sharing Location' : 'Not Sharing'}</Text>
        <TouchableOpacity
          style={[styles.toggleButton, { backgroundColor: isSharing ? '#EF4444' : '#10B981' }]}
          onPress={toggleLocationSharing}
        >
          <Ionicons 
            name={isSharing ? 'stop' : 'location'} 
            size={16} 
            color="#fff" 
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  toggleButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default SitterLocationSharing;
