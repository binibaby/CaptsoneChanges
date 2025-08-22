import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import authService, { User } from '../services/authService';

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

  useEffect(() => {
    checkAuthState();
    
    // Listen for app state changes (refresh, background/foreground)
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // App has come to foreground (including on refresh)
        console.log('App became active - checking if we should clear data');
        if (__DEV__ && !user) {
          // Only clear data if no user is logged in (fresh start)
          console.log('Development mode: No user logged in, clearing data for fresh start');
          authService.clearAllData().then(() => {
            setUser(null);
            console.log('All data cleared successfully for fresh start');
          });
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription?.remove();
    };
  }, [user]);

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
      } else if (__DEV__) {
        // Only clear data if no user exists and we're in development mode
        console.log('Development mode: No existing user, clearing data for fresh start');
        await authService.clearAllData();
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
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserProfile = async (profileData: Partial<User>) => {
    try {
      await authService.updateUserProfile(profileData);
      // Update the local user state with the new profile data
      if (user) {
        const updatedUser = { ...user, ...profileData };
        setUser(updatedUser);
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
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 