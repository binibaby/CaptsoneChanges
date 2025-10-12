import { bookingService } from './bookingService';
import { makeApiCall } from './networkService';
import { paymentService } from './paymentService';

export interface DashboardMetrics {
  totalSpent?: number;
  totalIncome?: number;
  activeBookings?: number;
  upcomingBookings?: number;
  completedJobs?: number;
  thisWeekSpent?: number;
  thisWeekIncome?: number;
  walletBalance?: number;
}

export interface Booking {
  id: number;
  user_id: number;
  sitter_id: number;
  date: string;
  start_time: string;
  end_time: string;
  status: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled';
  hourly_rate: number;
  total_amount: number;
  pet_name: string;
  pet_type: string;
  service_type: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

class DashboardService {
  private metrics: DashboardMetrics = {};
  private listeners: ((metrics: DashboardMetrics) => void)[] = [];
  private isListening = false;
  private cacheExpiry = 0;
  private cacheDuration = 30000; // 30 seconds cache

  /**
   * Clear cache to force fresh data
   */
  clearCache(): void {
    this.cacheExpiry = 0;
    this.metrics = {};
    console.log('🧹 Dashboard service cache cleared');
  }

  /**
   * Get dashboard metrics for pet owners
   */
  async getOwnerMetrics(userId: string): Promise<DashboardMetrics> {
    try {
      const [bookingsResponse, paymentsResponse] = await Promise.all([
        makeApiCall('/bookings', { method: 'GET' }),
        makeApiCall('/payments/history', { method: 'GET' }),
      ]);

      if (!bookingsResponse || !bookingsResponse.ok) {
        console.error('❌ Bookings API call failed:', bookingsResponse);
        return { activeBookings: 0, upcomingBookings: 0, totalSpent: 0, thisWeekSpent: 0 };
      }

      if (!paymentsResponse || !paymentsResponse.ok) {
        console.error('❌ Payments API call failed:', paymentsResponse);
        return { activeBookings: 0, upcomingBookings: 0, totalSpent: 0, thisWeekSpent: 0 };
      }

      const bookingsData = await bookingsResponse.json();
      const paymentsData = await paymentsResponse.json();
      
      const bookings: Booking[] = bookingsData.bookings || [];
      const payments = paymentsData.data || [];
      
      // Filter bookings for the specific user
      const userBookings = bookings.filter((booking: any) => {
        // Check multiple possible field names for user ID
        const isUserBooking = 
          booking.pet_owner_id === userId || 
          booking.petOwnerId === userId ||
          booking.user_id === userId ||
          booking.pet_owner?.id === userId ||
          booking.pet_owner?.user_id === userId ||
          booking.user?.id === userId;
        
        console.log(`🔍 Dashboard Service - Checking if booking ${booking.id} belongs to user ${userId}:`, {
          pet_owner_id: booking.pet_owner_id,
          petOwnerId: booking.petOwnerId,
          user_id: booking.user_id,
          pet_owner: booking.pet_owner,
          user: booking.user,
          userId: userId,
          isUserBooking
        });
        return isUserBooking;
      });
      
      console.log('🔍 Owner metrics - Total bookings:', bookings.length);
      console.log('🔍 Owner metrics - User bookings for user', userId, ':', userBookings.length);
      console.log('🔍 Owner metrics - User bookings details:', userBookings.map(b => ({
        id: b.id,
        status: b.status,
        date: b.date,
        pet_owner_id: b.pet_owner_id,
        petOwnerId: b.petOwnerId
      })));

      // Calculate metrics - include all successfully paid bookings (both completed and active)
      // A booking is considered paid if it has status 'active' or 'completed'
      const totalSpent = userBookings
        .filter((b: any) => b.status === 'active' || b.status === 'completed')
        .reduce((sum: number, b: any) => sum + b.total_amount, 0);

      // Helper function to check if booking is currently active (within time range)
      const isBookingActive = (booking: any) => {
        if (booking.status !== 'active' && booking.status !== 'confirmed') return false;
        
        const now = new Date();
        const bookingDate = new Date(booking.date);
        const startTime = booking.start_time || booking.time;
        const endTime = booking.end_time;
        
        if (startTime) {
          // Parse start time and create full datetime
          const [startHours, startMinutes] = startTime.split(':');
          const startDateTime = new Date(bookingDate);
          startDateTime.setHours(parseInt(startHours), parseInt(startMinutes), 0, 0);
          
          // If we have end time, use it; otherwise calculate from duration
          let endDateTime;
          if (endTime) {
            const [endHours, endMinutes] = endTime.split(':');
            endDateTime = new Date(bookingDate);
            endDateTime.setHours(parseInt(endHours), parseInt(endMinutes), 0, 0);
          } else {
            // Calculate end time from duration (default 8 hours if no duration)
            endDateTime = new Date(startDateTime);
            endDateTime.setHours(endDateTime.getHours() + (booking.duration || 8));
          }
          
          // Check if current time is within the booking time range
          return now >= startDateTime && now <= endDateTime;
        }
        
        return false;
      };

      // Helper function to check if booking is upcoming (future schedule)
      const isBookingUpcoming = (booking: any) => {
        // Include confirmed, pending, and active bookings that are in the future
        // 'active' means payment is successful but job hasn't started yet
        if (booking.status === 'completed' || booking.status === 'cancelled' || booking.status === 'active') {
          console.log(`  - ${booking.date} (${booking.status}): excluded status`);
          return false;
        }
        
        const now = new Date();
        const bookingDate = new Date(booking.date);
        const startTime = booking.start_time || booking.time;
        
        if (startTime) {
          // Parse time and create full datetime
          const [hours, minutes] = startTime.split(':');
          const fullDateTime = new Date(bookingDate);
          fullDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
          
          // Use a more lenient comparison - consider bookings as upcoming if they're today or future
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
        
        return bookingDate >= today;
      };

      // Use the same filtering logic as My Bookings screen
      const activeBookings = userBookings.filter((booking: any) => booking.status === 'active').length;
      const upcomingBookings = userBookings.filter((booking: any) => 
        booking.status !== 'completed' && 
        booking.status !== 'cancelled' && 
        booking.status !== 'active'
      ).length;
      
      console.log('🔍 Owner metrics - Active bookings count:', activeBookings);
      console.log('🔍 Owner metrics - Upcoming bookings count:', upcomingBookings);
      console.log('🔍 Owner metrics - Active bookings details:', userBookings.filter(b => b.status === 'active').map(b => ({ id: b.id, status: b.status, date: b.date })));
      console.log('🔍 Owner metrics - Upcoming bookings details:', userBookings.filter(b => 
        b.status !== 'completed' && 
        b.status !== 'cancelled' && 
        b.status !== 'active'
      ).map(b => ({ id: b.id, status: b.status, date: b.date })));
      
      console.log('📊 Owner metrics calculation:', {
        totalBookings: bookings.length,
        activeBookings: activeBookings,
        upcomingBookings: upcomingBookings,
        upcomingBookingIds: userBookings.filter((booking: any) => 
          booking.status !== 'completed' && 
          booking.status !== 'cancelled' && 
          booking.status !== 'active'
        ).map(b => b.id)
      });

      // Calculate this week's spending
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const thisWeekSpent = bookings
        .filter((b: any) => 
          (b.status === 'active' || b.status === 'completed') && 
          new Date(b.created_at) >= oneWeekAgo
        )
        .reduce((sum: number, b: any) => sum + b.total_amount, 0);

      this.metrics = {
        totalSpent,
        activeBookings,
        upcomingBookings,
        thisWeekSpent,
      };

      this.notifyListeners();
      return this.metrics;
    } catch (error) {
      console.error('Error getting owner metrics:', error);
      throw error;
    }
  }

  /**
   * Get dashboard metrics for pet sitters
   */
  async getSitterMetrics(userId: string): Promise<DashboardMetrics> {
    try {
      const [bookingsResponse, walletResponse] = await Promise.all([
        makeApiCall('/bookings', { method: 'GET' }),
        makeApiCall('/wallet', { method: 'GET' }),
      ]);

      if (!bookingsResponse || !bookingsResponse.ok) {
        console.error('❌ Bookings API call failed:', bookingsResponse);
        return { activeBookings: 0, upcomingBookings: 0, totalSpent: 0, thisWeekSpent: 0 };
      }

      if (!walletResponse || !walletResponse.ok) {
        console.error('❌ Wallet API call failed:', walletResponse);
        return { activeBookings: 0, upcomingBookings: 0, totalSpent: 0, thisWeekSpent: 0 };
      }

      // Parse API responses correctly
      const bookingsData = await bookingsResponse.json();
      const walletData = await walletResponse.json();
      
      const bookings: Booking[] = bookingsData.bookings || bookingsData.data || [];
      
      console.log('📊 DashboardService - API responses:', {
        bookingsCount: bookings.length,
        walletBalance: walletData.balance,
        bookingsData: bookingsData,
        walletData: walletData
      });

      // Helper function to check if booking is currently active (within time range)
      const isBookingActive = (booking: any) => {
        if (booking.status !== 'active' && booking.status !== 'confirmed') return false;
        
        const now = new Date();
        const bookingDate = new Date(booking.date);
        const startTime = booking.start_time || booking.time;
        const endTime = booking.end_time;
        
        if (startTime) {
          // Parse start time and create full datetime
          const [startHours, startMinutes] = startTime.split(':');
          const startDateTime = new Date(bookingDate);
          startDateTime.setHours(parseInt(startHours), parseInt(startMinutes), 0, 0);
          
          // If we have end time, use it; otherwise calculate from duration
          let endDateTime;
          if (endTime) {
            const [endHours, endMinutes] = endTime.split(':');
            endDateTime = new Date(bookingDate);
            endDateTime.setHours(parseInt(endHours), parseInt(endMinutes), 0, 0);
          } else {
            // Calculate end time from duration (default 8 hours if no duration)
            endDateTime = new Date(startDateTime);
            endDateTime.setHours(endDateTime.getHours() + (booking.duration || 8));
          }
          
          // Check if current time is within the booking time range
          return now >= startDateTime && now <= endDateTime;
        }
        
        return false;
      };

      // Helper function to check if booking is upcoming (future schedule)
      const isBookingUpcoming = (booking: any) => {
        // Include confirmed, pending, and active bookings that are in the future
        // 'active' means payment is successful but job hasn't started yet
        if (booking.status === 'completed' || booking.status === 'cancelled' || booking.status === 'active') {
          console.log(`  - ${booking.date} (${booking.status}): excluded status`);
          return false;
        }
        
        const now = new Date();
        const bookingDate = new Date(booking.date);
        const startTime = booking.start_time || booking.time;
        
        if (startTime) {
          // Parse time and create full datetime
          const [hours, minutes] = startTime.split(':');
          const fullDateTime = new Date(bookingDate);
          fullDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
          
          // Use a more lenient comparison - consider bookings as upcoming if they're today or future
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
        
        return bookingDate >= today;
      };

      // Helper function to check if booking is actually completed (finished)
      const isBookingCompleted = (booking: any) => {
        // Only consider bookings that are marked as completed AND have actually finished
        // Note: 'active' status means payment is successful but job is not yet completed
        if (booking.status !== 'completed') {
          console.log(`📅 Booking ${booking.id} not completed: status is ${booking.status}, not 'completed'`);
          return false;
        }
        
        // Additional check: Only count as completed if the session has actually ended
        // This prevents counting bookings that are marked as 'completed' but still ongoing
        
        const now = new Date();
        const bookingDate = new Date(booking.date);
        
        // Check if the booking date is in the past
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        bookingDate.setHours(0, 0, 0, 0);
        
        // If booking date is in the future, it can't be completed yet
        if (bookingDate > today) {
          console.log(`📅 Booking ${booking.id} is in the future (${booking.date}), not completed yet`);
          return false;
        }
        
        // Additional check: if booking date is today, check if the job has actually finished
        if (bookingDate.getTime() === today.getTime()) {
          const startTime = booking.start_time || booking.startTime || booking.time;
          if (startTime) {
            const [hours, minutes] = startTime.split(':');
            const startDateTime = new Date(bookingDate);
            startDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
            
            // If the job hasn't started yet today, it can't be completed
            if (now < startDateTime) {
              console.log(`📅 Booking ${booking.id} hasn't started yet today (${startDateTime.toISOString()}), not completed yet`);
              return false;
            }
          }
        }
        
        const endTime = booking.end_time || booking.endTime;
        
        if (endTime) {
          // Parse end time and create full datetime
          const [hours, minutes] = endTime.split(':');
          const endDateTime = new Date(booking.date);
          endDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
          
          // Only consider completed if the end time has passed
          const isFinished = now > endDateTime;
          console.log(`📅 Booking ${booking.id} end time check: ${endDateTime.toISOString()} vs ${now.toISOString()} = ${isFinished}`);
          return isFinished;
        } else {
          // If no end time, calculate from start time + duration
          const startTime = booking.start_time || booking.startTime || booking.time;
          if (startTime) {
            const [hours, minutes] = startTime.split(':');
            const startDateTime = new Date(booking.date);
            startDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
            
            // Add duration (default 8 hours if no duration)
            const endDateTime = new Date(startDateTime);
            endDateTime.setHours(endDateTime.getHours() + (booking.duration || 8));
            
            const isFinished = now > endDateTime;
            console.log(`📅 Booking ${booking.id} calculated end time check: ${endDateTime.toISOString()} vs ${now.toISOString()} = ${isFinished}`);
            return isFinished;
          }
        }
        
        return false;
      };

      // Use the same methods as My Schedule screen for consistency
      const completedBookings = await bookingService.getCompletedSitterBookings(userId);
      const upcomingBookings = await bookingService.getUpcomingSitterBookings(userId);
      const activeBookings = await bookingService.getActiveSitterBookings(userId);
      
      console.log('📊 Booking counts:', {
        total: bookings.length,
        completed: completedBookings.length,
        upcoming: upcomingBookings.length,
        active: activeBookings.length
      });
      
      console.log('📊 Sitter metrics calculation:', {
        totalBookings: bookings.length,
        completedJobs: completedBookings.length,
        upcomingJobs: upcomingBookings.length,
        completedBookingIds: completedBookings.map(b => b.id),
        upcomingBookingIds: upcomingBookings.map(b => b.id)
      });
      
      // Debug: Show all bookings and their statuses
      console.log('📋 All sitter bookings status check:');
      bookings.forEach(booking => {
        console.log(`  - Booking ${booking.id}: status=${booking.status}, date=${booking.date}, start_time=${booking.start_time || booking.time}`);
      });
      
      const completedJobs = completedBookings.length;

      // Use wallet balance as the source of truth for total income
      // This ensures e-wallet and total income container always match
      let totalIncome = parseFloat(walletData.balance) || 0;
      
      console.log('💰 Using wallet balance as total income:', totalIncome);
      console.log('💰 Wallet data received:', walletData);

      // Calculate this week's income from recent wallet transactions
      // This is a simplified approach - in a real app, you'd track transaction dates
      let thisWeekIncome = parseFloat(walletData.balance) || 0;
      
      console.log('💰 Using wallet balance as this week income:', thisWeekIncome);

      this.metrics = {
        totalIncome: totalIncome || 0,
        completedJobs: completedJobs || 0,
        upcomingBookings: upcomingBookings.length || 0,
        activeBookings: activeBookings.length || 0,
        thisWeekIncome: thisWeekIncome || 0,
        walletBalance: parseFloat(walletData.balance) || 0,
      };

      this.notifyListeners();
      return this.metrics;
    } catch (error) {
      console.error('Error getting sitter metrics:', error);
      
      // Return default metrics on error to prevent undefined values
      this.metrics = {
        totalIncome: 0,
        completedJobs: 0,
        upcomingBookings: 0,
        activeBookings: 0,
        thisWeekIncome: 0,
        walletBalance: 0,
      };
      
      this.notifyListeners();
      return this.metrics;
    }
  }

  /**
   * Subscribe to dashboard updates
   */
  subscribe(listener: (metrics: DashboardMetrics) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify all listeners of metric updates
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.metrics);
      } catch (error) {
        console.error('Error notifying dashboard listener:', error);
      }
    });
  }

  /**
   * Update metrics manually (for real-time updates)
   */
  updateMetrics(updates: Partial<DashboardMetrics>): void {
    this.metrics = { ...this.metrics, ...updates };
    this.notifyListeners();
  }

  /**
   * Get current metrics
   */
  getCurrentMetrics(): DashboardMetrics {
    return { ...this.metrics };
  }

  /**
   * Format currency for display
   */
  formatCurrency(amount: number): string {
    return paymentService.formatCurrency(amount);
  }

  /**
   * Handle payment received event
   */
  onPaymentReceived(paymentData: any): void {
    // Update sitter metrics
    if (this.metrics.walletBalance !== undefined) {
      this.metrics.walletBalance += paymentData.sitter_share;
    }
    
    if (this.metrics.totalIncome !== undefined) {
      this.metrics.totalIncome += paymentData.sitter_share;
    }

    // Update this week's income if payment is from this week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    if (new Date(paymentData.created_at) >= oneWeekAgo) {
      if (this.metrics.thisWeekIncome !== undefined) {
        this.metrics.thisWeekIncome += paymentData.sitter_share;
      }
    }

    this.notifyListeners();
  }

  /**
   * Handle wallet updated event
   */
  onWalletUpdated(walletBalance: number): void {
    this.metrics.walletBalance = walletBalance;
    this.notifyListeners();
  }

  /**
   * Handle booking status change
   */
  onBookingStatusChanged(booking: Booking, oldStatus: string, newStatus: string): void {
    // Update active bookings count
    if (newStatus === 'active' && oldStatus !== 'active') {
      if (this.metrics.activeBookings !== undefined) {
        this.metrics.activeBookings += 1;
      }
    } else if (oldStatus === 'active' && newStatus !== 'active') {
      if (this.metrics.activeBookings !== undefined) {
        this.metrics.activeBookings = Math.max(0, this.metrics.activeBookings - 1);
      }
    }

    // Update completed jobs count
    if (newStatus === 'completed' && oldStatus !== 'completed') {
      if (this.metrics.completedJobs !== undefined) {
        this.metrics.completedJobs += 1;
      }
    } else if (oldStatus === 'completed' && newStatus !== 'completed') {
      if (this.metrics.completedJobs !== undefined) {
        this.metrics.completedJobs = Math.max(0, this.metrics.completedJobs - 1);
      }
    }

    // Update upcoming bookings count
    if (newStatus === 'confirmed' && oldStatus !== 'confirmed') {
      if (this.metrics.upcomingBookings !== undefined) {
        this.metrics.upcomingBookings += 1;
      }
    } else if (oldStatus === 'confirmed' && newStatus !== 'confirmed') {
      if (this.metrics.upcomingBookings !== undefined) {
        this.metrics.upcomingBookings = Math.max(0, this.metrics.upcomingBookings - 1);
      }
    }

    this.notifyListeners();
  }

  /**
   * Handle payment completed event (for owners)
   */
  onPaymentCompleted(paymentData: any): void {
    // Update owner metrics - use booking total amount instead of payment amount
    if (this.metrics.totalSpent !== undefined && paymentData.booking) {
      this.metrics.totalSpent += paymentData.booking.total_amount;
    }

    // Update this week's spending if payment is from this week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    if (new Date(paymentData.created_at) >= oneWeekAgo) {
      if (this.metrics.thisWeekSpent !== undefined && paymentData.booking) {
        this.metrics.thisWeekSpent += paymentData.booking.total_amount;
      }
    }

    this.notifyListeners();
  }
}

export const dashboardService = new DashboardService();
