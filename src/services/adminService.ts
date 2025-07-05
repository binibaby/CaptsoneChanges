import { User } from './authService';
import { Booking } from './dataService';

export interface AdminUser extends User {
  role: 'admin' | 'super_admin';
  permissions: string[];
  createdAt: string;
  lastLogin: string;
}

export interface AdminStats {
  totalUsers: number;
  totalPetOwners: number;
  totalPetSitters: number;
  totalBookings: number;
  pendingVerifications: number;
  activeBookings: number;
  revenue: number;
  averageRating: number;
}

export interface UserManagementData {
  id: string;
  name: string;
  email: string;
  userRole: 'Pet Owner' | 'Pet Sitter';
  status: 'active' | 'suspended' | 'banned';
  joinDate: string;
  lastActive: string;
  totalBookings: number;
  rating?: number;
  isVerified?: boolean;
}

export interface SystemSettings {
  appVersion: string;
  maintenanceMode: boolean;
  newUserRegistration: boolean;
  maxBookingsPerUser: number;
  minimumRatingForSitters: number;
  verificationRequired: boolean;
  supportEmail: string;
}

class AdminService {
  private static instance: AdminService;
  private adminUsers: Map<string, AdminUser> = new Map();
  private systemSettings: SystemSettings = {
    appVersion: '1.0.0',
    maintenanceMode: false,
    newUserRegistration: true,
    maxBookingsPerUser: 10,
    minimumRatingForSitters: 4.0,
    verificationRequired: true,
    supportEmail: 'support@petsitconnect.com',
  };

  static getInstance(): AdminService {
    if (!AdminService.instance) {
      AdminService.instance = new AdminService();
    }
    return AdminService.instance;
  }

  // Admin Authentication
  async isAdmin(userId: string): Promise<boolean> {
    const adminUser = this.adminUsers.get(userId);
    return adminUser !== undefined;
  }

  async getAdminUser(userId: string): Promise<AdminUser | null> {
    return this.adminUsers.get(userId) || null;
  }

  async createAdminUser(userData: {
    email: string;
    name: string;
    role: 'admin' | 'super_admin';
    permissions: string[];
  }): Promise<AdminUser> {
    const adminUser: AdminUser = {
      id: Date.now().toString(),
      email: userData.email,
      name: userData.name,
      userRole: 'Pet Sitter', // Default role, but admin permissions override
      role: userData.role,
      permissions: userData.permissions,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };

    this.adminUsers.set(adminUser.id, adminUser);
    return adminUser;
  }

  // Dashboard Statistics
  async getAdminStats(): Promise<AdminStats> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      totalUsers: 1250,
      totalPetOwners: 890,
      totalPetSitters: 360,
      totalBookings: 2847,
      pendingVerifications: 23,
      activeBookings: 156,
      revenue: 45678.90,
      averageRating: 4.6,
    };
  }

  // User Management
  async getAllUsers(): Promise<UserManagementData[]> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));

    const mockUsers: UserManagementData[] = [
      {
        id: '1',
        name: 'Sarah Johnson',
        email: 'sarah@example.com',
        userRole: 'Pet Owner',
        status: 'active',
        joinDate: '2024-01-15',
        lastActive: '2024-01-20',
        totalBookings: 12,
        rating: 4.8,
      },
      {
        id: '2',
        name: 'Mike Chen',
        email: 'mike@example.com',
        userRole: 'Pet Sitter',
        status: 'active',
        joinDate: '2024-01-10',
        lastActive: '2024-01-20',
        totalBookings: 45,
        rating: 4.9,
        isVerified: true,
      },
      {
        id: '3',
        name: 'Emily Davis',
        email: 'emily@example.com',
        userRole: 'Pet Sitter',
        status: 'suspended',
        joinDate: '2024-01-05',
        lastActive: '2024-01-18',
        totalBookings: 8,
        rating: 3.2,
        isVerified: false,
      },
      {
        id: '4',
        name: 'Alex Wilson',
        email: 'alex@example.com',
        userRole: 'Pet Owner',
        status: 'banned',
        joinDate: '2024-01-01',
        lastActive: '2024-01-15',
        totalBookings: 3,
        rating: 2.1,
      },
    ];

    return mockUsers;
  }

  async updateUserStatus(userId: string, status: 'active' | 'suspended' | 'banned', reason?: string): Promise<void> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log(`User ${userId} status updated to ${status}${reason ? ` - Reason: ${reason}` : ''}`);
  }

  async deleteUser(userId: string): Promise<void> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log(`User ${userId} deleted`);
  }

  // Booking Management
  async getAllBookings(): Promise<Booking[]> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 600));

    // Return mock bookings
    return [];
  }

  async cancelBooking(bookingId: string, reason: string): Promise<void> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log(`Booking ${bookingId} cancelled - Reason: ${reason}`);
  }

  // Verification Management
  async getPendingVerifications(): Promise<any[]> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 400));

    return [
      {
        id: '1',
        sitterId: 'sitter1',
        sitterName: 'Sarah Johnson',
        documentType: 'identity',
        submittedAt: '2024-01-15T10:30:00Z',
      },
      {
        id: '2',
        sitterId: 'sitter1',
        sitterName: 'Sarah Johnson',
        documentType: 'background_check',
        submittedAt: '2024-01-16T14:20:00Z',
      },
    ];
  }

  // System Settings
  async getSystemSettings(): Promise<SystemSettings> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return this.systemSettings;
  }

  async updateSystemSettings(settings: Partial<SystemSettings>): Promise<void> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    this.systemSettings = { ...this.systemSettings, ...settings };
    console.log('System settings updated:', settings);
  }

  // Reports and Analytics
  async generateReport(reportType: 'users' | 'bookings' | 'revenue' | 'verifications', dateRange: { start: string; end: string }): Promise<any> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    const mockReport = {
      type: reportType,
      dateRange,
      generatedAt: new Date().toISOString(),
      data: {
        total: Math.floor(Math.random() * 1000),
        growth: Math.random() * 20 - 10, // -10% to +10%
        breakdown: {},
      },
    };

    return mockReport;
  }

  // Support and Moderation
  async getSupportTickets(): Promise<any[]> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 400));

    return [
      {
        id: '1',
        userId: 'user1',
        userName: 'John Doe',
        subject: 'Payment Issue',
        status: 'open',
        priority: 'high',
        createdAt: '2024-01-20T09:00:00Z',
      },
      {
        id: '2',
        userId: 'user2',
        userName: 'Jane Smith',
        subject: 'Booking Cancellation',
        status: 'in_progress',
        priority: 'medium',
        createdAt: '2024-01-19T14:30:00Z',
      },
    ];
  }

  async updateSupportTicket(ticketId: string, status: 'open' | 'in_progress' | 'resolved' | 'closed', response?: string): Promise<void> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log(`Support ticket ${ticketId} updated to ${status}${response ? ` - Response: ${response}` : ''}`);
  }

  // Content Moderation
  async getFlaggedContent(): Promise<any[]> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 400));

    return [
      {
        id: '1',
        type: 'review',
        content: 'Inappropriate review content...',
        reportedBy: 'user1',
        status: 'pending',
        createdAt: '2024-01-20T10:00:00Z',
      },
      {
        id: '2',
        type: 'profile',
        content: 'Suspicious profile activity...',
        reportedBy: 'user2',
        status: 'reviewed',
        createdAt: '2024-01-19T16:00:00Z',
      },
    ];
  }

  async moderateContent(contentId: string, action: 'approve' | 'remove' | 'warn', reason?: string): Promise<void> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log(`Content ${contentId} moderated - Action: ${action}${reason ? ` - Reason: ${reason}` : ''}`);
  }
}

export default AdminService.getInstance(); 