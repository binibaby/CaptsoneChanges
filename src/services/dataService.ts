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

  // Mock data
  private mockPets: Pet[] = [
    {
      id: '1',
      name: 'Max',
      type: 'dog',
      breed: 'Golden Retriever',
      age: 3,
      image: require('../assets/images/dog.png'),
      owner: {
        id: '1',
        email: 'sarah@example.com',
        name: 'Sarah Johnson',
        userRole: 'Pet Owner',
      },
      description: 'Friendly and energetic Golden Retriever who loves walks and playing fetch.',
      location: {
        latitude: 37.7749,
        longitude: -122.4194,
        address: 'San Francisco, CA',
      },
    },
    {
      id: '2',
      name: 'Luna',
      type: 'cat',
      breed: 'Persian',
      age: 2,
      image: require('../assets/images/cat.png'),
      owner: {
        id: '2',
        email: 'mike@example.com',
        name: 'Mike Chen',
        userRole: 'Pet Owner',
      },
      description: 'Calm and gentle Persian cat who enjoys quiet time and gentle pets.',
      location: {
        latitude: 37.7849,
        longitude: -122.4094,
        address: 'San Francisco, CA',
      },
    },
  ];

  private mockSitters: Sitter[] = [
    {
      id: '1',
      user: {
        id: '3',
        email: 'emily@example.com',
        name: 'Emily Davis',
        userRole: 'Pet Sitter',
      },
      rating: 4.8,
      reviews: 24,
      hourlyRate: 25,
      experience: '5 years',
      petTypes: ['dogs', 'cats'],
      location: {
        latitude: 37.7749,
        longitude: -122.4194,
        address: 'San Francisco, CA',
      },
      availability: {
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        hours: '8:00 AM - 8:00 PM',
      },
      bio: 'Experienced pet sitter with a love for all animals. I have a fenced yard and plenty of space for your pets to play.',
      images: [require('../assets/images/default-avatar.png')],
    },
    {
      id: '2',
      user: {
        id: '4',
        email: 'alex@example.com',
        name: 'Alex Wilson',
        userRole: 'Pet Sitter',
      },
      rating: 4.9,
      reviews: 18,
      hourlyRate: 30,
      experience: '3 years',
      petTypes: ['cats'],
      location: {
        latitude: 37.7849,
        longitude: -122.4094,
        address: 'San Francisco, CA',
      },
      availability: {
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        hours: '9:00 AM - 6:00 PM',
      },
      bio: 'Cat specialist with experience in caring for all breeds. I provide a calm, cat-friendly environment.',
      images: [require('../assets/images/default-avatar.png')],
    },
  ];

  // Methods
  async getPetsNearby(latitude: number, longitude: number, radius: number = 10): Promise<Pet[]> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    return this.mockPets;
  }

  async getSittersNearby(latitude: number, longitude: number, radius: number = 10): Promise<Sitter[]> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    return this.mockSitters;
  }

  async getPetById(id: string): Promise<Pet | null> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return this.mockPets.find(pet => pet.id === id) || null;
  }

  async getSitterById(id: string): Promise<Sitter | null> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return this.mockSitters.find(sitter => sitter.id === id) || null;
  }

  async searchSitters(query: string, filters?: {
    petTypes?: ('dogs' | 'cats')[];
    maxPrice?: number;
    minRating?: number;
  }): Promise<Sitter[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    let results = this.mockSitters;
    
    if (query) {
      results = results.filter(sitter => 
        sitter.user.name.toLowerCase().includes(query.toLowerCase()) ||
        sitter.bio.toLowerCase().includes(query.toLowerCase())
      );
    }
    
    if (filters?.petTypes) {
      results = results.filter(sitter =>
        filters.petTypes!.some(type => sitter.petTypes.includes(type))
      );
    }
    
    if (filters?.maxPrice) {
      results = results.filter(sitter => sitter.hourlyRate <= filters.maxPrice!);
    }
    
    if (filters?.minRating) {
      results = results.filter(sitter => sitter.rating >= filters.minRating!);
    }
    
    return results;
  }
}

export default DataService.getInstance(); 