import { User } from './authService';
import { Booking, Sitter } from './dataService';
import notificationService from './notificationService';

export interface BookingRequest {
  petId: string;
  sitterId: string;
  startDate: string;
  endDate: string;
  specialInstructions?: string;
  totalPrice: number;
}

export interface BookingStatus {
  id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
  message?: string;
}

class BookingService {
  private static instance: BookingService;
  private bookings: Booking[] = [];

  static getInstance(): BookingService {
    if (!BookingService.instance) {
      BookingService.instance = new BookingService();
    }
    return BookingService.instance;
  }

  async createBooking(request: BookingRequest, user: User): Promise<Booking> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    const newBooking: Booking = {
      id: Date.now().toString(),
      pet: {
        id: request.petId,
        name: 'Max', // This would come from the pet data
        type: 'dog',
        breed: 'Golden Retriever',
        age: 3,
        image: require('../assets/images/dog.png'),
        owner: user,
        description: 'Friendly dog',
        location: {
          latitude: 37.7749,
          longitude: -122.4194,
          address: 'San Francisco, CA',
        },
      },
      sitter: {
        id: request.sitterId,
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
        bio: 'Experienced pet sitter',
        images: [require('../assets/images/default-avatar.png')],
      },
      startDate: request.startDate,
      endDate: request.endDate,
      status: 'pending',
      totalPrice: request.totalPrice,
      specialInstructions: request.specialInstructions,
    };

    this.bookings.push(newBooking);

    // Send notification to sitter
    await notificationService.sendNewRequest(
      newBooking.sitter.user.name,
      newBooking.pet.name
    );

    return newBooking;
  }

  async getBookings(userId: string): Promise<Booking[]> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return this.bookings.filter(booking => 
      booking.pet.owner.id === userId || booking.sitter.user.id === userId
    );
  }

  async updateBookingStatus(bookingId: string, status: BookingStatus): Promise<Booking> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));

    const booking = this.bookings.find(b => b.id === bookingId);
    if (!booking) {
      throw new Error('Booking not found');
    }

    booking.status = status.status;

    // Send appropriate notification
    if (status.status === 'accepted') {
      await notificationService.sendBookingConfirmation(
        booking.sitter.user.name,
        booking.pet.name
      );
    }

    return booking;
  }

  async cancelBooking(bookingId: string): Promise<void> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));

    const bookingIndex = this.bookings.findIndex(b => b.id === bookingId);
    if (bookingIndex !== -1) {
      this.bookings[bookingIndex].status = 'cancelled';
    }
  }

  async getBookingById(bookingId: string): Promise<Booking | null> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 300));

    return this.bookings.find(booking => booking.id === bookingId) || null;
  }

  calculatePrice(sitter: Sitter, startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    return Math.ceil(hours) * sitter.hourlyRate;
  }
}

export default BookingService.getInstance(); 