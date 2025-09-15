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
  private apiCallDebounceMs: number = 3000; // 3 second debounce for API calls

  constructor() {
    // Real-time sitters will be loaded from API
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

  // Add or update a sitter's location via backend API
  async updateSitterLocation(sitter: RealtimeSitter) {
    console.log('📍 Updating sitter location via API:', {
      id: sitter.id,
      name: sitter.name,
      location: sitter.location,
      isOnline: sitter.isOnline
    });

    try {
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
    // Debounce API calls to prevent infinite loops (unless force refresh is requested)
    const now = Date.now();
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
      const response = await makeApiCall('/api/location/nearby-sitters', {
        method: 'POST',
        headers: getAuthHeaders(token || undefined),
        body: JSON.stringify({
          latitude,
          longitude,
          radius_km: radiusKm,
        }),
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
            allKeys: Object.keys(sitter)
          });
          
          return {
            ...sitter,
            lastSeen: new Date(sitter.lastSeen),
            // Map different possible image fields and ensure proper URL handling
            images: sitter.images || (sitter.profile_image ? [sitter.profile_image] : undefined),
            profileImage: sitter.profile_image || sitter.avatar,
            // Add helper to determine if image is a URL or local asset
            imageSource: sitter.profile_image || sitter.avatar || sitter.images?.[0]
          };
        });
        
        // Update local cache
        apiSitters.forEach((sitter: RealtimeSitter) => {
          this.sitters.set(sitter.id, sitter);
        });
        
        this.notifyListeners();
        return apiSitters;
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
    
    for (const sitter of this.sitters.values()) {
      if (!sitter.isOnline) continue;

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
    }

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

  // Set sitter as online/offline via backend API
  async setSitterOnline(sitterId: string, isOnline: boolean) {
    console.log(`👤 Setting sitter ${sitterId} ${isOnline ? 'online' : 'offline'} via API`);

    try {
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

      const response = await makeApiCall('/api/location/status', {
        method: 'POST',
        headers: getAuthHeaders(token || undefined),
        body: JSON.stringify({
          is_online: isOnline,
        }),
      });

      const data = await response.json();
      
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
    this.notifyListeners();
    console.log('🧹 Cleared all sitters');
  }
}

export default RealtimeLocationService.getInstance();
