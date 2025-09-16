import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  userRole: 'Pet Owner' | 'Pet Sitter';
  role: 'pet_owner' | 'pet_sitter';
  phone?: string;
  age?: number;
  gender?: string;
  address?: string;
  experience?: string;
  hourlyRate?: string;
  aboutMe?: string;
  specialties?: string[];
  email_verified?: boolean;
  phone_verified?: boolean;
  selectedPetTypes?: ('dogs' | 'cats')[];
  selectedBreeds?: string[];
  profileImage?: string;
  token?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

class AuthService {
  private static instance: AuthService;
  private currentUser: User | null = null;

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // Test server connectivity
  async testServerConnection(ip: string): Promise<boolean> {
    try {
      console.log(`🔍 Testing server connection to ${ip}:8000`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
      
      const response = await fetch(`http://${ip}:8000/api/health`, {
        method: 'GET',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      console.log(`✅ ${ip}:8000 - Server is reachable (status: ${response.status})`);
      return true;
    } catch (error) {
      console.log(`❌ ${ip}:8000 - Server not reachable:`, error);
      return false;
    }
  }

  async login(email: string, password: string): Promise<User> {
    try {
      console.log('Attempting to login with backend API');
      
      // Try multiple IPs in order
      const ipsToTry = [
        '192.168.100.184',  // Current WiFi IP
        '192.168.100.179',  // Previous WiFi IP
        'localhost',         // Localhost fallback
        '127.0.0.1',        // Localhost IP
      ];
      
      let lastError: Error | null = null;
      
      for (const ip of ipsToTry) {
        try {
          console.log(`🌐 Trying to connect to: ${ip}:8000`);
          
          // Call the backend login API with timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout per IP
          
          const response = await fetch(`http://${ip}:8000/api/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email,
              password,
            }),
            signal: controller.signal,
          });
          
          clearTimeout(timeoutId);

          // Check if response is ok
          if (!response.ok) {
            console.error(`❌ ${ip}:8000 - Login API error response:`, response.status, response.statusText);
            const errorText = await response.text();
            console.error('Error response body:', errorText);
            throw new Error(`Login failed: ${response.status} ${response.statusText}`);
          }

          // Check content type
          const contentType = response.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            console.error(`❌ ${ip}:8000 - Invalid content type:`, contentType);
            const responseText = await response.text();
            console.error('Non-JSON response:', responseText);
            throw new Error('Server returned non-JSON response');
          }

          const result = await response.json();
          console.log(`✅ ${ip}:8000 - Login API response:`, result);
          
          if (result.success) {
            console.log(`✅ ${ip}:8000 - Login successful, user data from backend:`, result.user);
            
            // Check if user data exists and has required fields
            if (!result.user || !result.user.id) {
              console.error('Invalid user data received from backend:', result);
              throw new Error('Invalid user data received from server');
            }
            
            // Create user object from backend response
            const user: User = {
              id: result.user.id.toString(),
              email: result.user.email || '',
              name: result.user.name || '',
              firstName: result.user.first_name || '',
              lastName: result.user.last_name || '',
              userRole: result.user.role === 'pet_owner' ? 'Pet Owner' : 'Pet Sitter',
              role: result.user.role || 'pet_owner',
              phone: result.user.phone || '',
              age: result.user.age,
              gender: result.user.gender || '',
              address: result.user.address || '',
              experience: result.user.experience || '',
              hourlyRate: result.user.hourly_rate !== null && result.user.hourly_rate !== undefined ? String(result.user.hourly_rate) : '',
              aboutMe: result.user.bio || '',
              specialties: result.user.specialties || [],
              email_verified: result.user.email_verified || false,
              phone_verified: result.user.phone_verified || false,
              selectedPetTypes: result.user.selected_pet_types || [],
              selectedBreeds: result.user.pet_breeds || [],
              profileImage: result.user.profile_image || undefined,
              token: result.token || undefined,
            };

            this.currentUser = user;
            await this.saveUserToStorage(user);
            
            // Restore profile data if available
            const userWithProfileData = await this.restoreProfileData(user);
            return userWithProfileData;
          } else {
            console.error(`❌ ${ip}:8000 - Login failed:`, result.message);
            throw new Error(result.message || 'Login failed');
          }
        } catch (error) {
          console.error(`❌ ${ip}:8000 - Connection failed:`, error);
          lastError = error as Error;
          continue; // Try next IP
        }
      }
      
      // If we get here, all IPs failed
      console.error('❌ All IP addresses failed. Last error:', lastError);
      throw new Error(`Cannot connect to server. Tried: ${ipsToTry.join(', ')}. Last error: ${lastError?.message || 'Unknown error'}`);
    } catch (error) {
      console.error('Error during login:', error);
      
      // Handle specific error types
      if ((error as any).name === 'AbortError') {
        throw new Error('Login request timed out. Please check your internet connection.');
      } else if ((error as any).message?.includes('NetworkError') || (error as any).message?.includes('fetch')) {
        throw new Error('Network error. Please check your internet connection.');
      } else if ((error as any).message?.includes('JSON Parse error')) {
        throw new Error('Server error. Please try again later.');
      }
      
      throw error;
    }
  }

  async register(  userData: {
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
    hourlyRate?: string;
    specialties?: string[];
    aboutMe?: string;
  }): Promise<User> {
    try {
      console.log('Attempting to register with backend API');
      
      // Call the backend register API with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      // Use current WiFi IP for faster registration (bypass network service)
      const response = await fetch('http://192.168.100.184:8000/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: userData.name,
          first_name: userData.name.split(' ')[0],
          last_name: userData.name.split(' ').slice(1).join(' '),
          email: userData.email,
          password: userData.password,
          password_confirmation: userData.password,
          role: userData.userRole === 'Pet Owner' ? 'pet_owner' : 'pet_sitter',
          phone: userData.phone || '',
          address: userData.address || '',
          gender: userData.gender || '',
          age: userData.age || null,
          experience: userData.experience || '',
          hourly_rate: userData.hourlyRate || null,
          pet_breeds: userData.selectedBreeds || [],
          specialties: userData.specialties || [],
          selected_pet_types: userData.selectedPetTypes || [],
          bio: userData.aboutMe || '',
        }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      // Check if response is ok
      if (!response.ok) {
        console.error('Register API error response:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error response body:', errorText);
        throw new Error(`Registration failed: ${response.status} ${response.statusText}`);
      }

      // Check content type
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Invalid content type:', contentType);
        const responseText = await response.text();
        console.error('Non-JSON response:', responseText);
        throw new Error('Server returned non-JSON response');
      }

      const result = await response.json();
      
      if (result.success) {
        console.log('Registration successful, user data from backend:', result.user);
        console.log('Backend hourly_rate:', result.user.hourly_rate);
        console.log('Backend hourly_rate type:', typeof result.user.hourly_rate);
        console.log('Backend hourly_rate value:', JSON.stringify(result.user.hourly_rate));
        
        // Check if user data exists and has required fields
        if (!result.user || !result.user.id) {
          console.error('Invalid user data received from backend:', result);
          throw new Error('Invalid user data received from server');
        }
        
        // Create user object from backend response
        const user: User = {
          id: result.user.id.toString(),
          email: result.user.email || '',
          name: result.user.name || '',
          firstName: result.user.first_name || '',
          lastName: result.user.last_name || '',
          userRole: result.user.role === 'pet_owner' ? 'Pet Owner' : 'Pet Sitter',
          role: result.user.role || 'pet_owner',
          phone: result.user.phone || '',
          age: result.user.age,
          gender: result.user.gender || '',
          address: result.user.address || '',
          experience: result.user.experience || '',
          hourlyRate: result.user.hourly_rate !== null && result.user.hourly_rate !== undefined ? String(result.user.hourly_rate) : '',
          aboutMe: result.user.bio || '',
          specialties: result.user.specialties || [],
          email_verified: result.user.email_verified || false,
          phone_verified: result.user.phone_verified || false,
          selectedPetTypes: result.user.selected_pet_types || [],
          selectedBreeds: result.user.pet_breeds || [],
          profileImage: result.user.profile_image || undefined,
          token: result.token || undefined,
        };

        this.currentUser = user;
        await this.saveUserToStorage(user);
        
        // Restore profile data if available
        const userWithProfileData = await this.restoreProfileData(user);
        return userWithProfileData;
      } else {
        console.error('Registration failed:', result.message);
        throw new Error(result.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Error during registration:', error);
      
      // Handle specific error types
      if ((error as any).name === 'AbortError') {
        throw new Error('Registration request timed out. Please check your internet connection.');
      } else if ((error as any).message?.includes('NetworkError') || (error as any).message?.includes('fetch')) {
        throw new Error('Network error. Please check your internet connection.');
      } else if ((error as any).message?.includes('JSON Parse error')) {
        throw new Error('Server error. Please try again later.');
      }
      
      throw error;
    }
  }

  async logout(): Promise<void> {
    console.log('AuthService: Logging out user');
    
    try {
      // Save profile data before clearing user data
      if (this.currentUser) {
        const profileData = {
          profileImage: this.currentUser.profileImage,
          hourlyRate: this.currentUser.hourlyRate,
          experience: this.currentUser.experience,
          specialties: this.currentUser.specialties,
          aboutMe: this.currentUser.aboutMe,
          selectedPetTypes: this.currentUser.selectedPetTypes,
          selectedBreeds: this.currentUser.selectedBreeds,
          firstName: this.currentUser.firstName,
          lastName: this.currentUser.lastName,
          phone: this.currentUser.phone,
          age: this.currentUser.age,
          gender: this.currentUser.gender,
          address: this.currentUser.address,
        };
        
        // Store profile data separately for persistence
        await AsyncStorage.setItem('user_profile_data', JSON.stringify(profileData));
        console.log('AuthService: Profile data saved for persistence');
      }
    } catch (error) {
      console.error('Error saving profile data during logout:', error);
    }
    
    this.currentUser = null;
    
    try {
      // Clear authentication data but preserve profile data
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('user_logged_out');
      console.log('AuthService: Authentication data cleared, profile data preserved');
      
      console.log('AuthService: User logged out successfully');
    } catch (error) {
      console.error('Error during logout:', error);
      // Continue with logout even if clearing data fails
    }
  }

  async clearAllData(): Promise<void> {
    this.currentUser = null;
    try {
      // Clear authentication data but preserve profile data
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('user_logged_out');
      console.log('clearAllData: Authentication data cleared, profile data preserved');
      
      console.log('Authentication data cleared successfully');
    } catch (error) {
      console.error('Error clearing user data:', error);
      // Continue even if there's an error
    }
  }

  // Method to clear current user from memory
  clearCurrentUser(): void {
    this.currentUser = null;
    console.log('AuthService: Current user cleared from memory');
  }

  // Method to completely clear all data including profile data (for "Start Fresh")
  async clearAllDataIncludingProfile(): Promise<void> {
    this.currentUser = null;
    try {
      // Clear all data including profile data
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('user_logged_out');
      await AsyncStorage.removeItem('user_profile_data');
      console.log('clearAllDataIncludingProfile: All data cleared including profile data');
    } catch (error) {
      console.error('Error clearing all data including profile:', error);
    }
  }

  async getCurrentUser(): Promise<User | null> {
    // Check if we have a current user in memory (from current session)
    if (this.currentUser) {
      console.log('getCurrentUser: Returning current session user:', this.currentUser.email);
      return this.currentUser;
    }
    
    // Try to restore from storage
    try {
      const stored = await AsyncStorage.getItem('user');
      if (stored) {
        const user = JSON.parse(stored);
        this.currentUser = user;
        console.log('getCurrentUser: Restored user from storage:', user.email);
        return user;
      }
    } catch (error) {
      console.error('Error restoring user from storage:', error);
    }
    
    console.log('getCurrentUser: No user found');
    return null;
  }

  // Method to restore profile data from persistent storage
  async restoreProfileData(user: User): Promise<User> {
    try {
      const storedProfileData = await AsyncStorage.getItem('user_profile_data');
      if (storedProfileData) {
        const profileData = JSON.parse(storedProfileData);
        console.log('AuthService: Restoring profile data:', profileData);
        
        // Merge profile data with user data, prioritizing stored profile data for user-editable fields
        const restoredUser = {
          ...user,
          ...profileData,
          // Ensure authentication data is not overwritten
          id: user.id,
          email: user.email,
          userRole: user.userRole,
          role: user.role,
          token: user.token,
          email_verified: user.email_verified,
          phone_verified: user.phone_verified,
          // Prioritize stored profile data for user-editable fields (preserve user changes)
          hourlyRate: profileData.hourlyRate || user.hourlyRate || '',
          experience: profileData.experience || user.experience || '',
          specialties: profileData.specialties || user.specialties || [],
          aboutMe: profileData.aboutMe || user.aboutMe || '',
          address: profileData.address || user.address || '',
          phone: profileData.phone || user.phone || '',
          age: profileData.age || user.age,
          gender: profileData.gender || user.gender || '',
          firstName: profileData.firstName || user.firstName || '',
          lastName: profileData.lastName || user.lastName || '',
          selectedPetTypes: profileData.selectedPetTypes || user.selectedPetTypes || [],
          selectedBreeds: profileData.selectedBreeds || user.selectedBreeds || [],
          // CRITICAL: Always preserve profileImage from backend (source of truth)
          profileImage: user.profileImage || profileData.profileImage || undefined,
        };
        
        console.log('AuthService: Original user hourlyRate:', user.hourlyRate);
        console.log('AuthService: Stored profileData hourlyRate:', profileData.hourlyRate);
        console.log('AuthService: Restored user hourlyRate:', restoredUser.hourlyRate);
        console.log('AuthService: Original user profileImage:', user.profileImage);
        console.log('AuthService: Stored profileData profileImage:', profileData.profileImage);
        console.log('AuthService: Restored user profileImage:', restoredUser.profileImage);
        
        this.currentUser = restoredUser;
        await this.saveUserToStorage(restoredUser);
        console.log('AuthService: Profile data restored successfully');
        console.log('AuthService: Restored hourlyRate:', restoredUser.hourlyRate);
        console.log('AuthService: Restored profileImage:', restoredUser.profileImage);
        return restoredUser;
      }
    } catch (error) {
      console.error('Error restoring profile data:', error);
    }
    
    return user;
  }


  async updateUserProfile(profileData: Partial<User>): Promise<User> {
    console.log('AuthService: updateUserProfile called with:', profileData);
    console.log('AuthService: Current user:', this.currentUser);
    console.log('AuthService: Profile image in update data:', profileData.profileImage);
    
    // Validate profileData
    if (!profileData) {
      console.error('AuthService: profileData is null or undefined');
      throw new Error('Profile data is required');
    }
    
    // If no current user exists, create a new one
    if (!this.currentUser) {
      console.log('No current user found, creating new user from profile data:', profileData);
      
      // Ensure we have required fields for creating a new user
      if (!profileData.email) {
        console.error('AuthService: Email is required to create a new user');
        throw new Error('Email is required to create a new user');
      }
      
      const newUser: User = {
        id: profileData.id || Date.now().toString(),
        email: profileData.email || '',
        name: profileData.name || `${profileData.firstName || ''} ${profileData.lastName || ''}`.trim(),
        firstName: profileData.firstName || '',
        lastName: profileData.lastName || '',
        userRole: profileData.userRole || 'Pet Owner',
        role: profileData.userRole === 'Pet Sitter' ? 'pet_sitter' : 'pet_owner',
        phone: profileData.phone || '',
        age: profileData.age || undefined,
        gender: profileData.gender || '',
        address: profileData.address || '',
        experience: profileData.experience || '',
        hourlyRate: profileData.hourlyRate || '',
        aboutMe: profileData.aboutMe || '',
        specialties: profileData.specialties || [],
        email_verified: profileData.email_verified || false,
        phone_verified: profileData.phone_verified || false,
        selectedPetTypes: profileData.selectedPetTypes || [],
        selectedBreeds: profileData.selectedBreeds || [],
        profileImage: profileData.profileImage || undefined,
      };

      this.currentUser = newUser;
      await this.saveUserToStorage(newUser);
      
      // Clear availability for new pet sitters
      if (newUser.userRole === 'Pet Sitter') {
        await this.clearAvailabilityForNewSitter();
      }
      
      console.log('Created new user in updateUserProfile:', newUser);
      return newUser;
    }

    // Validate current user has required fields
    if (!this.currentUser.id) {
      console.error('AuthService: Current user missing id field:', this.currentUser);
      throw new Error('Current user is missing required id field');
    }
    
    // Ensure current user has firstName and lastName properties
    if (!this.currentUser.firstName) {
      this.currentUser.firstName = '';
    }
    if (!this.currentUser.lastName) {
      this.currentUser.lastName = '';
    }
    
    
    // Update the current user with new profile data
    const updatedUser = { ...this.currentUser, ...profileData };
    console.log('AuthService: Updated user profileImage:', updatedUser.profileImage);
    
    // Update the name field if firstName or lastName changed
    if (profileData.firstName || profileData.lastName) {
      const firstName = profileData.firstName || (this.currentUser.firstName || '');
      const lastName = profileData.lastName || (this.currentUser.lastName || '');
      updatedUser.name = `${firstName} ${lastName}`.trim();
    }

    this.currentUser = updatedUser;
    await this.saveUserToStorage(updatedUser);
    
    // Update profile on backend
    try {
      await this.updateProfileOnBackend(updatedUser);
      console.log('AuthService: Profile updated on backend successfully');
      
      // Clear sitter cache to force refresh in find sitter map
      try {
        const { default: realtimeLocationService } = await import('./realtimeLocationService');
        realtimeLocationService.clearSitterCache();
        console.log('AuthService: Cleared sitter cache for profile update');
      } catch (cacheError) {
        console.error('AuthService: Error clearing sitter cache:', cacheError);
      }
    } catch (error) {
      console.error('AuthService: Failed to update profile on backend:', error);
      // Don't throw error here - local update was successful
    }
    
    // Also save profile data persistently
    try {
      const profileData = {
        profileImage: updatedUser.profileImage,
        hourlyRate: updatedUser.hourlyRate,
        experience: updatedUser.experience,
        specialties: updatedUser.specialties,
        aboutMe: updatedUser.aboutMe,
        selectedPetTypes: updatedUser.selectedPetTypes,
        selectedBreeds: updatedUser.selectedBreeds,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        phone: updatedUser.phone,
        age: updatedUser.age,
        gender: updatedUser.gender,
        address: updatedUser.address,
      };
      
      await AsyncStorage.setItem('user_profile_data', JSON.stringify(profileData));
      console.log('AuthService: Profile data saved persistently');
    } catch (error) {
      console.error('Error saving profile data persistently:', error);
    }
    
    console.log('Updated user profile:', updatedUser);
    console.log('AuthService: Final user profileImage after save:', updatedUser.profileImage);
    return updatedUser;
  }

  // Update profile on backend
  async updateProfileOnBackend(user: User): Promise<void> {
    try {
      console.log('AuthService: Updating profile on backend for user:', user.id);
      console.log('AuthService: Using endpoint: http://192.168.100.184:8000/api/profile/update');
      
      const response = await fetch('http://192.168.100.184:8000/api/profile/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          id: user.id,
          name: user.name,
          first_name: user.firstName || user.name.split(' ')[0] || null,
          last_name: user.lastName || user.name.split(' ').slice(1).join(' ') || null,
          email: user.email,
          phone: user.phone || null,
          age: user.age || null,
          gender: user.gender || null,
          address: user.address || null,
          experience: user.experience || null,
          hourly_rate: user.hourlyRate || null,
          bio: user.aboutMe || null,
          specialties: user.specialties || null,
          pet_breeds: user.selectedBreeds || null,
          selected_pet_types: user.selectedPetTypes || null,
          profile_image: user.profileImage || null,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Backend profile update failed:', response.status, errorText);
        console.error('Response URL:', response.url);
        console.error('Response headers:', response.headers);
        throw new Error(`Backend update failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('Backend profile update successful:', result);
    } catch (error) {
      console.error('Error updating profile on backend:', error);
      throw error;
    }
  }

  // Clear availability for new pet sitters
  async clearAvailabilityForNewSitter(): Promise<void> {
    try {
      console.log('AuthService: Clearing availability for new pet sitter');
      await AsyncStorage.removeItem('petSitterAvailabilities');
      console.log('AuthService: Availability cleared for new sitter');
    } catch (error) {
      console.error('AuthService: Error clearing availability for new sitter:', error);
    }
  }

  // New method to store complete user data from backend registration
  async storeUserFromBackend(backendUser: any): Promise<User> {
    console.log('Storing user data from backend:', backendUser);
    console.log('Backend user hourly_rate:', backendUser.hourly_rate);
    console.log('Backend user role:', backendUser.role);
    console.log('Backend user object keys:', Object.keys(backendUser));
    console.log('Backend user role type:', typeof backendUser.role);
    console.log('Backend user role === pet_sitter:', backendUser.role === 'pet_sitter');
    
    // Clear logout flag when user logs in
    await AsyncStorage.removeItem('user_logged_out');
    
    // Check if backendUser exists and has required fields
    if (!backendUser || !backendUser.id) {
      console.error('Invalid backend user data received:', backendUser);
      throw new Error('Invalid user data received from backend');
    }
    
    const user: User = {
      id: backendUser.id.toString(),
      email: backendUser.email || '',
      name: backendUser.name || '',
      firstName: backendUser.first_name || '',
      lastName: backendUser.last_name || '',
      userRole: backendUser.role === 'pet_owner' ? 'Pet Owner' : 'Pet Sitter',
      role: backendUser.role || 'pet_owner',
      phone: backendUser.phone || '',
      age: backendUser.age,
      gender: backendUser.gender || '',
      address: backendUser.address || '',
      aboutMe: backendUser.bio || '',
      email_verified: backendUser.email_verified || false,
      phone_verified: backendUser.phone_verified || false,
      selectedPetTypes: backendUser.selected_pet_types || [],
      selectedBreeds: backendUser.pet_breeds || [],
      profileImage: backendUser.profile_image || undefined,
      token: backendUser.token || undefined,
      // Always include sitter-specific fields for pet sitters
      experience: (backendUser.role === 'pet_sitter' || backendUser.role === 'Pet Sitter') ? (backendUser.experience || '') : '',
      hourlyRate: (backendUser.role === 'pet_sitter' || backendUser.role === 'Pet Sitter') ? (backendUser.hourly_rate !== null && backendUser.hourly_rate !== undefined ? String(backendUser.hourly_rate) : '') : '',
      specialties: (backendUser.role === 'pet_sitter' || backendUser.role === 'Pet Sitter') ? (backendUser.specialties || []) : [],
    };

    console.log('Created user object:', user);
    console.log('User hourlyRate:', user.hourlyRate);
    console.log('User hourlyRate type:', typeof user.hourlyRate);
    console.log('User hourlyRate value:', JSON.stringify(user.hourlyRate));
    console.log('User role:', user.role);

    this.currentUser = user;
    await this.saveUserToStorage(user);
    
    // Restore profile data if available (this will merge with backend data)
    const userWithProfileData = await this.restoreProfileData(user);
    console.log('User data stored from backend successfully:', userWithProfileData);
    console.log('Final hourlyRate after merge:', userWithProfileData.hourlyRate);
    console.log('Final profileImage after merge:', userWithProfileData.profileImage);
    return userWithProfileData;
  }

  async isAuthenticated(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user !== null;
  }

  private async saveUserToStorage(user: User): Promise<void> {
    try {
      console.log('saveUserToStorage: Saving user to AsyncStorage:', user.email);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      console.log('saveUserToStorage: User saved successfully to AsyncStorage');
    } catch (error) {
      console.error('Error saving user to storage:', error);
    }
  }
}

export default AuthService.getInstance(); 