// Utility functions for consistent time formatting across the app

/**
 * Convert 24-hour time to 12-hour format with AM/PM
 * @param time24 - Time in 24-hour format (e.g., "15:00" or "15:00:00")
 * @returns Time in 12-hour format (e.g., "3:00 PM")
 */
export const formatTime24To12 = (time24: string): string => {
  if (!time24) return 'Invalid Time';
  
  try {
    // Extract hours and minutes from various formats
    let cleanTime = time24;
    
    // If it contains 'T' (ISO format), extract just the time part
    if (time24.includes('T')) {
      const timeMatch = time24.match(/(\d{1,2}):(\d{2})/);
      if (timeMatch) {
        cleanTime = `${timeMatch[1]}:${timeMatch[2]}`;
      }
    }
    
    // Handle 12-hour format with AM/PM (already formatted)
    if (cleanTime.includes('AM') || cleanTime.includes('PM')) {
      return cleanTime;
    }
    
    // Parse 24-hour format
    const [hours, minutes] = cleanTime.split(':');
    const hour = parseInt(hours, 10);
    const minute = parseInt(minutes, 10);
    
    if (isNaN(hour) || isNaN(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
      return 'Invalid Time';
    }
    
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    
    return `${hour12}:${minute.toString().padStart(2, '0')} ${ampm}`;
  } catch (error) {
    console.error('Error formatting time:', error, 'Input:', time24);
    return 'Invalid Time';
  }
};

/**
 * Convert 12-hour time to 24-hour format
 * @param time12 - Time in 12-hour format (e.g., "3:00 PM")
 * @returns Time in 24-hour format (e.g., "15:00")
 */
export const formatTime12To24 = (time12: string): string => {
  if (!time12) return '00:00';
  
  try {
    // If already in 24-hour format, return as is
    if (!time12.includes('AM') && !time12.includes('PM')) {
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
    
    return `${hour24.toString().padStart(2, '0')}:${minutes}`;
  } catch (error) {
    console.error('Error converting time to 24-hour format:', error, 'Input:', time12);
    return '00:00';
  }
};

/**
 * Format time range from 24-hour to 12-hour format
 * @param startTime - Start time in 24-hour format
 * @param endTime - End time in 24-hour format
 * @returns Formatted time range (e.g., "3:00 PM - 6:00 PM")
 */
export const formatTimeRange = (startTime: string, endTime: string): string => {
  const formattedStart = formatTime24To12(startTime);
  const formattedEnd = formatTime24To12(endTime);
  
  if (formattedStart === 'Invalid Time' || formattedEnd === 'Invalid Time') {
    return 'Time not set';
  }
  
  return `${formattedStart} - ${formattedEnd}`;
};

/**
 * Format date consistently
 * @param dateString - Date string
 * @returns Formatted date (e.g., "Oct 27, 2025")
 */
export const formatDate = (dateString: string): string => {
  if (!dateString) return 'Invalid Date';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', error, 'Input:', dateString);
    return dateString;
  }
};
