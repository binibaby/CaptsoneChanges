import AsyncStorage from '@react-native-async-storage/async-storage';
import { messagingService } from './messagingService';

export interface Booking {
  id: string;
  sitterId: string;
  sitterName: string;
  petOwnerId: string;
  petOwnerName: string;
  date: string;
  startTime: string;
  endTime: string;
  hourlyRate: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  petName?: string;
  petImage?: string;
  specialInstructions?: string;
  createdAt: string;
  updatedAt: string;
}

class BookingService {
  private static instance: BookingService;
  private listeners: ((bookings: Booking[]) => void)[] = [];
  private lastNotificationTime: number = 0;
  private notificationDebounceMs: number = 5000; // 5 second debounce
  private lastApiCallTime: number = 0;
  private apiCallDebounceMs: number = 10000; // 10 second debounce for API calls
  private cachedBookings: Booking[] | null = null;
  private cacheExpiry: number = 0;
  private cacheDurationMs: number = 30000; // 30 second cache
  private pendingApiCall: Promise<Booking[]> | null = null;

  private constructor() {}

  static getInstance(): BookingService {
    if (!BookingService.instance) {
      BookingService.instance = new BookingService();
    }
    return BookingService.instance;
  }

  // Subscribe to booking updates
  subscribe(listener: (bookings: Booking[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Notify all listeners with debouncing
  private notifyListeners(bookings: Booking[]) {
    const now = Date.now();
    if (now - this.lastNotificationTime < this.notificationDebounceMs) {
      console.log('🚫 Skipping notification due to debounce');
      return;
    }
    
    this.lastNotificationTime = now;
    console.log('📢 Notifying booking listeners:', this.listeners.length);
    this.listeners.forEach(listener => listener(bookings));
  }

  // Get all bookings
  async getBookings(): Promise<Booking[]> {
    try {
      // Check cache first
      const now = Date.now();
      if (this.cachedBookings && now < this.cacheExpiry) {
        console.log('📅 Using cached bookings:', this.cachedBookings.length);
        return this.cachedBookings;
      }

      // First try to get from API
      const apiBookings = await this.fetchBookingsFromAPI();
      if (apiBookings.length > 0) {
        console.log('📅 Fetched bookings from API:', apiBookings.length);
        // Cache the results
        this.cachedBookings = apiBookings;
        this.cacheExpiry = now + this.cacheDurationMs;
        // Save to local storage for offline access (don't notify to prevent loops)
        await this.saveBookings(apiBookings, false);
        return apiBookings;
      }
      
      // Fallback to local storage
      const stored = await AsyncStorage.getItem('bookings');
      const localBookings = stored ? JSON.parse(stored) : [];
      console.log('📅 Using local bookings:', localBookings.length);
      // Cache local results too
      this.cachedBookings = localBookings;
      this.cacheExpiry = now + this.cacheDurationMs;
      return localBookings;
    } catch (error) {
      console.error('Error getting bookings:', error);
      // Fallback to local storage on error
      try {
        const stored = await AsyncStorage.getItem('bookings');
        return stored ? JSON.parse(stored) : [];
      } catch (localError) {
        console.error('Error getting local bookings:', localError);
        return [];
      }
    }
  }

  // Fetch bookings from API
  private async fetchBookingsFromAPI(): Promise<Booking[]> {
    try {
      // If there's already a pending API call, wait for it
      if (this.pendingApiCall) {
        console.log('🔄 Waiting for pending API call');
        return await this.pendingApiCall;
      }

      // Debounce API calls
      const now = Date.now();
      if (now - this.lastApiCallTime < this.apiCallDebounceMs) {
        console.log('🚫 Skipping API call due to debounce');
        return [];
      }
      this.lastApiCallTime = now;

      const user = await this.getCurrentUser();
      if (!user) {
        console.log('❌ No user found for API call');
        return [];
      }

      // Get auth token
      let token = user.token;
      if (!token) {
        // Fallback to hardcoded tokens for testing
        if (user.id === '5') {
          token = '64|dTO5Gio05Om1Buxtkta02gVpvQnetCTMrofsLjeudda0034b';
        } else if (user.id === '21') {
          token = '67|uCtobaBZatzbzDOeK8k1DytVHby0lpa07ERJJczu3cdfa507';
        } else {
          console.log('❌ No token available for user:', user.id);
          return [];
        }
      }

      console.log('🔑 Fetching bookings from API for user:', user.id);

      // Create the pending API call
      this.pendingApiCall = this.makeApiCall(user.id, token);
      const response = await this.pendingApiCall;
      
      // Clear the pending call
      this.pendingApiCall = null;

      if (response.ok) {
        const data = await response.json();
        console.log('📅 API bookings response:', data);
        
        if (data.success && data.bookings) {
          // Convert API format to local format
          const bookings: Booking[] = data.bookings.map((apiBooking: any) => ({
            id: apiBooking.id.toString(),
            sitterId: apiBooking.pet_sitter.id.toString(),
            sitterName: apiBooking.pet_sitter.name,
            petOwnerId: apiBooking.pet_owner.id.toString(),
            petOwnerName: apiBooking.pet_owner.name,
            date: apiBooking.date,
            startTime: apiBooking.time.split(' - ')[0] || '09:00',
            endTime: apiBooking.time.split(' - ')[1] || '17:00',
            hourlyRate: 25, // Default rate since API doesn't include it
            status: apiBooking.status,
            createdAt: apiBooking.created_at,
            updatedAt: apiBooking.created_at,
          }));
          
          console.log('✅ Converted API bookings:', bookings.length);
          return bookings;
        }
      } else {
        console.log('⚠️ API call failed:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching bookings from API:', error);
      // Clear the pending call on error
      this.pendingApiCall = null;
    }
    
    return [];
  }

  // Make the actual API call
  private async makeApiCall(userId: string, token: string): Promise<Response> {
    return await fetch('http://172.20.10.2:8000/api/bookings/', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });
  }

  // Get current user (import from auth service)
  private async getCurrentUser() {
    const { default: authService } = await import('./authService');
    return await authService.getCurrentUser();
  }

  // Save bookings to storage
  private async saveBookings(bookings: Booking[], shouldNotify: boolean = true) {
    try {
      console.log('💾 Saving bookings to AsyncStorage:', bookings.length);
      await AsyncStorage.setItem('bookings', JSON.stringify(bookings));
      
      if (shouldNotify) {
        this.notifyListeners(bookings);
      }
      console.log('✅ Bookings saved successfully');
    } catch (error) {
      console.error('Error saving bookings:', error);
    }
  }

  // Create a new booking
  async createBooking(bookingData: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>): Promise<Booking> {
    console.log('📅 Creating new booking with data:', bookingData);
    const bookings = await this.getBookings();
    const newBooking: Booking = {
      ...bookingData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    console.log('📋 New booking object:', newBooking);
    bookings.push(newBooking);
    console.log('💾 Total bookings after adding:', bookings.length);
    await this.saveBookings(bookings);
    return newBooking;
  }

  // Update booking status
  async updateBookingStatus(bookingId: string, status: Booking['status']): Promise<Booking | null> {
    const bookings = await this.getBookings();
    const bookingIndex = bookings.findIndex(b => b.id === bookingId);
    
    if (bookingIndex === -1) return null;

    const updatedBooking = {
      ...bookings[bookingIndex],
      status,
      updatedAt: new Date().toISOString(),
    };

    bookings[bookingIndex] = updatedBooking;
    await this.saveBookings(bookings);

    // Create message and notification for booking confirmation/cancellation
    if (status === 'confirmed' || status === 'cancelled') {
      // Create message
      await messagingService.createBookingConfirmationMessage({
        sitterId: updatedBooking.sitterId,
        sitterName: updatedBooking.sitterName,
        petOwnerId: updatedBooking.petOwnerId,
        petOwnerName: updatedBooking.petOwnerName,
        bookingId: updatedBooking.id,
        date: updatedBooking.date,
        startTime: updatedBooking.startTime,
        endTime: updatedBooking.endTime,
        status: status === 'confirmed' ? 'confirmed' : 'cancelled',
      });

      // Create notification for pet owner
      const { notificationService } = await import('./notificationService');
      await notificationService.createBookingConfirmationNotification({
        sitterId: updatedBooking.sitterId,
        sitterName: updatedBooking.sitterName,
        petOwnerId: updatedBooking.petOwnerId,
        petOwnerName: updatedBooking.petOwnerName,
        bookingId: updatedBooking.id,
        date: updatedBooking.date,
        startTime: updatedBooking.startTime,
        endTime: updatedBooking.endTime,
        status: status === 'confirmed' ? 'confirmed' : 'cancelled',
      });
    }

    // Notify listeners about the booking update
    this.notifyListeners(bookings);

    return updatedBooking;
  }

  // Get bookings for a specific sitter
  async getSitterBookings(sitterId: string): Promise<Booking[]> {
    const bookings = await this.getBookings();
    console.log('🔍 Filtering bookings for sitter:', sitterId);
    console.log('📊 Total bookings in storage:', bookings.length);
    bookings.forEach(booking => {
      console.log(`  - Booking ${booking.id}: sitterId=${booking.sitterId}, date=${booking.date}, status=${booking.status}`);
    });
    const sitterBookings = bookings.filter(b => b.sitterId === sitterId);
    console.log('👤 Sitter bookings found:', sitterBookings.length);
    return sitterBookings;
  }

  // Get bookings for a specific pet owner
  async getPetOwnerBookings(petOwnerId: string): Promise<Booking[]> {
    const bookings = await this.getBookings();
    return bookings.filter(b => b.petOwnerId === petOwnerId);
  }

  // Get upcoming bookings for a sitter
  async getUpcomingSitterBookings(sitterId: string): Promise<Booking[]> {
    console.log('🔍 Getting upcoming bookings for sitter:', sitterId);
    const sitterBookings = await this.getSitterBookings(sitterId);
    console.log('📊 All sitter bookings:', sitterBookings.length);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    console.log('📅 Today:', today.toISOString().split('T')[0]);

    // Include pending bookings from today onwards, or all pending if none found
    let upcoming = sitterBookings.filter(booking => {
      const bookingDate = new Date(booking.date);
      bookingDate.setHours(0, 0, 0, 0);
      const isUpcoming = bookingDate >= today;
      const isPending = (booking.status === 'pending');
      console.log(`  - ${booking.date} (${booking.status}): upcoming=${isUpcoming}, status=${isPending}`);
      // Include only pending bookings from today onwards
      return isUpcoming && isPending;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // If no upcoming bookings found, show all pending bookings
    if (upcoming.length === 0) {
      console.log('📅 No upcoming bookings found, showing all pending bookings');
      upcoming = sitterBookings.filter(booking => booking.status === 'pending')
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }
    
    console.log('📅 Upcoming bookings result:', upcoming.length);
    return upcoming;
  }

  // Get pending bookings for a sitter
  async getPendingSitterBookings(sitterId: string): Promise<Booking[]> {
    const sitterBookings = await this.getSitterBookings(sitterId);
    return sitterBookings.filter(b => b.status === 'pending');
  }

  // Get completed bookings for a sitter
  async getCompletedSitterBookings(sitterId: string): Promise<Booking[]> {
    const sitterBookings = await this.getSitterBookings(sitterId);
    return sitterBookings.filter(b => b.status === 'completed');
  }

  // Calculate total earnings for a sitter
  async getSitterEarnings(sitterId: string): Promise<{
    thisWeek: number;
    thisMonth: number;
    total: number;
    completedJobs: number;
  }> {
    const completedBookings = await this.getCompletedSitterBookings(sitterId);
    
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const thisWeekBookings = completedBookings.filter(b => {
      const bookingDate = new Date(b.date);
      return bookingDate >= startOfWeek;
    });

    const thisMonthBookings = completedBookings.filter(b => {
      const bookingDate = new Date(b.date);
      return bookingDate >= startOfMonth;
    });

    const calculateEarnings = (bookings: Booking[]) => {
      return bookings.reduce((total, booking) => {
        const startTime = new Date(`2000-01-01 ${booking.startTime}`);
        const endTime = new Date(`2000-01-01 ${booking.endTime}`);
        const hours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
        return total + (hours * booking.hourlyRate);
      }, 0);
    };

    return {
      thisWeek: calculateEarnings(thisWeekBookings),
      thisMonth: calculateEarnings(thisMonthBookings),
      total: calculateEarnings(completedBookings),
      completedJobs: completedBookings.length,
    };
  }

  // Delete booking
  async deleteBooking(bookingId: string): Promise<boolean> {
    const bookings = await this.getBookings();
    const updated = bookings.filter(b => b.id !== bookingId);
    
    if (updated.length === bookings.length) return false;
    
    await this.saveBookings(updated);
    return true;
  }
}

export const bookingService = BookingService.getInstance();