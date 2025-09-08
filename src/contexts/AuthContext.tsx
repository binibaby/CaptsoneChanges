import * as Location from 'expo-location';
import React, { createContext, useContext, useEffect, useState } from 'react';
import authService, { User } from '../services/authService';
import locationService, { LocationConfig } from '../services/locationService';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: {
    email: string;
    password: string;
    name: string;
    userRole: 'Pet Owner' | 'Pet Sitter';
    selectedPetTypes?: ('dogs' | 'cats')[];
    selectedBreeds?: string[];
  }) => Promise<void>;
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

  useEffect(() => {
    // Check if user is already logged in on app start
    const checkExistingAuth = async () => {
      try {
        console.log('App started - checking existing authentication');
        const existingUser = await authService.getCurrentUser();
        if (existingUser) {
          console.log('Found existing user:', existingUser.email);
          setUser(existingUser);
        } else {
          console.log('No existing user found');
          setUser(null);
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Error checking existing auth:', error);
        setUser(null);
        setIsLoading(false);
      }
    };
    
    checkExistingAuth();
  }, []);

  const checkAuthState = async () => {
    try {
      // Check if there's a current user stored
      const currentUser = await authService.getCurrentUser();
      
      if (currentUser) {
        console.log('Found existing user:', currentUser.email);
        console.log('User details:', {
          id: currentUser.id,
          name: currentUser.name,
          email: currentUser.email,
          role: currentUser.userRole
        });
        setUser(currentUser);
      } else {
        console.log('No existing user found, starting fresh');
        setUser(null);
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const user = await authService.login(email, password);
      setUser(user);
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
  }) => {
    setIsLoading(true);
    try {
      const user = await authService.register(userData);
      setUser(user);
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
      await authService.storeUserFromBackend(backendUser);
      const user = await authService.getCurrentUser();
      if (user) {
        console.log('AuthContext: User stored successfully, setting user state:', user);
        setUser(user);
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
      // Clear all data and return to onboarding
      await authService.clearAllData();
      setUser(null);
    } catch (error) {
      console.error('Error refreshing:', error);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Location tracking functions
  const startLocationTracking = React.useCallback(async (radius: number = 1000) => {
    if (!user) {
      console.log('Cannot start location tracking: no user logged in');
      return;
    }

    try {
      console.log('Starting location tracking for user:', user.email);
      
      const config: LocationConfig = {
        radius,
        updateInterval: 30000, // 30 seconds
        onLocationUpdate: async (location) => {
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
            console.log('User address:', address);
          } catch (error) {
            console.error('Failed to get address:', error);
          }
        },
        onRadiusEnter: (location) => {
          console.log('User entered radius:', radius, 'meters');
        },
        onRadiusExit: (location) => {
          console.log('User exited radius:', radius, 'meters');
        },
        onError: (error) => {
          console.error('Location tracking error:', error);
          setIsLocationTracking(false);
        }
      };

      await locationService.startLocationTracking(config);
      setIsLocationTracking(true);
      
      console.log('Location tracking started successfully for user:', user.email);
    } catch (error) {
      console.error('Failed to start location tracking:', error);
      setIsLocationTracking(false);
    }
  }, [user]);

  const stopLocationTracking = React.useCallback(() => {
    try {
      locationService.stopLocationTracking();
      setIsLocationTracking(false);
      setCurrentLocation(null);
      setUserAddress(null);
      console.log('Location tracking stopped');
    } catch (error) {
      console.error('Error stopping location tracking:', error);
    }
  }, []);

  // Start location tracking when user logs in (disabled to prevent crashes)
  useEffect(() => {
    if (user && !isLocationTracking) {
      console.log('User logged in, location tracking available but not auto-started');
      // startLocationTracking(1000); // Disabled to prevent crashes
    } else if (!user && isLocationTracking) {
      console.log('User logged out, stopping location tracking...');
      stopLocationTracking();
    }
  }, [user, isLocationTracking, startLocationTracking, stopLocationTracking]);

  // Cleanup location tracking on unmount
  useEffect(() => {
    return () => {
      if (isLocationTracking) {
        stopLocationTracking();
      }
    };
  }, [isLocationTracking, stopLocationTracking]);

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
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 