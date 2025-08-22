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
      
      // Call the backend login API
      const response = await fetch('http://192.168.100.164:8000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('Login successful, user data from backend:', result.user);
        
        // Create user object from backend response
        const user: User = {
          id: result.user.id.toString(),
          email: result.user.email,
          name: result.user.name,
          firstName: result.user.first_name,
          lastName: result.user.last_name,
          userRole: result.user.role === 'pet_owner' ? 'Pet Owner' : 'Pet Sitter',
          role: result.user.role,
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
      
      // Call the backend register API
      const response = await fetch('http://192.168.100.164:8000/api/register', {
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
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('Registration successful, user data from backend:', result.user);
        
        // Create user object from backend response
        const user: User = {
          id: result.user.id.toString(),
          email: result.user.email,
          name: result.user.name,
          firstName: result.user.first_name,
          lastName: result.user.last_name,
          userRole: result.user.role === 'pet_owner' ? 'Pet Owner' : 'Pet Sitter',
          role: result.user.role,
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
      throw error;
    }
  }

  async logout(): Promise<void> {
    this.currentUser = null;
    await AsyncStorage.removeItem('user');
  }

  async clearAllData(): Promise<void> {
    this.currentUser = null;
    try {
      // Get all keys first to see what's actually stored
      const allKeys = await AsyncStorage.getAllKeys();
      console.log('Current AsyncStorage keys:', allKeys);
      
      // Clear all keys that might contain user data
      const keysToRemove = allKeys.filter(key => 
        key.includes('user') || 
        key.includes('auth') || 
        key.includes('profile') || 
        key.includes('signup') ||
        key.includes('preference')
      );
      
      console.log('Keys to remove:', keysToRemove);
      
      for (const key of keysToRemove) {
        try {
          await AsyncStorage.removeItem(key);
          console.log(`Removed key: ${key}`);
        } catch (error) {
          console.log(`Could not remove key ${key}:`, error);
        }
      }
      
      console.log('All user data cleared successfully');
    } catch (error) {
      console.error('Error clearing user data:', error);
      // Continue even if there's an error
    }
  }

  async getCurrentUser(): Promise<User | null> {
    if (this.currentUser) {
      console.log('getCurrentUser: Returning cached user:', this.currentUser.email);
      return this.currentUser;
    }
    
    try {
      console.log('getCurrentUser: No cached user, checking AsyncStorage');
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        console.log('getCurrentUser: Found user data in AsyncStorage:', userData);
        this.currentUser = JSON.parse(userData);
        console.log('getCurrentUser: Parsed user data:', this.currentUser);
        return this.currentUser;
      } else {
        console.log('getCurrentUser: No user data found in AsyncStorage');
      }
    } catch (error) {
      console.error('Error reading user from storage:', error);
    }
    
    return null;
  }

  async updateUserProfile(profileData: Partial<User>): Promise<User> {
    // If no current user exists, create a new one
    if (!this.currentUser) {
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

    // Update the current user with new profile data
    const updatedUser = { ...this.currentUser, ...profileData };
    
    // Update the name field if firstName or lastName changed
    if (profileData.firstName || profileData.lastName) {
      const firstName = profileData.firstName || this.currentUser.firstName || '';
      const lastName = profileData.lastName || this.currentUser.lastName || '';
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
    
    const user: User = {
      id: backendUser.id.toString(),
      email: backendUser.email,
      name: backendUser.name,
      firstName: backendUser.first_name,
      lastName: backendUser.last_name,
      userRole: backendUser.role === 'pet_owner' ? 'Pet Owner' : 'Pet Sitter',
      role: backendUser.role,
      phone: backendUser.phone || '',
      age: backendUser.age,
      gender: backendUser.gender || '',
      address: backendUser.address || '',
      experience: backendUser.experience || '',
      hourlyRate: backendUser.hourly_rate || '',
      aboutMe: backendUser.bio || '',
      specialties: backendUser.specialties || [],
      email_verified: backendUser.email_verified || false,
      phone_verified: backendUser.phone_verified || false,
      selectedPetTypes: backendUser.selected_pet_types || [],
      selectedBreeds: backendUser.pet_breeds || [],
      profileImage: backendUser.profile_image || undefined,
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