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

      const activeBookings = bookings.filter(b => b.status === 'active').length;
      const upcomingBookings = bookings.filter(b => 
        b.status === 'confirmed' && new Date(b.date) > new Date()
      ).length;

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

      // Calculate metrics
      const completedJobs = bookings.filter(b => b.status === 'completed' || b.status === 'active').length;
      const upcomingBookings = bookings.filter(b => 
        b.status === 'confirmed' && new Date(b.date) > new Date()
      ).length;

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
