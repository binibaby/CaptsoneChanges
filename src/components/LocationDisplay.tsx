import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

interface LocationDisplayProps {
  showAddress?: boolean;
  showCoordinates?: boolean;
  compact?: boolean;
}

const LocationDisplay: React.FC<LocationDisplayProps> = ({
  showAddress = true,
  showCoordinates = false,
  compact = false,
}) => {
  try {
    const { currentLocation, userAddress, isLocationTracking } = useAuth();

    console.log('LocationDisplay render:', {
      isLocationTracking,
      hasCurrentLocation: !!currentLocation,
      hasUserAddress: !!userAddress,
      showAddress,
      showCoordinates
    });

    if (!isLocationTracking) {
      return (
        <View style={[styles.container, compact && styles.compact]}>
          <Ionicons name="location-outline" size={16} color="#FF6B6B" />
          <Text style={[styles.text, styles.errorText]}>Location tracking inactive</Text>
        </View>
      );
    }

    if (!currentLocation) {
      return (
        <View style={[styles.container, compact && styles.compact]}>
          <Ionicons name="location-outline" size={16} color="#FFA500" />
          <Text style={[styles.text, styles.warningText]}>Getting your location...</Text>
        </View>
      );
    }

    return (
      <View style={[styles.container, compact && styles.compact]}>
        <Ionicons name="location" size={16} color="#4CAF50" />
        <View style={styles.textContainer}>
          {showAddress && userAddress && (
            <Text style={[styles.text, styles.addressText]} numberOfLines={2}>
              {userAddress}
            </Text>
          )}
          {showCoordinates && (
            <Text style={[styles.text, styles.coordinatesText]}>
              {currentLocation.coords.latitude.toFixed(6)}, {currentLocation.coords.longitude.toFixed(6)}
            </Text>
          )}
          {!showAddress && !userAddress && (
            <Text style={[styles.text, styles.successText]}>Location detected</Text>
          )}
        </View>
      </View>
    );
  } catch (error) {
    console.error('LocationDisplay error:', error);
    return (
      <View style={[styles.container, compact && styles.compact]}>
        <Ionicons name="alert-circle" size={16} color="#FF6B6B" />
        <Text style={[styles.text, styles.errorText]}>Location error</Text>
      </View>
    );
  }
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 8,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  compact: {
    padding: 4,
  },
  textContainer: {
    marginLeft: 6,
    flex: 1,
  },
  text: {
    fontSize: 14,
    fontWeight: '500',
  },
  addressText: {
    color: '#333',
  },
  coordinatesText: {
    color: '#666',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  successText: {
    color: '#4CAF50',
  },
  warningText: {
    color: '#FFA500',
  },
  errorText: {
    color: '#FF6B6B',
  },
});

export default LocationDisplay;
