import AsyncStorage from '@react-native-async-storage/async-storage';
import authService from './authService';
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
  isWeekly?: boolean;
  startDate?: string;
  endDate?: string;
  totalAmount?: number;
}

export interface WeeklyBooking {
  id: string;
  sitterId: string;
  sitterName: string;
  petOwnerId: string;
  petOwnerName: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  hourlyRate: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  isWeekly: true;
  totalAmount: number;
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
  private pendingApiCall: Promise<Response> | null = null;

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

  // Confirm a booking
  async confirmBooking(bookingId: string): Promise<boolean> {
    try {
      console.log('✅ Confirming booking:', bookingId);
      
      const user = await authService.getCurrentUser();
      if (!user) {
        throw new Error('User not found.');
      }

      // Get auth token
      let token = user.token;
      if (!token) {
        // Fallback to hardcoded tokens for testing
        if (user.id === '5') {
          token = '64|dTO5Gio05Om1Buxtkta02gVpvQnetCTMrofsLjeudda0034b';
        } else if (user.id === '21') {
          token = '67|uCtobaBZatzbzDOeK8k1DytVHby0lpa07ERJJczu3cdfa507';
        } else if (user.id === '74') {
          token = '287|HOTtxWRw3lHKLL7j2e6GQbvORaLsbq2W5lS0vWJcfdab31c9';
        } else {
          throw new Error('No token available for user: ' + user.id);
        }
      }

      const { makeApiCall } = await import('./networkService');
      const response = await makeApiCall(`/api/bookings/${bookingId}/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to confirm booking');
      }

      const result = await response.json();
      console.log('✅ Booking confirmed successfully:', result);
      
      // Notify listeners about the booking update
      this.notifyListeners();
      
      return true;
    } catch (error) {
      console.error('❌ Error confirming booking:', error);
      throw error;
    }
  }

  // Cancel a booking
  async cancelBooking(bookingId: string): Promise<boolean> {
    try {
      console.log('❌ Cancelling booking:', bookingId);
      
      const user = await authService.getCurrentUser();
      if (!user) {
        throw new Error('User not found.');
      }

      // Get auth token
      let token = user.token;
      if (!token) {
        // Fallback to hardcoded tokens for testing
        if (user.id === '5') {
          token = '64|dTO5Gio05Om1Buxtkta02gVpvQnetCTMrofsLjeudda0034b';
        } else if (user.id === '21') {
          token = '67|uCtobaBZatzbzDOeK8k1DytVHby0lpa07ERJJczu3cdfa507';
        } else if (user.id === '74') {
          token = '287|HOTtxWRw3lHKLL7j2e6GQbvORaLsbq2W5lS0vWJcfdab31c9';
        } else {
          throw new Error('No token available for user: ' + user.id);
        }
      }

      const { makeApiCall } = await import('./networkService');
      const response = await makeApiCall(`/api/bookings/${bookingId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to cancel booking');
      }

      const result = await response.json();
      console.log('✅ Booking cancelled successfully:', result);
      
      // Notify listeners about the booking update
      this.notifyListeners();
      
      return true;
    } catch (error) {
      console.error('❌ Error cancelling booking:', error);
      throw error;
    }
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
        const response = await this.pendingApiCall;
        // Process the response and return bookings
        return await this.processApiResponse(response);
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

      // Process the response
      return await this.processApiResponse(response);
    } catch (error) {
      console.error('Error fetching bookings from API:', error);
      // Clear the pending call on error
      this.pendingApiCall = null;
    }
    
    return [];
  }

  // Make the actual API call
  private async makeApiCall(userId: string, token: string): Promise<Response> {
    const { makeApiCall } = await import('./networkService');
    return await makeApiCall('/api/bookings/', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  // Process API response and convert to Booking[]
  private async processApiResponse(response: Response): Promise<Booking[]> {
    if (response && response.ok) {
      const data = await response.json();
      console.log('📅 API bookings response:', data);
      
      if (data.success && data.bookings) {
        console.log('🔍 API booking fields available:', data.bookings.length > 0 ? Object.keys(data.bookings[0]) : 'No bookings');
        console.log('🔍 First API booking sample:', data.bookings[0]);
        
        // Convert API format to local format
        const bookings: Booking[] = data.bookings.map((apiBooking: any) => {
          const hourlyRate = parseFloat(apiBooking.hourly_rate) || parseFloat(apiBooking.hourlyRate) || 0;
          console.log(`💰 Booking ${apiBooking.id} hourly rate:`, {
            hourly_rate: apiBooking.hourly_rate,
            hourlyRate: apiBooking.hourlyRate,
            parsed: hourlyRate
          });
          
          return {
            id: apiBooking.id.toString(),
            sitterId: apiBooking.pet_sitter.id.toString(),
            sitterName: apiBooking.pet_sitter.name,
            petOwnerId: apiBooking.pet_owner.id.toString(),
            petOwnerName: apiBooking.pet_owner.name,
            date: apiBooking.date,
            startTime: apiBooking.time.split(' - ')[0] || '09:00',
            endTime: apiBooking.time.split(' - ')[1] || '17:00',
            hourlyRate: hourlyRate, // Use actual rate from API
            status: apiBooking.status,
            createdAt: apiBooking.created_at,
            updatedAt: apiBooking.created_at,
            petName: apiBooking.pet_name,
            totalAmount: parseFloat(apiBooking.total_amount) || 0,
            duration: apiBooking.duration,
            isWeekly: apiBooking.is_weekly || false,
            startDate: apiBooking.start_date,
            endDate: apiBooking.end_date,
          };
        });
        
        console.log('✅ Converted API bookings:', bookings.length);
        return bookings;
      }
    } else {
      console.log('⚠️ API call failed:', response?.status, response?.statusText);
    }
    
    return [];
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
    
    try {
      // First, save to database
      const user = await this.getCurrentUser();
      if (!user) {
        throw new Error('No user found');
      }

      const token = user.token;
      if (!token) {
        throw new Error('No authentication token available');
      }

      // Convert time to 24-hour format for backend
      const convertTo24Hour = (time12: string) => {
        if (!time12.includes('AM') && !time12.includes('PM')) {
          return time12;
        }
        
        const [time, period] = time12.split(' ');
        const [hours, minutes] = time.split(':');
        let hour24 = parseInt(hours, 10);
        
        if (period === 'PM' && hour24 !== 12) {
          hour24 += 12;
        } else if (period === 'AM' && hour24 === 12) {
          hour24 = 0;
        }
        
        return `${hour24.toString().padStart(2, '0')}:${minutes}`;
      };

      // Ensure date is in Y-m-d format and not in the past
      const formatDateForAPI = (dateString: string) => {
        const date = new Date(dateString);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset time to start of day
        
        // Check if date is valid
        if (isNaN(date.getTime())) {
          console.log('⚠️ Invalid date format, using today\'s date instead');
          return today.toISOString().split('T')[0];
        }
        
        // Reset time to start of day for comparison
        date.setHours(0, 0, 0, 0);
        
        // If the date is in the past, use today's date instead
        if (date < today) {
          console.log('⚠️ Date is in the past, using today\'s date instead');
          return today.toISOString().split('T')[0];
        }
        
        return date.toISOString().split('T')[0];
      };

      const formattedDate = formatDateForAPI(bookingData.date);

      const bookingPayload = {
        sitter_id: bookingData.sitterId,
        date: formattedDate,
        time: convertTo24Hour(bookingData.startTime),
        pet_name: 'My Pet', // Default pet name
        pet_type: 'Dog', // Default pet type
        service_type: 'Pet Sitting',
        duration: 3, // Default duration in hours
        rate_per_hour: bookingData.hourlyRate,
        description: 'Pet sitting service requested',
        is_weekly: false
      };

      console.log('📝 Sending booking to API:', bookingPayload);
      console.log('📝 Original date:', bookingData.date);
      console.log('📝 Formatted date:', formattedDate);
      console.log('📝 Date validation - is today or future:', formattedDate >= new Date().toISOString().split('T')[0]);
      console.log('📝 Today\'s date:', new Date().toISOString().split('T')[0]);
      console.log('📝 Date comparison details:');
      console.log('  - Input date:', bookingData.date);
      console.log('  - Parsed date:', new Date(bookingData.date));
      console.log('  - Today:', new Date());
      console.log('  - Is past?', new Date(bookingData.date) < new Date());

      const { makeApiCall } = await import('./networkService');
      const response = await makeApiCall('/api/bookings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingPayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API booking failed:', response.status, errorText);
        throw new Error(`API booking failed: ${response.status}`);
      }

      const apiResponse = await response.json();
      console.log('✅ API booking successful:', apiResponse);

      // Create local booking object with API response
      const newBooking: Booking = {
        ...bookingData,
        id: apiResponse.booking?.id?.toString() || Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Save to local storage as well
      const bookings = await this.getBookings();
      bookings.push(newBooking);
      await this.saveBookings(bookings);

      console.log('✅ Booking created successfully:', newBooking);
      return newBooking;

    } catch (error) {
      console.error('❌ Error creating booking:', error);
      
      // Fallback to local storage only
      const bookings = await this.getBookings();
      const newBooking: Booking = {
        ...bookingData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      bookings.push(newBooking);
      await this.saveBookings(bookings);
      
      console.log('⚠️ Booking saved locally only:', newBooking);
      return newBooking;
    }
  }

  async createWeeklyBooking(bookingData: Omit<WeeklyBooking, 'id' | 'createdAt' | 'updatedAt'>): Promise<WeeklyBooking> {
    console.log('📅 ===== CREATING WEEKLY BOOKING =====');
    console.log('📅 Creating new weekly booking with data:', bookingData);
    
    try {
      // First, save to database
      const user = await this.getCurrentUser();
      if (!user) {
        throw new Error('No user found');
      }

      const token = user.token;
      if (!token) {
        throw new Error('No authentication token available');
      }

      // Convert time to 24-hour format for backend
      const convertTo24Hour = (time12: string) => {
        if (!time12.includes('AM') && !time12.includes('PM')) {
          return time12;
        }
        
        const [time, period] = time12.split(' ');
        const [hours, minutes] = time.split(':');
        let hour24 = parseInt(hours, 10);
        
        if (period === 'PM' && hour24 !== 12) {
          hour24 += 12;
        } else if (period === 'AM' && hour24 === 12) {
          hour24 = 0;
        }
        
        return `${hour24.toString().padStart(2, '0')}:${minutes}`;
      };

      // Calculate total amount for weekly booking
      const calculateTotalAmount = () => {
        const startDate = new Date(bookingData.startDate);
        const endDate = new Date(bookingData.endDate);
        const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end dates
        
        // Calculate hours per day
        const startTime24 = convertTo24Hour(bookingData.startTime);
        const endTime24 = convertTo24Hour(bookingData.endTime);
        const [startHour, startMin] = startTime24.split(':').map(Number);
        const [endHour, endMin] = endTime24.split(':').map(Number);
        const hoursPerDay = (endHour + endMin/60) - (startHour + startMin/60);
        
        return daysDiff * hoursPerDay * bookingData.hourlyRate;
      };

      const totalAmount = calculateTotalAmount();

      const bookingPayload = {
        sitter_id: bookingData.sitterId,
        date: bookingData.startDate, // Use start date as primary date
        time: convertTo24Hour(bookingData.startTime),
        pet_name: 'My Pet', // Default pet name
        pet_type: 'Dog', // Default pet type
        service_type: 'Pet Sitting',
        duration: 3, // Default duration in hours
        rate_per_hour: bookingData.hourlyRate,
        description: 'Weekly pet sitting service requested',
        is_weekly: true,
        start_date: bookingData.startDate,
        end_date: bookingData.endDate,
        start_time: convertTo24Hour(bookingData.startTime),
        end_time: convertTo24Hour(bookingData.endTime),
        total_amount: totalAmount
      };

      console.log('📝 Sending weekly booking to API:', bookingPayload);
      console.log('📝 Calculated total amount:', totalAmount);
      console.log('📝 Time conversion - start:', convertTo24Hour(bookingData.startTime), 'end:', convertTo24Hour(bookingData.endTime));

      const { makeApiCall } = await import('./networkService');
      const response = await makeApiCall('/api/bookings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingPayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API weekly booking failed:', response.status, errorText);
        throw new Error(`API weekly booking failed: ${response.status}`);
      }

      const apiResponse = await response.json();
      console.log('✅ API weekly booking successful:', apiResponse);

      // Create weekly booking object with API response
      const newBooking: WeeklyBooking = {
        ...bookingData,
        id: apiResponse.booking?.id?.toString() || `weekly_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        totalAmount: totalAmount,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Save weekly booking to a separate storage key
      const weeklyBookings = await this.getWeeklyBookings();
      weeklyBookings.push(newBooking);
      await this.saveWeeklyBookings(weeklyBookings);

      // Also add to regular bookings for compatibility
      const regularBooking: Booking = {
        id: newBooking.id,
        sitterId: newBooking.sitterId,
        sitterName: newBooking.sitterName,
        petOwnerId: newBooking.petOwnerId,
        petOwnerName: newBooking.petOwnerName,
        date: newBooking.startDate, // Use start date as primary date
        startTime: newBooking.startTime,
        endTime: newBooking.endTime,
        hourlyRate: newBooking.hourlyRate,
        status: newBooking.status,
        isWeekly: true,
        startDate: newBooking.startDate,
        endDate: newBooking.endDate,
        totalAmount: newBooking.totalAmount,
        createdAt: newBooking.createdAt,
        updatedAt: newBooking.updatedAt,
      };

      const bookings = await this.getBookings();
      bookings.push(regularBooking);
      await this.saveBookings(bookings);

      console.log('✅ Weekly booking created successfully:', newBooking);
      return newBooking;

    } catch (error) {
      console.error('❌ Error creating weekly booking:', error);
      
      // Fallback to local storage only
      const newBooking: WeeklyBooking = {
        ...bookingData,
        id: `weekly_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Save weekly booking to a separate storage key
      const weeklyBookings = await this.getWeeklyBookings();
      weeklyBookings.push(newBooking);
      await this.saveWeeklyBookings(weeklyBookings);

      // Also add to regular bookings for compatibility
      const regularBooking: Booking = {
        id: newBooking.id,
        sitterId: newBooking.sitterId,
        sitterName: newBooking.sitterName,
        petOwnerId: newBooking.petOwnerId,
        petOwnerName: newBooking.petOwnerName,
        date: newBooking.startDate, // Use start date as primary date
        startTime: newBooking.startTime,
        endTime: newBooking.endTime,
        hourlyRate: newBooking.hourlyRate,
        status: newBooking.status,
        isWeekly: true,
        startDate: newBooking.startDate,
        endDate: newBooking.endDate,
        totalAmount: newBooking.totalAmount,
        createdAt: newBooking.createdAt,
        updatedAt: newBooking.updatedAt,
      };

      const bookings = await this.getBookings();
      bookings.push(regularBooking);
      await this.saveBookings(bookings);
      
      console.log('⚠️ Weekly booking saved locally only:', newBooking);
      return newBooking;
    }
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

  // Get weekly bookings
  async getWeeklyBookings(): Promise<WeeklyBooking[]> {
    try {
      const data = await AsyncStorage.getItem('weeklyBookings');
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading weekly bookings:', error);
      return [];
    }
  }

  // Save weekly bookings
  private async saveWeeklyBookings(bookings: WeeklyBooking[]) {
    try {
      await AsyncStorage.setItem('weeklyBookings', JSON.stringify(bookings));
    } catch (error) {
      console.error('Error saving weekly bookings:', error);
    }
  }
}

export const bookingService = BookingService.getInstance();