import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { getAuthHeaders } from '../constants/config';
import { useAuth } from '../contexts/AuthContext';
import locationService from '../services/locationService';
import { makeApiCall } from '../services/networkService';
import realtimeLocationService from '../services/realtimeLocationService';

interface SitterLocationSharingProps {
  onLocationShared?: (isSharing: boolean) => void;
}

const SitterLocationSharing: React.FC<SitterLocationSharingProps> = ({
  onLocationShared,
}) => {
  const { user, currentLocation, userAddress } = useAuth();
  const [isSharing, setIsSharing] = useState(false);
  const [sharingStatus, setSharingStatus] = useState<string>('Not available');

  // Restore availability data when sitter comes online
  const restoreAvailabilityData = async () => {
    try {
      if (!user || user.userRole !== 'Pet Sitter') return;

      console.log('🔄 Restoring availability data for online sitter...');
      
      // Get saved availability data from local storage
      const savedData = await AsyncStorage.getItem(`petSitterAvailabilities_${user.id}`);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        
        // Convert to the format expected by the backend
        const availabilities = Object.entries(parsedData).map(([date, timeRanges]) => ({
          date,
          timeRanges
        }));

        if (availabilities.length > 0) {
          // Send to backend to restore in cache
          const token = user.token;
          if (token) {
            const response = await makeApiCall('/api/sitters/restore-availability', {
              method: 'POST',
              headers: {
                ...getAuthHeaders(token),
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ availabilities }),
            });

            if (response.ok) {
              console.log('✅ Availability data restored successfully');
            } else {
              console.log('⚠️ Failed to restore availability data to backend');
            }
          }
        }
      }
    } catch (error) {
      console.error('❌ Error restoring availability data:', error);
    }
  };

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

    // If no current location, try to get it first
    if (!currentLocation) {
      try {
        // Import Location from expo-location
        const Location = require('expo-location');
        
        // Request location permission
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Location Permission Required',
            'Please enable location access in your device settings to make yourself available to pet owners.',
            [{ text: 'OK' }]
          );
          return;
        }

        // Get current location
        const location = await Location.getCurrentPositionAsync({});
        console.log('📍 Got current location:', location);
        
        // Get address from coordinates
        let address = userAddress;
        if (!address) {
          try {
            address = await locationService.getAddressFromCoordinates(
              location.coords.latitude,
              location.coords.longitude
            );
            console.log('📍 Got address from coordinates:', address);
          } catch (error) {
            console.error('Failed to get address from coordinates:', error);
            address = `${location.coords.latitude.toFixed(4)}, ${location.coords.longitude.toFixed(4)}`;
          }
        }
        
        const sitterData = {
          id: user.id,
          userId: user.id,
          name: user.name,
          email: user.email,
          location: {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            address: address,
          },
          specialties: user.specialties || ['General Pet Care'],
          experience: user.experience || '1 year',
          petTypes: user.selectedPetTypes || ['dogs', 'cats'],
          selectedBreeds: user.selectedBreeds || ['All breeds welcome'],
          hourlyRate: parseFloat(user.hourlyRate || '25'),
          rating: 4.5,
          reviews: 0,
          bio: user.aboutMe || 'Professional pet sitter ready to help!',
          isOnline: true,
          lastSeen: new Date(),
        };

        await realtimeLocationService.updateSitterLocation(sitterData);
        await realtimeLocationService.setSitterOnline(user.id, true);
        realtimeLocationService.startRealtimeUpdates();

        // Restore availability data when coming online
        await restoreAvailabilityData();

        setIsSharing(true);
        setSharingStatus('Available - Pet owners can find you!');
        onLocationShared?.(true);

        console.log('✅ Pet sitter location sharing started with new location:', {
          name: user.name,
          location: sitterData.location,
        });
        return;
      } catch (error) {
        console.error('Failed to get location:', error);
        Alert.alert(
          'Location Error',
          'Unable to get your current location. Please check your location settings and try again.',
          [{ text: 'OK' }]
        );
        return;
      }
    }

    try {
      // Get address from coordinates if not available
      let address = userAddress;
      if (!address) {
        try {
          address = await locationService.getAddressFromCoordinates(
            currentLocation.coords.latitude,
            currentLocation.coords.longitude
          );
          console.log('📍 Got address from coordinates:', address);
        } catch (error) {
          console.error('Failed to get address from coordinates:', error);
          address = `${currentLocation.coords.latitude.toFixed(4)}, ${currentLocation.coords.longitude.toFixed(4)}`;
        }
      }

      const sitterData = {
        id: user.id,
        userId: user.id,
        name: user.name,
        email: user.email,
        location: {
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
          address: address,
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

      // Restore availability data when coming online
      await restoreAvailabilityData();

      setIsSharing(true);
      setSharingStatus('Available - Pet owners can find you!');
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
    setSharingStatus('Not available');
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

  // Show simple toggle even if location is not available
  // The toggle will handle location permission requests internally

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Availability</Text>
      <View style={styles.toggleContainer}>
        <Text style={styles.toggleLabel}>Status</Text>
        <TouchableOpacity
          style={[styles.toggle, isSharing ? styles.toggleOn : styles.toggleOff]}
          onPress={toggleLocationSharing}
        >
          <View style={[styles.toggleButton, isSharing ? styles.toggleButtonOn : styles.toggleButtonOff]} />
        </TouchableOpacity>
        <Text style={[styles.toggleText, isSharing ? styles.toggleTextOn : styles.toggleTextOff]}>
          {isSharing ? 'ON' : 'OFF'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    margin: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    padding: 2,
  },
  toggleOn: {
    backgroundColor: '#10B981',
  },
  toggleOff: {
    backgroundColor: '#D1D5DB',
  },
  toggleButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleButtonOn: {
    alignSelf: 'flex-end',
  },
  toggleButtonOff: {
    alignSelf: 'flex-start',
  },
  toggleText: {
    fontSize: 12,
    fontWeight: 'bold',
    minWidth: 24,
    textAlign: 'center',
  },
  toggleTextOn: {
    color: '#10B981',
  },
  toggleTextOff: {
    color: '#6B7280',
  },
});

export default SitterLocationSharing;
