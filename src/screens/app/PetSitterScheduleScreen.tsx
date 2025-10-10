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

  // Refresh schedule every minute to check for time changes and auto-complete sessions
  useEffect(() => {
    const interval = setInterval(async () => {
      if (currentUserId && !loading) {
        // Auto-complete sessions that have ended
        try {
          const result = await bookingService.autoCompleteSessions();
          if (result.success && result.completed_count > 0) {
            console.log(`✅ Auto-completed ${result.completed_count} sessions`);
            // Refresh the schedule to show updated status
            loadSchedule();
          }
        } catch (error) {
          console.error('Error auto-completing sessions:', error);
        }
        
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
      
      // Get all bookings first to debug
      const allSystemBookings = await bookingService.getBookings();
      console.log('📊 All bookings in system:', allSystemBookings.length);
      
      const sitterBookings = await bookingService.getSitterBookings(currentUserId);
      console.log('👤 All sitter bookings for user', currentUserId, ':', sitterBookings.length);
      sitterBookings.forEach(booking => {
        console.log(`  - Booking ${booking.id}: ${booking.date} (${booking.status}) - ${booking.petOwnerName} - ${booking.petName}`);
      });
      
      // Get upcoming bookings (confirmed and pending)
      const upcomingBookings = await bookingService.getUpcomingSitterBookings(currentUserId);
      console.log('📅 Upcoming bookings found:', upcomingBookings.length);
      upcomingBookings.forEach(booking => {
        console.log(`  - Upcoming: ${booking.date} (${booking.status}) - ${booking.petOwnerName}`);
      });
      
      // Get active bookings (sessions in progress)
      const activeBookings = await bookingService.getActiveSitterBookings(currentUserId);
      console.log('🔄 Active bookings found:', activeBookings.length);
      activeBookings.forEach(booking => {
        console.log(`  - Active: ${booking.date} (${booking.status}) - ${booking.petOwnerName}`);
      });
      
      // Get all sitter bookings to include any that might be ongoing but not marked as 'active'
      const allSitterBookings = await bookingService.getSitterBookings(currentUserId);
      console.log('📊 All sitter bookings for schedule:', allSitterBookings.length);
      
      // Filter out completed and cancelled bookings, keep all others
      const relevantBookings = allSitterBookings.filter(booking => 
        booking.status !== 'completed' && booking.status !== 'cancelled'
      );
      console.log('📋 Relevant bookings (excluding completed/cancelled):', relevantBookings.length);
      
      // Combine upcoming, active, and other relevant bookings
      const allBookings = [...upcomingBookings, ...activeBookings, ...relevantBookings];
      
      // Remove duplicates based on booking ID
      const uniqueBookings = allBookings.filter((booking, index, self) => 
        index === self.findIndex(b => b.id === booking.id)
      );
      console.log('📋 Unique bookings after deduplication:', uniqueBookings.length);
      
      // Convert to ScheduleItem format
      const scheduleItems: ScheduleItem[] = uniqueBookings.map(booking => ({
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

  // Check if a booking session can be started
  const canStartSession = (booking: ScheduleItem) => {
    try {
      // Only confirmed bookings can be started
      if (booking.status !== 'confirmed') {
        console.log(`📅 Booking ${booking.id} cannot start: status is ${booking.status}, not 'confirmed'`);
        return false;
      }

      const now = new Date();
      const bookingDate = new Date(booking.date);
      
      // Check if the booking is for today or in the past (allow starting late)
      const today = new Date();
      const isToday = bookingDate.toDateString() === today.toDateString();
      const isPast = bookingDate < today;
      
      if (!isToday && !isPast) {
        console.log(`📅 Booking ${booking.id} is in the future (${bookingDate.toDateString()}), cannot start yet`);
        return false;
      }
      
      // Get start time
      const startTime = booking.startTime || booking.time;
      if (!startTime) {
        console.log(`📅 Booking ${booking.id} cannot start: no start time`);
        return false;
      }
      
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
      
      // Allow starting session if it's today or in the past (no time restrictions)
      const canStart = isToday || isPast;
      
      console.log(`📅 Booking ${booking.id} can start: ${canStart} (today: ${isToday}, past: ${isPast})`);
      
      return canStart;
    } catch (error) {
      console.error('Error checking if session can start:', error);
      return false;
    }
  };

  // Check if a session is past its start time (for late starts)
  const isSessionPastStartTime = (booking: ScheduleItem) => {
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
      
      // Check if current time is past the start time
      return now > startDateTime;
    } catch (error) {
      console.error('Error checking if session is past start time:', error);
      return false;
    }
  };

  // Check if a booking can be marked as completed
  const canCompleteSession = (booking: ScheduleItem) => {
    // Must be active status - this is the key requirement
    if (booking.status !== 'active') {
      console.log(`📅 Booking ${booking.id} cannot be completed: status is ${booking.status}, not 'active'`);
      return false;
    }

    // Once a session is active, it can always be marked as completed
    // The sitter can complete it at any time during or after the session
    console.log(`📅 Booking ${booking.id} can be completed: session is active`);
    return true;
  };

  // Check if session is still ongoing (active but not yet at end time)
  const isSessionOngoing = (booking: ScheduleItem) => {
    if (booking.status !== 'active') {
      return false;
    }

    try {
      const now = new Date();
      const bookingDate = new Date(booking.date);
      
      // Get end time
      const endTime = booking.endTime || booking.time;
      if (!endTime) return false;
      
      // Parse end time
      let cleanTime = endTime;
      if (endTime.includes('T')) {
        const timeMatch = endTime.match(/(\d{1,2}):(\d{2})/);
        if (timeMatch) {
          cleanTime = `${timeMatch[1]}:${timeMatch[2]}`;
        }
      }
      
      const [hours, minutes] = cleanTime.split(':');
      const endDateTime = new Date(bookingDate);
      endDateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
      
      // Session is ongoing if current time is before end time
      return now < endDateTime;
    } catch (error) {
      console.error('Error checking if session is ongoing:', error);
      return false;
    }
  };

  // Start session using the new API endpoint
  const handleStartSession = async (item: ScheduleItem) => {
    console.log('🚀 Starting session for booking:', item.id);
    console.log('👤 Pet Owner:', item.petOwnerName);
    console.log('🐕 Pet Name:', item.petName);
    
    try {
      // Call the new start session API endpoint
      const { makeApiCall } = await import('../../services/networkService');
      const user = await authService.getCurrentUser();
      const token = user?.token;
      
      if (!token) {
        throw new Error('No authentication token available');
      }
      
      const response = await makeApiCall(`/api/bookings/${item.id}/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to start session');
      }

      const result = await response.json();
      console.log('✅ Session started successfully:', result);
      
      // Create notification for the pet owner
      const { notificationService } = await import('../../services/notificationService');
      await notificationService.createSessionStartedNotification({
        bookingId: item.id,
        petOwnerId: item.petOwnerId,
        petOwnerName: item.petOwnerName,
        sitterId: item.sitterId,
        sitterName: item.sitterName || 'Pet Sitter',
        date: item.date,
        startDate: item.startDate,
        endDate: item.endDate,
        startTime: item.startTime,
        endTime: item.endTime,
        hourlyRate: item.hourlyRate,
        isWeekly: item.isWeekly || false
      });
      
      // Refresh the schedule to show updated status
      loadSchedule();
      
      // Refresh booking service data to notify other screens
      const { bookingService } = await import('../../services/bookingService');
      const updatedBookings = await bookingService.getBookings();
      // This will trigger the subscription callbacks
      
      // Show success notification to sitter
      alert('✅ Session started successfully! The pet owner has been notified.');
      console.log('✅ Session started successfully');
    } catch (error) {
      console.error('❌ Error starting session:', error);
      // Show error message to user
      alert(`Failed to start session: ${error.message}`);
    }
  };

  // Complete session using the new API endpoint
  const handleCompleteSession = async (item: ScheduleItem) => {
    console.log('🏁 Completing session for booking:', item.id);
    
    // Check if session is still ongoing
    if (isSessionOngoing(item)) {
      const endTime = formatTimeForDisplay(item.endTime || item.time || '');
      alert(`⏰ Session is still ongoing!\n\nThe session is scheduled to end at ${endTime}. Please wait until the session time is completed before marking it as finished.`);
      return;
    }
    
    try {
      // Call the new complete session API endpoint
      const { makeApiCall } = await import('../../services/networkService');
      const user = await authService.getCurrentUser();
      const token = user?.token;
      
      if (!token) {
        throw new Error('No authentication token available');
      }
      
      const response = await makeApiCall(`/api/bookings/${item.id}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to complete session');
      }

      const result = await response.json();
      console.log('✅ Session completed successfully:', result);
      
      // Refresh the schedule to show updated status
      loadSchedule();
      
      // Refresh booking service data to notify other screens
      const { bookingService } = await import('../../services/bookingService');
      const updatedBookings = await bookingService.getBookings();
      // This will trigger the subscription callbacks
      
      // Show success notification to sitter
      alert('✅ Session completed successfully! The pet owner has been notified.');
      console.log('✅ Session completed successfully');
      
    } catch (error) {
      console.error('❌ Error completing session:', error);
      // Show error message to user
      alert(`Failed to complete session: ${error.message}`);
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
            filteredSchedule.map((item) => {
              console.log('🎨 Rendering booking item:', item.id, 'status:', item.status, 'date:', item.date);
              return (
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
                  <View style={styles.buttonRow}>
                    <TouchableOpacity 
                      style={styles.startButton}
                      onPress={() => handleStartSession(item)}
                    >
                      <Ionicons name="play-circle" size={16} color="#fff" />
                      <Text style={styles.buttonText}>Start Session</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={styles.completeButton}
                      onPress={() => handleCompleteSession(item)}
                    >
                      <Ionicons name="checkmark-circle" size={16} color="#fff" />
                      <Text style={styles.buttonText}>Mark as Completed</Text>
                    </TouchableOpacity>
                  </View>
                  
                  {/* Status Message */}
                  {item.status === 'active' && (
                    <View style={styles.ongoingContainer}>
                      <Text style={styles.ongoingText}>
                        ⏰ Session in progress - ends at {formatTimeForDisplay(item.endTime || item.time || '')}
                      </Text>
                    </View>
                  )}
                  
                  {/* Status message removed - buttons provide the functionality now */}
                  
                  {/* Pending Status Message - No longer needed since bookings are auto-confirmed */}
                  {item.status === 'pending' && (
                    <View style={styles.waitingContainer}>
                      <Text style={styles.waitingText}>Booking confirmed automatically</Text>
                    </View>
                  )}
                </View>
              </View>
              );
            })
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
    marginTop: 15,
    paddingHorizontal: 5,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  startButton: {
    flex: 1,
    backgroundColor: '#10B981',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  completeButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  disabledButton: {
    backgroundColor: '#E5E7EB',
    opacity: 0.6,
  },
  disabledButtonText: {
    color: '#9CA3AF',
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
  ongoingContainer: {
    flex: 1,
    backgroundColor: '#FEF3C7',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  ongoingText: {
    color: '#92400E',
    fontSize: 12,
    fontWeight: '600',
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