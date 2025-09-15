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

  async login(email: string, password: string): Promise<User> {
    try {
      console.log('Attempting to login with backend API');
      
      // Call the backend login API with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      // Use mobile data IP for mobile device access
      const response = await fetch('http://172.20.10.2:8000/api/login', {
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
        console.error('Login API error response:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error response body:', errorText);
        throw new Error(`Login failed: ${response.status} ${response.statusText}`);
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
      console.log('Login API response:', result);
      
      if (result.success) {
        console.log('Login successful, user data from backend:', result.user);
        
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
          hourlyRate: result.user.hourly_rate || '',
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
        return user;
      } else {
        console.error('Login failed:', result.message);
        throw new Error(result.message || 'Login failed');
      }
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

  async register(userData: {
    email: string;
    password: string;
    name: string;
    userRole: 'Pet Owner' | 'Pet Sitter';
    selectedPetTypes?: ('dogs' | 'cats')[];
    selectedBreeds?: string[];
  }): Promise<User> {
    try {
      console.log('Attempting to register with backend API');
      
      // Call the backend register API with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      // Use mobile data IP for faster registration (bypass network service)
      const response = await fetch('http://172.20.10.2:8000/api/register', {
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
          hourlyRate: result.user.hourly_rate || '',
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
        return user;
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
    this.currentUser = null;
    
    try {
      // Clear all user data to ensure complete logout
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('user_logged_out');
      console.log('AuthService: All user data cleared');
      
      console.log('AuthService: User logged out successfully');
    } catch (error) {
      console.error('Error during logout:', error);
      // Continue with logout even if clearing data fails
    }
  }

  async clearAllData(): Promise<void> {
    this.currentUser = null;
    try {
      // Clear all user data to ensure complete cleanup
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('user_logged_out');
      console.log('clearAllData: All user data cleared');
      
      console.log('All user data cleared successfully');
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


  async updateUserProfile(profileData: Partial<User>): Promise<User> {
    console.log('AuthService: updateUserProfile called with:', profileData);
    console.log('AuthService: Current user:', this.currentUser);
    
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
    
    // Update the name field if firstName or lastName changed
    if (profileData.firstName || profileData.lastName) {
      const firstName = profileData.firstName || (this.currentUser.firstName || '');
      const lastName = profileData.lastName || (this.currentUser.lastName || '');
      updatedUser.name = `${firstName} ${lastName}`.trim();
    }

    this.currentUser = updatedUser;
    await this.saveUserToStorage(updatedUser);
    console.log('Updated user profile:', updatedUser);
    return updatedUser;
  }

  // New method to store complete user data from backend registration
  async storeUserFromBackend(backendUser: any): Promise<User> {
    console.log('Storing user data from backend:', backendUser);
    
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
      // Only include sitter-specific fields for pet sitters
      ...(backendUser.role === 'pet_sitter' && {
        experience: backendUser.experience || '',
        hourlyRate: backendUser.hourly_rate || '',
        specialties: backendUser.specialties || [],
      }),
    };

    this.currentUser = user;
    await this.saveUserToStorage(user);
    console.log('User data stored from backend successfully:', user);
    return user;
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