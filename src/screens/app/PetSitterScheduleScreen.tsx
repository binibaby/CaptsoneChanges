import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import authService from '../../services/authService';
import { Booking, bookingService } from '../../services/bookingService';

interface ScheduleItem extends Booking {
  // Extended interface for display purposes
  petBreed?: string;
  location?: string;
  rate?: string;
}

const PetSitterScheduleScreen = () => {
  const router = useRouter();
  
  // State management
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  
  // Generate current week dates
  const generateCurrentWeekDates = () => {
    const today = new Date();
    const dates = [];
    
    // Start from Monday of current week
    const monday = new Date(today);
    monday.setDate(today.getDate() - today.getDay() + 1);
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      const month = date.toLocaleDateString('en-US', { month: 'short' });
      const day = date.getDate();
      dates.push(`${month} ${day}`);
    }
    
    return dates;
  };

  // Load user data and schedule
  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      loadSchedule();
      
      // Subscribe to booking updates
      const unsubscribe = bookingService.subscribe(() => {
        if (!loading) {
          loadSchedule();
        }
      });

      return unsubscribe;
    }
  }, [currentUserId]);

  // Refresh schedule every minute to check for time changes
  useEffect(() => {
    const interval = setInterval(() => {
      if (currentUserId && !loading) {
        // Force re-render to update start session buttons
        setSchedule(prevSchedule => [...prevSchedule]);
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [currentUserId, loading]);

  const loadUserData = async () => {
    try {
      const user = await authService.getCurrentUser();
      setCurrentUserId(user?.id || null);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadSchedule = async () => {
    if (!currentUserId) return;

    try {
      setLoading(true);
      console.log('🔄 Loading schedule for sitter:', currentUserId);
      
      // Get upcoming bookings
      const upcomingBookings = await bookingService.getUpcomingSitterBookings(currentUserId);
      console.log('📅 Upcoming bookings found:', upcomingBookings.length);
      
      // Convert to ScheduleItem format
      const scheduleItems: ScheduleItem[] = upcomingBookings.map(booking => ({
        ...booking,
        rate: `₱${booking.hourlyRate || 0}/hr`,
      }));
      
      setSchedule(scheduleItems);
      
      // Generate available dates from bookings
      const dates = generateAvailableDates(scheduleItems);
      setAvailableDates(dates);
      
      // Set today as default selected date
      const today = new Date();
      const todayFormatted = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      setSelectedDate(todayFormatted);
      
    } catch (error) {
      console.error('Error loading schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateAvailableDates = (bookings: ScheduleItem[]) => {
    const dateSet = new Set<string>();
    
    // Add current week dates
    const currentWeekDates = generateCurrentWeekDates();
    currentWeekDates.forEach(date => dateSet.add(date));
    
    // Add dates from bookings
    bookings.forEach(booking => {
      const bookingDate = new Date(booking.date);
      const month = bookingDate.toLocaleDateString('en-US', { month: 'short' });
      const day = bookingDate.getDate();
      const formattedDate = `${month} ${day}`;
      dateSet.add(formattedDate);
    });
    
    return Array.from(dateSet).sort((a, b) => {
      const dateA = new Date(a + ', ' + new Date().getFullYear());
      const dateB = new Date(b + ', ' + new Date().getFullYear());
      return dateA.getTime() - dateB.getTime();
    });
  };

  const handleBack = () => {
    router.back();
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
  };

  const handleViewDetails = (item: ScheduleItem) => {
    // Navigate to booking details
    console.log('View details for:', item.id);
  };

  // Format date for display
  const formatDateForDisplay = (dateString: string) => {
    const date = new Date(dateString);
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const day = date.getDate();
    return `${month} ${day}`;
  };

  // Format time for display
  const formatTimeForDisplay = (timeString: string) => {
    try {
      if (!timeString) return 'Time TBD';
      
      // Handle malformed time data
      let cleanTime = timeString;
      if (timeString.includes('T')) {
        const timeMatch = timeString.match(/(\d{1,2}):(\d{2})/);
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
      console.error('Error formatting time:', error);
      return 'Time TBD';
    }
  };

  // Filter schedule for selected date
  const getFilteredSchedule = () => {
    if (!selectedDate) return [];
    
    return schedule.filter(item => {
      const itemDate = formatDateForDisplay(item.date);
      return itemDate === selectedDate;
    });
  };

  // Check if selected date is today
  const isToday = () => {
    const today = new Date();
    const todayFormatted = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return selectedDate === todayFormatted;
  };

  // Check if a booking session can be started (current time >= start time)
  const canStartSession = (booking: ScheduleItem) => {
    try {
      const now = new Date();
      const bookingDate = new Date(booking.date);
      
      // Get start time
      const startTime = booking.startTime || booking.time;
      if (!startTime) return false;
      
      // Parse start time
      let cleanTime = startTime;
      if (startTime.includes('T')) {
        const timeMatch = startTime.match(/(\d{1,2}):(\d{2})/);
        if (timeMatch) {
          cleanTime = `${timeMatch[1]}:${timeMatch[2]}`;
        }
      }
      
      const [hours, minutes] = cleanTime.split(':');
      const startDateTime = new Date(bookingDate);
      startDateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
      
      // Check if current time is >= start time
      return now >= startDateTime;
    } catch (error) {
      console.error('Error checking if session can start:', error);
      return false;
    }
  };

  // Navigate to conversation with pet owner
  const handleStartSession = async (item: ScheduleItem) => {
    console.log('🚀 Starting session for booking:', item.id);
    console.log('👤 Pet Owner:', item.petOwnerName);
    console.log('🐕 Pet Name:', item.petName);
    
    try {
      // Update booking status to active
      await bookingService.updateBookingStatus(item.id, 'active');
      console.log('✅ Booking status updated to active');
      
      // Navigate to messages screen with the pet owner
      router.push({
        pathname: '/pet-sitter-messages',
        params: {
          bookingId: item.id,
          petOwnerId: item.petOwnerId,
          petOwnerName: item.petOwnerName,
          petName: item.petName || 'Pet',
          bookingDate: item.date,
          startTime: item.startTime,
          endTime: item.endTime,
          status: 'active'
        }
      });
      console.log('✅ Navigation to messages successful');
    } catch (error) {
      console.error('❌ Error starting session:', error);
      // Still navigate even if status update fails
      router.push({
        pathname: '/pet-sitter-messages',
        params: {
          bookingId: item.id,
          petOwnerId: item.petOwnerId,
          petOwnerName: item.petOwnerName,
          petName: item.petName || 'Pet',
          bookingDate: item.date,
          startTime: item.startTime,
          endTime: item.endTime,
          status: 'active'
        }
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#F59E0B';
      case 'confirmed':
        return '#10B981';
      case 'active':
        return '#4CAF50';
      case 'completed':
        return '#3B82F6';
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
      case 'confirmed':
        return 'Confirmed';
      case 'active':
        return 'Active';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const filteredSchedule = getFilteredSchedule();

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Schedule</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading your schedule...</Text>
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
        <Text style={styles.headerTitle}>My Schedule</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content}>
        {/* Date Selector */}
        <View style={styles.dateSelector}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {availableDates.map((date) => (
              <TouchableOpacity
                key={date}
                style={[
                  styles.dateButton,
                  selectedDate === date && styles.selectedDateButton
                ]}
                onPress={() => handleDateSelect(date)}
              >
                <Text style={[
                  styles.dateText,
                  selectedDate === date && styles.selectedDateText
                ]}>
                  {date}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Schedule for Selected Date */}
        <View style={styles.scheduleContainer}>
          <Text style={styles.dateTitle}>{selectedDate}, {new Date().getFullYear()}</Text>
          
          {filteredSchedule.length > 0 ? (
            filteredSchedule.map((item) => (
              <View key={item.id} style={styles.scheduleCard}>
                <View style={styles.scheduleHeader}>
                  <View style={styles.timeContainer}>
                    <Ionicons name="time-outline" size={16} color="#666" />
                    <Text style={styles.timeText}>
                      {item.startTime && item.endTime ? 
                        `${formatTimeForDisplay(item.startTime)} - ${formatTimeForDisplay(item.endTime)}` : 
                        formatTimeForDisplay(item.startTime || item.time || '')
                      }
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                    <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
                  </View>
                </View>

                <View style={styles.bookingInfo}>
                  <View style={styles.petInfo}>
                    <Text style={styles.petName}>{item.petName || 'Pet Name TBD'}</Text>
                  </View>
                  
                  <View style={styles.ownerInfo}>
                    <Text style={styles.ownerName}>Owner: {item.petOwnerName}</Text>
                  </View>
                </View>

                <View style={styles.bookingDetails}>
                  <View style={styles.detailItem}>
                    <Ionicons name="cash-outline" size={14} color="#666" />
                    <Text style={styles.detailText}>{item.rate || `₱${item.hourlyRate || 0}/hr`}</Text>
                  </View>
                </View>

                <View style={styles.actionButtons}>
                  {(item.status === 'pending' || item.status === 'confirmed') && canStartSession(item) && (
                    <TouchableOpacity 
                      style={styles.startButton}
                      onPress={() => handleStartSession(item)}
                    >
                      <Text style={styles.startButtonText}>Start Session</Text>
                    </TouchableOpacity>
                  )}
                  {(item.status === 'pending' || item.status === 'confirmed') && !canStartSession(item) && (
                    <View style={styles.waitingContainer}>
                      <Text style={styles.waitingText}>Session starts at {formatTimeForDisplay(item.startTime || item.time || '')}</Text>
                    </View>
                  )}
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={64} color="#ccc" />
              <Text style={styles.emptyTitle}>No bookings on {selectedDate}</Text>
              <Text style={styles.emptySubtitle}>You have a free day! Check other dates for your schedule.</Text>
            </View>
          )}
        </View>

        {/* Daily Summary */}
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>
            {isToday() ? "Today's Summary" : `${selectedDate}'s Summary`}
          </Text>
          <View style={styles.summaryStats}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNumber}>
                {filteredSchedule.length}
              </Text>
              <Text style={styles.summaryLabel}>Total Bookings</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNumber}>
                {filteredSchedule.filter(item => item.status === 'pending' || item.status === 'confirmed').length}
              </Text>
              <Text style={styles.summaryLabel}>Upcoming</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNumber}>
                {filteredSchedule.filter(item => item.status === 'active').length}
              </Text>
              <Text style={styles.summaryLabel}>Active</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNumber}>
                {filteredSchedule.filter(item => item.status === 'completed').length}
              </Text>
              <Text style={styles.summaryLabel}>Completed</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNumber}>
                ₱{filteredSchedule
                  .filter(item => item.status === 'completed')
                  .reduce((total, item) => total + (item.totalAmount || 0), 0)
                }
              </Text>
              <Text style={styles.summaryLabel}>Earned</Text>
            </View>
          </View>
        </View>
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
  headerRight: {
    width: 30,
  },
  content: {
    flex: 1,
  },
  dateSelector: {
    backgroundColor: '#fff',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  dateButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
  },
  selectedDateButton: {
    backgroundColor: '#F59E0B',
  },
  dateText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  selectedDateText: {
    color: '#fff',
  },
  scheduleContainer: {
    padding: 20,
  },
  dateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  scheduleCard: {
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
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
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
  bookingInfo: {
    marginBottom: 12,
  },
  petInfo: {
    marginBottom: 8,
  },
  petName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  ownerInfo: {
    marginBottom: 8,
  },
  ownerName: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
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
  startButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  waitingContainer: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  waitingText: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
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
  summaryContainer: {
    backgroundColor: '#fff',
    padding: 20,
    margin: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  summaryStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
    minWidth: 60,
    marginVertical: 5,
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F59E0B',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
});

export default PetSitterScheduleScreen; 