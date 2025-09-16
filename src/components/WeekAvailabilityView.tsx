import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

interface TimeSlot {
  id: string;
  startTime: Date;
  endTime: Date;
  day: string;
  date: string;
}

interface WeekAvailabilityViewProps {
  visible: boolean;
  onClose: () => void;
  onSave: (timeSlots: TimeSlot[]) => void;
}

const WeekAvailabilityView: React.FC<WeekAvailabilityViewProps> = ({
  visible,
  onClose,
  onSave,
}) => {
  console.log('WeekAvailabilityView render - visible:', visible);
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);

  const daysOfWeek = [
    { key: 'monday', label: 'Monday', short: 'Mon' },
    { key: 'tuesday', label: 'Tuesday', short: 'Tue' },
    { key: 'wednesday', label: 'Wednesday', short: 'Wed' },
    { key: 'thursday', label: 'Thursday', short: 'Thu' },
    { key: 'friday', label: 'Friday', short: 'Fri' },
    { key: 'saturday', label: 'Saturday', short: 'Sat' },
    { key: 'sunday', label: 'Sunday', short: 'Sun' },
  ];

  const getWeekDates = () => {
    const today = new Date();
    const currentDay = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - currentDay + 1); // Start from Monday
    
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      weekDates.push(date);
    }
    return weekDates;
  };

  const weekDates = getWeekDates();

  const handleDaySelect = (dayKey: string, date: Date) => {
    setSelectedDay(dayKey);
    setSelectedDate(date);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      setSelectedDate(selectedDate);
    }
    setShowDatePicker(false);
  };

  const handleStartTimeChange = (event: any, selectedTime?: Date) => {
    if (selectedTime) {
      setStartTime(selectedTime);
    }
    setShowStartTimePicker(false);
  };

  const handleEndTimeChange = (event: any, selectedTime?: Date) => {
    if (selectedTime) {
      setEndTime(selectedTime);
    }
    setShowEndTimePicker(false);
  };

  const addTimeSlot = () => {
    if (!selectedDay) return;

    const newSlot: TimeSlot = {
      id: `${selectedDay}-${Date.now()}`,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      day: selectedDay,
      date: selectedDate.toISOString().split('T')[0],
    };

    setTimeSlots(prev => [...prev, newSlot]);
  };

  const removeTimeSlot = (id: string) => {
    setTimeSlots(prev => prev.filter(slot => slot.id !== id));
  };

  const formatTime = (date: Date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    return `${displayHours}:${displayMinutes} ${ampm}`;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleSave = () => {
    onSave(timeSlots);
    setTimeSlots([]);
    setSelectedDay('');
    onClose();
  };

  const getTimeSlotsForDay = (dayKey: string) => {
    return timeSlots.filter(slot => slot.day === dayKey);
  };

  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Set Week Availability</Text>
          <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Week View */}
          <View style={styles.weekContainer}>
            <Text style={styles.sectionTitle}>Select Days & Times</Text>
            
            {daysOfWeek.map((day, index) => {
              const date = weekDates[index];
              const daySlots = getTimeSlotsForDay(day.key);
              const isSelected = selectedDay === day.key;
              
              return (
                <View key={day.key} style={styles.dayRow}>
                  <TouchableOpacity
                    style={[
                      styles.dayButton,
                      isSelected && styles.selectedDayButton,
                      daySlots.length > 0 && styles.hasTimeSlotsButton
                    ]}
                    onPress={() => handleDaySelect(day.key, date)}
                  >
                    <Text style={[
                      styles.dayButtonText,
                      isSelected && styles.selectedDayButtonText,
                      daySlots.length > 0 && styles.hasTimeSlotsButtonText
                    ]}>
                      {day.short}
                    </Text>
                    <Text style={[
                      styles.dayDateText,
                      isSelected && styles.selectedDayDateText
                    ]}>
                      {date.getDate()}
                    </Text>
                  </TouchableOpacity>

                  <View style={styles.dayContent}>
                    {isSelected && (
                      <View style={styles.timeSelector}>
                        <View style={styles.timeRow}>
                          <Text style={styles.timeLabel}>Starts</Text>
                          <View style={styles.timeInputContainer}>
                            <TouchableOpacity
                              style={styles.timeInput}
                              onPress={() => setShowDatePicker(true)}
                            >
                              <Text style={styles.timeInputText}>
                                {formatDate(selectedDate)}
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.timeInput}
                              onPress={() => setShowStartTimePicker(true)}
                            >
                              <Text style={styles.timeInputText}>
                                {formatTime(startTime)}
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>

                        <View style={styles.timeRow}>
                          <Text style={styles.timeLabel}>Ends</Text>
                          <View style={styles.timeInputContainer}>
                            <TouchableOpacity
                              style={styles.timeInput}
                              onPress={() => setShowDatePicker(true)}
                            >
                              <Text style={styles.timeInputText}>
                                {formatDate(selectedDate)}
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.timeInput}
                              onPress={() => setShowEndTimePicker(true)}
                            >
                              <Text style={styles.timeInputText}>
                                {formatTime(endTime)}
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>

                        <TouchableOpacity
                          style={styles.addTimeButton}
                          onPress={addTimeSlot}
                        >
                          <Ionicons name="add" size={20} color="#fff" />
                          <Text style={styles.addTimeButtonText}>Add Time Slot</Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {/* Show existing time slots */}
                    {daySlots.length > 0 && (
                      <View style={styles.timeSlotsContainer}>
                        {daySlots.map((slot) => (
                          <View key={slot.id} style={styles.timeSlot}>
                            <Text style={styles.timeSlotText}>
                              {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                            </Text>
                            <TouchableOpacity
                              onPress={() => removeTimeSlot(slot.id)}
                              style={styles.removeSlotButton}
                            >
                              <Ionicons name="close" size={16} color="#EF4444" />
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>

        {/* Date Picker */}
        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleDateChange}
          />
        )}

        {/* Start Time Picker */}
        {showStartTimePicker && (
          <DateTimePicker
            value={startTime}
            mode="time"
            is24Hour={false}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleStartTimeChange}
          />
        )}

        {/* End Time Picker */}
        {showEndTimePicker && (
          <DateTimePicker
            value={endTime}
            mode="time"
            is24Hour={false}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleEndTimeChange}
          />
        )}
      </View>
    </Modal>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  cancelButton: {
    paddingVertical: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#8B5CF6',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  saveButton: {
    paddingVertical: 8,
  },
  saveButtonText: {
    fontSize: 16,
    color: '#8B5CF6',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  weekContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  dayRow: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  dayButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  selectedDayButton: {
    backgroundColor: '#8B5CF6',
  },
  hasTimeSlotsButton: {
    backgroundColor: '#10B981',
  },
  dayButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  selectedDayButtonText: {
    color: '#fff',
  },
  hasTimeSlotsButtonText: {
    color: '#fff',
  },
  dayDateText: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  selectedDayDateText: {
    color: '#fff',
  },
  dayContent: {
    flex: 1,
  },
  timeSelector: {
    marginTop: 8,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    width: 60,
  },
  timeInputContainer: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  timeInput: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  timeInputText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  addTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B5CF6',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 8,
    gap: 8,
  },
  addTimeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  timeSlotsContainer: {
    marginTop: 8,
  },
  timeSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#E8F5E8',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 4,
  },
  timeSlotText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  removeSlotButton: {
    padding: 4,
  },
});

export default WeekAvailabilityView;
