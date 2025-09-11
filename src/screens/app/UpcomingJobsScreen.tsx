import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    FlatList,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import authService from '../../services/authService';
import { Booking, bookingService } from '../../services/bookingService';

const UpcomingJobsScreen = () => {
  console.log('🚀 UpcomingJobsScreen component rendered');
  const router = useRouter();
  const [upcomingJobs, setUpcomingJobs] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      loadUpcomingJobs();
      
      // Subscribe to booking updates with debouncing
      const unsubscribe = bookingService.subscribe(() => {
        // Only reload if not already loading
        if (!loading) {
          loadUpcomingJobs();
        }
      });

      return unsubscribe;
    }
  }, [currentUserId]); // Removed loading from dependencies to prevent infinite loop

  const loadUserData = async () => {
    try {
      const user = await authService.getCurrentUser();
      console.log('👤 Current user loaded:', user);
      console.log('👤 User ID:', user?.id);
      console.log('👤 User role:', user?.role);
      setCurrentUserId(user?.id || null);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadUpcomingJobs = async () => {
    if (!currentUserId) {
      console.log('❌ No currentUserId found');
      return;
    }

    try {
      console.log('🔄 Loading upcoming jobs for user:', currentUserId);
      
      // First, let's get ALL sitter bookings to see what we have
      const allSitterBookings = await bookingService.getSitterBookings(currentUserId);
      console.log('📊 All sitter bookings found:', allSitterBookings.length);
      console.log('📊 All sitter bookings data:', allSitterBookings);
      
      // Then get upcoming bookings
      const upcoming = await bookingService.getUpcomingSitterBookings(currentUserId);
      console.log('📅 Upcoming jobs found:', upcoming.length);
      console.log('📅 Upcoming jobs data:', upcoming);
      
      // Set the upcoming jobs
      setUpcomingJobs(upcoming);
    } catch (error) {
      console.error('Error loading upcoming jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleViewAll = () => {
    console.log('🔵 View All button clicked!');
    console.log('🔵 Navigating to all-bookings screen...');
    
    try {
      // Navigate to the all-bookings screen
      router.push('/all-bookings');
      console.log('✅ Navigation to all-bookings successful');
    } catch (error) {
      console.error('❌ Navigation error:', error);
      // Try alternative navigation
      try {
        router.replace('/all-bookings');
        console.log('✅ Navigation replace successful');
      } catch (error2) {
        console.error('❌ Navigation replace also failed:', error2);
        // Last resort - try to navigate to a different screen
        router.push('/pet-sitter-dashboard');
      }
    }
  };


  const handleJobPress = (job: Booking) => {
    console.log('🔴 JOB CARD PRESSED!');
    console.log('🔴 Job ID:', job.id);
    console.log('🔴 Job details:', job);
    
    // For now, let's navigate to the booking screen with the job details
    // You can change this to navigate to a specific job details screen later
    try {
      router.push({
        pathname: '/booking',
        params: {
          jobId: job.id,
          petOwnerName: job.petOwnerName,
          date: job.date,
          startTime: job.startTime,
          endTime: job.endTime,
          status: job.status,
          petName: job.petName,
          specialInstructions: job.specialInstructions || '',
          hourlyRate: job.hourlyRate?.toString() || '0'
        }
      });
      console.log('✅ Navigation to booking screen successful');
    } catch (error) {
      console.error('❌ Navigation error:', error);
      // Fallback: try to navigate to a simple booking screen
      router.push('/booking');
    }
  };

  const handleAcceptJob = async (job: Booking) => {
    try {
      await bookingService.updateBookingStatus(job.id, 'confirmed');
      console.log('Job accepted:', job.id);
    } catch (error) {
      console.error('Error accepting job:', error);
    }
  };

  const handleDeclineJob = async (job: Booking) => {
    try {
      await bookingService.updateBookingStatus(job.id, 'cancelled');
      console.log('Job declined:', job.id);
    } catch (error) {
      console.error('Error declining job:', error);
    }
  };

  const handleContactOwner = (job: Booking) => {
    router.push('/pet-sitter-messages');
  };

  const calculateEarnings = (job: Booking) => {
    try {
      console.log('💰 Calculating earnings for job:', job);
      
      // Handle malformed time data
      let startTime = job.startTime;
      let endTime = job.endTime;
      
      // If time contains weird format like "2025-09-10T18:0", extract just the time part
      if (startTime && startTime.includes('T')) {
        const timeMatch = startTime.match(/(\d{1,2}):(\d{2})/);
        if (timeMatch) {
          startTime = `${timeMatch[1]}:${timeMatch[2]}`;
        }
      }
      
      if (endTime && endTime.includes('T')) {
        const timeMatch = endTime.match(/(\d{1,2}):(\d{2})/);
        if (timeMatch) {
          endTime = `${timeMatch[1]}:${timeMatch[2]}`;
        }
      }
      
      if (!startTime || !endTime || !job.hourlyRate) {
        console.log('❌ Missing booking data:', { startTime, endTime, hourlyRate: job.hourlyRate });
        return 0;
      }
      
      const start = new Date(`2000-01-01 ${startTime}`);
      const end = new Date(`2000-01-01 ${endTime}`);
      
      if (end <= start) {
        end.setDate(end.getDate() + 1);
      }
      
      const diffMs = end.getTime() - start.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      const total = Math.ceil(diffHours * job.hourlyRate);
      
      console.log('💰 Earnings calculation:', { startTime, endTime, hours: diffHours, rate: job.hourlyRate, total });
      return total;
    } catch (error) {
      console.error('❌ Error calculating earnings:', error);
      return 0;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (time24: string) => {
    try {
      // Handle malformed time data
      let cleanTime = time24;
      
      // If time contains weird format like "2025-09-10T18:0", extract just the time part
      if (time24 && time24.includes('T')) {
        const timeMatch = time24.match(/(\d{1,2}):(\d{2})/);
        if (timeMatch) {
          cleanTime = `${timeMatch[1]}:${timeMatch[2]}`;
        }
      }
      
      const [hours, minutes] = cleanTime.split(':');
      const hour = parseInt(hours, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      return `${hour12}:${minutes} ${ampm}`;
    } catch (error) {
      console.error('❌ Error formatting time:', error, 'Input:', time24);
      return 'Invalid Time';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#F59E0B';
      case 'confirmed':
        return '#10B981';
      default:
        return '#6B7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'confirmed':
        return 'Confirmed';
      default:
        return status;
    }
  };

  const renderJob = ({ item }: { item: Booking }) => {
    console.log('🎨 Rendering job card:', item);
    const earnings = calculateEarnings(item);
    console.log('💰 Calculated earnings:', earnings);
    
    return (
      <TouchableOpacity 
        style={styles.jobCard} 
        onPress={() => handleJobPress(item)}
      >
        <View style={styles.jobContent}>
          <View style={styles.jobInfo}>
            <Text style={styles.petOwnerName}>{item.petOwnerName || 'Unknown Owner'}</Text>
            <Text style={styles.jobTime}>
              {item.startTime && item.endTime ? 
                `${formatTime(item.startTime)} - ${formatTime(item.endTime)}` : 
                'Time not set'
              }
            </Text>
            <Text style={styles.jobDate}>{formatDate(item.date)}</Text>
          </View>
          <View style={styles.jobRightSide}>
            <Text style={styles.totalAmount}>₱{earnings.toFixed(0)}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
              <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Upcoming Jobs</Text>
          </View>
          <View style={{ width: 60 }} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading upcoming jobs...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Upcoming Jobs</Text>
        </View>
        <TouchableOpacity 
          style={styles.viewAllButton} 
          onPress={() => {
            console.log('🔵 View All button pressed!');
            handleViewAll();
          }}
        >
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>

      {/* Summary Stats */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{upcomingJobs.length}</Text>
          <Text style={styles.summaryLabel}>Upcoming Jobs</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>
            ₱{upcomingJobs.reduce((total, job) => total + calculateEarnings(job), 0).toFixed(0)}
          </Text>
          <Text style={styles.summaryLabel}>Potential Earnings</Text>
        </View>
      </View>

      {/* Jobs List */}
      <FlatList
        data={upcomingJobs}
        renderItem={renderJob}
        keyExtractor={(item) => item.id}
        style={styles.jobsList}
        contentContainerStyle={styles.jobsListContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>No upcoming jobs</Text>
            <Text style={styles.emptySubtitle}>Your upcoming jobs will appear here</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    position: 'relative',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 50, // Space for back button and view all button
  },
  viewAllButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#3B82F6',
    minWidth: 80,
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  summaryContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3B82F6',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  jobsList: {
    flex: 1,
  },
  jobsListContent: {
    padding: 16,
  },
  jobCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  jobContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  jobInfo: {
    flex: 1,
  },
  petOwnerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  jobTime: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
    marginBottom: 2,
  },
  jobDate: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  jobRightSide: {
    alignItems: 'flex-end',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10B981',
    marginBottom: 4,
  },
  acceptButtonText: {
    color: '#fff',
  },
  declineButtonText: {
    color: '#EF4444',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default UpcomingJobsScreen;

