import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import React, { createContext, useContext, useEffect, useState } from 'react';
import authService, { User } from '../services/authService';
import locationService from '../services/locationService';
import realtimeLocationService from '../services/realtimeLocationService';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (userData: {
    email: string;
    password: string;
    name: string;
    userRole: 'Pet Owner' | 'Pet Sitter';
    selectedPetTypes?: ('dogs' | 'cats')[];
    selectedBreeds?: string[];
    phone?: string;
    address?: string;
    gender?: string;
    age?: number;
    experience?: string;
    specialties?: string[];
    aboutMe?: string;
  }) => Promise<User>;
  updateUserProfile: (profileData: Partial<User>) => Promise<void>;
  storeUserFromBackend: (backendUser: any) => Promise<void>;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
  // Location tracking properties
  currentLocation: Location.LocationObject | null;
  userAddress: string | null;
  isLocationTracking: boolean;
  startLocationTracking: (radius?: number) => Promise<void>;
  stopLocationTracking: () => void;
  // Profile update trigger for global refresh
  profileUpdateTrigger: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // Wait a bit for the context to be ready
    console.log('AuthContext not ready yet, waiting...');
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Location tracking state
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [isLocationTracking, setIsLocationTracking] = useState(false);
  const [locationSubscription, setLocationSubscription] = useState<Location.LocationSubscription | null>(null);
  // Profile update trigger for global refresh
  const [profileUpdateTrigger, setProfileUpdateTrigger] = useState(0);

  useEffect(() => {
    // Check for existing user data and restore if available
    const checkAuthState = async () => {
      try {
        console.log('App started - checking for existing user data');
        
        // Check if there's a current user stored
        const currentUser = await authService.getCurrentUser();
        
        if (currentUser) {
          console.log('Found existing user:', currentUser.email);
          console.log('User profile image:', currentUser.profileImage);
          console.log('User hourly rate:', currentUser.hourlyRate);
          
          // Restore profile data if available
          const userWithProfileData = await authService.restoreProfileData(currentUser);
          setUser(userWithProfileData);
          
          console.log('AuthContext: User restored with profile data');
          console.log('AuthContext: Restored hourly rate:', userWithProfileData.hourlyRate);
          console.log('AuthContext: Restored profile image:', userWithProfileData.profileImage);
        } else {
          console.log('No existing user found');
          setUser(null);
        }
      } catch (error) {
        console.error('Error checking auth state:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuthState();
  }, []);

  // Load persisted location data (only for initial load, then use real-time)
  const loadPersistedLocation = React.useCallback(async () => {
    try {
      // Don't load old location data - force fresh location detection
      console.log('📍 Skipping old location data, will use fresh real-time location');
      setCurrentLocation(null);
      setUserAddress(null);
    } catch (error) {
      console.error('Error loading persisted location:', error);
    }
  }, []);

  // Location tracking functions
  const startLocationTracking = React.useCallback(async (radius: number = 1000) => {
    if (!user) {
      console.log('Cannot start location tracking: no user logged in');
      return;
    }

    if (isLocationTracking) {
      console.log('Location tracking already active');
      return;
    }

    try {
      console.log('📍 Starting location tracking with radius:', radius);
      setIsLocationTracking(true);
      
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Location permission denied');
        setIsLocationTracking(false);
        return;
      }

      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000, // Update every 5 seconds
          distanceInterval: radius, // Update when moved radius meters
        },
        async (location) => {
          setCurrentLocation(location);
          console.log('Location updated:', {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy,
            timestamp: new Date(location.timestamp).toLocaleString()
          });

          // Get address from coordinates
          try {
            const address = await locationService.getAddressFromCoordinates(
              location.coords.latitude,
              location.coords.longitude
            );
            setUserAddress(address);
            console.log('📍 Real-time address detected:', address);

            // Clear old stored location data and save new real-time location
            await AsyncStorage.removeItem('user_location');
            await AsyncStorage.removeItem('user_address');
            await saveLocationData(location, address);

            // Update user profile with new real-time location
            if (user) {
              try {
                await updateUserProfile({ address: address });
                console.log('📍 Updated user profile with real-time location');
              } catch (error) {
                console.error('Failed to update user profile with location:', error);
              }
            }
          } catch (error) {
            console.error('Failed to get address:', error);
            // Still save location even if address fails
            await saveLocationData(location, null);
          }
        }
      );

      setLocationSubscription(subscription);
      console.log('📍 Location tracking started successfully');
    } catch (error) {
      console.error('Error starting location tracking:', error);
      setIsLocationTracking(false);
    }
  }, [user, isLocationTracking]);

  const stopLocationTracking = React.useCallback(() => {
    if (locationSubscription) {
      locationSubscription.remove();
      setLocationSubscription(null);
    }
    setIsLocationTracking(false);
    console.log('📍 Location tracking stopped');
  }, [locationSubscription]);

  // Load persisted location on mount
  useEffect(() => {
    loadPersistedLocation();
  }, [loadPersistedLocation]);

  // Auto-start location tracking when user logs in
  useEffect(() => {
    if (user && !isLocationTracking) {
      console.log('User logged in, starting location tracking immediately');
      startLocationTracking(1000); // Enable real-time location tracking
    } else if (!user && isLocationTracking) {
      console.log('User logged out, stopping location tracking...');
      stopLocationTracking();
    }
  }, [user, isLocationTracking, startLocationTracking]);


  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const user = await authService.login(email, password);
      setUser(user);
      
      // Clear ALL logout flags when user logs in
      try {
        await AsyncStorage.multiRemove(['user_logged_out', 'logout_timestamp']);
        console.log('AuthContext: All logout flags cleared on login');
      } catch (error) {
        console.error('AuthContext: Error clearing logout flags:', error);
      }
      
      return user; // Return the user object
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: {
    email: string;
    password: string;
    name: string;
    userRole: 'Pet Owner' | 'Pet Sitter';
    selectedPetTypes?: ('dogs' | 'cats')[];
    selectedBreeds?: string[];
    phone?: string;
    address?: string;
    gender?: string;
    age?: number;
    experience?: string;
    specialties?: string[];
    aboutMe?: string;
  }) => {
    setIsLoading(true);
    try {
      const user = await authService.register(userData);
      setUser(user);
      
      // Clear ALL logout flags when user registers
      try {
        await AsyncStorage.multiRemove(['user_logged_out', 'logout_timestamp']);
        console.log('AuthContext: All logout flags cleared on registration');
      } catch (error) {
        console.error('AuthContext: Error clearing logout flags:', error);
      }
      
      return user; // Return the user object
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserProfile = async (profileData: Partial<User>) => {
    try {
      console.log('AuthContext: updateUserProfile called with:', profileData);
      console.log('AuthContext: Current user state:', user);
      console.log('AuthContext: Profile image in update data:', profileData.profileImage);
      
      // Validate profileData before processing
      if (!profileData) {
        console.error('AuthContext: profileData is null or undefined');
        throw new Error('Profile data is required');
      }
      
      await authService.updateUserProfile(profileData);
      // Update the local user state with the new profile data
      if (user) {
        const updatedUser = { ...user, ...profileData };
        setUser(updatedUser);
        console.log('AuthContext: User state updated successfully');
        console.log('AuthContext: Updated user profileImage:', updatedUser.profileImage);
        
        // Trigger global refresh for all components
        setProfileUpdateTrigger(prev => prev + 1);
        console.log('AuthContext: Triggered global profile update refresh');
        
        // If this is a pet sitter and profile was updated, refresh location data
        console.log('AuthContext: Checking user role for profile update:', user.role, 'is pet_sitter:', user.role === 'pet_sitter');
        if (user.role === 'pet_sitter' && (profileData.hourlyRate !== undefined || profileData.name !== undefined)) {
          console.log('AuthContext: Pet sitter profile updated, refreshing location data');
          try {
            // Clear sitter cache to force refresh in find sitter map
            realtimeLocationService.clearSitterCache();
            console.log('AuthContext: Cleared sitter cache for profile update');
            
            // Update the sitter's location data with the new profile info
            await realtimeLocationService.updateSitterLocation({
              id: user.id,
              userId: user.id,
              name: updatedUser.name,
              email: user.email,
              location: {
                latitude: currentLocation?.coords.latitude || 0,
                longitude: currentLocation?.coords.longitude || 0,
                address: userAddress || '',
              },
              specialties: user.specialties || ['General Pet Care'],
              experience: user.experience || '1 year',
              petTypes: user.selectedPetTypes || ['dogs', 'cats'],
              selectedBreeds: user.selectedBreeds || ['All breeds welcome'],
              hourlyRate: typeof profileData.hourlyRate === 'string' ? parseFloat(profileData.hourlyRate) : (profileData.hourlyRate || 0),
              rating: 4.5,
              reviews: 0,
              bio: user.aboutMe || 'Professional pet sitter ready to help!',
              isOnline: true,
              lastSeen: new Date(),
              profileImage: user.profileImage,
              followers: 0,
              following: 0,
            });
          } catch (error) {
            console.error('AuthContext: Error updating sitter location data:', error);
          }
        }
      } else {
        console.warn('AuthContext: No current user to update');
      }
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  };

  const storeUserFromBackend = async (backendUser: any) => {
    try {
      console.log('AuthContext: Storing user from backend:', backendUser);
      const user = await authService.storeUserFromBackend(backendUser);
      if (user) {
        console.log('AuthContext: User stored successfully, setting user state:', user);
        setUser(user);
        
        // If this is a pet sitter, update their location data with latest profile info
        console.log('AuthContext: Checking user role for login:', user.role, 'is pet_sitter:', user.role === 'pet_sitter');
        if (user.role === 'pet_sitter') {
          console.log('AuthContext: Pet sitter logged in, updating location data with latest profile');
          console.log('AuthContext: User data for sitter:', {
            id: user.id,
            name: user.name,
            selectedPetTypes: user.selectedPetTypes,
            selectedBreeds: user.selectedBreeds,
            specialties: user.specialties,
            experience: user.experience,
            hourlyRate: user.hourlyRate,
            aboutMe: user.aboutMe,
            profileImage: user.profileImage
          });
          try {
            await realtimeLocationService.updateSitterLocation({
              id: user.id,
              userId: user.id,
              name: user.name,
              email: user.email,
              location: {
                latitude: currentLocation?.coords.latitude || 0,
                longitude: currentLocation?.coords.longitude || 0,
                address: userAddress || user.address || '',
              },
              specialties: user.specialties || ['General Pet Care'],
              experience: user.experience || '1 year',
              petTypes: user.selectedPetTypes || ['dogs', 'cats'],
              selectedBreeds: user.selectedBreeds || ['All breeds welcome'],
              hourlyRate: typeof user.hourlyRate === 'string' ? parseFloat(user.hourlyRate) : (user.hourlyRate || 25),
              rating: 4.5,
              reviews: 0,
              bio: user.aboutMe || 'Professional pet sitter ready to help!',
              isOnline: true,
              lastSeen: new Date(),
              profileImage: user.profileImage,
              followers: 0,
              following: 0,
            });
            console.log('AuthContext: Pet sitter location data updated successfully');
          } catch (error) {
            console.error('AuthContext: Error updating pet sitter location data on login:', error);
          }
        }
      } else {
        console.error('AuthContext: Failed to retrieve user after storing');
      }
    } catch (error) {
      console.error('Error storing user from backend:', error);
      throw error;
    }
  };

  const refresh = async () => {
    try {
      // Clear all data including profile data and return to onboarding
      await authService.clearAllDataIncludingProfile();
      setUser(null);
    } catch (error) {
      console.error('Error refreshing:', error);
    }
  };

  const logout = async () => {
    try {
      console.log('AuthContext: COMPLETE LOGOUT - Clearing everything');
      
      // 1. If user is a pet sitter, remove them from sitter visibility
      if (user && (user.role === 'pet_sitter' || user.userRole === 'Pet Sitter')) {
        console.log('AuthContext: Removing pet sitter from visibility');
        console.log('AuthContext: Sitter ID:', user.id);
        console.log('AuthContext: Sitter name:', user.name);
        try {
          // Set sitter as offline to remove from find sitter map
          console.log('AuthContext: Setting sitter offline via API...');
          const offlineResult = await realtimeLocationService.setSitterOnline(user.id, false);
          console.log('AuthContext: Offline API result:', offlineResult);
          
          // Wait a moment for the API call to complete
          console.log('AuthContext: Waiting for API call to complete...');
          await new Promise(resolve => setTimeout(resolve, 2000)); // Increased to 2 seconds
          
          // Force remove from local cache as well
          console.log('AuthContext: Removing sitter from local cache...');
          realtimeLocationService.removeSitter(user.id);
          
          // Clear all sitters from cache to force refresh
          console.log('AuthContext: Clearing all sitters cache...');
          realtimeLocationService.clearAllSitters();
          
          console.log('AuthContext: Pet sitter removed from visibility');
        } catch (error) {
          console.error('AuthContext: Error removing sitter from visibility:', error);
          // Even if API fails, remove from local cache
          console.log('AuthContext: Fallback - removing from local cache only');
          realtimeLocationService.removeSitter(user.id);
          realtimeLocationService.clearAllSitters();
        }
      } else {
        console.log('AuthContext: User is not a pet sitter, skipping offline process');
        console.log('AuthContext: User role:', user?.role);
        console.log('AuthContext: User userRole:', user?.userRole);
      }
      
      // 2. Stop ALL location tracking
      stopLocationTracking();
      
      // 3. Clear ALL user data from AuthService
      await authService.clearAllData();
      authService.clearCurrentUser();
      
      // 4. Clear user state immediately
      setUser(null);
      setIsLoading(false);
      
      // 5. Clear ALL AsyncStorage data
      try {
        await AsyncStorage.multiRemove([
          'user_data',
          'user_token',
          'user_profile',
          'user_logged_out',
          'location_data',
          'notifications',
          'sitter_data',
          'booking_data'
        ]);
        console.log('AuthContext: All AsyncStorage data cleared');
      } catch (error) {
        console.error('AuthContext: Error clearing AsyncStorage:', error);
      }
      
      // 6. Clear notifications
      try {
        const { notificationService } = await import('../services/notificationService');
        await notificationService.clearAllNotifications();
        console.log('AuthContext: Notifications cleared');
      } catch (error) {
        console.error('AuthContext: Error clearing notifications:', error);
      }
      
      // 7. Clear realtime location service cache
      try {
        realtimeLocationService.clearAllSitters();
        console.log('AuthContext: Realtime location cache cleared');
      } catch (error) {
        console.error('AuthContext: Error clearing location cache:', error);
      }
      
      // 8. Set logout flag to prevent ANY access
      try {
        await AsyncStorage.setItem('user_logged_out', 'true');
        await AsyncStorage.setItem('logout_timestamp', Date.now().toString());
        console.log('🔒 AuthContext: LOGOUT FLAGS SET - NAVIGATION DISABLED');
      } catch (error) {
        console.error('AuthContext: Error setting logout flags:', error);
      }
      
      // 9. Trigger profile update to refresh all screens
      setProfileUpdateTrigger(prev => prev + 1);
      console.log('AuthContext: Triggered profile update refresh for logout');
      
      // 9. Force immediate app refresh to trigger navigation change
      try {
        // Force a state change to trigger re-render of navigation
        setIsLoading(true);
        setTimeout(() => setIsLoading(false), 100);
        console.log('🔒 AuthContext: FORCED APP REFRESH - NAVIGATION LOCKED');
      } catch (error) {
        console.error('AuthContext: Error forcing refresh:', error);
      }
      
      console.log('AuthContext: COMPLETE LOGOUT SUCCESSFUL');
    } catch (error) {
      console.error('Logout error:', error);
      // Even if there's an error, clear everything
      authService.clearCurrentUser();
      setUser(null);
      setIsLoading(false);
      try {
        await AsyncStorage.clear();
        console.log('AuthContext: Emergency clear of all data');
      } catch (clearError) {
        console.error('AuthContext: Emergency clear failed:', clearError);
      }
    }
  };

  // Save location data persistently
  const saveLocationData = React.useCallback(async (location: Location.LocationObject | null, address: string | null) => {
    try {
      if (location) {
        await AsyncStorage.setItem('user_location', JSON.stringify(location));
        console.log('📍 Saved location persistently');
      }
      
      if (address) {
        await AsyncStorage.setItem('user_address', address);
        console.log('📍 Saved address persistently');
      }
    } catch (error) {
      console.error('Error saving location data:', error);
    }
  }, []);

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    updateUserProfile,
    storeUserFromBackend,
    refresh,
    logout,
    // Location tracking values
    currentLocation,
    userAddress,
    isLocationTracking,
    startLocationTracking,
    stopLocationTracking,
    // Profile update trigger for global refresh
    profileUpdateTrigger,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 