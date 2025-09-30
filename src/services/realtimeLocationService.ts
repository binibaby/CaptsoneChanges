import { getAuthHeaders } from '../constants/config';
import authService from './authService';
import { makeApiCall } from './networkService';

export interface RealtimeSitter {
  id: string;
  userId: string;
  name: string;
  email: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  specialties: string[];
  experience: string;
  petTypes: ('dogs' | 'cats')[];
  selectedBreeds: string[];
  hourlyRate: number;
  rating: number;
  reviews: number;
  bio: string;
  isOnline: boolean;
  lastSeen: Date;
  distance?: string;
  images?: any[];
  profileImage?: string;
  imageSource?: string;
  followers?: number;
  following?: number;
}

class RealtimeLocationService {
  private static instance: RealtimeLocationService;
  private sitters: Map<string, RealtimeSitter> = new Map();
  private listeners: Set<(sitters: RealtimeSitter[]) => void> = new Set();
  private lastApiCallTime: number = 0;
  private apiCallDebounceMs: number = 1000; // 1 second debounce for API calls
  private cacheTimestamp: number = 0;
  private cacheValidityMs: number = 15000; // Cache valid for 15 seconds

  constructor() {
    // Real-time sitters will be loaded from API
    // Clear any existing cache on initialization
    this.sitters.clear();
    console.log('🧹 RealtimeLocationService initialized - cache cleared');
  }


  // Helper method to get current user's auth token
  private async getAuthToken(): Promise<string | null> {
    try {
      const user = await authService.getCurrentUser();
      if (user?.token) {
        console.log('✅ Auth token found for user:', user.email);
        return user.token;
      } else {
        console.warn('⚠️ No auth token found for user:', user?.email || 'unknown');
        return null;
      }
    } catch (error) {
      console.error('❌ Error getting auth token:', error);
      return null;
    }
  }
  private updateInterval: ReturnType<typeof setInterval> | null = null;

  static getInstance(): RealtimeLocationService {
    if (!RealtimeLocationService.instance) {
      RealtimeLocationService.instance = new RealtimeLocationService();
    }
    return RealtimeLocationService.instance;
  }

  // Start real-time updates
  startRealtimeUpdates() {
    if (this.updateInterval) return;

    console.log('🔄 Starting real-time location updates...');
    
    this.updateInterval = setInterval(() => {
      this.notifyListeners();
    }, 5000); // Update every 5 seconds
  }

  // Stop real-time updates
  stopRealtimeUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
      console.log('⏹️ Stopped real-time location updates');
    }
  }

  // Clear sitter cache to force refresh
  clearSitterCache() {
    console.log('🧹 Clearing sitter cache to force refresh');
    this.sitters.clear();
    this.lastApiCallTime = 0; // Reset debounce timer
  }

  // Add or update a sitter's location via backend API
  async updateSitterLocation(sitter: RealtimeSitter) {
    console.log('📍 Updating sitter location via API:', {
      id: sitter.id,
      name: sitter.name,
      location: sitter.location,
      isOnline: sitter.isOnline
    });

    try {
      // Check if current user is a pet sitter before updating location
      const currentUser = await authService.getCurrentUser();
      if (currentUser && currentUser.role !== 'pet_sitter') {
        console.warn('⚠️ Only pet sitters can share their location. Current user role:', currentUser.role);
        return;
      }

      const token = await this.getAuthToken();
      if (!token) {
        console.warn('⚠️ No auth token available, updating local cache only');
        // Update local cache without API call
        this.sitters.set(sitter.id, {
          ...sitter,
          lastSeen: new Date(),
        });
        this.notifyListeners();
        return;
      }

      const response = await makeApiCall('/api/location/update', {
        method: 'POST',
        headers: getAuthHeaders(token || undefined),
        body: JSON.stringify({
          latitude: sitter.location.latitude,
          longitude: sitter.location.longitude,
          address: sitter.location.address,
          is_online: sitter.isOnline,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Sitter location updated successfully via API');
        // Also update local cache for immediate UI updates
        this.sitters.set(sitter.id, {
          ...sitter,
          lastSeen: new Date(),
        });
        this.notifyListeners();
      } else {
        console.error('❌ Failed to update sitter location:', data.message);
        // Fallback to local storage
        this.sitters.set(sitter.id, {
          ...sitter,
          lastSeen: new Date(),
        });
        this.notifyListeners();
      }
    } catch (error) {
      console.error('❌ Error updating sitter location via API:', error);
      // Fallback to local storage
      this.sitters.set(sitter.id, {
        ...sitter,
        lastSeen: new Date(),
      });
      this.notifyListeners();
    }
  }

  // Get sitters near a specific location via backend API
  async getSittersNearby(
    latitude: number, 
    longitude: number, 
    radiusKm: number = 2,
    forceRefresh: boolean = false
  ): Promise<RealtimeSitter[]> {
    // Clear cache if force refresh is requested
    if (forceRefresh) {
      console.log('🔄 Force refresh requested - clearing cache');
      this.sitters.clear();
    }
    
    // Check if cache is still valid (unless force refresh is requested)
    const now = Date.now();
    if (!forceRefresh && this.cacheTimestamp > 0 && (now - this.cacheTimestamp) < this.cacheValidityMs) {
      console.log('🚫 Using cached data (cache still valid)');
      return Array.from(this.sitters.values());
    }
    
    // Debounce API calls to prevent infinite loops (unless force refresh is requested)
    if (!forceRefresh && now - this.lastApiCallTime < this.apiCallDebounceMs) {
      console.log('🚫 Skipping API call due to debounce, using cached data');
      return Array.from(this.sitters.values());
    }
    this.lastApiCallTime = now;

    console.log('🔍 Getting nearby sitters via API:', {
      latitude,
      longitude,
      radiusKm
    });

    try {
      const token = await this.getAuthToken();
      const response = await makeApiCall(`/api/location/nearby-sitters?latitude=${latitude}&longitude=${longitude}&radius_km=${radiusKm}`, {
        method: 'GET',
        headers: getAuthHeaders(token || undefined),
      });

      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Found nearby sitters via API:', data.count);
        console.log('🔍 Raw API sitter data:', JSON.stringify(data.sitters, null, 2));
        
        // Update local cache with API results
        const apiSitters = data.sitters.map((sitter: any) => {
          console.log(`👤 Processing sitter ${sitter.name || sitter.id}:`, {
            hasProfileImage: !!sitter.profile_image,
            hasImages: !!sitter.images,
            hasAvatar: !!sitter.avatar,
            profileImage: sitter.profile_image,
            images: sitter.images,
            avatar: sitter.avatar,
            petTypes: sitter.petTypes,
            selectedPetTypes: sitter.selected_pet_types,
            selectedBreeds: sitter.selectedBreeds,
            petBreeds: sitter.pet_breeds,
            isOnline: sitter.isOnline,
            lastSeen: sitter.lastSeen,
            allKeys: Object.keys(sitter)
          });
          console.log(`👤 Raw sitter data from API:`, JSON.stringify(sitter, null, 2));
          
          const mappedSitter = {
            ...sitter,
            lastSeen: new Date(sitter.lastSeen),
            // Map different possible image fields and ensure proper URL handling
            images: sitter.images || (sitter.profile_image ? [sitter.profile_image] : undefined),
            // Use profile_image_url if available (full URL), otherwise fall back to profile_image (storage path)
            profileImage: sitter.profile_image_url || sitter.profile_image || sitter.avatar,
            // Add helper to determine if image is a URL or local asset
            imageSource: sitter.profile_image_url || sitter.profile_image || sitter.avatar || sitter.images?.[0],
            // Map pet types and breeds from backend field names to frontend field names
            petTypes: sitter.petTypes || (sitter.selected_pet_types && sitter.selected_pet_types.length > 0 ? sitter.selected_pet_types : ['dogs', 'cats']),
            selectedBreeds: sitter.selectedBreeds || (sitter.pet_breeds && sitter.pet_breeds.length > 0 ? sitter.pet_breeds : ['All breeds welcome'])
          };
          
          // Enhanced debugging for image mapping
          console.log(`🖼️ RealtimeLocationService - Image mapping for sitter ${sitter.name}:`, {
            'sitter.profile_image': sitter.profile_image,
            'sitter.profile_image_url': sitter.profile_image_url,
            'sitter.avatar': sitter.avatar,
            'sitter.images': sitter.images,
            'mapped.profileImage': mappedSitter.profileImage,
            'mapped.imageSource': mappedSitter.imageSource,
            'mapped.images': mappedSitter.images
          });
          
          console.log(`👤 Final mapped sitter:`, JSON.stringify(mappedSitter, null, 2));
          return mappedSitter;
        });
        
        // Filter out offline sitters and deduplicate
        const onlineSitters = apiSitters.filter((sitter: RealtimeSitter) => {
          // Only show sitters who are online and have recent activity (within last 5 minutes)
          const lastSeen = new Date(sitter.lastSeen);
          const now = new Date();
          const timeDiff = now.getTime() - lastSeen.getTime();
          const isRecent = timeDiff < 5 * 60 * 1000; // 5 minutes in milliseconds
          
          console.log(`👤 Sitter ${sitter.name} (${sitter.id}): isOnline=${sitter.isOnline}, lastSeen=${sitter.lastSeen}, isRecent=${isRecent}, timeDiff=${timeDiff}ms`);
          
          return sitter.isOnline && isRecent;
        });
        
        const uniqueSitters = onlineSitters.filter((sitter: RealtimeSitter, index: number, self: RealtimeSitter[]) => 
          index === self.findIndex((s: RealtimeSitter) => s.id === sitter.id)
        );
        
        console.log(`👥 Filtered sitters: ${apiSitters.length} total, ${onlineSitters.length} online, ${uniqueSitters.length} unique online`);
        
        console.log(`👥 Deduplicated sitters: ${apiSitters.length} -> ${uniqueSitters.length}`);
        
        // Update local cache
        uniqueSitters.forEach((sitter: RealtimeSitter) => {
          this.sitters.set(sitter.id, sitter);
        });
        
        this.notifyListeners();
        this.cacheTimestamp = now; // Update cache timestamp
        return uniqueSitters;
      } else {
        console.error('❌ Failed to get nearby sitters:', data.message);
        return [];
      }
    } catch (error) {
      console.error('❌ Error getting nearby sitters via API:', error);
      console.log('🔄 Falling back to local calculation...');
      // Fallback to local calculation
      return this.getSittersNearbyLocal(latitude, longitude, radiusKm);
    }
  }

  // Fallback method for local calculation
  private getSittersNearbyLocal(
    latitude: number, 
    longitude: number, 
    radiusKm: number = 2
  ): RealtimeSitter[] {
    const nearbySitters: RealtimeSitter[] = [];
    
    this.sitters.forEach((sitter, sitterId) => {
      if (!sitter.isOnline) return;

      const distance = this.calculateDistance(
        latitude,
        longitude,
        sitter.location.latitude,
        sitter.location.longitude
      );

      if (distance <= radiusKm) {
        nearbySitters.push({
          ...sitter,
          distance: `${distance.toFixed(1)} km`
        } as RealtimeSitter & { distance: string });
      }
    });

    // Sort by distance
    return nearbySitters.sort((a, b) => {
      const distA = parseFloat((a as any).distance);
      const distB = parseFloat((b as any).distance);
      return distA - distB;
    });
  }

  // Calculate distance between two coordinates (Haversine formula)
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in kilometers
    return distance;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  // Get current user's availability status
  async getCurrentUserAvailabilityStatus(): Promise<boolean> {
    try {
      const user = await authService.getCurrentUser();
      if (!user || user.role !== 'pet_sitter') {
        return false;
      }

      // Check if the current user is in our sitters cache
      const currentSitter = this.sitters.get(user.id);
      if (currentSitter) {
        return currentSitter.isOnline;
      }

      // If not in cache, try to get from backend
      const token = await this.getAuthToken();
      if (!token) {
        return false;
      }

      const response = await makeApiCall('/api/location/status', {
        method: 'GET',
        headers: getAuthHeaders(token),
      });

      if (response.ok) {
        const data = await response.json();
        return data.is_online || false;
      }

      return false;
    } catch (error) {
      console.error('Error getting current user availability status:', error);
      return false;
    }
  }

  // Set sitter as online/offline via backend API
  async setSitterOnline(sitterId: string, isOnline: boolean) {
    console.log(`👤 Setting sitter ${sitterId} ${isOnline ? 'online' : 'offline'} via API`);

    try {
      // Check if current user is a pet sitter before setting online status
      const currentUser = await authService.getCurrentUser();
      console.log('👤 Current user for setSitterOnline:', currentUser);
      if (currentUser && currentUser.role !== 'pet_sitter') {
        console.warn('⚠️ Only pet sitters can set online status. Current user role:', currentUser.role);
        return;
      }

      const token = await this.getAuthToken();
      if (!token) {
        console.warn('⚠️ No auth token available, updating local cache only');
        // Update local cache without API call
        if (isOnline) {
          const sitter = this.sitters.get(sitterId);
          if (sitter) {
            sitter.isOnline = isOnline;
            sitter.lastSeen = new Date();
            this.sitters.set(sitterId, sitter);
            this.notifyListeners();
            console.log(`👤 Sitter ${sitter.name} is now ${isOnline ? 'online' : 'offline'} (local only)`);
          }
        } else {
          this.removeSitter(sitterId);
        }
        return;
      }

      console.log('👤 Making API call to set sitter offline...');
      const response = await makeApiCall('/api/location/status', {
        method: 'POST',
        headers: getAuthHeaders(token || undefined),
        body: JSON.stringify({
          is_online: isOnline,
        }),
      });

      console.log('👤 API response status:', response.status);
      const data = await response.json();
      console.log('👤 API response data:', data);
      
      if (data.success) {
        console.log(`✅ Sitter ${sitterId} status updated successfully via API`);
        // Update local cache
        if (isOnline) {
          // If going online, keep in cache
          const sitter = this.sitters.get(sitterId);
          if (sitter) {
            sitter.isOnline = isOnline;
            sitter.lastSeen = new Date();
            this.sitters.set(sitterId, sitter);
            this.notifyListeners();
          }
        } else {
          // If going offline, remove from cache entirely
          this.removeSitter(sitterId);
        }
      } else {
        console.error('❌ Failed to update sitter status:', data.message);
        // Fallback to local update
        if (isOnline) {
          const sitter = this.sitters.get(sitterId);
          if (sitter) {
            sitter.isOnline = isOnline;
            sitter.lastSeen = new Date();
            this.sitters.set(sitterId, sitter);
            this.notifyListeners();
            console.log(`👤 Sitter ${sitter.name} is now ${isOnline ? 'online' : 'offline'} (local fallback)`);
          }
        } else {
          this.removeSitter(sitterId);
        }
      }
    } catch (error) {
      console.error('❌ Error updating sitter status via API:', error);
      // Fallback to local update
      if (isOnline) {
        const sitter = this.sitters.get(sitterId);
        if (sitter) {
          sitter.isOnline = isOnline;
          sitter.lastSeen = new Date();
          this.sitters.set(sitterId, sitter);
          this.notifyListeners();
          console.log(`👤 Sitter ${sitter.name} is now ${isOnline ? 'online' : 'offline'} (local)`);
        }
      } else {
        this.removeSitter(sitterId);
      }
    }
  }

  // Subscribe to real-time updates
  subscribe(listener: (sitters: RealtimeSitter[]) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Notify all listeners
  private notifyListeners() {
    const sittersArray = Array.from(this.sitters.values());
    this.listeners.forEach(listener => listener(sittersArray));
  }

  // Get all sitters
  getAllSitters(): RealtimeSitter[] {
    return Array.from(this.sitters.values());
  }

  // Remove sitter
  removeSitter(sitterId: string) {
    this.sitters.delete(sitterId);
    this.notifyListeners();
    console.log(`🗑️ Removed sitter: ${sitterId}`);
  }

  // Clear all sitters
  clearAllSitters() {
    this.sitters.clear();
    this.cacheTimestamp = 0; // Reset cache timestamp
    this.lastApiCallTime = 0; // Reset API call time to allow immediate refresh
    this.notifyListeners();
    console.log('🧹 Cleared all sitters, cache timestamp, and API call time');
  }

  // Update a specific sitter's data (useful for profile updates)
  updateSitterData(sitterId: string, updatedData: Partial<RealtimeSitter>): void {
    const existingSitter = this.sitters.get(sitterId);
    if (existingSitter) {
      const updatedSitter = {
        ...existingSitter,
        ...updatedData,
        lastSeen: new Date(), // Update last seen time
      };
      this.sitters.set(sitterId, updatedSitter);
      this.notifyListeners();
      console.log(`🔄 Updated sitter ${sitterId} data:`, updatedData);
    }
  }

  // Force clear everything and refresh
  async forceClearAndRefresh(latitude: number, longitude: number, radiusKm: number = 50) {
    console.log('🔄 Force clearing everything and refreshing...');
    this.clearAllSitters();
    return await this.getSittersNearby(latitude, longitude, radiusKm, true);
  }
}

export default RealtimeLocationService.getInstance();
