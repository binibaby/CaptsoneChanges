import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Alert,
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
import { getAuthHeaders } from '../../constants/config';
import authService from '../../services/authService';
import { makeApiCall } from '../../services/networkService';
import realtimeLocationService from '../../services/realtimeLocationService';

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
  
  // Repeat weekly state
  const [repeatWeekly, setRepeatWeekly] = useState(false);
  
  // Helper function to check if a date is part of recurring availability
  const isRecurringAvailability = (date: string) => {
    return markedDates[date]?.selectedColor === '#8B5CF6';
  };
  
  // Weekly availability state (for repeat weekly feature only)
  const [weeklyAvailabilities, setWeeklyAvailabilities] = useState<{[key: string]: any}>({});
  
  // Availability status state
  const [isAvailabilityEnabled, setIsAvailabilityEnabled] = useState<boolean>(true);

  // Check availability status
  const checkAvailabilityStatus = async () => {
    try {
      const isAvailable = await realtimeLocationService.getCurrentUserAvailabilityStatus();
      const wasEnabled = isAvailabilityEnabled;
      setIsAvailabilityEnabled(isAvailable);
      console.log('📊 Availability status checked:', isAvailable ? 'ON' : 'OFF');
      
      // If availability was just turned on, refresh availability data
      if (isAvailable && !wasEnabled) {
        console.log('🔄 Availability turned ON - refreshing availability data...');
        await loadAvailabilityData();
      }
    } catch (error) {
      console.error('❌ Error checking availability status:', error);
      setIsAvailabilityEnabled(false);
    }
  };

  // Save availability data to AsyncStorage and backend
  const saveAvailabilityData = async (data: { [date: string]: TimeRange[] }, forceSave: boolean = false) => {
    try {
      const user = await authService.getCurrentUser();
      if (!user || user.role !== 'pet_sitter') {
        console.log('⚠️ User is not a pet sitter, skipping save');
        return;
      }

      // Save to user-specific local storage
      await AsyncStorage.setItem(`petSitterAvailabilities_${user.id}`, JSON.stringify(data));
      console.log('✅ Availability data saved to local storage for user:', user.id);

      // Save to backend (allow empty data if forceSave is true)
      await saveAvailabilityToBackend(data, forceSave);
    } catch (error) {
      console.error('❌ Error saving availability data:', error);
    }
  };

  // Save weekly availability data
  const saveWeeklyAvailabilityData = async (weeklyData: any, forceSave: boolean = false) => {
    try {
      const user = await authService.getCurrentUser();
      if (!user || user.role !== 'pet_sitter') {
        console.log('⚠️ User is not a pet sitter, skipping weekly save');
        return;
      }

      // Save to user-specific local storage
      await AsyncStorage.setItem(`petSitterWeeklyAvailabilities_${user.id}`, JSON.stringify(weeklyData));
      console.log('✅ Weekly availability data saved to local storage for user:', user.id);

      // Save to backend (allow empty data if forceSave is true)
      await saveWeeklyAvailabilityToBackend(weeklyData, forceSave);
    } catch (error) {
      console.error('❌ Error saving weekly availability data:', error);
    }
  };

  // Save availability to backend
  const saveAvailabilityToBackend = async (data: { [date: string]: TimeRange[] }, forceSave: boolean = false) => {
    try {
      const user = await authService.getCurrentUser();
      if (!user || user.role !== 'pet_sitter') {
        console.log('⚠️ User is not a pet sitter, skipping backend save');
        return;
      }

      // Convert data to the format expected by backend
      const availabilities = Object.entries(data).map(([date, timeRanges]) => ({
        date,
        timeRanges
      }));

      console.log('🔄 Saving availability for user:', user.id, user.name);
      console.log('🔄 Availability data:', availabilities);

      // Check if we have any availability data
      if (availabilities.length === 0) {
        if (forceSave) {
          console.log('🧹 Clearing daily availability data - skipping backend call since no data to save');
          return;
        } else {
          console.log('⚠️ No availability data to save');
          return;
        }
      }

      // Validate that each availability has the required fields
      for (const availability of availabilities) {
        if (!availability.date || !availability.timeRanges || availability.timeRanges.length === 0) {
          console.error('❌ Invalid availability data:', availability);
          return;
        }
        
        for (const timeRange of availability.timeRanges) {
          if (!timeRange.startTime || !timeRange.endTime) {
            console.error('❌ Invalid time range:', timeRange);
            return;
          }
        }
      }

      // Get token for the user
      const token = user.token;
      if (!token) {
        console.error('❌ No authentication token available for user:', user.id);
        console.log('❌ User needs to be properly authenticated to save availability');
        return;
      }

      console.log('✅ Using token for user:', user.id);

      const requestBody = { availabilities };
      console.log('🔄 Request body being sent:', JSON.stringify(requestBody, null, 2));

      const response = await makeApiCall(
        '/api/sitters/availability',
        {
          method: 'POST',
          headers: {
            ...getAuthHeaders(token),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        }
      );

      console.log('🔄 Response status:', response.status);
      console.log('🔄 Response ok:', response.ok);

      if (response.ok) {
        const responseData = await response.json();
        console.log('✅ Availability data saved to backend successfully:', responseData);
        
        // Also save to local storage for persistence when sitter goes offline/online
        await AsyncStorage.setItem(`petSitterAvailabilities_${user.id}`, JSON.stringify(data));
        console.log('✅ Availability data also saved to local storage for persistence');
      } else {
        console.error('❌ Failed to save availability to backend:', response.status);
        
        // Try to parse error response for better debugging
        try {
          const errorText = await response.text();
          console.error('❌ Error response:', errorText);
          
          // Try to parse error as JSON for better error handling
          try {
            const errorData = JSON.parse(errorText);
            console.error('❌ Parsed error data:', errorData);
            
            // Provide more specific error messages based on the parsed data
            if (errorData.message) {
              console.error('❌ Error message:', errorData.message);
            }
            if (errorData.errors) {
              console.error('❌ Validation errors:', errorData.errors);
            }
          } catch (parseError) {
            console.error('❌ Could not parse error response as JSON');
            console.error('❌ Raw error text:', errorText);
          }
        } catch (textError) {
          console.error('❌ Could not read error response text:', textError);
        }
      }
    } catch (error) {
      console.error('❌ Error saving availability to backend:', error);
    }
  };

  // Save weekly availability to backend
  const saveWeeklyAvailabilityToBackend = async (weeklyData: any, forceSave: boolean = false) => {
    try {
      const user = await authService.getCurrentUser();
      if (!user || user.role !== 'pet_sitter') {
        console.log('⚠️ User is not a pet sitter, skipping backend save');
        return;
      }

      // Convert weekly data to the format expected by backend
      const availabilities = Object.entries(weeklyData).map(([weekId, weekData]: [string, any]) => ({
        weekId,
        startDate: weekData.startDate,
        endDate: weekData.endDate,
        startTime: weekData.startTime,
        endTime: weekData.endTime,
        isWeekly: true
      }));

      console.log('🔄 Saving weekly availability for user:', user.id, user.name);
      console.log('🔄 Weekly availability data:', availabilities);

      if (availabilities.length === 0) {
        if (forceSave) {
          console.log('🧹 Clearing weekly availability data - skipping backend call since feature is removed');
          return;
        } else {
          console.log('⚠️ No weekly availability data to save');
          return;
        }
      }

      const token = user.token;
      if (!token) {
        console.error('❌ No token available for user');
        return;
      }

      const requestBody = {
        availabilities: availabilities,
        isWeekly: true
      };

      console.log('🔄 Request body being sent:', JSON.stringify(requestBody, null, 2));

      const response = await makeApiCall(
        '/api/sitters/weekly-availability',
        {
          method: 'POST',
          headers: {
            ...getAuthHeaders(token),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        }
      );

      console.log('🔄 Response status:', response.status);
      console.log('🔄 Response ok:', response.ok);

      if (response.ok) {
        const responseData = await response.json();
        console.log('✅ Weekly availability data saved to backend successfully:', responseData);
      } else {
        console.error('❌ Failed to save weekly availability to backend:', response.status);
        
        // Try to parse error response for better debugging
        try {
          const errorText = await response.text();
          console.error('❌ Error response:', errorText);
          
          // Try to parse error as JSON for better error handling
          try {
            const errorData = JSON.parse(errorText);
            console.error('❌ Parsed error data:', errorData);
            
            // Provide more specific error messages based on the parsed data
            if (errorData.message) {
              console.error('❌ Error message:', errorData.message);
            }
            if (errorData.errors) {
              console.error('❌ Validation errors:', errorData.errors);
            }
          } catch (parseError) {
            console.error('❌ Could not parse error response as JSON');
            console.error('❌ Raw error text:', errorText);
          }
        } catch (textError) {
          console.error('❌ Could not read error response text:', textError);
        }
      }
    } catch (error) {
      console.error('❌ Error saving weekly availability to backend:', error);
    }
  };

  // Generate marked dates for daily availability
  const generateMarkedDates = () => {
    const markedDatesData: any = {};
    
    // Add daily availability with green indicators
    Object.keys(availabilities).forEach(date => {
      if (availabilities[date] && availabilities[date].length > 0) {
        markedDatesData[date] = { 
          selected: true, 
          marked: true, 
          selectedColor: '#10B981',
          selectedTextColor: '#fff',
          dots: [{
            key: 'daily',
            color: '#10B981',
            selectedDotColor: '#10B981'
          }]
        };
      }
    });
    
    console.log('📅 Generated marked dates:', markedDatesData);
    return markedDatesData;
  };

  // Load availability data from backend and local storage
  const loadAvailabilityData = async () => {
    try {
      const user = await authService.getCurrentUser();
      if (!user || user.role !== 'pet_sitter') {
        console.log('⚠️ User is not a pet sitter, skipping availability load');
        return;
      }

      // First try to load from backend
      await loadAvailabilityFromBackend(user.id);
      
      // Then load from local storage as fallback
      const savedData = await AsyncStorage.getItem(`petSitterAvailabilities_${user.id}`);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        setAvailabilities(parsedData);
        console.log('✅ Local availability data loaded successfully');
      }
    } catch (error) {
      console.error('❌ Error loading availability data:', error);
    }
  };

  // Load availability data from backend
  const loadAvailabilityFromBackend = async (userId: string) => {
    try {
      const user = await authService.getCurrentUser();
      if (!user || !user.token) {
        console.log('⚠️ No user or token available for backend load');
        return;
      }

      console.log('🔄 Loading availability from backend for user:', userId);
      
      const response = await makeApiCall(
        `/api/sitters/${userId}/availability`,
        {
          method: 'GET',
          headers: {
            ...getAuthHeaders(user.token),
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Backend availability data loaded:', data);
        
        if (data.availabilities && data.availabilities.length > 0) {
          // Convert backend format to local format
          const availabilityData: { [date: string]: TimeRange[] } = {};
          data.availabilities.forEach((availability: any) => {
            availabilityData[availability.date] = availability.timeRanges;
          });
          
          setAvailabilities(availabilityData);
          
          // Save to local storage for offline access
          await AsyncStorage.setItem(`petSitterAvailabilities_${userId}`, JSON.stringify(availabilityData));
          console.log('✅ Availability data synced to local storage');
        }
      } else {
        console.log('⚠️ API call failed (404), retrying... (1/1)');
        console.log('🔄 Forcing network re-detection...');
        
        // Try to parse error response for better debugging
        try {
          const errorText = await response.text();
          console.error('❌ Error response:', errorText);
          
          // Try to parse error as JSON for better error handling
          try {
            const errorData = JSON.parse(errorText);
            console.error('❌ Parsed error data:', errorData);
          } catch (parseError) {
            console.error('❌ Could not parse error response as JSON');
          }
        } catch (textError) {
          console.error('❌ Could not read error response text:', textError);
        }
        
        console.log('⚠️ No backend availability data found for user:', userId);
      }
    } catch (error) {
      console.error('❌ Error loading availability from backend:', error);
    }
  };



  // Clear availability data for new sitters and implement auto-cleanup
  const clearAvailabilityDataForNewSitter = async () => {
    try {
      const user = await authService.getCurrentUser();
      if (!user || user.role !== 'pet_sitter') {
        return;
      }

      // Check if this is a new sitter by looking for a flag
      const isNewSitter = await AsyncStorage.getItem(`sitter_${user.id}_availability_initialized`);
      
      if (!isNewSitter) {
        console.log('🆕 New sitter detected, clearing availability data');
        
        // Clear all user-specific availability data
        await AsyncStorage.removeItem(`petSitterAvailabilities_${user.id}`);
        await AsyncStorage.removeItem(`petSitterWeeklyAvailabilities_${user.id}`);
        
        // Reset local state
        setAvailabilities({});
        setWeeklyAvailabilities({});
        setMarkedDates({});
        
        // Mark this sitter as having initialized their availability
        await AsyncStorage.setItem(`sitter_${user.id}_availability_initialized`, 'true');
        
        console.log('✅ Availability data cleared for new sitter');
      } else {
        // For existing sitters, clean up expired availability data
        await cleanupExpiredAvailabilityData(user.id);
        
        // Clear all existing weekly schedules (since we removed the weekly feature)
        console.log('🧹 Clearing all existing weekly schedules for existing sitter');
        setWeeklyAvailabilities({});
        await AsyncStorage.removeItem(`petSitterWeeklyAvailabilities_${user.id}`);
        await saveWeeklyAvailabilityData({}, true); // Clear from backend
        console.log('✅ All weekly schedules cleared for existing sitter');
      }
    } catch (error) {
      console.error('❌ Error clearing availability data for new sitter:', error);
    }
  };

  // Clean up expired availability data
  const cleanupExpiredAvailabilityData = async (userId: string) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Clean up daily availability
      const dailyData = await AsyncStorage.getItem(`petSitterAvailabilities_${userId}`);
      if (dailyData) {
        const parsedData = JSON.parse(dailyData);
        const cleanedData: { [date: string]: TimeRange[] } = {};
        
        Object.keys(parsedData).forEach(date => {
          const dateObj = new Date(date);
          if (dateObj >= today) {
            cleanedData[date] = parsedData[date];
          }
        });
        
        if (Object.keys(cleanedData).length !== Object.keys(parsedData).length) {
          await AsyncStorage.setItem(`petSitterAvailabilities_${userId}`, JSON.stringify(cleanedData));
          setAvailabilities(cleanedData);
          console.log('✅ Cleaned up expired daily availability data');
        }
      }
      
      // Clean up weekly availability
      const weeklyData = await AsyncStorage.getItem(`petSitterWeeklyAvailabilities_${userId}`);
      if (weeklyData) {
        const parsedData = JSON.parse(weeklyData);
        const cleanedData: { [key: string]: any } = {};
        
        Object.keys(parsedData).forEach(weekId => {
          const weekData = parsedData[weekId];
          const endDate = new Date(weekData.endDate);
          if (endDate >= today) {
            cleanedData[weekId] = weekData;
          }
        });
        
        if (Object.keys(cleanedData).length !== Object.keys(parsedData).length) {
          await AsyncStorage.setItem(`petSitterWeeklyAvailabilities_${userId}`, JSON.stringify(cleanedData));
          setWeeklyAvailabilities(cleanedData);
          console.log('✅ Cleaned up expired weekly availability data');
        }
      }
    } catch (error) {
      console.error('❌ Error cleaning up expired availability data:', error);
    }
  };

  // Load data when component mounts
  useEffect(() => {
    clearAvailabilityDataForNewSitter();
    loadAvailabilityData();
    checkAvailabilityStatus();
  }, []);

  // Refresh data when screen comes into focus (to get latest data after changes)
  useFocusEffect(
    useCallback(() => {
      console.log('🔄 PetSitterAvailabilityScreen focused, refreshing data');
      loadAvailabilityData();
      checkAvailabilityStatus();
    }, [])
  );

  // Refresh data when screen comes into focus
  useEffect(() => {
    const handleFocus = () => {
      console.log('🔄 Screen focused, refreshing availability data...');
      loadAvailabilityData();
    };

    // Call immediately and set up interval for periodic refresh
    handleFocus();
    const interval = setInterval(handleFocus, 5000); // Refresh every 5 seconds
    
    return () => {
      clearInterval(interval);
    };
  }, []);

  // Update marked dates when availabilities change
  useEffect(() => {
    console.log('🔄 Updating marked dates...');
    console.log('📅 Current availabilities:', availabilities);
    
    const newMarkedDates = generateMarkedDates();
    setMarkedDates(newMarkedDates);
  }, [availabilities]);

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

        // Handle repeat weekly logic
        if (repeatWeekly) {
          console.log('🔄 Setting up weekly recurring availability for:', selectedDate);
          const baseDate = new Date(selectedDate);
          const dayOfWeek = baseDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
          const timeRanges = availabilities[selectedDate];
          
          // Generate recurring availability for the next 12 weeks
          const newAvailabilities = { ...availabilities };
          const newMarkedDates = { ...markedDates };
          
          for (let week = 1; week <= 12; week++) {
            const recurringDate = new Date(baseDate);
            recurringDate.setDate(baseDate.getDate() + (week * 7));
            const dateString = recurringDate.toISOString().split('T')[0];
            
            // Add the same time ranges for this recurring date
            newAvailabilities[dateString] = [...timeRanges];
            
            // Mark the date on the calendar
            newMarkedDates[dateString] = { 
              selected: true, 
              marked: true, 
              selectedColor: '#8B5CF6' // Purple color for recurring availability
            };
          }
          
          setAvailabilities(newAvailabilities);
          setMarkedDates(newMarkedDates);
          
          // Save the updated availability data
          saveAvailabilityData(newAvailabilities);
          
          console.log('✅ Weekly recurring availability set for 12 weeks');
        }
      } else {
        // If no time ranges selected, still close the modal but don't mark the date
        console.log('No time ranges selected for this date');
      }
    }
    
    // Reset repeat weekly checkbox
    setRepeatWeekly(false);
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

  const handleDeleteAvailability = async (date: string) => {
    try {
      console.log('🗑️ Deleting availability for date:', date);
      console.log('🗑️ Current availabilities before deletion:', Object.keys(availabilities));
      console.log('🗑️ Current markedDates before deletion:', Object.keys(markedDates));
      
      // Show confirmation dialog
      Alert.alert(
        'Delete Availability',
        `Are you sure you want to delete the availability for ${new Date(date).toLocaleDateString()}?`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                const isRecurring = isRecurringAvailability(date);
                
                if (isRecurring) {
                  // For recurring availability, show a confirmation dialog
                  // For now, we'll just delete this instance
                  console.log('🗑️ Deleting recurring availability instance for:', date);
                }
                
                const newAvailabilities = { ...availabilities };
                delete newAvailabilities[date];
                
                // Update local state immediately for better UX
                setAvailabilities(newAvailabilities);
                
                const newMarkedDates = { ...markedDates };
                delete newMarkedDates[date];
                setMarkedDates(newMarkedDates);
                
                console.log('🗑️ New availabilities after deletion:', Object.keys(newAvailabilities));
                console.log('🗑️ New markedDates after deletion:', Object.keys(newMarkedDates));
                
                // Save to backend and local storage
                await saveAvailabilityData(newAvailabilities);
                
                console.log('✅ Availability deleted successfully for:', date);
              } catch (error) {
                console.error('❌ Error deleting availability:', error);
                console.error('❌ Error details:', error);
                // Revert local state if backend save failed
                setAvailabilities(availabilities);
                setMarkedDates(markedDates);
                Alert.alert('Error', 'Failed to delete availability. Please try again.');
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('❌ Error in handleDeleteAvailability:', error);
    }
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
    
    // Mark the date as selected with green color
    setMarkedDates({
      ...markedDates,
      [targetDate]: { selected: true, marked: true, selectedColor: '#10B981' }
    });

    // Handle repeat weekly logic for custom times
    if (repeatWeekly) {
      console.log('🔄 Setting up weekly recurring availability for custom time:', targetDate);
      const baseDate = new Date(targetDate);
      const timeRanges = [newRange]; // Use the custom time range
      
      // Generate recurring availability for the next 12 weeks
      const recurringAvailabilities = { ...newAvailabilities };
      const recurringMarkedDates = { ...markedDates };
      
      for (let week = 1; week <= 12; week++) {
        const recurringDate = new Date(baseDate);
        recurringDate.setDate(baseDate.getDate() + (week * 7));
        const dateString = recurringDate.toISOString().split('T')[0];
        
        // Add the same custom time range for this recurring date
        recurringAvailabilities[dateString] = [...timeRanges];
        
        // Mark the date on the calendar with purple color for recurring
        recurringMarkedDates[dateString] = { 
          selected: true, 
          marked: true, 
          selectedColor: '#8B5CF6' // Purple color for recurring availability
        };
      }
      
      setAvailabilities(recurringAvailabilities);
      setMarkedDates(recurringMarkedDates);
      
      // Save the updated availability data with recurring times
      saveAvailabilityData(recurringAvailabilities);
      
      console.log('✅ Weekly recurring availability set for custom time for 12 weeks');
    } else {
      // Save normally if not repeating weekly
      saveAvailabilityData(newAvailabilities);
    }
    
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
    // Reset repeat weekly state for custom time modal
    setRepeatWeekly(false);
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
    // Reset repeat weekly state for custom time modal
    setRepeatWeekly(false);
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
    // Ensure all dates are visible
    'stylesheet.calendar.main': {
      container: {
        paddingLeft: 5,
        paddingRight: 5,
      }
    },
    'stylesheet.day.basic': {
      base: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 16,
        margin: 1,
      },
      today: {
        backgroundColor: '#E0E7FF',
        borderRadius: 16,
      },
      todayText: {
        color: '#8B5CF6',
        fontWeight: 'bold',
      },
      selected: {
        backgroundColor: '#10B981',
        borderRadius: 16,
      },
      selectedText: {
        color: '#fff',
        fontWeight: 'bold',
      },
      disabled: {
        opacity: 0.3,
      },
      disabledText: {
        color: '#ccc',
      }
    },
    // Multi-dot marking styles
    'stylesheet.day.multi-dot': {
      base: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 16,
        margin: 1,
      },
      selected: {
        backgroundColor: '#8B5CF6',
        borderRadius: 16,
      },
      today: {
        backgroundColor: '#E0E7FF',
        borderRadius: 16,
      },
      text: {
        color: '#222',
        fontWeight: '500',
        fontSize: 16,
      },
      selectedText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
      },
      todayText: {
        color: '#8B5CF6',
        fontWeight: 'bold',
        fontSize: 16,
      }
    }
  }), []);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Set Availability</Text>
      </View>
      <ScrollView style={styles.content}>
        <View style={{ margin: 16, borderRadius: 16, overflow: 'hidden', backgroundColor: '#fff', elevation: 2 }}>
          <Calendar
            onDayPress={handleDayPress}
            markedDates={generateMarkedDates()}
            theme={calendarTheme}
            style={{ borderRadius: 16 }}
            hideExtraDays={false}
            disableMonthChange={false}
            firstDay={1}
            markingType="multi-dot"
            enableSwipeMonths={true}
            // Ensure all dates are visible
            minDate="2025-01-01"
            maxDate="2026-12-31"
          />
        </View>

        {/* Calendar Legend */}
        <View style={styles.legendContainer}>
          <Text style={styles.legendTitle}>Availability Legend</Text>
          <View style={styles.legendItems}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
              <Text style={styles.legendText}>Daily Availability</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#8B5CF6' }]} />
              <Text style={styles.legendText}>Repeat Weekly</Text>
            </View>
          </View>
        </View>


        {/* Show selected availabilities */}
        <View style={styles.availabilitiesSection}>
          {Object.keys(availabilities).length > 0 && isAvailabilityEnabled && (
            <Text style={styles.availabilitiesTitle}>Single Day Availabilities</Text>
          )}
          {!isAvailabilityEnabled && Object.keys(availabilities).length > 0 && (
            <View style={styles.availabilityDisabledMessage}>
              <Ionicons name="eye-off" size={24} color="#6B7280" />
              <Text style={styles.availabilityDisabledText}>
                Schedules are hidden because availability is turned OFF
              </Text>
              <Text style={styles.availabilityDisabledSubtext}>
                Turn ON availability in the dashboard to view your schedules
              </Text>
            </View>
          )}
          {isAvailabilityEnabled && Object.entries(availabilities).map(([date, timeRanges], index) => {
            // Check if this is a recurring availability
            const isRecurring = isRecurringAvailability(date);
            
            return (
            <View key={date} style={[styles.availabilityCard, { backgroundColor: availabilityCardColors[index % availabilityCardColors.length] }]}>
              <View style={styles.availabilityCardHeader}>
                <View style={styles.dateContainer}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.dateText}>{formatDate(date)}</Text>
                    {isRecurring && (
                      <View style={{ 
                        marginLeft: 8, 
                        backgroundColor: 'rgba(139, 92, 246, 0.2)', 
                        paddingHorizontal: 6, 
                        paddingVertical: 2, 
                        borderRadius: 8 
                      }}>
                        <Text style={{ 
                          fontSize: 10, 
                          color: '#8B5CF6', 
                          fontWeight: '600' 
                        }}>
                          🔄 WEEKLY
                        </Text>
                      </View>
                    )}
                  </View>
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
            );
          })}
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
          
          {/* Repeat Weekly Checkbox */}
          <View style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            marginBottom: 16, 
            paddingHorizontal: 8,
            backgroundColor: '#F8F9FA',
            borderRadius: 12,
            padding: 12
          }}>
            <TouchableOpacity
              style={{
                width: 24,
                height: 24,
                borderRadius: 4,
                borderWidth: 2,
                borderColor: repeatWeekly ? '#8B5CF6' : '#D1D5DB',
                backgroundColor: repeatWeekly ? '#8B5CF6' : 'transparent',
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 12,
              }}
              onPress={() => setRepeatWeekly(!repeatWeekly)}
            >
              {repeatWeekly && (
                <Ionicons name="checkmark" size={16} color="#fff" />
              )}
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={{ 
                fontSize: 16, 
                fontWeight: '600', 
                color: '#374151',
                marginBottom: 2
              }}>
                Repeat Weekly
              </Text>
              <Text style={{ 
                fontSize: 12, 
                color: '#6B7280',
                lineHeight: 16
              }}>
                This availability will repeat every {selectedDate ? new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long' }) : 'week'} at the same time
              </Text>
            </View>
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

            {/* Repeat Weekly Checkbox for Custom Times */}
            <View style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              marginBottom: 16,
              width: '100%'
            }}>
              <TouchableOpacity
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 4,
                  borderWidth: 2,
                  borderColor: repeatWeekly ? '#8B5CF6' : '#D1D5DB',
                  backgroundColor: repeatWeekly ? '#8B5CF6' : 'transparent',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 12,
                }}
                onPress={() => setRepeatWeekly(!repeatWeekly)}
              >
                {repeatWeekly && (
                  <Ionicons name="checkmark" size={16} color="#fff" />
                )}
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={{ 
                  fontSize: 16, 
                  fontWeight: '600', 
                  color: '#374151',
                  marginBottom: 2
                }}>
                  Repeat Weekly
                </Text>
                <Text style={{ 
                  fontSize: 12, 
                  color: '#6B7280',
                  lineHeight: 16
                }}>
                  This custom time will repeat every {(editingDate || selectedDate) ? new Date(editingDate || selectedDate || '').toLocaleDateString('en-US', { weekday: 'long' }) : 'week'} at the same time
                </Text>
              </View>
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
  weeklyAvailabilityCard: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
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
  availabilityDisabledMessage: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 20,
    margin: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  availabilityDisabledText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  availabilityDisabledSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default PetSitterAvailabilityScreen; 