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
import { getAuthHeaders } from '../src/constants/config';
import authService from '../src/services/authService';
import { bookingService } from '../src/services/bookingService';
import { messagingService } from '../src/services/messagingService';
import { makeApiCall } from '../src/services/networkService';
import { notificationService } from '../src/services/notificationService';

interface TimeRange {
  id: string;
  startTime: string;
  endTime: string;
}

interface SitterAvailability {
  date: string;
  timeRanges: TimeRange[];
}

interface WeekOption {
  startDate: string;
  endDate: string;
  timeRanges: TimeRange[];
}

const WeekBookingScreen: React.FC = () => {
  const router = useRouter();
  const { sitterId, sitterName, sitterRate, sitterImage } = useLocalSearchParams<{
    sitterId: string;
    sitterName: string;
    sitterRate: string;
    sitterImage?: string;
  }>();
  
  const [availabilities, setAvailabilities] = useState<SitterAvailability[]>([]);
  const [availableWeeks, setAvailableWeeks] = useState<WeekOption[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<WeekOption | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sitterId) {
      loadSitterAvailability();
    }
  }, [sitterId]);

  useEffect(() => {
    generateAvailableWeeks();
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

      if (response.ok) {
        const data = await response.json();
        setAvailabilities(data.availabilities || []);
      } else {
        await loadLocalAvailability();
      }
    } catch (error) {
      console.error('❌ Error loading sitter availability:', error);
      await loadLocalAvailability();
    } finally {
      setLoading(false);
    }
  };

  const loadLocalAvailability = async () => {
    try {
      const savedData = await AsyncStorage.getItem('petSitterAvailabilities');
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        const availabilityArray = Object.entries(parsedData).map(([date, timeRanges]) => ({
          date,
          timeRanges: timeRanges as TimeRange[]
        }));
        setAvailabilities(availabilityArray);
      }
    } catch (error) {
      console.error('❌ Error loading local availability:', error);
    }
  };

  const getAuthToken = async (): Promise<string | null> => {
    try {
      const user = await authService.getCurrentUser();
      return user?.token || null;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  };

  const generateAvailableWeeks = () => {
    const weeks: WeekOption[] = [];
    const today = new Date();
    
    // Generate 4 weeks of demo data
    for (let i = 0; i < 4; i++) {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() + (i * 7));
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      weeks.push({
        startDate: weekStart.toISOString().split('T')[0],
        endDate: weekEnd.toISOString().split('T')[0],
        timeRanges: [
          {
            id: `week-${i}-1`,
            startTime: '9:00 AM',
            endTime: '5:00 PM'
          },
          {
            id: `week-${i}-2`,
            startTime: '10:00 AM',
            endTime: '6:00 PM'
          }
        ]
      });
    }
    
    setAvailableWeeks(weeks);
  };

  const handleWeekSelect = (week: WeekOption) => {
    setSelectedWeek(week);
    setSelectedTimeRange(week.timeRanges[0]); // Auto-select first time range
  };

  const handleTimeRangeSelect = (timeRange: TimeRange) => {
    setSelectedTimeRange(timeRange);
  };

  const handleBookWeek = async () => {
    if (!selectedWeek || !selectedTimeRange || !sitterId) {
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
      const startDate = new Date(selectedWeek.startDate);
      const endDate = new Date(selectedWeek.endDate);
      const bookings = [];

      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        
        const booking = await bookingService.createBooking({
          sitterId: sitterId,
          sitterName: sitterName || 'Sitter',
          petOwnerId: currentUser.id,
          petOwnerName: currentUser.name || 'Pet Owner',
          date: dateStr,
          startTime: selectedTimeRange.startTime,
          endTime: selectedTimeRange.endTime,
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
          startTime: selectedTimeRange.startTime,
          endTime: selectedTimeRange.endTime,
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
          startTime: selectedTimeRange.startTime,
          endTime: selectedTimeRange.endTime,
          hourlyRate: parseFloat(sitterRate || '25'),
        });
      }

      Alert.alert(
        'Week Booking Request Sent!',
        `Your booking request for ${bookings.length} days has been sent to ${sitterName}. You'll receive a notification when they respond.`,
        [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      );

    } catch (error) {
      console.error('Error creating week booking:', error);
      Alert.alert('Error', 'Failed to create booking. Please try again.');
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

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  };

  const calculateTotalCost = () => {
    if (!selectedWeek || !selectedTimeRange) return 0;
    
    const startTime = selectedTimeRange.startTime;
    const endTime = selectedTimeRange.endTime;
    
    // Calculate hours per day
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
    
    const start24 = parseTime(startTime);
    const end24 = parseTime(endTime);
    
    const start = new Date(`2000-01-01T${start24}:00`);
    const end = new Date(`2000-01-01T${end24}:00`);
    
    if (end <= start) {
      end.setDate(end.getDate() + 1);
    }
    
    const diffMs = end.getTime() - start.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    const totalCost = parseFloat(sitterRate || '25') * diffHours * 7;
    
    return Math.round(totalCost);
  };

  const getImageSource = () => {
    if (!sitterImage) {
      return require('../src/assets/images/default-avatar.png');
    }
    
    if (typeof sitterImage === 'string' && (sitterImage.startsWith('http') || sitterImage.startsWith('https'))) {
      return { uri: sitterImage };
    }
    
    if (typeof sitterImage === 'string' && sitterImage.startsWith('/storage/')) {
      const fullUrl = `http://172.20.10.2:8000${sitterImage}`;
      return { uri: fullUrl };
    }
    
    if (typeof sitterImage === 'string') {
      return { uri: sitterImage };
    }
    
    return require('../src/assets/images/default-avatar.png');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.headerContainer}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#1F2937" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Book Whole Week</Text>
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
      {/* Header */}
      <View style={styles.headerContainer}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Book Whole Week</Text>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* Sitter Info */}
        <View style={styles.sitterInfoCard}>
          <View style={styles.sitterInfoHeader}>
            <View style={styles.sitterAvatar}>
              <Image 
                source={getImageSource()} 
                style={styles.avatarImage}
                defaultSource={require('../src/assets/images/default-avatar.png')}
                resizeMode="cover"
              />
            </View>
            <View style={styles.sitterInfo}>
              <Text style={styles.sitterName}>{sitterName || 'Sitter'}</Text>
              <Text style={styles.sitterRate}>₱{sitterRate || '25'}/hour</Text>
            </View>
          </View>
        </View>

        {/* Week Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Week</Text>
          <View style={styles.weekGrid}>
            {availableWeeks.map((week, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.weekCard,
                  selectedWeek?.startDate === week.startDate && styles.selectedWeekCard
                ]}
                onPress={() => handleWeekSelect(week)}
              >
                <Text style={[
                  styles.weekDateRange,
                  selectedWeek?.startDate === week.startDate && styles.selectedWeekText
                ]}>
                  {formatDateRange(week.startDate, week.endDate)}
                </Text>
                <Text style={[
                  styles.weekDays,
                  selectedWeek?.startDate === week.startDate && styles.selectedWeekText
                ]}>
                  7 days
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Time Range Selection */}
        {selectedWeek && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Time Range</Text>
            <View style={styles.timeRangeGrid}>
              {selectedWeek.timeRanges.map((timeRange, index) => (
                <TouchableOpacity
                  key={timeRange.id}
                  style={[
                    styles.timeRangeCard,
                    selectedTimeRange?.id === timeRange.id && styles.selectedTimeRangeCard
                  ]}
                  onPress={() => handleTimeRangeSelect(timeRange)}
                >
                  <Text style={[
                    styles.timeRangeText,
                    selectedTimeRange?.id === timeRange.id && styles.selectedTimeRangeText
                  ]}>
                    {timeRange.startTime} - {timeRange.endTime}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Pricing Summary */}
        {selectedWeek && selectedTimeRange && (
          <View style={styles.pricingCard}>
            <Text style={styles.pricingTitle}>Pricing Summary</Text>
            
            <View style={styles.pricingRow}>
              <Text style={styles.pricingLabel}>Sitter:</Text>
              <Text style={styles.pricingValue}>{sitterName || 'Sitter'}</Text>
            </View>
            
            <View style={styles.pricingRow}>
              <Text style={styles.pricingLabel}>Week:</Text>
              <Text style={styles.pricingValue}>{formatDateRange(selectedWeek.startDate, selectedWeek.endDate)}</Text>
            </View>
            
            <View style={styles.pricingRow}>
              <Text style={styles.pricingLabel}>Time:</Text>
              <Text style={styles.pricingValue}>{selectedTimeRange.startTime} - {selectedTimeRange.endTime}</Text>
            </View>
            
            <View style={styles.pricingRow}>
              <Text style={styles.pricingLabel}>Daily Rate:</Text>
              <Text style={styles.pricingValue}>₱{sitterRate || '25'}/hour</Text>
            </View>
            
            <View style={styles.pricingRow}>
              <Text style={styles.pricingLabel}>Duration:</Text>
              <Text style={styles.pricingValue}>7 days</Text>
            </View>
            
            <View style={[styles.pricingRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total Cost:</Text>
              <Text style={styles.totalValue}>₱{calculateTotalCost()}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Book Button */}
      {selectedWeek && selectedTimeRange && (
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={styles.bookButton}
            onPress={handleBookWeek}
          >
            <View style={styles.buttonContent}>
              <Ionicons name="calendar" size={24} color="#fff" />
              <Text style={styles.bookButtonText}>Book Whole Week</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
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
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  sitterInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
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
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  sitterRate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  weekGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  weekCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
  },
  selectedWeekCard: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  weekDateRange: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 4,
  },
  weekDays: {
    fontSize: 10,
    color: '#6B7280',
  },
  selectedWeekText: {
    color: '#fff',
  },
  timeRangeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  timeRangeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
  },
  selectedTimeRangeCard: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  timeRangeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  selectedTimeRangeText: {
    color: '#fff',
  },
  pricingCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  pricingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
    paddingTop: 12,
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
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  discountText: {
    fontSize: 12,
    color: '#10B981',
    textAlign: 'center',
    fontStyle: 'italic',
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
  bookButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
    gap: 12,
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
});

export default WeekBookingScreen;
