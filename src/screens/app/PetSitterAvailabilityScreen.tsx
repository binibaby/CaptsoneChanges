import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface TimeSlot {
  id: string;
  time: string;
  isAvailable: boolean;
}

interface DaySchedule {
  day: string;
  date: string;
  isAvailable: boolean;
  timeSlots: TimeSlot[];
}

const PetSitterAvailabilityScreen = () => {
  const router = useRouter();
  const [schedule, setSchedule] = useState<DaySchedule[]>([
    {
      day: 'Monday',
      date: 'Dec 16',
      isAvailable: true,
      timeSlots: [
        { id: '1', time: '9:00 AM', isAvailable: true },
        { id: '2', time: '10:00 AM', isAvailable: true },
        { id: '3', time: '11:00 AM', isAvailable: false },
        { id: '4', time: '12:00 PM', isAvailable: true },
        { id: '5', time: '1:00 PM', isAvailable: true },
        { id: '6', time: '2:00 PM', isAvailable: true },
        { id: '7', time: '3:00 PM', isAvailable: true },
        { id: '8', time: '4:00 PM', isAvailable: true },
        { id: '9', time: '5:00 PM', isAvailable: true },
        { id: '10', time: '6:00 PM', isAvailable: false },
      ]
    },
    {
      day: 'Tuesday',
      date: 'Dec 17',
      isAvailable: true,
      timeSlots: [
        { id: '11', time: '9:00 AM', isAvailable: true },
        { id: '12', time: '10:00 AM', isAvailable: true },
        { id: '13', time: '11:00 AM', isAvailable: true },
        { id: '14', time: '12:00 PM', isAvailable: true },
        { id: '15', time: '1:00 PM', isAvailable: true },
        { id: '16', time: '2:00 PM', isAvailable: true },
        { id: '17', time: '3:00 PM', isAvailable: true },
        { id: '18', time: '4:00 PM', isAvailable: true },
        { id: '19', time: '5:00 PM', isAvailable: true },
        { id: '20', time: '6:00 PM', isAvailable: true },
      ]
    },
    {
      day: 'Wednesday',
      date: 'Dec 18',
      isAvailable: false,
      timeSlots: [
        { id: '21', time: '9:00 AM', isAvailable: false },
        { id: '22', time: '10:00 AM', isAvailable: false },
        { id: '23', time: '11:00 AM', isAvailable: false },
        { id: '24', time: '12:00 PM', isAvailable: false },
        { id: '25', time: '1:00 PM', isAvailable: false },
        { id: '26', time: '2:00 PM', isAvailable: false },
        { id: '27', time: '3:00 PM', isAvailable: false },
        { id: '28', time: '4:00 PM', isAvailable: false },
        { id: '29', time: '5:00 PM', isAvailable: false },
        { id: '30', time: '6:00 PM', isAvailable: false },
      ]
    },
    {
      day: 'Thursday',
      date: 'Dec 19',
      isAvailable: true,
      timeSlots: [
        { id: '31', time: '9:00 AM', isAvailable: true },
        { id: '32', time: '10:00 AM', isAvailable: true },
        { id: '33', time: '11:00 AM', isAvailable: true },
        { id: '34', time: '12:00 PM', isAvailable: true },
        { id: '35', time: '1:00 PM', isAvailable: true },
        { id: '36', time: '2:00 PM', isAvailable: true },
        { id: '37', time: '3:00 PM', isAvailable: true },
        { id: '38', time: '4:00 PM', isAvailable: true },
        { id: '39', time: '5:00 PM', isAvailable: true },
        { id: '40', time: '6:00 PM', isAvailable: true },
      ]
    },
    {
      day: 'Friday',
      date: 'Dec 20',
      isAvailable: true,
      timeSlots: [
        { id: '41', time: '9:00 AM', isAvailable: true },
        { id: '42', time: '10:00 AM', isAvailable: true },
        { id: '43', time: '11:00 AM', isAvailable: true },
        { id: '44', time: '12:00 PM', isAvailable: true },
        { id: '45', time: '1:00 PM', isAvailable: true },
        { id: '46', time: '2:00 PM', isAvailable: true },
        { id: '47', time: '3:00 PM', isAvailable: true },
        { id: '48', time: '4:00 PM', isAvailable: true },
        { id: '49', time: '5:00 PM', isAvailable: true },
        { id: '50', time: '6:00 PM', isAvailable: true },
      ]
    },
    {
      day: 'Saturday',
      date: 'Dec 21',
      isAvailable: true,
      timeSlots: [
        { id: '51', time: '9:00 AM', isAvailable: true },
        { id: '52', time: '10:00 AM', isAvailable: true },
        { id: '53', time: '11:00 AM', isAvailable: true },
        { id: '54', time: '12:00 PM', isAvailable: true },
        { id: '55', time: '1:00 PM', isAvailable: true },
        { id: '56', time: '2:00 PM', isAvailable: true },
        { id: '57', time: '3:00 PM', isAvailable: true },
        { id: '58', time: '4:00 PM', isAvailable: true },
        { id: '59', time: '5:00 PM', isAvailable: true },
        { id: '60', time: '6:00 PM', isAvailable: true },
      ]
    },
    {
      day: 'Sunday',
      date: 'Dec 22',
      isAvailable: false,
      timeSlots: [
        { id: '61', time: '9:00 AM', isAvailable: false },
        { id: '62', time: '10:00 AM', isAvailable: false },
        { id: '63', time: '11:00 AM', isAvailable: false },
        { id: '64', time: '12:00 PM', isAvailable: false },
        { id: '65', time: '1:00 PM', isAvailable: false },
        { id: '66', time: '2:00 PM', isAvailable: false },
        { id: '67', time: '3:00 PM', isAvailable: false },
        { id: '68', time: '4:00 PM', isAvailable: false },
        { id: '69', time: '5:00 PM', isAvailable: false },
        { id: '70', time: '6:00 PM', isAvailable: false },
      ]
    }
  ]);

  const handleBack = () => {
    router.back();
  };

  const toggleDayAvailability = (dayIndex: number) => {
    const updatedSchedule = [...schedule];
    updatedSchedule[dayIndex].isAvailable = !updatedSchedule[dayIndex].isAvailable;
    
    // Update all time slots for that day
    updatedSchedule[dayIndex].timeSlots = updatedSchedule[dayIndex].timeSlots.map(slot => ({
      ...slot,
      isAvailable: updatedSchedule[dayIndex].isAvailable
    }));
    
    setSchedule(updatedSchedule);
  };

  const toggleTimeSlot = (dayIndex: number, slotId: string) => {
    const updatedSchedule = [...schedule];
    const day = updatedSchedule[dayIndex];
    const slotIndex = day.timeSlots.findIndex(slot => slot.id === slotId);
    
    if (slotIndex !== -1) {
      day.timeSlots[slotIndex].isAvailable = !day.timeSlots[slotIndex].isAvailable;
      setSchedule(updatedSchedule);
    }
  };

  const handleSave = () => {
    Alert.alert('Success', 'Your availability has been updated!');
    router.back();
  };

  const handleQuickSet = (available: boolean) => {
    const updatedSchedule = schedule.map(day => ({
      ...day,
      isAvailable: available,
      timeSlots: day.timeSlots.map(slot => ({
        ...slot,
        isAvailable: available
      }))
    }));
    setSchedule(updatedSchedule);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Set Availability</Text>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={[styles.quickButton, styles.availableButton]} 
            onPress={() => handleQuickSet(true)}
          >
            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
            <Text style={styles.quickButtonText}>Set All Available</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.quickButton, styles.unavailableButton]} 
            onPress={() => handleQuickSet(false)}
          >
            <Ionicons name="close-circle" size={20} color="#FF4444" />
            <Text style={styles.quickButtonText}>Set All Unavailable</Text>
          </TouchableOpacity>
        </View>

        {/* Schedule */}
        <View style={styles.scheduleContainer}>
          {schedule.map((day, dayIndex) => (
            <View key={day.day} style={styles.dayContainer}>
              {/* Day Header */}
              <TouchableOpacity 
                style={[styles.dayHeader, day.isAvailable && styles.availableDayHeader]} 
                onPress={() => toggleDayAvailability(dayIndex)}
              >
                <View style={styles.dayInfo}>
                  <Text style={[styles.dayName, day.isAvailable && styles.availableDayText]}>
                    {day.day}
                  </Text>
                  <Text style={[styles.dayDate, day.isAvailable && styles.availableDayText]}>
                    {day.date}
                  </Text>
                </View>
                <View style={[styles.availabilityIndicator, day.isAvailable && styles.availableIndicator]}>
                  <Ionicons 
                    name={day.isAvailable ? 'checkmark' : 'close'} 
                    size={16} 
                    color={day.isAvailable ? '#4CAF50' : '#FF4444'} 
                  />
                </View>
              </TouchableOpacity>

              {/* Time Slots */}
              <View style={styles.timeSlotsContainer}>
                {day.timeSlots.map((slot) => (
                  <TouchableOpacity
                    key={slot.id}
                    style={[
                      styles.timeSlot,
                      slot.isAvailable && styles.availableTimeSlot,
                      !day.isAvailable && styles.disabledTimeSlot
                    ]}
                    onPress={() => toggleTimeSlot(dayIndex, slot.id)}
                    disabled={!day.isAvailable}
                  >
                    <Text style={[
                      styles.timeText,
                      slot.isAvailable && styles.availableTimeText,
                      !day.isAvailable && styles.disabledTimeText
                    ]}>
                      {slot.time}
                    </Text>
                    {slot.isAvailable && (
                      <Ionicons name="checkmark" size={12} color="#4CAF50" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        </View>

        {/* Legend */}
        <View style={styles.legendContainer}>
          <Text style={styles.legendTitle}>Legend</Text>
          <View style={styles.legendItems}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, styles.availableDot]} />
              <Text style={styles.legendText}>Available</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, styles.unavailableDot]} />
              <Text style={styles.legendText}>Unavailable</Text>
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
  saveButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  quickActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 10,
  },
  quickButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  availableButton: {
    backgroundColor: '#E8F5E8',
  },
  unavailableButton: {
    backgroundColor: '#FFE8E8',
  },
  quickButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  scheduleContainer: {
    padding: 20,
  },
  dayContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: '#F0F0F0',
  },
  availableDayHeader: {
    backgroundColor: '#E8F5E8',
  },
  dayInfo: {
    flex: 1,
  },
  dayName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  availableDayText: {
    color: '#4CAF50',
  },
  dayDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  availabilityIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFE8E8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  availableIndicator: {
    backgroundColor: '#E8F5E8',
  },
  timeSlotsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 15,
    gap: 8,
  },
  timeSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    gap: 6,
  },
  availableTimeSlot: {
    backgroundColor: '#E8F5E8',
  },
  disabledTimeSlot: {
    backgroundColor: '#F8F8F8',
  },
  timeText: {
    fontSize: 12,
    color: '#666',
  },
  availableTimeText: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  disabledTimeText: {
    color: '#CCC',
  },
  legendContainer: {
    backgroundColor: '#fff',
    padding: 20,
    margin: 20,
    borderRadius: 12,
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  legendItems: {
    flexDirection: 'row',
    gap: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  availableDot: {
    backgroundColor: '#4CAF50',
  },
  unavailableDot: {
    backgroundColor: '#FF4444',
  },
  legendText: {
    fontSize: 14,
    color: '#666',
  },
});

export default PetSitterAvailabilityScreen; 