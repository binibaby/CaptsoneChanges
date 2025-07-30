import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
  id: string;
  email: string;
  name: string;
  userRole: 'Pet Owner' | 'Pet Sitter';
  role: 'pet_owner' | 'pet_sitter';
  phone?: string;
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
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock user data - in real app, this would come from your backend
    const mockUser: User = {
      id: '1',
      email,
      name: email.split('@')[0],
      userRole: 'Pet Owner',
      role: 'pet_owner',
      phone: '+1234567890',
      email_verified: false,
      phone_verified: false,
      selectedPetTypes: ['dogs', 'cats'],
      selectedBreeds: ['Golden Retriever', 'Persian'],
    };

    this.currentUser = mockUser;
    await this.saveUserToStorage(mockUser);
    return mockUser;
  }

  async register(userData: {
    email: string;
    password: string;
    name: string;
    userRole: 'Pet Owner' | 'Pet Sitter';
    selectedPetTypes?: ('dogs' | 'cats')[];
    selectedBreeds?: string[];
  }): Promise<User> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newUser: User = {
      id: Date.now().toString(),
      email: userData.email,
      name: userData.name,
      userRole: userData.userRole,
      role: userData.userRole === 'Pet Owner' ? 'pet_owner' : 'pet_sitter',
      phone: '',
      email_verified: false,
      phone_verified: false,
      selectedPetTypes: userData.selectedPetTypes,
      selectedBreeds: userData.selectedBreeds,
    };

    this.currentUser = newUser;
    await this.saveUserToStorage(newUser);
    return newUser;
  }

  async logout(): Promise<void> {
    this.currentUser = null;
    await AsyncStorage.removeItem('user');
  }

  async getCurrentUser(): Promise<User | null> {
    if (this.currentUser) {
      return this.currentUser;
    }
    
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        this.currentUser = JSON.parse(userData);
        return this.currentUser;
      }
    } catch (error) {
      console.error('Error getting current user:', error);
    }
    
    return null;
  }

  async isAuthenticated(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user !== null;
  }

  private async saveUserToStorage(user: User): Promise<void> {
    try {
      await AsyncStorage.setItem('user', JSON.stringify(user));
    } catch (error) {
      console.error('Error saving user to storage:', error);
    }
  }
}

export default AuthService.getInstance(); 