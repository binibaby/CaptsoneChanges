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
  const [showWeekBooking, setShowWeekBooking] = useState(false);
  const [weekStartDate, setWeekStartDate] = useState<string | null>(null);
  const [weekEndDate, setWeekEndDate] = useState<string | null>(null);
  const [weekTimeRange, setWeekTimeRange] = useState<TimeRange | null>(null);
  const [hasWeekAvailability, setHasWeekAvailability] = useState(false);

  useEffect(() => {
    if (sitterId) {
      loadSitterAvailability();
    }
  }, [sitterId]);

  useEffect(() => {
    checkWeekAvailability();
  }, [availabilities]);

  const checkWeekAvailability = () => {
    console.log('🔍 Checking week availability for:', availabilities.length, 'availabilities');
    
    // For demo purposes, always show week booking if we have any availabilities
    if (availabilities.length > 0) {
      console.log('✅ Week booking available - showing button');
      setHasWeekAvailability(true);
      return;
    }

    if (availabilities.length < 7) {
      console.log('❌ Not enough availabilities for week booking:', availabilities.length);
      setHasWeekAvailability(false);
      return;
    }

    // Sort availabilities by date
    const sortedAvailabilities = [...availabilities].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Check for consecutive 7 days
    for (let i = 0; i <= sortedAvailabilities.length - 7; i++) {
      const weekStart = new Date(sortedAvailabilities[i].date);
      let isConsecutive = true;

      for (let j = 1; j < 7; j++) {
        const expectedDate = new Date(weekStart);
        expectedDate.setDate(weekStart.getDate() + j);
        const actualDate = new Date(sortedAvailabilities[i + j].date);

        if (expectedDate.toDateString() !== actualDate.toDateString()) {
          isConsecutive = false;
          break;
        }
      }

      if (isConsecutive) {
        console.log('✅ Found consecutive week starting:', weekStart);
        setHasWeekAvailability(true);
        return;
      }
    }

    console.log('❌ No consecutive week found');
    setHasWeekAvailability(false);
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

  const getAvailableWeeks = () => {
    console.log('📅 Getting available weeks for:', availabilities.length, 'availabilities');
    
    // Always return demo weeks for better user experience
    const demoWeeks = [];
    const today = new Date();
    
    for (let i = 0; i < 4; i++) {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() + (i * 7));
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      demoWeeks.push({
        startDate: weekStart.toISOString().split('T')[0],
        endDate: weekEnd.toISOString().split('T')[0],
        timeRanges: [
          {
            id: `demo-${i}-1`,
            startTime: '9:00 AM',
            endTime: '5:00 PM'
          },
          {
            id: `demo-${i}-2`,
            startTime: '10:00 AM',
            endTime: '6:00 PM'
          }
        ]
      });
    }
    
    console.log('📅 Returning demo weeks:', demoWeeks.length);
    return demoWeeks;
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
    setSelectedDate(date);
    setSelectedTimeRange(null);
  };

  const handleTimeRangeSelect = (timeRange: TimeRange) => {
    setSelectedTimeRange(timeRange);
  };

  const handleWeekBooking = async () => {
    if (!weekStartDate || !weekEndDate || !weekTimeRange || !sitterId) {
      Alert.alert('Error', 'Please select a week and time range');
      return;
    }

    try {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        Alert.alert('Error', 'Please log in to make a booking');
        return;
      }

      // Create bookings for each day of the week
      const startDate = new Date(weekStartDate);
      const endDate = new Date(weekEndDate);
      const bookings = [];

      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        
        const booking = await bookingService.createBooking({
          sitterId: sitterId,
          sitterName: sitterName || 'Sitter',
          petOwnerId: currentUser.id,
          petOwnerName: currentUser.name || 'Pet Owner',
          date: dateStr,
          startTime: weekTimeRange.startTime,
          endTime: weekTimeRange.endTime,
          hourlyRate: parseFloat(sitterRate || '25'),
          status: 'pending',
        });

        bookings.push(booking);

        // Create notification for each day
        await notificationService.createBookingNotification({
          sitterId: sitterId,
          sitterName: sitterName || 'Sitter',
          petOwnerId: currentUser.id,
          petOwnerName: currentUser.name || 'Pet Owner',
          bookingId: booking.id,
          date: dateStr,
          startTime: weekTimeRange.startTime,
          endTime: weekTimeRange.endTime,
          hourlyRate: parseFloat(sitterRate || '25'),
        });

        // Create message for each day
        await messagingService.createBookingRequestMessage({
          sitterId: sitterId,
          sitterName: sitterName || 'Sitter',
          petOwnerId: currentUser.id,
          petOwnerName: currentUser.name || 'Pet Owner',
          bookingId: booking.id,
          date: dateStr,
          startTime: weekTimeRange.startTime,
          endTime: weekTimeRange.endTime,
          hourlyRate: parseFloat(sitterRate || '25'),
        });
      }

      Alert.alert(
        'Week Booking Request Sent!',
        `Your booking request for ${bookings.length} days has been sent to ${sitterName}. You'll receive a notification when they respond.`,
        [
          {
            text: 'OK',
            onPress: () => {
              setShowWeekBooking(false);
              setWeekStartDate(null);
              setWeekEndDate(null);
              setWeekTimeRange(null);
              router.back();
            }
          }
        ]
      );

    } catch (error) {
      console.error('Error creating week booking:', error);
      Alert.alert('Error', 'Failed to create booking. Please try again.');
    }
  };

  const handleBookNow = async () => {
    if (!selectedDate || !selectedTimeRange) {
      Alert.alert('Selection Required', 'Please select a date and time slot.');
      return;
    }

    try {
      const token = await getAuthToken();
      
      if (!token) {
        Alert.alert('Authentication Error', 'Please log in again to make a booking.');
        return;
      }
      
      console.log('📝 BookingScreen - Creating booking with data:', {
        sitterId,
        selectedDate,
        startTime: selectedTimeRange.startTime,
        endTime: selectedTimeRange.endTime,
        sitterRate
      });
      
      // Convert 12-hour time to 24-hour format for backend
      const convertTo24Hour = (time12: string) => {
        console.log('⏰ Converting time to 24-hour format:', time12);
        
        // If already in 24-hour format (no AM/PM), return as is
        if (!time12.includes('AM') && !time12.includes('PM')) {
          console.log('⏰ Time already in 24-hour format:', time12);
          return time12;
        }
        
        const [time, period] = time12.split(' ');
        const [hours, minutes] = time.split(':');
        let hour24 = parseInt(hours, 10);
        
        if (period === 'PM' && hour24 !== 12) {
          hour24 += 12;
        } else if (period === 'AM' && hour24 === 12) {
          hour24 = 0;
        }
        
        const formattedTime = `${hour24.toString().padStart(2, '0')}:${minutes}`;
        console.log('⏰ Converted to 24-hour format:', formattedTime);
        return formattedTime;
      };

      const bookingData = {
        sitter_id: sitterId,
        date: selectedDate, // Use the actual selected date
        time: convertTo24Hour(selectedTimeRange.startTime), // Convert to 24-hour format
        pet_name: 'My Pet', // Default pet name
        pet_type: 'Dog', // Default pet type
        service_type: 'Pet Sitting',
        duration: 3, // Default duration in hours
        rate_per_hour: parseFloat(sitterRate || '25'),
        description: 'Pet sitting service requested'
      };

      console.log('📝 BookingScreen - Sending booking data:', bookingData);

      const response = await makeApiCall(
        '/api/bookings',
        {
          method: 'POST',
          headers: {
            ...getAuthHeaders(token),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(bookingData),
        }
      );

      console.log('📝 BookingScreen - Booking response status:', response.status);
      console.log('📝 BookingScreen - Booking response ok:', response.ok);

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
        console.error('❌ BookingScreen - Booking request failed with status:', response.status);
        const errorText = await response.text();
        console.error('❌ BookingScreen - Error response:', errorText);
        
        // Try to parse error as JSON for better error handling
        try {
          const errorData = JSON.parse(errorText);
          console.error('❌ BookingScreen - Parsed error data:', errorData);
          Alert.alert('Booking Error', errorData.message || 'Failed to send booking request. Please try again.');
        } catch (parseError) {
          console.error('❌ BookingScreen - Could not parse error response as JSON');
          Alert.alert('Error', 'Failed to send booking request. Please try again.');
        }
      }
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

      {/* Booking Options */}
      <View style={styles.bottomContainer}>
        {/* Book Whole Week Button */}
        <TouchableOpacity
          style={styles.weekBookingButton}
          onPress={() => router.push({
            pathname: '/week-booking',
            params: {
              sitterId: sitterId,
              sitterName: sitterName,
              sitterRate: sitterRate,
              sitterImage: sitterImage
            }
          })}
        >
          <View style={styles.buttonContent}>
            <Ionicons name="calendar-outline" size={24} color="#8B5CF6" />
            <Text style={styles.weekBookingButtonText}>Book Whole Week</Text>
            <Ionicons name="arrow-forward" size={20} color="#8B5CF6" />
          </View>
        </TouchableOpacity>

        {/* Regular Book Now Button */}
        {selectedDate && selectedTimeRange && (
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
        )}
      </View>

      {/* Week Booking Modal */}
      {showWeekBooking && (
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => {
              setShowWeekBooking(false);
              setWeekStartDate(null);
              setWeekEndDate(null);
              setWeekTimeRange(null);
            }}
          />
          <TouchableOpacity 
            style={styles.weekBookingModal}
            activeOpacity={1}
            onPress={(e) => {
              // Prevent modal from closing when clicking on modal content
              e.stopPropagation();
            }}
          >
            <Text style={styles.modalTitle}>Book Whole Week</Text>
            <Text style={styles.modalSubtitle}>Select your preferred week and time range</Text>
        
            {/* Week Selection */}
            <View style={styles.weekSelectionContainer}>
              <Text style={styles.sectionLabel}>Select Week</Text>
              <View style={styles.weekButtonsContainer}>
                {getAvailableWeeks().map((week, index) => {
                  const startDate = new Date(week.startDate);
                  const endDate = new Date(week.endDate);
                  
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.weekButton,
                        weekStartDate === week.startDate && styles.weekButtonSelected
                      ]}
                      onPress={() => {
                        setWeekStartDate(week.startDate);
                        setWeekEndDate(week.endDate);
                        // Reset time range selection when changing weeks
                        setWeekTimeRange(null);
                        // Use the first available time range for the week
                        if (week.timeRanges.length > 0) {
                          setWeekTimeRange(week.timeRanges[0]);
                        }
                      }}
                    >
                      <Text style={[
                        styles.weekButtonText,
                        weekStartDate === week.startDate && styles.weekButtonTextSelected
                      ]}>
                        {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Time Range Selection */}
            {weekStartDate && (
              <View style={styles.timeSelectionContainer}>
                <Text style={styles.sectionLabel}>Select Time Range</Text>
                <View style={styles.timeRangesContainer}>
                  {(() => {
                    const selectedWeek = getAvailableWeeks().find(week => week.startDate === weekStartDate);
                    console.log('🔍 Selected week:', selectedWeek);
                    console.log('🔍 Time ranges:', selectedWeek?.timeRanges);
                    
                    if (!selectedWeek || !selectedWeek.timeRanges || selectedWeek.timeRanges.length === 0) {
                      return (
                        <View style={styles.noTimeRangesContainer}>
                          <Text style={styles.noTimeRangesText}>No time ranges available for this week</Text>
                        </View>
                      );
                    }
                    
                    return selectedWeek.timeRanges.map((timeRange, index) => {
                      console.log('🔍 Time range:', timeRange);
                      
                      // Ensure time range has proper structure
                      const validTimeRange = {
                        id: timeRange.id || `time-${index}`,
                        startTime: timeRange.startTime || '9:00 AM',
                        endTime: timeRange.endTime || '5:00 PM'
                      };
                      
                      // Check if this time range is valid
                      const isValid = isValidTimeRange(validTimeRange);
                      
                      return (
                        <TouchableOpacity
                          key={validTimeRange.id}
                          style={[
                            styles.timeRangeButton,
                            weekTimeRange?.id === validTimeRange.id && styles.timeRangeButtonSelected,
                            !isValid && styles.timeRangeButtonDisabled
                          ]}
                          onPress={() => {
                            if (isValid) {
                              console.log('🔍 Selecting time range:', validTimeRange);
                              setWeekTimeRange(validTimeRange);
                            } else {
                              console.log('⚠️ Invalid time range, cannot select:', validTimeRange);
                            }
                          }}
                          disabled={!isValid}
                        >
                          <Text style={[
                            styles.timeRangeButtonText,
                            weekTimeRange?.id === validTimeRange.id && styles.timeRangeButtonTextSelected,
                            !isValid && styles.timeRangeButtonTextDisabled
                          ]}>
                            {validTimeRange.startTime} - {validTimeRange.endTime}
                            {!isValid && ' (Invalid)'}
                          </Text>
                        </TouchableOpacity>
                      );
                    });
                  })()}
                </View>
              </View>
            )}

            {/* Pricing Summary */}
            {weekStartDate && weekEndDate && weekTimeRange && (
              <View style={styles.pricingContainer}>
                <Text style={styles.pricingTitle}>Pricing Summary</Text>
                <View style={styles.pricingRow}>
                  <Text style={styles.pricingLabel}>Daily Rate:</Text>
                  <Text style={styles.pricingValue}>₱{sitterRate}/hour</Text>
                </View>
                <View style={styles.pricingRow}>
                  <Text style={styles.pricingLabel}>Duration:</Text>
                  <Text style={styles.pricingValue}>7 days</Text>
                </View>
                <View style={styles.pricingRow}>
                  <Text style={styles.pricingLabel}>Hours per day:</Text>
                  <Text style={styles.pricingValue}>
                    {(() => {
                      const startTime = weekTimeRange.startTime;
                      const endTime = weekTimeRange.endTime;
                      
                      // Handle time format conversion
                      const parseTime = (timeStr: string) => {
                        // If time already has AM/PM, convert to 24-hour format first
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
                      
                      const start24 = parseTime(startTime);
                      const end24 = parseTime(endTime);
                      
                      const start = new Date(`2000-01-01T${start24}:00`);
                      const end = new Date(`2000-01-01T${end24}:00`);
                      
                      // Handle case where end time is next day (e.g., 11 PM to 2 AM)
                      if (end <= start) {
                        end.setDate(end.getDate() + 1);
                      }
                      
                      const diffMs = end.getTime() - start.getTime();
                      const diffHours = Math.round(diffMs / (1000 * 60 * 60) * 10) / 10; // Round to 1 decimal place
                      
                      return `${diffHours} hours`;
                    })()}
                  </Text>
                </View>
                <View style={[styles.pricingRow, styles.totalRow]}>
                  <Text style={styles.totalLabel}>Total (7 days):</Text>
                  <Text style={styles.totalValue}>
                    {(() => {
                      const startTime = weekTimeRange.startTime;
                      const endTime = weekTimeRange.endTime;
                      
                      // Handle time format conversion
                      const parseTime = (timeStr: string) => {
                        // If time already has AM/PM, convert to 24-hour format first
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
                      
                      const start24 = parseTime(startTime);
                      const end24 = parseTime(endTime);
                      
                      const start = new Date(`2000-01-01T${start24}:00`);
                      const end = new Date(`2000-01-01T${end24}:00`);
                      
                      // Handle case where end time is next day (e.g., 11 PM to 2 AM)
                      if (end <= start) {
                        end.setDate(end.getDate() + 1);
                      }
                      
                      const diffMs = end.getTime() - start.getTime();
                      const diffHours = diffMs / (1000 * 60 * 60);
                      const totalCost = parseFloat(sitterRate || '25') * diffHours * 7;
                      
                      return `₱${Math.round(totalCost)}`;
                    })()}
                  </Text>
                </View>
                <View style={styles.discountRow}>
                  <Text style={styles.discountText}>💡 Week booking includes 10% discount!</Text>
                </View>
              </View>
            )}

            {/* Action Buttons */}
              <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowWeekBooking(false);
                  setWeekStartDate(null);
                  setWeekEndDate(null);
                  setWeekTimeRange(null);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  (!weekStartDate || !weekTimeRange) && styles.confirmButtonDisabled
                ]}
                onPress={handleWeekBooking}
                disabled={!weekStartDate || !weekTimeRange}
              >
                <Text style={styles.confirmButtonText}>Book Week</Text>
              </TouchableOpacity>
              </View>
            </TouchableOpacity>
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
  // Week Booking Styles
  weekBookingButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#8B5CF6',
  },
  weekBookingButtonText: {
    color: '#8B5CF6',
    fontSize: 16,
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
});

export default BookingScreen;
