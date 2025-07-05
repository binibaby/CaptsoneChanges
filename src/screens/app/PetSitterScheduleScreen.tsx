import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface ScheduleItem {
  id: string;
  petOwnerName: string;
  petName: string;
  petBreed: string;
  date: string;
  time: string;
  duration: string;
  status: 'upcoming' | 'in-progress' | 'completed' | 'cancelled';
  location: string;
  rate: string;
}

const PetSitterScheduleScreen = () => {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState('Dec 16');
  const [schedule, setSchedule] = useState<ScheduleItem[]>([
    {
      id: '1',
      petOwnerName: 'John Davis',
      petName: 'Max',
      petBreed: 'Golden Retriever',
      date: 'Dec 16',
      time: '2:00 PM - 4:00 PM',
      duration: '2 hours',
      status: 'upcoming',
      location: 'San Francisco, CA',
      rate: '$50',
    },
    {
      id: '2',
      petOwnerName: 'Emma Wilson',
      petName: 'Luna',
      petBreed: 'Siamese Cat',
      date: 'Dec 17',
      time: '9:00 AM - 5:00 PM',
      duration: '8 hours',
      status: 'upcoming',
      location: 'San Francisco, CA',
      rate: '$200',
    },
    {
      id: '3',
      petOwnerName: 'Sarah Johnson',
      petName: 'Mochi',
      petBreed: 'Abyssinian',
      date: 'Dec 15',
      time: '10:00 AM - 12:00 PM',
      duration: '2 hours',
      status: 'completed',
      location: 'San Francisco, CA',
      rate: '$40',
    },
    {
      id: '4',
      petOwnerName: 'Mike Chen',
      petName: 'Buddy',
      petBreed: 'Labrador Retriever',
      date: 'Dec 18',
      time: '1:00 PM - 3:00 PM',
      duration: '2 hours',
      status: 'upcoming',
      location: 'San Francisco, CA',
      rate: '$50',
    },
  ]);

  const dates = ['Dec 15', 'Dec 16', 'Dec 17', 'Dec 18', 'Dec 19', 'Dec 20', 'Dec 21'];

  const handleBack = () => {
    router.back();
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
  };

  const handleStartSession = (item: ScheduleItem) => {
    // Navigate to session screen or start tracking
    console.log('Start session for:', item.id);
  };

  const handleViewDetails = (item: ScheduleItem) => {
    // Navigate to booking details
    console.log('View details for:', item.id);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return '#F59E0B';
      case 'in-progress':
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
      case 'upcoming':
        return 'Upcoming';
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

  const filteredSchedule = schedule.filter(item => item.date === selectedDate);

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
            {dates.map((date) => (
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
          <Text style={styles.dateTitle}>{selectedDate}, 2024</Text>
          
          {filteredSchedule.length > 0 ? (
            filteredSchedule.map((item) => (
              <View key={item.id} style={styles.scheduleCard}>
                <View style={styles.scheduleHeader}>
                  <View style={styles.timeContainer}>
                    <Ionicons name="time-outline" size={16} color="#666" />
                    <Text style={styles.timeText}>{item.time}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                    <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
                  </View>
                </View>

                <View style={styles.bookingInfo}>
                  <View style={styles.petInfo}>
                    <Text style={styles.petName}>{item.petName}</Text>
                    <Text style={styles.petBreed}>{item.petBreed}</Text>
                  </View>
                  
                  <View style={styles.ownerInfo}>
                    <Text style={styles.ownerName}>Owner: {item.petOwnerName}</Text>
                    <Text style={styles.locationText}>📍 {item.location}</Text>
                  </View>
                </View>

                <View style={styles.bookingDetails}>
                  <View style={styles.detailItem}>
                    <Ionicons name="calendar-outline" size={14} color="#666" />
                    <Text style={styles.detailText}>{item.duration}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Ionicons name="cash-outline" size={14} color="#666" />
                    <Text style={styles.detailText}>{item.rate}</Text>
                  </View>
                </View>

                <View style={styles.actionButtons}>
                  <TouchableOpacity 
                    style={styles.detailsButton}
                    onPress={() => handleViewDetails(item)}
                  >
                    <Text style={styles.detailsButtonText}>View Details</Text>
                  </TouchableOpacity>
                  
                  {item.status === 'upcoming' && (
                    <TouchableOpacity 
                      style={styles.startButton}
                      onPress={() => handleStartSession(item)}
                    >
                      <Text style={styles.startButtonText}>Start Session</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={64} color="#ccc" />
              <Text style={styles.emptyTitle}>No bookings today</Text>
              <Text style={styles.emptySubtitle}>You have a free day! Check other dates for your schedule.</Text>
            </View>
          )}
        </View>

        {/* Weekly Summary */}
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>This Week's Summary</Text>
          <View style={styles.summaryStats}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNumber}>
                {schedule.filter(item => item.status === 'upcoming').length}
              </Text>
              <Text style={styles.summaryLabel}>Upcoming</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNumber}>
                {schedule.filter(item => item.status === 'completed').length}
              </Text>
              <Text style={styles.summaryLabel}>Completed</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNumber}>
                ${schedule
                  .filter(item => item.status === 'completed')
                  .reduce((total, item) => total + parseInt(item.rate.replace('$', '')), 0)
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
  petBreed: {
    fontSize: 14,
    color: '#666',
  },
  ownerInfo: {
    marginBottom: 8,
  },
  ownerName: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  locationText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
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
  detailsButton: {
    flex: 1,
    backgroundColor: '#F0F0F0',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  detailsButtonText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '600',
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
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
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
});

export default PetSitterScheduleScreen; 