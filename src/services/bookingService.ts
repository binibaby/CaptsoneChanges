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
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'active';
  petName?: string;
  petImage?: string;
  specialInstructions?: string;
  createdAt: string;
  updatedAt: string;
  isWeekly?: boolean;
  startDate?: string;
  endDate?: string;
  totalAmount?: number;
  duration?: number;
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
  private pendingApiCall: Promise<Booking[]> | null = null;
  private cachedEarnings: { [sitterId: string]: { data: any, expiry: number } } = {};
  private earningsCacheDurationMs: number = 10000; // 10 second cache for earnings

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
    
    // Clear earnings cache when bookings change
    this.clearEarningsCache();
  }

  // Clear earnings cache
  private clearEarningsCache() {
    console.log('🧹 Clearing earnings cache');
    this.cachedEarnings = {};
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
      this.notifyListeners([]);
      
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
      this.notifyListeners([]);
      
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
        const bookings = await this.pendingApiCall;
        // Return the already processed bookings
        return bookings;
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
        } else if (user.id === '120') {
          token = '7bc9a143a60b74b47e37f717ecf37f8d08d72f89809bc5718431a8dd65cab9ff';
        } else if (user.id === '121') {
          token = '616|Mh2WHZIp1aFUXtMKiilSU84KTP3Snege7zRjE2bM00a52108';
        } else {
          console.log('❌ No token available for user:', user.id);
          return [];
        }
      }

      console.log('🔑 Fetching bookings from API for user:', user.id);

      // Create the pending API call that processes the response
      this.pendingApiCall = this.makeApiCall(user.id, token).then(async (response) => {
        return await this.processApiResponse(response);
      });
      
      const bookings = await this.pendingApiCall;
      
      // Clear the pending call
      this.pendingApiCall = null;

      return bookings;
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
      // Clone the response to avoid "Already read" error
      const responseClone = response.clone();
      const data = await responseClone.json();
      console.log('📅 API bookings response:', data);
      
      if (data.success && data.bookings) {
        console.log('🔍 API booking fields available:', data.bookings.length > 0 ? Object.keys(data.bookings[0]) : 'No bookings');
        console.log('🔍 First API booking sample:', data.bookings[0]);
        
        // Convert API format to local format
        const bookings: Booking[] = data.bookings.map((apiBooking: any) => {
          const hourlyRate = parseFloat(apiBooking.hourly_rate) || parseFloat(apiBooking.hourlyRate) || 0;
          const totalAmount = parseFloat(apiBooking.total_amount) || 0;
          const duration = parseInt(apiBooking.duration) || 3;
          
          // Calculate start and end times
          let startTime = '09:00';
          let endTime = '17:00';
          
          if (apiBooking.start_time && apiBooking.end_time) {
            // Use provided start/end times
            startTime = apiBooking.start_time;
            endTime = apiBooking.end_time;
          } else if (apiBooking.time) {
            // Parse from time field (format: "2025-10-08 07:00:00")
            const timeDate = new Date(apiBooking.time);
            const hours = timeDate.getHours().toString().padStart(2, '0');
            const minutes = timeDate.getMinutes().toString().padStart(2, '0');
            startTime = `${hours}:${minutes}`;
            
            // Calculate end time based on duration
            const endDate = new Date(timeDate.getTime() + (duration * 60 * 60 * 1000));
            const endHours = endDate.getHours().toString().padStart(2, '0');
            const endMinutes = endDate.getMinutes().toString().padStart(2, '0');
            endTime = `${endHours}:${endMinutes}`;
          }
          
          console.log(`💰 Booking ${apiBooking.id} details:`, {
            hourly_rate: apiBooking.hourly_rate,
            total_amount: apiBooking.total_amount,
            duration: apiBooking.duration,
            startTime,
            endTime,
            calculatedEarnings: duration * hourlyRate
          });
          
          return {
            id: apiBooking.id.toString(),
            sitterId: apiBooking.pet_sitter.id.toString(),
            sitterName: apiBooking.pet_sitter.name,
            petOwnerId: apiBooking.pet_owner.id.toString(),
            petOwnerName: apiBooking.pet_owner.name,
            date: apiBooking.date,
            startTime,
            endTime,
            hourlyRate: hourlyRate,
            status: apiBooking.status,
            createdAt: apiBooking.created_at,
            updatedAt: apiBooking.created_at,
            petName: apiBooking.pet_name,
            totalAmount: totalAmount,
            duration: duration,
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
        console.log('📅 formatDateForAPI input:', dateString);
        
        // Parse the date string directly as YYYY-MM-DD format to avoid timezone issues
        const dateMatch = dateString.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (dateMatch) {
          const [, year, month, day] = dateMatch;
          // Create date in local timezone to avoid timezone conversion issues
          const localDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          const formattedDate = `${year}-${month}-${day}`;
          console.log('📅 Parsed date from YYYY-MM-DD (local):', formattedDate);
          return formattedDate;
        }
        
        // Fallback: try to extract YYYY-MM-DD from any date string
        const isoMatch = dateString.match(/(\d{4}-\d{2}-\d{2})/);
        if (isoMatch) {
          const formattedDate = isoMatch[1];
          console.log('📅 Extracted YYYY-MM-DD from string:', formattedDate);
          return formattedDate;
        }
        
        // Last resort: parse as date and format
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
          console.log('⚠️ Invalid date format, using today\'s date instead');
          const today = new Date();
          return today.toISOString().split('T')[0];
        }
        
        // Format as YYYY-MM-DD in local timezone
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const formattedDate = `${year}-${month}-${day}`;
        
        console.log('📅 Date formatting result:', {
          inputDate: dateString,
          parsedDate: date.toISOString(),
          formattedDate: formattedDate
        });
        
        return formattedDate;
      };

      const formattedDate = formatDateForAPI(bookingData.date);

      // Calculate duration in hours from start and end times
      const calculateDurationInHours = (startTime: string, endTime: string): number => {
        // Convert 12-hour format to 24-hour format and then to minutes
        const convertToMinutes = (timeStr: string): number => {
          // Handle both 12-hour (AM/PM) and 24-hour formats
          if (timeStr.includes('AM') || timeStr.includes('PM')) {
            const [time, period] = timeStr.split(' ');
            const [hours, minutes] = time.split(':');
            let hour24 = parseInt(hours, 10);
            
            if (period === 'PM' && hour24 !== 12) {
              hour24 += 12;
            } else if (period === 'AM' && hour24 === 12) {
              hour24 = 0;
            }
            
            return hour24 * 60 + parseInt(minutes || '0', 10);
          } else {
            // Already in 24-hour format
            const [hours, minutes] = timeStr.split(':');
            return parseInt(hours, 10) * 60 + parseInt(minutes || '0', 10);
          }
        };

        const startTimeMinutes = convertToMinutes(startTime);
        const endTimeMinutes = convertToMinutes(endTime);
        let durationMinutes = endTimeMinutes - startTimeMinutes;
        
        // Handle overnight bookings (end time is next day)
        if (durationMinutes < 0) {
          durationMinutes += 24 * 60; // Add 24 hours
        }
        
        const durationHours = durationMinutes / 60;
        console.log('🕐 Duration calculation:', {
          startTime,
          endTime,
          startTimeMinutes,
          endTimeMinutes,
          durationMinutes,
          durationHours
        });
        
        return durationHours;
      };

      const durationInHours = calculateDurationInHours(bookingData.startTime, bookingData.endTime);

      const bookingPayload = {
        sitter_id: bookingData.sitterId,
        date: formattedDate,
        time: convertTo24Hour(bookingData.startTime),
        start_time: convertTo24Hour(bookingData.startTime),
        end_time: convertTo24Hour(bookingData.endTime),
        pet_name: 'My Pet', // Default pet name
        pet_type: 'Dog', // Default pet type
        service_type: 'Pet Sitting',
        duration: Math.round(durationInHours * 100) / 100, // Duration in hours, rounded to 2 decimal places
        rate_per_hour: bookingData.hourlyRate,
        description: 'Pet sitting service requested',
        is_weekly: false
      };

      console.log('📝 Sending booking to API:', bookingPayload);
      console.log('📝 Original booking data:', {
        date: bookingData.date,
        startTime: bookingData.startTime,
        endTime: bookingData.endTime,
        sitterId: bookingData.sitterId
      });
      console.log('📝 Formatted date:', formattedDate);
      console.log('📝 Converted times:', {
        startTime: convertTo24Hour(bookingData.startTime),
        endTime: convertTo24Hour(bookingData.endTime)
      });
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
    
    const now = new Date();
    console.log('📅 Current time:', now.toISOString());

    // Helper function to check if booking is upcoming (future schedule)
    const isBookingUpcoming = (booking: any) => {
      // Include only confirmed and pending bookings that are in the future
      // 'active' bookings should only appear after sitter manually starts the session
      if (booking.status !== 'confirmed' && booking.status !== 'pending') return false;
      
      const bookingDate = new Date(booking.date);
      const startTime = booking.startTime || booking.start_time || booking.time;
      
      if (startTime) {
        // Parse time and create full datetime
        const [hours, minutes] = startTime.split(':');
        const fullDateTime = new Date(bookingDate);
        fullDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        
        // Use a more lenient comparison - consider bookings as upcoming if they're today or future
        // and not yet started (not active status)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const bookingDay = new Date(bookingDate);
        bookingDay.setHours(0, 0, 0, 0);
        
        const isTodayOrFuture = bookingDay >= today;
        const isNotStarted = booking.status !== 'active';
        
        console.log(`  - ${booking.date} ${startTime} (${booking.status}): isTodayOrFuture=${isTodayOrFuture}, isNotStarted=${isNotStarted}`);
        return isTodayOrFuture && isNotStarted;
      }
      
      // If no time, just check if date is today or future
      bookingDate.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      console.log(`  - ${booking.date} (${booking.status}): ${bookingDate.toISOString()} >= ${today.toISOString()} = ${bookingDate >= today}`);
      return bookingDate >= today;
    };

    // Filter upcoming bookings
    const upcoming = sitterBookings.filter(isBookingUpcoming)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
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
    // Only include 'completed' bookings - 'active' bookings are still in progress
    return sitterBookings.filter(b => b.status === 'completed');
  }

  // Get active bookings for a sitter (sessions in progress)
  async getActiveSitterBookings(sitterId: string): Promise<Booking[]> {
    const sitterBookings = await this.getSitterBookings(sitterId);
    return sitterBookings.filter(b => b.status === 'active');
  }

  // Calculate total earnings for a sitter
  async getSitterEarnings(sitterId: string): Promise<{
    thisWeek: number;
    thisMonth: number;
    total: number;
    completedJobs: number;
  }> {
    // Check cache first
    const now = Date.now();
    const cached = this.cachedEarnings[sitterId];
    if (cached && now < cached.expiry) {
      console.log('💰 Using cached earnings for sitter:', sitterId);
      return cached.data;
    }

    console.log('💰 Calculating fresh earnings for sitter:', sitterId);
    const completedBookings = await this.getCompletedSitterBookings(sitterId);
    const activeBookings = await this.getActiveSitterBookings(sitterId);
    const allEarningBookings = [...completedBookings, ...activeBookings];
    console.log('💰 getSitterEarnings - Found completed bookings:', completedBookings.length);
    console.log('💰 getSitterEarnings - Found active bookings:', activeBookings.length);
    allEarningBookings.forEach(booking => {
      console.log(`  - Booking ${booking.id}: Status=${booking.status}, Amount=${booking.totalAmount || 'N/A'}, HourlyRate=${booking.hourlyRate}`);
    });
    
    const currentDate = new Date();
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

    const thisWeekBookings = allEarningBookings.filter(b => {
      const bookingDate = new Date(b.date);
      return bookingDate >= startOfWeek;
    });

    const thisMonthBookings = allEarningBookings.filter(b => {
      const bookingDate = new Date(b.date);
      return bookingDate >= startOfMonth;
    });

    const calculateEarnings = (bookings: Booking[]) => {
      console.log('💰 calculateEarnings - Processing bookings:', bookings.length);
      return bookings.reduce((total, booking) => {
        // Use totalAmount if available, otherwise calculate from duration × hourlyRate
        const bookingEarnings = booking.totalAmount || ((booking.duration || 3) * booking.hourlyRate);
        const safeEarnings = typeof bookingEarnings === 'number' ? bookingEarnings : 0;
        // Apply 90% sitter commission (same as dashboardService)
        const sitterEarnings = safeEarnings * 0.9;
        console.log(`  - Booking ${booking.id}: Status=${booking.status}, TotalAmount=${booking.totalAmount}, Duration=${booking.duration || 3}, HourlyRate=${booking.hourlyRate}, RawEarnings=${safeEarnings}, SitterEarnings=${sitterEarnings}`);
        return total + sitterEarnings;
      }, 0);
    };

    // Get wallet balance to include in total earnings
    let walletBalance = 0;
    try {
      const { makeApiCall } = await import('./networkService');
      const user = await this.getCurrentUser();
      if (user?.token) {
        const walletResponse = await makeApiCall('/api/wallet', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${user.token}`,
          },
        });
        if (walletResponse.ok) {
          const walletData = await walletResponse.json();
          walletBalance = parseFloat(walletData.balance) || 0;
          console.log('💰 Wallet balance found:', walletBalance, 'Type:', typeof walletBalance);
        }
      }
    } catch (error) {
      console.log('💰 Could not fetch wallet balance:', error);
    }

    const calculatedEarnings = {
      thisWeek: calculateEarnings(thisWeekBookings),
      thisMonth: calculateEarnings(thisMonthBookings),
      total: calculateEarnings(allEarningBookings),
      completedJobs: allEarningBookings.length,
    };

    // Ensure walletBalance is a number
    const safeWalletBalance = typeof walletBalance === 'number' ? walletBalance : 0;
    
    // If no earnings from bookings but wallet has balance, use wallet balance (consistent with dashboardService)
    const earningsData = {
      thisWeek: calculatedEarnings.thisWeek === 0 && safeWalletBalance > 0 ? safeWalletBalance : calculatedEarnings.thisWeek,
      thisMonth: calculatedEarnings.thisMonth === 0 && safeWalletBalance > 0 ? safeWalletBalance : calculatedEarnings.thisMonth,
      total: calculatedEarnings.total === 0 && safeWalletBalance > 0 ? safeWalletBalance : calculatedEarnings.total,
      completedJobs: calculatedEarnings.completedJobs,
    };

    console.log('💰 Final earnings calculation:', {
      calculated: calculatedEarnings,
      walletBalance,
      final: earningsData
    });

    // Cache the results
    this.cachedEarnings[sitterId] = {
      data: earningsData,
      expiry: now + this.earningsCacheDurationMs
    };

    console.log('💰 Cached earnings for sitter:', sitterId, earningsData);
    return earningsData;
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

  /**
   * Auto-complete sessions that have ended
   */
  async autoCompleteSessions(): Promise<{ success: boolean; completed_count: number }> {
    try {
      const { makeApiCall } = await import('./networkService');
      const authService = (await import('./authService')).default;
      const user = await authService.getCurrentUser();
      const token = user?.token;
      
      if (!token) {
        throw new Error('No authentication token available');
      }

      const response = await makeApiCall('/api/bookings/auto-complete', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to auto-complete sessions');
      }

      const data = await response.json();
      console.log('✅ Auto-completed sessions:', data);
      return data;
    } catch (error) {
      console.error('Error auto-completing sessions:', error);
      return { success: false, completed_count: 0 };
    }
  }
}

export const bookingService = BookingService.getInstance();