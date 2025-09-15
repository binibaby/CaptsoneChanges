import * as Location from 'expo-location';
import { Platform } from 'react-native';

interface LocationConfig {
  radius: number; // in meters
  updateInterval: number; // in milliseconds
  onLocationUpdate: (location: Location.LocationObject) => void;
  onRadiusEnter?: (location: Location.LocationObject) => void;
  onRadiusExit?: (location: Location.LocationObject) => void;
  onError?: (error: string) => void;
}

interface UserLocation {
  latitude: number;
  longitude: number;
  address?: string;
  timestamp: number;
}

class LocationService {
  private locationSubscription: Location.LocationSubscription | null = null;
  private lastKnownLocation: Location.LocationObject | null = null;
  private radiusCenter: { latitude: number; longitude: number } | null = null;
  private radius: number = 1000; // default 1km
  private isTracking: boolean = false;

  async requestPermissions(): Promise<boolean> {
    try {
      console.log('Requesting location permissions...');
      
      // Request foreground permissions
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      console.log('Foreground permission status:', foregroundStatus);
      
      if (foregroundStatus !== 'granted') {
        console.log('Foreground location permission denied');
        return false;
      }

      // Request background permissions for continuous tracking
      if (Platform.OS === 'ios') {
        try {
          const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
          console.log('Background permission status:', backgroundStatus);
          
          if (backgroundStatus !== 'granted') {
            console.log('Background location permission denied, using foreground only');
          }
        } catch (backgroundError) {
          console.log('Background permission request failed:', backgroundError);
          // Continue with foreground only
        }
      }

      console.log('Location permissions granted successfully');
      return true;
    } catch (error: any) {
      console.error('Error requesting location permissions:', error);
      
      // Provide more specific error information
      if (error?.message?.includes('NSLocation')) {
        console.error('iOS location permission keys missing. Please rebuild the app after updating app.json');
      } else if (error?.message?.includes('ACCESS_FINE_LOCATION')) {
        console.error('Android location permission missing. Please rebuild the app after updating app.json');
      }
      
      return false;
    }
  }

  async startLocationTracking(config: LocationConfig): Promise<void> {
    try {
      // Check if already tracking
      if (this.isTracking) {
        console.log('Location tracking already active');
        return;
      }

      // Request permissions first
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.log('Location permission denied, skipping location tracking');
        return; // Don't throw error, just skip tracking
      }

      this.radius = config.radius;
      this.isTracking = true;
      
      console.log('Starting location tracking with radius:', this.radius, 'meters');

      // Get initial location
      const initialLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      this.radiusCenter = {
        latitude: initialLocation.coords.latitude,
        longitude: initialLocation.coords.longitude,
      };

      // Start continuous location updates
      this.locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: config.updateInterval,
          distanceInterval: 10, // Update every 10 meters of movement
        },
        (location) => {
          this.handleLocationUpdate(location, config);
        }
      );

      // Immediately call the update callback with initial location
      config.onLocationUpdate(initialLocation);
      
      console.log('Location tracking started successfully');
    } catch (error) {
      this.isTracking = false;
      console.error('Failed to start location tracking:', error);
      if (config.onError) {
        config.onError(error instanceof Error ? error.message : 'Unknown error');
      }
      throw error;
    }
  }

  private handleLocationUpdate(location: Location.LocationObject, config: LocationConfig) {
    this.lastKnownLocation = location;
    
    // Call the update callback
    config.onLocationUpdate(location);

    // Check if user is within radius
    if (this.radiusCenter) {
      const distance = this.calculateDistance(
        this.radiusCenter.latitude,
        this.radiusCenter.longitude,
        location.coords.latitude,
        location.coords.longitude
      );

      if (distance <= this.radius) {
        // User is within radius
        if (config.onRadiusEnter) {
          config.onRadiusEnter(location);
        }
      } else {
        // User is outside radius
        if (config.onRadiusExit) {
          config.onRadiusExit(location);
        }
      }
    }
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  async getCurrentLocation(): Promise<Location.LocationObject> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Location permission denied');
      }

      return await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
    } catch (error) {
      console.error('Failed to get current location:', error);
      throw error;
    }
  }

  async getAddressFromCoordinates(latitude: number, longitude: number): Promise<string> {
    try {
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (reverseGeocode.length > 0) {
        const address = reverseGeocode[0];
        const parts = [
          address.street,
          address.city,
          address.region,
          address.country
        ].filter(Boolean);
        
        return parts.join(', ');
      }
      
      return 'Unknown location';
    } catch (error) {
      console.error('Failed to get address from coordinates:', error);
      return 'Unknown location';
    }
  }

  stopLocationTracking(): void {
    if (this.locationSubscription) {
      this.locationSubscription.remove();
      this.locationSubscription = null;
    }
    this.isTracking = false;
    console.log('Location tracking stopped');
  }

  getLastKnownLocation(): Location.LocationObject | null {
    return this.lastKnownLocation;
  }

  isLocationTracking(): boolean {
    return this.isTracking;
  }

  getRadiusCenter(): { latitude: number; longitude: number } | null {
    return this.radiusCenter;
  }
}

export default new LocationService();
export type { LocationConfig, UserLocation };
