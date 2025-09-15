import { User } from './authService';

export interface Pet {
  id: string;
  name: string;
  type: 'dog' | 'cat';
  breed: string;
  age: number;
  image: any;
  owner: User;
  description: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
}

export interface Sitter {
  id: string;
  user: User;
  rating: number;
  reviews: number;
  hourlyRate: number;
  experience: string;
  petTypes: ('dogs' | 'cats')[];
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  availability: {
    days: string[];
    hours: string;
  };
  bio: string;
  images: any[];
}

export interface Booking {
  id: string;
  pet: Pet;
  sitter: Sitter;
  startDate: string;
  endDate: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  totalPrice: number;
  specialInstructions?: string;
}

class DataService {
  private static instance: DataService;

  static getInstance(): DataService {
    if (!DataService.instance) {
      DataService.instance = new DataService();
    }
    return DataService.instance;
  }

  // No mock data - all data comes from real API calls

  // Methods - all return empty arrays since we use real API data
  async getPetsNearby(latitude: number, longitude: number, radius: number = 10): Promise<Pet[]> {
    // Return empty array - real data comes from API calls
    console.log('DataService: getPetsNearby called - returning empty array (use real API)');
    return [];
  }

  async getSittersNearby(latitude: number, longitude: number, radius: number = 10): Promise<Sitter[]> {
    // Return empty array - real data comes from realtimeLocationService
    console.log('DataService: getSittersNearby called - returning empty array (use realtimeLocationService)');
    return [];
  }

  async getPetById(id: string): Promise<Pet | null> {
    // Return null - real data comes from API calls
    console.log('DataService: getPetById called - returning null (use real API)');
    return null;
  }

  async getSitterById(id: string): Promise<Sitter | null> {
    // Return null - real data comes from API calls
    console.log('DataService: getSitterById called - returning null (use real API)');
    return null;
  }

  async searchSitters(query: string, filters?: {
    petTypes?: ('dogs' | 'cats')[];
    maxPrice?: number;
    minRating?: number;
  }): Promise<Sitter[]> {
    // Return empty array - real data comes from API calls
    console.log('DataService: searchSitters called - returning empty array (use real API)');
    return [];
  }
}

export default DataService.getInstance(); 