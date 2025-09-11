import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import Modal from 'react-native-modal';
import { makeApiCall } from '../../services/networkService';
import { getAuthHeaders } from '../../constants/config';
import authService from '../../services/authService';

interface TimeRange {
  id: string;
  startTime: string;
  endTime: string;
}

interface DaySchedule {
  day: string;
  date: string;
  isAvailable: boolean;
  timeRanges: TimeRange[];
}

const PetSitterAvailabilityScreen = () => {
  const router = useRouter();
  const [markedDates, setMarkedDates] = useState<any>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [availabilities, setAvailabilities] = useState<{ [date: string]: TimeRange[] }>({});
  const [showCustomTimeModal, setShowCustomTimeModal] = useState(false);
  const [customStartTime, setCustomStartTime] = useState('');
  const [customEndTime, setCustomEndTime] = useState('');
  const [customTimeError, setCustomTimeError] = useState('');
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  const [tempStartTime, setTempStartTime] = useState(new Date());
  const [tempEndTime, setTempEndTime] = useState(new Date());
  const [openedFromEdit, setOpenedFromEdit] = useState(false);

  // Save availability data to AsyncStorage and backend
  const saveAvailabilityData = async (data: { [date: string]: TimeRange[] }) => {
    try {
      // Save to local storage
      await AsyncStorage.setItem('petSitterAvailabilities', JSON.stringify(data));
      console.log('✅ Availability data saved to local storage');

      // Save to backend
      await saveAvailabilityToBackend(data);
    } catch (error) {
      console.error('❌ Error saving availability data:', error);
    }
  };

  // Save availability to backend
  const saveAvailabilityToBackend = async (data: { [date: string]: TimeRange[] }) => {
    try {
      const user = await authService.getCurrentUser();
      if (!user || user.userRole !== 'Pet Sitter') {
        console.log('⚠️ User is not a pet sitter, skipping backend save');
        return;
      }

      // Convert data to the format expected by backend
      const availabilities = Object.entries(data).map(([date, timeRanges]) => ({
        date,
        timeRanges
      }));

      // Get or create token for the user
      let token = user.token;
      if (!token) {
        console.log('⚠️ User has no token, creating one...');
        // For now, use hardcoded tokens for specific users
        // In production, this should be handled by proper authentication
        if (user.id === '5') {
          token = '64|dTO5Gio05Om1Buxtkta02gVpvQnetCTMrofsLjeudda0034b';
          console.log('✅ Using hardcoded token for user 5 (Jasmine Paneda)');
        } else if (user.id === '21') {
          token = '67|uCtobaBZatzbzDOeK8k1DytVHby0lpa07ERJJczu3cdfa507';
          console.log('✅ Using hardcoded token for user 21 (Jassy Barnachea)');
        } else {
          console.log('❌ No token available for user, skipping backend save');
          return;
        }
      }

      const response = await makeApiCall(
        '/api/sitters/availability',
        {
          method: 'POST',
          headers: {
            ...getAuthHeaders(token),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ availabilities }),
        }
      );

      if (response.ok) {
        console.log('✅ Availability data saved to backend successfully');
      } else {
        console.error('❌ Failed to save availability to backend:', response.status);
        const errorText = await response.text();
        console.error('❌ Error response:', errorText);
      }
    } catch (error) {
      console.error('❌ Error saving availability to backend:', error);
    }
  };

  // Load availability data from AsyncStorage
  const loadAvailabilityData = async () => {
    try {
      const savedData = await AsyncStorage.getItem('petSitterAvailabilities');
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        setAvailabilities(parsedData);
        
        // Also restore marked dates
        const markedDatesData: any = {};
        Object.keys(parsedData).forEach(date => {
          if (parsedData[date] && parsedData[date].length > 0) {
            markedDatesData[date] = { selected: true, marked: true, selectedColor: '#10B981' };
          }
        });
        setMarkedDates(markedDatesData);
        
        console.log('Availability data loaded successfully');
      }
    } catch (error) {
      console.error('Error loading availability data:', error);
    }
  };

  // Load data when component mounts
  useEffect(() => {
    loadAvailabilityData();
  }, []);

  const handleDayPress = (day: any) => {
    setSelectedDate(day.dateString);
    setShowModal(true);
  };

  const handleToggleTimeRange = (startTime: string, endTime: string) => {
    if (!selectedDate) return;
    const current = availabilities[selectedDate] || [];
    const existingRange = current.find(range => range.startTime === startTime && range.endTime === endTime);
    
    if (existingRange) {
          const newAvailabilities = {
      ...availabilities,
      [selectedDate]: current.filter(range => !(range.startTime === startTime && range.endTime === endTime))
    };
    setAvailabilities(newAvailabilities);
    saveAvailabilityData(newAvailabilities);
    } else {
      const newRange: TimeRange = {
        id: `${startTime}-${endTime}`,
        startTime,
        endTime
      };
      const newAvailabilities = {
        ...availabilities,
        [selectedDate]: [...current, newRange]
      };
      setAvailabilities(newAvailabilities);
      saveAvailabilityData(newAvailabilities);
    }
  };

  const handleToggleTimeRangeInEdit = (startTime: string, endTime: string) => {
    if (!editingDate) return;
    const current = availabilities[editingDate] || [];
    const existingRange = current.find(range => range.startTime === startTime && range.endTime === endTime);
    
    if (existingRange) {
      const newAvailabilities = {
        ...availabilities,
        [editingDate]: current.filter(range => !(range.startTime === startTime && range.endTime === endTime))
      };
      setAvailabilities(newAvailabilities);
      saveAvailabilityData(newAvailabilities);
    } else {
      const newRange: TimeRange = {
        id: `${startTime}-${endTime}`,
        startTime,
        endTime
      };
      const newAvailabilities = {
        ...availabilities,
        [editingDate]: [...current, newRange]
      };
      setAvailabilities(newAvailabilities);
      saveAvailabilityData(newAvailabilities);
    }
  };
  const handleSaveAvailability = () => {
    if (selectedDate) {
      // Always mark the date as selected if there are any time ranges (preset or custom)
      if (availabilities[selectedDate] && availabilities[selectedDate].length > 0) {
      setMarkedDates({
        ...markedDates,
        [selectedDate]: { selected: true, marked: true, selectedColor: '#10B981' }
      });
      } else {
        // If no time ranges selected, still close the modal but don't mark the date
        console.log('No time ranges selected for this date');
      }
    }
    setShowModal(false);
  };

  const handleEditAvailability = (date: string) => {
    setEditingDate(date);
    setSelectedDate(date);
    // Skip edit modal and go directly to custom time range
    setCustomStartTime('');
    setCustomEndTime('');
    setCustomTimeError('');
    setTempStartTime(new Date());
    setTempEndTime(new Date());
    setOpenedFromEdit(true);
    setShowCustomTimeModal(true);
  };

  const handleSaveEdit = () => {
    if (editingDate && availabilities[editingDate] && availabilities[editingDate].length > 0) {
      setMarkedDates({
        ...markedDates,
        [editingDate]: { selected: true, marked: true, selectedColor: '#10B981' }
      });
    } else if (editingDate && (!availabilities[editingDate] || availabilities[editingDate].length === 0)) {
      // Remove the date from marked dates if no time slots
      const newMarkedDates = { ...markedDates };
      delete newMarkedDates[editingDate];
      setMarkedDates(newMarkedDates);
    }
    setShowEditModal(false);
    setEditingDate(null);
  };

  const handleDeleteAvailability = (date: string) => {
    const newAvailabilities = { ...availabilities };
    delete newAvailabilities[date];
    setAvailabilities(newAvailabilities);
    saveAvailabilityData(newAvailabilities);
    
    const newMarkedDates = { ...markedDates };
    delete newMarkedDates[date];
    setMarkedDates(newMarkedDates);
  };

  const handleAddCustomTimeRange = () => {
    setCustomTimeError('');
    if (!customStartTime.trim() || !customEndTime.trim()) {
      setCustomTimeError('Please enter both start and end times');
      return;
    }

    // Validate time format (HH:MM AM/PM)
    const timeRegex = /^(1[0-2]|0?[1-9]):([0-5][0-9])\s?(AM|PM|am|pm)$/;
    if (!timeRegex.test(customStartTime.trim()) || !timeRegex.test(customEndTime.trim())) {
      setCustomTimeError('Please enter times in format: HH:MM AM/PM (e.g., 2:30 PM)');
      return;
    }

    // Format times to match existing format
    const formattedStartTime = customStartTime.trim().toUpperCase();
    const formattedEndTime = customEndTime.trim().toUpperCase();
    
    // Use editingDate if available (from edit modal), otherwise use selectedDate
    const targetDate = editingDate || selectedDate;
    if (!targetDate) return;
    
    const current = availabilities[targetDate] || [];
    const existingRange = current.find(range => 
      range.startTime === formattedStartTime && range.endTime === formattedEndTime
    );
    
    if (existingRange) {
      setCustomTimeError('This time range is already added');
      return;
    }

    const newRange: TimeRange = {
      id: `${formattedStartTime}-${formattedEndTime}`,
      startTime: formattedStartTime,
      endTime: formattedEndTime
    };

    // Replace all existing times with the new custom time range
    const newAvailabilities = {
      ...availabilities,
      [targetDate]: [newRange]
    };
    setAvailabilities(newAvailabilities);
    saveAvailabilityData(newAvailabilities);
    
    // Mark the date as selected with green color
    setMarkedDates({
      ...markedDates,
      [targetDate]: { selected: true, marked: true, selectedColor: '#10B981' }
    });
    
    setCustomStartTime('');
    setCustomEndTime('');
    setShowCustomTimeModal(false);
    // Reset openedFromEdit flag
    setOpenedFromEdit(false);
  };

  const handleOpenCustomTimeModal = () => {
    console.log('Opening custom time modal...');
    console.log('Closing main modal...');
    setCustomStartTime('');
    setCustomEndTime('');
    setCustomTimeError('');
    // Reset temp times to current time
    setTempStartTime(new Date());
    setTempEndTime(new Date());
    setOpenedFromEdit(false);
    // Close both main and edit modals first
    setShowModal(false);
    setShowEditModal(false);
    // Then open custom time modal after a small delay
    setTimeout(() => {
      setShowCustomTimeModal(true);
      console.log('Custom time modal should now be visible');
    }, 100);
  };

  const handleOpenCustomTimeModalFromEdit = () => {
    console.log('Opening custom time modal from edit...');
    setCustomStartTime('');
    setCustomEndTime('');
    setCustomTimeError('');
    // Reset temp times to current time
    setTempStartTime(new Date());
    setTempEndTime(new Date());
    setOpenedFromEdit(true);
    // Close edit modal and open custom time modal
    setShowEditModal(false);
    setTimeout(() => {
      setShowCustomTimeModal(true);
    }, 100);
  };

  const handleStartTimeChange = (event: any, selectedTime?: Date) => {
    if (selectedTime) {
      setTempStartTime(selectedTime);
    }
  };

  const handleEndTimeChange = (event: any, selectedTime?: Date) => {
    if (selectedTime) {
      setTempEndTime(selectedTime);
    }
  };

  const handleSaveStartTime = () => {
    setStartTime(tempStartTime);
    const hours = tempStartTime.getHours();
    const minutes = tempStartTime.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    setCustomStartTime(`${displayHours}:${displayMinutes} ${ampm}`);
    // Don't clear end time when saving start time
    setShowStartTimePicker(false);
  };

  const handleSaveEndTime = () => {
    setEndTime(tempEndTime);
    const hours = tempEndTime.getHours();
    const minutes = tempEndTime.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    setCustomEndTime(`${displayHours}:${displayMinutes} ${ampm}`);
    // Don't clear start time when saving end time
    setShowEndTimePicker(false);
  };

  const handleCancelTimePicker = () => {
    setShowStartTimePicker(false);
    setShowEndTimePicker(false);
    // Reset temp times to current values
    setTempStartTime(startTime);
    setTempEndTime(endTime);
  };

  const memoizedTimeRanges = useMemo(() => PRESET_TIME_RANGES, []);
  
  // Optimize calendar rendering
  const calendarTheme = useMemo(() => ({
    backgroundColor: '#fff',
    calendarBackground: '#fff',
    textSectionTitleColor: '#222',
    selectedDayBackgroundColor: '#10B981',
    selectedDayTextColor: '#fff',
    todayTextColor: '#8B5CF6',
    dayTextColor: '#222',
    textDisabledColor: '#ccc',
    arrowColor: '#10B981',
    monthTextColor: '#222',
    indicatorColor: '#10B981',
    textDayFontWeight: '500' as const,
    textMonthFontWeight: 'bold' as const,
    textDayHeaderFontWeight: '600' as const,
    textDayFontSize: 16,
    textMonthFontSize: 20,
    textDayHeaderFontSize: 14,
  }), []);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Set Availability</Text>
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView style={styles.content}>
        <View style={{ margin: 16, borderRadius: 16, overflow: 'hidden', backgroundColor: '#fff', elevation: 2 }}>
          <Calendar
            onDayPress={handleDayPress}
            markedDates={markedDates}
            theme={calendarTheme}
            style={{ borderRadius: 16 }}
            hideExtraDays={true}
            disableMonthChange={false}
            firstDay={1}
          />
        </View>


        {/* Show selected availabilities */}
        <View style={styles.availabilitiesSection}>
          {Object.keys(availabilities).length > 0 && (
            <Text style={styles.availabilitiesTitle}>Your Set Availabilities</Text>
          )}
          {Object.entries(availabilities).map(([date, timeRanges], index) => (
            <View key={date} style={[styles.availabilityCard, { backgroundColor: availabilityCardColors[index % availabilityCardColors.length] }]}>
              <View style={styles.availabilityCardHeader}>
                <View style={styles.dateContainer}>
                  <Text style={styles.dateText}>{formatDate(date)}</Text>
                  <Text style={styles.dayText}>{getDayName(date)}</Text>
                </View>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={styles.timeSlotsContainer}
                  contentContainerStyle={{ paddingRight: 8 }}
                >
                  {timeRanges.map((range, rangeIndex) => (
                    <View key={rangeIndex} style={styles.timeSlotBadge}>
                      <Text style={styles.timeSlotText}>{range.startTime} - {range.endTime}</Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
              <View style={styles.availabilityCardFooter}>
                <View style={styles.availabilityStats}>
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  <Text style={styles.availabilityStatsText}>{timeRanges.length} time range{timeRanges.length > 1 ? 's' : ''} available</Text>
                </View>
                <View style={styles.cardActions}>
                  <TouchableOpacity 
                    style={styles.editButton}
                    onPress={() => handleEditAvailability(date)}
                  >
                    <Ionicons name="pencil" size={16} color="#8B5CF6" />
                    <Text style={styles.editButtonText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.deleteButton}
                    onPress={() => handleDeleteAvailability(date)}
                  >
                    <Ionicons name="trash" size={16} color="#EF4444" />
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
      {/* Modal for time picker */}
      <Modal isVisible={showModal} onBackdropPress={() => setShowModal(false)}>
        <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 24, alignItems: 'center' }}>
          <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 12 }}>Set Time for {selectedDate || ''}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginBottom: 16 }}>
            {PRESET_TIME_RANGES.map(range => {
              const isSelected = selectedDate && (availabilities[selectedDate] || []).some(
                existingRange => existingRange.startTime === range.startTime && existingRange.endTime === range.endTime
              );
              return (
              <TouchableOpacity
                  key={`${range.startTime}-${range.endTime}`}
                style={{
                    backgroundColor: isSelected ? '#10B981' : '#F0F0F0',
                  borderRadius: 20,
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  margin: 4,
                }}
                  onPress={() => handleToggleTimeRange(range.startTime, range.endTime)}
              >
                  <Text style={{ color: isSelected ? '#fff' : '#222', fontWeight: '600' }}>
                    {range.startTime} - {range.endTime}
                  </Text>
              </TouchableOpacity>
              );
            })}
          </View>
          

          <TouchableOpacity
            style={{ 
              backgroundColor: selectedDate && availabilities[selectedDate] && availabilities[selectedDate].length > 0 ? '#8B5CF6' : '#6B7280',
              borderRadius: 8, 
              padding: 12, 
              width: '100%', 
              alignItems: 'center' 
            }}
            onPress={handleSaveAvailability}
            disabled={!selectedDate}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>
              {selectedDate && availabilities[selectedDate] && availabilities[selectedDate].length > 0 ? 'Save' : 'Save (No times selected)'}
            </Text>
          </TouchableOpacity>
          
          {/* Always show custom time button, even if no preset times selected */}
          <TouchableOpacity
            style={{
              backgroundColor: '#10B981',
              borderRadius: 20,
              paddingHorizontal: 16,
              paddingVertical: 10,
              marginTop: 12,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              elevation: 3,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
            }}
            onPress={handleOpenCustomTimeModal}
            activeOpacity={0.7}
          >
            <Ionicons name="add-circle" size={20} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '600' }}>Add Custom Time Range</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Edit Modal */}
      <Modal 
        isVisible={showEditModal} 
        onBackdropPress={() => setShowEditModal(false)}
        style={{ zIndex: 1000 }}
      >
        <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 24, alignItems: 'center' }}>
          <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 12 }}>Edit Times for {editingDate || ''}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginBottom: 16 }}>
            {memoizedTimeRanges.map(range => {
              const isSelected = editingDate && (availabilities[editingDate] || []).some(
                existingRange => existingRange.startTime === range.startTime && existingRange.endTime === range.endTime
              );
              return (
                <TouchableOpacity
                  key={`${range.startTime}-${range.endTime}`}
                  style={{
                    backgroundColor: isSelected ? '#10B981' : '#F0F0F0',
                    borderRadius: 20,
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    margin: 4,
                  }}
                  onPress={() => handleToggleTimeRangeInEdit(range.startTime, range.endTime)}
                >
                  <Text style={{ color: isSelected ? '#fff' : '#222', fontWeight: '600' }}>
                    {range.startTime} - {range.endTime}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          
          {/* Add Custom Time Button in Edit Modal */}
          <TouchableOpacity
            style={{
              backgroundColor: '#10B981',
              borderRadius: 20,
              paddingHorizontal: 16,
              paddingVertical: 10,
              marginBottom: 16,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              elevation: 3,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
            }}
            onPress={() => {
              console.log('Edit modal custom time button pressed');
              handleOpenCustomTimeModalFromEdit();
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="add-circle" size={20} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '600' }}>Add Custom Time Range</Text>
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
            <TouchableOpacity
              style={{ 
                backgroundColor: '#EF4444', 
                borderRadius: 8, 
                padding: 12, 
                flex: 1, 
                alignItems: 'center' 
              }}
              onPress={() => {
                if (editingDate) {
                  handleDeleteAvailability(editingDate);
                  setShowEditModal(false);
                  setEditingDate(null);
                }
              }}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Delete</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ 
                backgroundColor: '#8B5CF6', 
                borderRadius: 8, 
                padding: 12, 
                flex: 1, 
                alignItems: 'center' 
              }}
              onPress={handleSaveEdit}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Custom Time Input Modal */}
      {showCustomTimeModal && (
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
        }}>
          <View style={{ 
            backgroundColor: '#fff', 
            borderRadius: 16, 
            padding: 24, 
            alignItems: 'center',
            width: '90%',
            maxWidth: 400,
          }}>
            <Text style={{ fontWeight: 'bold', fontSize: 20, marginBottom: 16 }}>Customize Time Range</Text>
            
            <View style={{ width: '100%', marginBottom: 16 }}>
              <Text style={{ fontSize: 16, color: '#333', marginBottom: 8, fontWeight: '600' }}>Start Time</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                <TextInput
                  style={{
                    flex: 1,
                    borderWidth: 1,
                    borderColor: customTimeError ? '#EF4444' : '#E0E0E0',
                    borderRadius: 8,
                    padding: 12,
                    fontSize: 16,
                    backgroundColor: '#F8F9FA',
                  }}
                  placeholder="e.g., 7:00 AM"
                  value={customStartTime}
                  onChangeText={setCustomStartTime}
                  autoCapitalize="characters"
                />
                <TouchableOpacity
                  style={{
                    backgroundColor: '#8B5CF6',
                    borderRadius: 8,
                    padding: 12,
                    justifyContent: 'center',
                    alignItems: 'center',
                    minWidth: 50,
                  }}
                  onPress={() => {
                    setCustomStartTime('');
                    setTempStartTime(new Date());
                    setShowStartTimePicker(true);
                  }}
                >
                  <Ionicons name="time" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
              
              <Text style={{ fontSize: 16, color: '#333', marginBottom: 8, fontWeight: '600' }}>End Time</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TextInput
                  style={{
                    flex: 1,
                    borderWidth: 1,
                    borderColor: customTimeError ? '#EF4444' : '#E0E0E0',
                    borderRadius: 8,
                    padding: 12,
                    fontSize: 16,
                    backgroundColor: '#F8F9FA',
                  }}
                  placeholder="e.g., 6:00 PM"
                  value={customEndTime}
                  onChangeText={setCustomEndTime}
                  autoCapitalize="characters"
                />
                <TouchableOpacity
                  style={{
                    backgroundColor: '#8B5CF6',
                    borderRadius: 8,
                    padding: 12,
                    justifyContent: 'center',
                    alignItems: 'center',
                    minWidth: 50,
                  }}
                  onPress={() => {
                    setCustomEndTime('');
                    setTempEndTime(new Date());
                    setShowEndTimePicker(true);
                  }}
                >
                  <Ionicons name="time" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
              {customTimeError ? (
                <Text style={{ color: '#EF4444', fontSize: 12, marginTop: 4 }}>{customTimeError}</Text>
              ) : null}
            </View>

            <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
              <TouchableOpacity
                style={{ 
                  backgroundColor: '#6B7280', 
                  borderRadius: 8, 
                  padding: 12, 
                  flex: 1, 
                  alignItems: 'center' 
                }}
                onPress={() => {
                  setShowCustomTimeModal(false);
                  setCustomStartTime('');
                  setCustomEndTime('');
                  setCustomTimeError('');
                  // Reset openedFromEdit flag
                  setOpenedFromEdit(false);
                }}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ 
                  backgroundColor: '#10B981', 
                  borderRadius: 8, 
                  padding: 12, 
                  flex: 1, 
                  alignItems: 'center' 
                }}
                onPress={handleAddCustomTimeRange}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Time Pickers - Positioned on top of everything */}
      {showStartTimePicker && (
        <View style={styles.timePickerOverlay}>
          <View style={styles.timePickerContainer}>
            <Text style={styles.timePickerTitle}>Select Start Time</Text>
            <DateTimePicker
              value={tempStartTime}
              mode="time"
              is24Hour={false}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleStartTimeChange}
            />
            <View style={styles.timePickerButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancelTimePicker}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.timePickerSaveButton} onPress={handleSaveStartTime}>
                <Text style={styles.timePickerSaveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {showEndTimePicker && (
        <View style={styles.timePickerOverlay}>
          <View style={styles.timePickerContainer}>
            <Text style={styles.timePickerTitle}>Select End Time</Text>
            <DateTimePicker
              value={tempEndTime}
              mode="time"
              is24Hour={false}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleEndTimeChange}
            />
            <View style={styles.timePickerButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancelTimePicker}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.timePickerSaveButton} onPress={handleSaveEndTime}>
                <Text style={styles.timePickerSaveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const PRESET_TIME_RANGES = [
  { startTime: '7:00 AM', endTime: '9:00 AM' },
  { startTime: '9:00 AM', endTime: '12:00 PM' },
  { startTime: '12:00 PM', endTime: '3:00 PM' },
  { startTime: '3:00 PM', endTime: '6:00 PM' },
  { startTime: '6:00 PM', endTime: '9:00 PM' },
  { startTime: '7:00 AM', endTime: '6:00 PM' },
  { startTime: '9:00 AM', endTime: '5:00 PM' },
  { startTime: '8:00 AM', endTime: '4:00 PM' },
];

const availabilityCardColors = ['#A7F3D0', '#DDD6FE', '#FDE68A', '#BAE6FD'];

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  });
};

const getDayName = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { weekday: 'long' });
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerSpacer: {
    width: 24,
  },
  backButton: {
    position: 'absolute',
    left: 16,
    padding: 5,
    zIndex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 16,
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
    marginTop: 6,
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
  availabilitiesSection: {
    marginHorizontal: 20,
    marginTop: 20,
  },
  availabilitiesTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  availabilityCard: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  availabilityCardHeader: {
    padding: 12,
  },
  dateContainer: {
    marginBottom: 8,
  },
  dateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  dayText: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },

  timeSlotBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 6,
    marginVertical: 2,
  },
  timeSlotText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
  },
  availabilityCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  availabilityStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  availabilityStatsText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  deleteButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444',
  },
  timePickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  timePickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    alignItems: 'center',
  },
  timePickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  timePickerButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  cancelButton: {
    backgroundColor: '#6B7280',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  timePickerSaveButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  timePickerSaveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PetSitterAvailabilityScreen; 