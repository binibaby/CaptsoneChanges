import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Alert,
    Image,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { Booking, bookingService } from '../../services/bookingService';

interface Job {
  id: string;
  petSitterName: string;
  petName: string;
  date: string;
  time: string;
  duration: string;
  rate: string;
  status: 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled';
  avatar: any;
  petImage: any;
  location: string;
}

const PetOwnerJobsScreen = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState<'active' | 'upcoming' | 'past'>('active');
  const [jobs, setJobs] = useState<Job[]>([
    // New users start with no jobs
  ]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  // Check if user is logged out and redirect to onboarding
  useEffect(() => {
    const checkLogoutStatus = async () => {
      try {
        const loggedOut = await AsyncStorage.getItem('user_logged_out');
        if (loggedOut === 'true') {
          console.log('PetOwnerJobsScreen: User was logged out, redirecting to onboarding');
          router.replace('/onboarding');
        }
      } catch (error) {
        console.error('Error checking logout status:', error);
      }
    };
    
    checkLogoutStatus();
  }, [router]);

  // Load bookings when user changes
  useEffect(() => {
    if (user?.id) {
      loadBookings();
    }
  }, [user?.id]);

  // Format time to 12-hour format
  const formatTime = (time: string) => {
    if (!time) return 'Invalid Time';
    try {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      return `${hour12}:${minutes} ${ampm}`;
    } catch (error) {
      return time;
    }
  };

  // Format date to readable format
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Invalid Date';
    try {
      const date = new Date(dateString);
      const options: Intl.DateTimeFormatOptions = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      };
      return date.toLocaleDateString('en-US', options);
    } catch (error) {
      return dateString;
    }
  };

  const loadBookings = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      console.log('🔄 Loading bookings for pet owner:', user.id);
      
      // Get all bookings for this pet owner
      const allBookings = await bookingService.getBookings();
      const ownerBookings = allBookings.filter(booking => booking.petOwnerId === user.id);
      
      console.log('📊 Owner bookings found:', ownerBookings.length);
      console.log('💰 Booking hourly rates:', ownerBookings.map(b => ({ id: b.id, sitter: b.sitterName, rate: b.hourlyRate })));
      
      // Debug: Check if we have the correct booking data
      if (ownerBookings.length > 0) {
        console.log('🔍 First booking details:', ownerBookings[0]);
        console.log('🔍 All booking fields:', Object.keys(ownerBookings[0]));
      }
      
      setBookings(ownerBookings);
    } catch (error) {
      console.error('Error loading bookings:', error);
      Alert.alert('Error', 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleJobPress = (job: Job) => {
    // Navigate to job details
    console.log('View job details:', job.id);
  };

  const handleCancelJob = (jobId: string) => {
    // Cancel job logic
    console.log('Cancel job:', jobId);
  };

  const handleContactSitter = (job: Job) => {
    router.push('/pet-owner-messages');
  };

  const handlePendingDetails = (job: any) => {
    // Get the original booking data to access the true hourly rate
    const originalBooking = bookings.find(booking => booking.id === job.id);
    const actualHourlyRate = originalBooking?.hourlyRate || 'N/A';
    
    console.log('💰 True sitter hourly rate from booking:', actualHourlyRate);
    console.log('🔍 Original booking:', originalBooking);
    console.log('🔍 Job object:', job);
    
    Alert.alert(
      'Booking Details',
      `Sitter: ${job.petSitterName}\nDate: ${job.date}\nTime: ${job.time}`,
      [
        { text: 'OK', style: 'default' }
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#F59E0B';
      case 'active':
        return '#10B981';
      case 'confirmed':
        return '#3B82F6';
      case 'in-progress':
        return '#3B82F6';
      case 'completed':
        return '#9C27B0';
      case 'cancelled':
        return '#FF4444';
      default:
        return '#666';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'active':
        return 'Active';
      case 'confirmed':
        return 'Confirmed';
      case 'in-progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  // Updated filtering logic for new categories
  const activeBookings = bookings.filter(booking => booking.status === 'active');
  const upcomingBookings = bookings.filter(booking => booking.status === 'confirmed');
  const pastBookings = bookings.filter(booking => booking.status === 'completed');

  const currentJobs = selectedTab === 'active' ? activeBookings : 
                     selectedTab === 'upcoming' ? upcomingBookings : pastBookings;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Bookings</Text>
        <TouchableOpacity style={styles.newBookingButton} onPress={() => router.push('/find-sitter-map')}>
          <Ionicons name="add" size={24} color="#F59E0B" />
        </TouchableOpacity>
      </View>

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, selectedTab === 'active' && styles.activeTab]} 
          onPress={() => setSelectedTab('active')}
        >
          <Text style={[styles.tabText, selectedTab === 'active' && styles.activeTabText]}>
            Active ({activeBookings.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, selectedTab === 'upcoming' && styles.activeTab]} 
          onPress={() => setSelectedTab('upcoming')}
        >
          <Text style={[styles.tabText, selectedTab === 'upcoming' && styles.activeTabText]}>
            Upcoming ({upcomingBookings.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, selectedTab === 'past' && styles.activeTab]} 
          onPress={() => setSelectedTab('past')}
        >
          <Text style={[styles.tabText, selectedTab === 'past' && styles.activeTabText]}>
            Past ({pastBookings.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {currentJobs.length > 0 ? (
          currentJobs.map((item) => {
            // Handle both Job objects and Booking objects
            const isBooking = 'sitterName' in item;
            const job = isBooking ? {
              id: item.id,
              petSitterName: item.sitterName,
              petName: item.petName || 'Pet',
              date: formatDate(item.date), // Format date to readable format
              time: `${formatTime(item.startTime)} - ${formatTime(item.endTime)}`, // Format time to 12-hour format
              duration: item.duration ? `${item.duration} hours` : 'N/A',
              rate: item.hourlyRate ? `₱${item.hourlyRate}/hour` : 'Rate not set',
              status: item.status,
              avatar: { uri: 'https://via.placeholder.com/50x50/cccccc/666666?text=U' },
              petImage: { uri: 'https://via.placeholder.com/50x50/cccccc/666666?text=P' },
              location: 'Location',
              // Store the actual hourly rate for easy access
              actualHourlyRate: item.hourlyRate
            } : item;

            // Debug logging to see what's happening with the rates
            if (isBooking) {
              console.log('🔍 Creating job for booking:', {
                id: item.id,
                sitterName: item.sitterName,
                hourlyRate: item.hourlyRate,
                formattedRate: item.hourlyRate ? `₱${item.hourlyRate}/hour` : 'Rate not set'
              });
            }

            return (
              <View key={job.id} style={styles.jobCard}>
                {selectedTab === 'active' ? (
                  // Simplified active card
                  <>
                    <View style={styles.pendingCardHeader}>
                      <Text style={styles.pendingSitterName}>{job.petSitterName}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(job.status) }]}>
                        <Text style={styles.statusText}>Active</Text>
                      </View>
                    </View>
                    
                    <View style={styles.pendingDateTime}>
                      <Text style={styles.pendingDate}>{job.date}</Text>
                      <Text style={styles.pendingTime}>{job.time}</Text>
                    </View>

                    <View style={styles.pendingActions}>
                      <TouchableOpacity 
                        style={styles.contactButton}
                        onPress={() => handleContactSitter(job)}
                      >
                        <Ionicons name="chatbubbles-outline" size={16} color="#3B82F6" />
                        <Text style={styles.contactButtonText}>Message</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                ) : (
                  // Full card for other tabs
                  <>
                    <View style={styles.jobHeader}>
                      <View style={styles.sitterInfo}>
                        <Image source={job.avatar} style={styles.sitterAvatar} />
                        <View style={styles.sitterDetails}>
                          <Text style={styles.sitterName}>{job.petSitterName}</Text>
                          <Text style={styles.locationText}>📍 {job.location}</Text>
                        </View>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(job.status) }]}>
                        <Text style={styles.statusText}>{getStatusText(job.status)}</Text>
                      </View>
                    </View>

                    <View style={styles.petInfo}>
                      <Image source={job.petImage} style={styles.petImage} />
                      <View style={styles.petDetails}>
                        <Text style={styles.petName}>{job.petName}</Text>
                        <Text style={styles.bookingDate}>{job.date}</Text>
                      </View>
                    </View>

                    <View style={styles.bookingDetails}>
                      <View style={styles.detailItem}>
                        <Ionicons name="time-outline" size={16} color="#666" />
                        <Text style={styles.detailText}>{job.time}</Text>
                      </View>
                      <View style={styles.detailItem}>
                        <Ionicons name="calendar-outline" size={16} color="#666" />
                        <Text style={styles.detailText}>{job.duration}</Text>
                      </View>
                      <View style={styles.detailItem}>
                        <Ionicons name="cash-outline" size={16} color="#666" />
                        <Text style={styles.detailText}>{job.rate}</Text>
                      </View>
                    </View>

                    <View style={styles.actionButtons}>
                      <TouchableOpacity 
                        style={styles.contactButton}
                        onPress={() => handleContactSitter(job)}
                      >
                        <Ionicons name="chatbubbles-outline" size={16} color="#3B82F6" />
                        <Text style={styles.contactButtonText}>Message</Text>
                      </TouchableOpacity>
                      
                      {job.status === 'confirmed' && (
                        <TouchableOpacity 
                          style={styles.cancelButton}
                          onPress={() => handleCancelJob(job.id)}
                        >
                          <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </>
                )}
              </View>
            );
          })
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons 
              name={selectedTab === 'active' ? 'play-circle-outline' : 
                    selectedTab === 'upcoming' ? 'calendar-outline' : 'checkmark-circle-outline'} 
              size={64} 
              color="#ccc" 
            />
            <Text style={styles.emptyTitle}>
              {selectedTab === 'active' ? 'No active bookings' :
               selectedTab === 'upcoming' ? 'No upcoming bookings' : 'No past bookings'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {selectedTab === 'active' 
                ? 'Your ongoing bookings will appear here' 
                : selectedTab === 'upcoming' 
                ? 'Find a pet sitter to get started!' 
                : 'Your completed bookings will appear here.'
              }
            </Text>
            {(selectedTab === 'upcoming' || selectedTab === 'active') && (
              <TouchableOpacity 
                style={styles.findSitterButton}
                onPress={() => router.push('/find-sitter-map')}
              >
                <Text style={styles.findSitterButtonText}>Find Pet Sitter</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  newBookingButton: {
    padding: 5,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#F59E0B',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  jobCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  // Pending card specific styles
  pendingCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  pendingSitterName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  pendingDateTime: {
    marginBottom: 15,
  },
  pendingDate: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  pendingTime: {
    fontSize: 14,
    color: '#888',
  },
  pendingActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sitterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sitterAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  sitterDetails: {
    flex: 1,
  },
  sitterName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  locationText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  petInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  petImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  petDetails: {
    flex: 1,
  },
  petName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  bookingDate: {
    fontSize: 12,
    color: '#666',
  },
  bookingDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    color: '#666',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  contactButtonText: {
    color: '#3B82F6',
    fontSize: 12,
    fontWeight: '600',
  },
  detailsButton: {
    flex: 1,
    backgroundColor: '#F0F0F0',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  detailsButtonText: {
    color: '#333',
    fontSize: 12,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#FFE8E8',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: '#FF4444',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 20,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  findSitterButton: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  findSitterButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PetOwnerJobsScreen; 