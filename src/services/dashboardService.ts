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

  /**
   * Get dashboard metrics for pet owners
   */
  async getOwnerMetrics(): Promise<DashboardMetrics> {
    try {
      const [bookingsResponse, paymentsResponse] = await Promise.all([
        makeApiCall('/bookings', { method: 'GET' }),
        makeApiCall('/payments/history', { method: 'GET' }),
      ]);

      const bookings: Booking[] = bookingsResponse.data || [];
      const payments = paymentsResponse.data || [];

      // Calculate metrics
      const totalSpent = payments
        .filter((p: any) => p.status === 'completed')
        .reduce((sum: number, p: any) => sum + p.amount, 0);

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
        if (booking.status !== 'confirmed' && booking.status !== 'pending' && booking.status !== 'active') return false;
        
        const now = new Date();
        const bookingDate = new Date(booking.date);
        const startTime = booking.start_time || booking.time;
        
        if (startTime) {
          // Parse time and create full datetime
          const [hours, minutes] = startTime.split(':');
          const fullDateTime = new Date(bookingDate);
          fullDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
          
          return fullDateTime > now;
        }
        
        // If no time, just check if date is today or future
        bookingDate.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        return bookingDate >= today;
      };

      const activeBookings = bookings.filter(isBookingActive).length;
      const upcomingBookings = bookings.filter(isBookingUpcoming).length;
      
      console.log('📊 Owner metrics calculation:', {
        totalBookings: bookings.length,
        activeBookings: activeBookings,
        upcomingBookings: upcomingBookings,
        upcomingBookingIds: bookings.filter(isBookingUpcoming).map(b => b.id)
      });

      // Calculate this week's spending
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const thisWeekSpent = payments
        .filter((p: any) => 
          p.status === 'completed' && 
          new Date(p.created_at) >= oneWeekAgo
        )
        .reduce((sum: number, p: any) => sum + p.amount, 0);

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
  async getSitterMetrics(): Promise<DashboardMetrics> {
    try {
      const [bookingsResponse, walletResponse] = await Promise.all([
        makeApiCall('/bookings', { method: 'GET' }),
        makeApiCall('/wallet', { method: 'GET' }),
      ]);

      const bookings: Booking[] = bookingsResponse.data || [];
      const walletData = walletResponse;

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
        if (booking.status !== 'confirmed' && booking.status !== 'pending' && booking.status !== 'active') return false;
        
        const now = new Date();
        const bookingDate = new Date(booking.date);
        const startTime = booking.start_time || booking.time;
        
        if (startTime) {
          // Parse time and create full datetime
          const [hours, minutes] = startTime.split(':');
          const fullDateTime = new Date(bookingDate);
          fullDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
          
          return fullDateTime > now;
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

      // Calculate metrics with debugging
      const completedBookings = bookings.filter(isBookingCompleted);
      const upcomingBookings = bookings.filter(isBookingUpcoming);
      
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

      // Calculate total income from completed and active bookings (both are paid)
      const totalIncome = bookings
        .filter(b => b.status === 'completed' || b.status === 'active')
        .reduce((sum, b) => sum + (b.total_amount * 0.9), 0); // 90% to sitter

      // Calculate this week's income
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const thisWeekIncome = bookings
        .filter(b => 
          (b.status === 'completed' || b.status === 'active') && 
          new Date(b.created_at) >= oneWeekAgo
        )
        .reduce((sum, b) => sum + (b.total_amount * 0.9), 0);

      this.metrics = {
        totalIncome,
        completedJobs,
        upcomingBookings,
        thisWeekIncome,
        walletBalance: walletData.balance || 0,
      };

      this.notifyListeners();
      return this.metrics;
    } catch (error) {
      console.error('Error getting sitter metrics:', error);
      throw error;
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
    // Update owner metrics
    if (this.metrics.totalSpent !== undefined) {
      this.metrics.totalSpent += paymentData.amount;
    }

    // Update this week's spending if payment is from this week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    if (new Date(paymentData.created_at) >= oneWeekAgo) {
      if (this.metrics.thisWeekSpent !== undefined) {
        this.metrics.thisWeekSpent += paymentData.amount;
      }
    }

    this.notifyListeners();
  }
}

export const dashboardService = new DashboardService();
