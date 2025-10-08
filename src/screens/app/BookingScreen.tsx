import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    Image,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { getAuthHeaders } from '../../constants/config';
import authService from '../../services/authService';
import { bookingService } from '../../services/bookingService';
import { messagingService } from '../../services/messagingService';
import { makeApiCall } from '../../services/networkService';
import { notificationService } from '../../services/notificationService';

interface TimeRange {
  id: string;
  startTime: string;
  endTime: string;
}

interface SitterAvailability {
  date: string;
  timeRanges: TimeRange[];
}

const BookingScreen: React.FC = () => {
  const router = useRouter();
  const { sitterId, sitterName, sitterRate, sitterImage } = useLocalSearchParams<{
    sitterId: string;
    sitterName: string;
    sitterRate: string;
    sitterImage?: string;
  }>();
  const [availabilities, setAvailabilities] = useState<SitterAvailability[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange | null>(null);
  const [loading, setLoading] = useState(true);
  const [sitterIsOnline, setSitterIsOnline] = useState<boolean>(true);

  useEffect(() => {
    if (sitterId) {
      loadSitterAvailability();
      checkSitterAvailabilityStatus();
    }
  }, [sitterId]);

  // Set up periodic availability status checks for real-time updates
  useEffect(() => {
    if (!sitterId) return;
    
    const interval = setInterval(() => {
      checkSitterAvailabilityStatus();
    }, 30000); // Check every 30 seconds (less frequent to avoid conflicts)
    
    return () => clearInterval(interval);
  }, [sitterId]);

  // Refresh data when screen comes into focus (to get latest data after deletions)
  useFocusEffect(
    useCallback(() => {
      if (sitterId) {
        console.log('🔄 BookingScreen focused, refreshing availability data');
        loadSitterAvailability();
        // Check for real-time availability updates
        checkSitterAvailabilityStatus();
      }
    }, [sitterId])
  );


  // Check sitter's availability status for real-time updates
  const checkSitterAvailabilityStatus = async () => {
    try {
      if (!sitterId) return;
      
      console.log('📊 Checking sitter availability status for real-time updates...');
      
      // Get the sitter's current availability status from the backend
      const token = await getAuthToken();
      if (!token) return;
      
      // Try to get sitter's online status from the realtime location service
      try {
        const response = await makeApiCall(
          `/api/sitters/${sitterId}/availability-status`,
          {
            method: 'GET',
            headers: getAuthHeaders(token),
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          const isAvailable = data.is_online || false;
          
          console.log('📊 Sitter availability status:', isAvailable ? 'ONLINE' : 'OFFLINE');
          
          // Update the online status state
          setSitterIsOnline(isAvailable);
          
          // If sitter is online and we don't have availability data, reload it
          if (isAvailable && availabilities.length === 0) {
            console.log('📊 Sitter is online but no availability data, reloading...');
            await loadSitterAvailability();
          }
        } else {
          console.log('⚠️ Availability status endpoint not available, falling back to normal data loading');
          // If the endpoint doesn't exist, just reload the availability data normally
          setSitterIsOnline(true); // Assume online if we can't check
          await loadSitterAvailability();
        }
      } catch (apiError) {
        console.log('⚠️ Availability status check failed, falling back to normal data loading:', apiError);
        // If the endpoint doesn't exist or fails, just reload the availability data normally
        await loadSitterAvailability();
      }
    } catch (error) {
      console.error('❌ Error checking sitter availability status:', error);
      // Fallback to normal data loading
      await loadSitterAvailability();
    }
  };

  // Helper function to validate time ranges
  const isValidTimeRange = (timeRange: TimeRange): boolean => {
    if (!timeRange || !timeRange.startTime || !timeRange.endTime) {
      return false;
    }
    
    const parseTime = (timeStr: string) => {
      if (timeStr.includes('AM') || timeStr.includes('PM')) {
        const [time, period] = timeStr.split(' ');
        const [hours, minutes] = time.split(':');
        let hour24 = parseInt(hours, 10);
        
        if (period === 'PM' && hour24 !== 12) {
          hour24 += 12;
        } else if (period === 'AM' && hour24 === 12) {
          hour24 = 0;
        }
        
        return `${hour24.toString().padStart(2, '0')}:${minutes}`;
      }
      return timeStr;
    };
    
    try {
      const start24 = parseTime(timeRange.startTime);
      const end24 = parseTime(timeRange.endTime);
      
      const start = new Date(`2000-01-01T${start24}:00`);
      const end = new Date(`2000-01-01T${end24}:00`);
      
      // Handle case where end time is next day (e.g., 11 PM to 2 AM)
      if (end <= start) {
        end.setDate(end.getDate() + 1);
      }
      
      const diffMs = end.getTime() - start.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      
      // Valid if duration is at least 0.5 hours (30 minutes)
      return diffHours >= 0.5;
    } catch (error) {
      console.error('Error validating time range:', error);
      return false;
    }
  };


  useEffect(() => {
    console.log('📅 Availabilities updated:', availabilities.length, 'items');
    console.log('📅 Availabilities data:', availabilities);
  }, [availabilities]);

  const loadSitterAvailability = async () => {
    try {
      setLoading(true);
      console.log('🔍 Loading availability for sitter:', sitterId);
      
      const token = await getAuthToken();
      const response = await makeApiCall(
        `/api/sitters/${sitterId}/availability`,
        {
          method: 'GET',
          headers: getAuthHeaders(token || undefined),
        }
      );

      console.log('📡 API Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('📅 API Response data:', data);
        
        // Filter out past dates - only show today and future dates
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const futureAvailabilities = (data.availabilities || []).filter((availability: SitterAvailability) => {
          const availabilityDate = new Date(availability.date);
          availabilityDate.setHours(0, 0, 0, 0);
          const isFutureOrToday = availabilityDate >= today;
          
          if (!isFutureOrToday) {
            console.log('🗑️ Filtering out past date:', availability.date);
          }
          
          return isFutureOrToday;
        });
        
        console.log('📅 Filtered availabilities (future only):', futureAvailabilities.length);
        setAvailabilities(futureAvailabilities);
      } else {
        console.log('⚠️ API failed, no availability data found for this sitter');
        // Don't fallback to local data - only show sitters with actual availability
        setAvailabilities([]);
      }
    } catch (error) {
      console.error('❌ Error loading sitter availability:', error);
      console.log('❌ No availability data available for this sitter');
      // Don't fallback to local data - only show sitters with actual availability
      setAvailabilities([]);
    } finally {
      setLoading(false);
    }
  };

  const loadLocalAvailability = async () => {
    try {
      console.log('🔄 Loading local availability data...');
      const savedData = await AsyncStorage.getItem('petSitterAvailabilities');
      console.log('💾 Local data found:', !!savedData);
      
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        console.log('📊 Parsed local data:', parsedData);
        const availabilityArray = Object.entries(parsedData).map(([date, timeRanges]) => ({
          date,
          timeRanges: timeRanges as TimeRange[]
        }));
        console.log('📅 Formatted availability:', availabilityArray);
        setAvailabilities(availabilityArray);
      } else {
        console.log('❌ No local availability data found');
        setAvailabilities([]);
      }
    } catch (error) {
      console.error('❌ Error loading local availability:', error);
      setAvailabilities([]);
    }
  };


  const getAuthToken = async (): Promise<string | null> => {
    try {
      const user = await authService.getCurrentUser();
      const token = user?.token;
      
      console.log('🔑 BookingScreen - Getting auth token for user:', user?.id);
      console.log('🔑 BookingScreen - User token:', token ? 'Present' : 'Missing');
      
      if (!token) {
        console.error('❌ BookingScreen - No authentication token available for user:', user?.id);
        console.log('❌ User needs to be properly authenticated to make bookings');
        return null;
      }
      
      console.log('✅ BookingScreen - Using token for user:', user?.id);
      return token;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  };

  const handleDateSelect = (date: string) => {
    // Toggle selection - if already selected, deselect
    if (selectedDate === date) {
      setSelectedDate(null);
      setSelectedTimeRange(null);
    } else {
      setSelectedDate(date);
      setSelectedTimeRange(null);
    }
  };

  const handleTimeRangeSelect = (timeRange: TimeRange) => {
    // Toggle selection - if already selected, deselect
    if (selectedTimeRange?.id === timeRange.id) {
      setSelectedTimeRange(null);
    } else {
      setSelectedTimeRange(timeRange);
    }
  };





  const handleBookNow = async () => {
    if (!selectedDate || !selectedTimeRange) {
      Alert.alert('Selection Required', 'Please select a date and time slot.');
      return;
    }

    try {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        Alert.alert('Error', 'Please log in to make a booking');
        return;
      }
      
      console.log('📝 BookingScreen - Creating booking with data:', {
        sitterId,
        selectedDate,
        startTime: selectedTimeRange.startTime,
        endTime: selectedTimeRange.endTime,
        sitterRate
      });
      
      // Create booking using the service (which handles API call)
      const newBooking = await bookingService.createBooking({
        sitterId: sitterId!,
        sitterName: sitterName || 'Sitter',
        petOwnerId: currentUser.id,
        petOwnerName: currentUser.name || 'Pet Owner',
        date: selectedDate,
        startTime: selectedTimeRange.startTime,
        endTime: selectedTimeRange.endTime,
        hourlyRate: parseFloat(sitterRate || '25'),
        status: 'pending',
      });
      
      console.log('✅ New booking created:', newBooking);

      // Create notification for the sitter
      await notificationService.createBookingNotification({
        sitterId: sitterId!,
        sitterName: sitterName || 'Sitter',
        petOwnerId: currentUser.id,
        petOwnerName: currentUser.name || 'Pet Owner',
        bookingId: newBooking.id,
        date: selectedDate,
        startTime: selectedTimeRange.startTime,
        endTime: selectedTimeRange.endTime,
        hourlyRate: parseFloat(sitterRate || '25'),
      });

      // Create message for the sitter
      await messagingService.createBookingRequestMessage({
        sitterId: sitterId!,
        sitterName: sitterName || 'Sitter',
        petOwnerId: currentUser.id,
        petOwnerName: currentUser.name || 'Pet Owner',
        bookingId: newBooking.id,
        date: selectedDate,
        startTime: selectedTimeRange.startTime,
        endTime: selectedTimeRange.endTime,
        hourlyRate: parseFloat(sitterRate || '25'),
      });

      // Calculate duration in minutes
      const startTimeMinutes = selectedTimeRange.startTime.split(':').reduce((acc, time) => (60 * acc) + +time, 0);
      const endTimeMinutes = selectedTimeRange.endTime.split(':').reduce((acc, time) => (60 * acc) + +time, 0);
      const duration = endTimeMinutes - startTimeMinutes;

      // Redirect to booking summary screen for payment
      router.push({
        pathname: '/booking-summary',
        params: {
          bookingId: newBooking.id.toString(),
          sitterId: sitterId,
          sitterName: sitterName,
          sitterImage: sitterImage,
          sitterRate: sitterRate,
          selectedDate: selectedDate,
          startTime: selectedTimeRange.startTime,
          endTime: selectedTimeRange.endTime,
          petName: 'My Pet', // Default pet name
          petType: 'Dog', // Default pet type
          serviceType: 'Pet Sitting',
          duration: duration.toString(),
          description: 'Pet sitting service',
        },
      });
    } catch (error) {
      console.error('❌ BookingScreen - Error creating booking:', error);
      Alert.alert('Error', 'Failed to send booking request. Please try again.');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getDayName = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  };

  // Helper function to get proper image source
  const getImageSource = () => {
    console.log('🖼️ BookingScreen - Getting image source for sitterImage:', sitterImage);
    
    if (!sitterImage) {
      console.log('🖼️ BookingScreen - No sitterImage, using default avatar');
      return require('../../assets/images/default-avatar.png');
    }
    
    // If it's a URL (starts with http), use it directly
    if (typeof sitterImage === 'string' && (sitterImage.startsWith('http') || sitterImage.startsWith('https'))) {
      console.log('🖼️ BookingScreen - Using HTTP URL:', sitterImage);
      return { uri: sitterImage };
    }
    
    // If it's a storage path (starts with /storage/), construct full URL
    if (typeof sitterImage === 'string' && sitterImage.startsWith('/storage/')) {
      const { networkService } = require('../../services/networkService');
      const fullUrl = networkService.getImageUrl(sitterImage);
      console.log('🖼️ BookingScreen - Using storage path, full URL:', fullUrl);
      return { uri: fullUrl };
    }
    
    // For any other string (local paths), treat as URI
    if (typeof sitterImage === 'string') {
      console.log('🖼️ BookingScreen - Using string as URI:', sitterImage);
      return { uri: sitterImage };
    }
    
    // Default fallback
    console.log('🖼️ BookingScreen - Using default fallback');
    return require('../../assets/images/default-avatar.png');
  };

  // Helper function to format time to AM/PM
  const formatTime = (time24: string) => {
    console.log('⏰ BookingScreen - Formatting time:', time24);
    
    // Check if time already has AM/PM (to avoid duplication)
    if (time24.includes('AM') || time24.includes('PM')) {
      console.log('⏰ BookingScreen - Time already has AM/PM, returning as is:', time24);
      return time24;
    }
    
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    const formattedTime = `${hour12}:${minutes} ${ampm}`;
    
    console.log('⏰ BookingScreen - Formatted time:', formattedTime);
    return formattedTime;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.headerContainer}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#1F2937" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Book {sitterName || 'Sitter'}</Text>
            <View style={styles.headerSpacer} />
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading availability...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Gradient Background */}
      <View style={styles.headerContainer}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Book {sitterName || 'Sitter'}</Text>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* Sitter Info Card with Enhanced Design */}
        <View style={styles.sitterInfoCard}>
          <View style={styles.sitterInfoHeader}>
            <View style={styles.sitterAvatar}>
              <Image 
                source={getImageSource()} 
                style={styles.avatarImage}
                onError={(error) => {
                  console.log('❌ BookingScreen - Sitter image failed to load:', error.nativeEvent.error);
                  console.log('❌ BookingScreen - Image source was:', getImageSource());
                }}
                onLoad={() => {
                  console.log('✅ BookingScreen - Sitter image loaded successfully');
                }}
                defaultSource={require('../../assets/images/default-avatar.png')}
                resizeMode="cover"
              />
            </View>
            <View style={styles.sitterInfo}>
              <Text style={styles.sitterName}>{sitterName || 'Sitter'}</Text>
            </View>
            <View style={styles.rateContainer}>
              <Text style={styles.sitterRate}>₱{sitterRate || '25'}</Text>
              <Text style={styles.rateUnit}>/hour</Text>
            </View>
          </View>
          <View style={styles.instructionContainer}>
            <Ionicons name="calendar-outline" size={20} color="#3B82F6" />
            <Text style={styles.sitterInfoText}>Select your preferred date and time slot</Text>
          </View>
        </View>

        {/* Availability List */}
        {availabilities.length === 0 ? (
          <View style={styles.noAvailabilityContainer}>
            <View style={styles.noAvailabilityIcon}>
              <Ionicons name="calendar-outline" size={64} color="#E5E7EB" />
            </View>
            <Text style={styles.noAvailabilityText}>No availability set</Text>
            <Text style={styles.noAvailabilitySubtext}>
              This sitter hasn't set their availability yet.
            </Text>
            <View style={styles.noAvailabilityAction}>
              <Ionicons name="refresh" size={16} color="#F59E0B" />
              <Text style={styles.refreshText}>Pull to refresh</Text>
            </View>
          </View>
        ) : (
          <>

            {/* Daily Availability Cards */}
            {!sitterIsOnline && (
              <View style={styles.availabilitySection}>
                <View style={styles.sitterOfflineMessage}>
                  <Ionicons name="eye-off" size={24} color="#6B7280" />
                  <Text style={styles.sitterOfflineText}>
                    Schedules are hidden because this sitter is currently offline
                  </Text>
                  <Text style={styles.sitterOfflineSubtext}>
                    Schedules will appear when the sitter comes back online
                  </Text>
                </View>
              </View>
            )}
            {sitterIsOnline && availabilities.length > 0 && (
              <View style={styles.availabilitySection}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="time-outline" size={24} color="#3B82F6" />
                  <Text style={styles.sectionTitle}>Daily Availability</Text>
                </View>
                {availabilities.map((availability, index) => {
                  const cardColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];
                  const cardColor = cardColors[index % cardColors.length];
                  
                  return (
                    <TouchableOpacity
                      key={availability.date}
                      style={[
                        styles.dailyAvailabilityCard,
                        { backgroundColor: cardColor },
                        selectedDate === availability.date && styles.selectedDailyCard
                      ]}
                      onPress={() => handleDateSelect(availability.date)}
                    >
                    <View style={styles.dailyCardHeader}>
                      <View style={styles.dailyDateContainer}>
                        <Ionicons name="calendar" size={20} color="#fff" />
                        <View style={styles.dailyDateTextContainer}>
                          <Text style={styles.dailyDateText}>{formatDate(availability.date)}</Text>
                          <Text style={styles.dailyDayText}>{getDayName(availability.date)}</Text>
                        </View>
                      </View>
                      <View style={styles.dailyBadge}>
                        <Text style={styles.dailyBadgeText}>DAILY</Text>
                      </View>
                    </View>
                    <View style={styles.dailyCardFooter}>
                      <View style={styles.dailyStats}>
                        <Ionicons name="time" size={16} color="#fff" />
                        <Text style={styles.dailyStatsText}>
                          {availability.timeRanges.length} time slot{availability.timeRanges.length > 1 ? 's' : ''} available
                        </Text>
                      </View>
                      <Ionicons 
                        name={selectedDate === availability.date ? "chevron-up" : "chevron-down"} 
                        size={20} 
                        color="#fff" 
                      />
                    </View>
                    
                    {selectedDate === availability.date && (
                      <View style={styles.timeSlotsContainer}>
                        {availability.timeRanges.map((timeRange, timeIndex) => (
                          <TouchableOpacity
                            key={timeIndex}
                            style={[
                              styles.timeSlot,
                              selectedTimeRange?.id === timeRange.id && styles.selectedTimeSlot
                            ]}
                            onPress={() => handleTimeRangeSelect(timeRange)}
                          >
                            <Text style={[
                              styles.timeSlotText,
                              selectedTimeRange?.id === timeRange.id && styles.selectedTimeSlotText
                            ]}>
                              {formatTime(timeRange.startTime)} - {formatTime(timeRange.endTime)}
                            </Text>
                            {selectedTimeRange?.id === timeRange.id && (
                              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                            )}
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </>
        )}

        {/* Booking Summary */}
        {(() => {
          const shouldShowSummary = selectedDate && selectedTimeRange;
          console.log('🔄 Booking summary check:', {
            selectedDate,
            selectedTimeRange,
            shouldShowSummary
          });
          return shouldShowSummary;
        })() && (
          <View style={styles.bookingSummary}>
            <View style={styles.summaryHeader}>
              <Ionicons name="checkmark-circle" size={24} color="#10B981" />
              <Text style={styles.summaryTitle}>Booking Summary</Text>
            </View>
            <View style={styles.summaryContent}>
              <View style={styles.summaryRow}>
                <View style={styles.summaryIcon}>
                  <Ionicons name="person" size={16} color="#3B82F6" />
                </View>
                <Text style={styles.summaryLabel}>Sitter:</Text>
                <Text style={styles.summaryValue}>{sitterName || 'Sitter'}</Text>
              </View>
              
              <View style={styles.summaryRow}>
                <View style={styles.summaryIcon}>
                  <Ionicons name="calendar" size={16} color="#3B82F6" />
                </View>
                <Text style={styles.summaryLabel}>Date:</Text>
                <Text style={styles.summaryValue}>{formatDate(selectedDate!)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <View style={styles.summaryIcon}>
                  <Ionicons name="time" size={16} color="#3B82F6" />
                </View>
                <Text style={styles.summaryLabel}>Time:</Text>
                <Text style={styles.summaryValue}>
                  {formatTime(selectedTimeRange!.startTime)} - {formatTime(selectedTimeRange!.endTime)}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <View style={styles.summaryIcon}>
                  <Ionicons name="cash" size={16} color="#3B82F6" />
                </View>
                <Text style={styles.summaryLabel}>Rate:</Text>
                <Text style={styles.summaryValue}>₱{sitterRate || '25'}/hour</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Booking Options */}
      <View style={styles.bottomContainer}>
        {/* Book Now Button */}
        {(() => {
          const shouldShowButton = selectedDate && selectedTimeRange;
          console.log('🔄 Book Now button check:', {
            selectedDate,
            selectedTimeRange,
            shouldShowButton
          });
          return shouldShowButton;
        })() && (
          <View style={styles.buttonShadow}>
            <TouchableOpacity
              style={styles.bookNowButton}
              onPress={handleBookNow}
            >
              <View style={styles.buttonContent}>
                <Ionicons name="calendar" size={24} color="#fff" />
                <Text style={styles.bookNowButtonText}>
                  Book Now
                </Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </View>
            </TouchableOpacity>
          </View>
        )}
      </View>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  headerContainer: {
    backgroundColor: '#fff',
    paddingTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  headerSpacer: {
    width: 24,
  },
  backButton: {
    position: 'absolute',
    left: 16,
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    zIndex: 1,
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
  content: {
    flex: 1,
    padding: 16,
  },
  sitterInfoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  sitterInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sitterAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  sitterInfo: {
    flex: 1,
  },
  sitterName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 4,
  },
  reviewsText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  rateContainer: {
    alignItems: 'flex-end',
  },
  sitterRate: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10B981',
  },
  rateUnit: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: -2,
  },
  instructionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  sitterInfoText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
    fontStyle: 'italic',
  },
  noAvailabilityContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  noAvailabilityIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  noAvailabilityText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  noAvailabilitySubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  noAvailabilityAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#EFF6FF',
    borderRadius: 20,
  },
  refreshText: {
    fontSize: 12,
    color: '#3B82F6',
    marginLeft: 4,
    fontWeight: '500',
  },
  availabilitySection: {
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginLeft: 8,
  },
  availabilityCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8F9FA',
  },
  selectedDateHeader: {
    backgroundColor: '#E8F5E8',
  },
  dateInfo: {
    flex: 1,
  },
  dayName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  dateText: {
    fontSize: 14,
    color: '#666',
    marginTop: 12,
  },
  timeSlotsContainer: {
    padding: 16,
    paddingTop: 12,
  },
  timeSlot: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  selectedTimeSlot: {
    backgroundColor: '#E8F5E8',
    borderColor: '#10B981',
  },
  timeSlotText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  selectedTimeSlotText: {
    color: '#10B981',
    fontWeight: 'bold',
  },
  bookingSummary: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginLeft: 8,
  },
  summaryContent: {
    paddingTop: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
    width: 60,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  bottomContainer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonShadow: {
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  bookNowButton: {
    backgroundColor: '#10B981',
    borderRadius: 16,
    overflow: 'hidden',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
    gap: 12,
  },
  bookNowButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  weekBookingModal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    flexDirection: 'column',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  weekSelectionContainer: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  weekButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  weekButton: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    flex: 1,
    minWidth: '45%',
  },
  weekButtonSelected: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  weekButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
  },
  weekButtonTextSelected: {
    color: '#fff',
  },
  timeSelectionContainer: {
    marginBottom: 24,
  },
  timeRangesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeRangeButton: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    flex: 1,
    minWidth: '45%',
  },
  timeRangeButtonSelected: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  timeRangeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
  },
  timeRangeButtonTextSelected: {
    color: '#fff',
  },
  timeRangeButtonDisabled: {
    backgroundColor: '#F3F4F6',
    borderColor: '#D1D5DB',
    opacity: 0.5,
  },
  timeRangeButtonTextDisabled: {
    color: '#9CA3AF',
  },
  pricingContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  pricingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  pricingLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  pricingValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 8,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10B981',
  },
  discountRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  discountText: {
    fontSize: 12,
    color: '#10B981',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  noTimeRangesContainer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  noTimeRangesText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  weeklyAvailabilityCard: {
    backgroundColor: '#8B5CF6',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  selectedWeeklyCard: {
    borderWidth: 2,
    borderColor: '#10B981',
  },
  weeklyCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  weeklyDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  weeklyDateTextContainer: {
    marginLeft: 12,
  },
  weeklyDateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  weeklyTimeText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  weeklyBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  weeklyBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  weeklyCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  weeklyStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  weeklyStatsText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10B981',
  },
  // Daily Availability Card Styles
  dailyAvailabilityCard: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  selectedDailyCard: {
    borderWidth: 2,
    borderColor: '#10B981',
  },
  dailyCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dailyDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dailyDateTextContainer: {
    gap: 2,
  },
  dailyDateText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  dailyDayText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  dailyBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dailyBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  dailyCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  dailyStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dailyStatsText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  sitterOfflineMessage: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 20,
    margin: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  sitterOfflineText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  sitterOfflineSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default BookingScreen;

