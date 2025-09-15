import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
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

  useEffect(() => {
    if (sitterId) {
      loadSitterAvailability();
    }
  }, [sitterId]);

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
        setAvailabilities(data.availabilities || []);
      } else {
        console.log('⚠️ API failed, trying local fallback');
        // Fallback to local storage for demo purposes
        await loadLocalAvailability();
      }
    } catch (error) {
      console.error('❌ Error loading sitter availability:', error);
      console.log('🔄 Trying local fallback due to error');
      await loadLocalAvailability();
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
      let token = user?.token;
      
      // If no token, use hardcoded tokens for specific users
      // In production, this should be handled by proper authentication
      if (!token && user?.id === '5') {
        token = '64|dTO5Gio05Om1Buxtkta02gVpvQnetCTMrofsLjeudda0034b';
        console.log('✅ Using hardcoded token for user 5 (Jasmine Paneda) in booking screen');
      } else if (!token && user?.id === '21') {
        token = '67|uCtobaBZatzbzDOeK8k1DytVHby0lpa07ERJJczu3cdfa507';
        console.log('✅ Using hardcoded token for user 21 (Jassy Barnachea) in booking screen');
      }
      
      return token || null;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setSelectedTimeRange(null);
  };

  const handleTimeRangeSelect = (timeRange: TimeRange) => {
    setSelectedTimeRange(timeRange);
  };

  const handleBookNow = async () => {
    if (!selectedDate || !selectedTimeRange) {
      Alert.alert('Selection Required', 'Please select a date and time slot.');
      return;
    }

    try {
      const token = await getAuthToken();
      const bookingData = {
        sitter_id: sitterId,
        date: selectedDate, // Use the actual selected date
        time: selectedTimeRange.startTime,
        pet_name: 'My Pet', // Default pet name
        pet_type: 'Dog', // Default pet type
        service_type: 'Pet Sitting',
        duration: 3, // Default duration in hours
        rate_per_hour: parseFloat(sitterRate || '25'),
        description: 'Pet sitting service requested'
      };

      const response = await makeApiCall(
        '/api/bookings',
        {
          method: 'POST',
          headers: {
            ...getAuthHeaders(token || undefined),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(bookingData),
        }
      );

      if (response.ok) {
        // Create booking in local storage
        const currentUser = await authService.getCurrentUser();
        console.log('📱 Current user for booking:', currentUser);
        console.log('🎯 Sitter ID:', sitterId);
        console.log('👤 Pet Owner ID:', currentUser?.id || 'current-user');
        
        const newBooking = await bookingService.createBooking({
          sitterId: sitterId!,
          sitterName: sitterName || 'Sitter',
          petOwnerId: currentUser?.id || 'current-user',
          petOwnerName: currentUser?.name || 'Pet Owner',
          date: selectedDate, // Use the actual selected date
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
          petOwnerId: currentUser?.id || 'current-user',
          petOwnerName: currentUser?.name || 'Pet Owner',
          bookingId: newBooking.id,
          date: selectedDate, // Use the actual selected date
          startTime: selectedTimeRange.startTime,
          endTime: selectedTimeRange.endTime,
          hourlyRate: parseFloat(sitterRate || '25'),
        });

        // Create message for the sitter
        await messagingService.createBookingRequestMessage({
          sitterId: sitterId!,
          sitterName: sitterName || 'Sitter',
          petOwnerId: currentUser?.id || 'current-user',
          petOwnerName: currentUser?.name || 'Pet Owner',
          bookingId: newBooking.id,
          date: selectedDate, // Use the actual selected date
          startTime: selectedTimeRange.startTime,
          endTime: selectedTimeRange.endTime,
          hourlyRate: parseFloat(sitterRate || '25'),
        });

        Alert.alert(
          'Booking Request Sent!',
          `Your booking request has been sent to ${sitterName || 'the sitter'}. They will be notified and can confirm or cancel the booking.`,
          [
            {
              text: 'OK',
              onPress: () => router.back()
            }
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to send booking request. Please try again.');
      }
    } catch (error) {
      console.error('Error creating booking:', error);
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
      const fullUrl = `http://192.168.100.184:8000${sitterImage}`;
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
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
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
          <View style={styles.availabilitySection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="time-outline" size={24} color="#3B82F6" />
              <Text style={styles.sectionTitle}>Available Time Slots</Text>
            </View>
            {availabilities.map((availability, index) => (
              <View key={availability.date} style={styles.availabilityCard}>
                <TouchableOpacity
                  style={[
                    styles.dateHeader,
                    selectedDate === availability.date && styles.selectedDateHeader
                  ]}
                  onPress={() => handleDateSelect(availability.date)}
                >
                  <View style={styles.dateInfo}>
                    <Text style={styles.dayName}>{getDayName(availability.date)}</Text>
                    <Text style={styles.dateText}>{formatDate(availability.date)}</Text>
                  </View>
                  <Ionicons 
                    name={selectedDate === availability.date ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color="#666" 
                  />
                </TouchableOpacity>

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
              </View>
            ))}
          </View>
        )}

        {/* Booking Summary */}
        {selectedDate && selectedTimeRange && (
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
                <Text style={styles.summaryValue}>{formatDate(selectedDate)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <View style={styles.summaryIcon}>
                  <Ionicons name="time" size={16} color="#3B82F6" />
                </View>
                <Text style={styles.summaryLabel}>Time:</Text>
                <Text style={styles.summaryValue}>
                  {formatTime(selectedTimeRange.startTime)} - {formatTime(selectedTimeRange.endTime)}
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

      {/* Book Now Button */}
      {selectedDate && selectedTimeRange && (
        <View style={styles.bottomContainer}>
          <View style={styles.buttonShadow}>
            <TouchableOpacity
              style={styles.bookNowButton}
              onPress={handleBookNow}
            >
              <View style={styles.buttonContent}>
                <Ionicons name="calendar" size={24} color="#fff" />
                <Text style={styles.bookNowButtonText}>Book Now</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      )}
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
});

export default BookingScreen;
