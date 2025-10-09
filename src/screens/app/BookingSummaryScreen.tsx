import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { makeApiCall } from '../../services/networkService';

interface BookingSummaryScreenProps {
  bookingId?: string;
  sitterId?: string;
  sitterName?: string;
  sitterImage?: string;
  sitterRate?: string;
  selectedDate?: string;
  startTime?: string;
  endTime?: string;
  petName?: string;
  petType?: string;
  serviceType?: string;
  duration?: number;
  description?: string;
}

const BookingSummaryScreen: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const {
    bookingId,
    sitterId,
    sitterName,
    sitterImage,
    sitterRate,
    selectedDate,
    startTime,
    endTime,
    petName,
    petType,
    serviceType,
    duration,
    description,
  } = useLocalSearchParams<BookingSummaryScreenProps>();

  // Debug logging to see what time values we're receiving
  console.log('🔍 BookingSummaryScreen received params:', {
    selectedDate,
    startTime,
    endTime,
    duration,
    sitterRate
  });

  // Calculate total amount with proper validation
  const hourlyRate = parseFloat(sitterRate || '25') || 25; // Fallback to 25 if NaN
  const hours = duration ? (parseFloat(duration.toString()) / 60) || 2 : 2; // Default to 2 hours if not specified or invalid
  const totalAmount = hourlyRate * hours;
  const appFee = totalAmount * 0.1; // 10% app fee
  const sitterAmount = totalAmount * 0.9; // 90% to sitter

  // Debug logging to help identify calculation issues
  console.log('💰 Payment calculation debug:', {
    sitterRate,
    hourlyRate,
    duration,
    hours,
    totalAmount,
    appFee,
    sitterAmount
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return 'Invalid Time';
    
    try {
      // Handle different time formats
      let cleanTime = timeString;
      
      // If it contains 'T' (ISO format), extract just the time part
      if (timeString.includes('T')) {
        const timeMatch = timeString.match(/(\d{1,2}):(\d{2})/);
        if (timeMatch) {
          cleanTime = `${timeMatch[1]}:${timeMatch[2]}`;
        }
      }
      
      // Handle 12-hour format with AM/PM
      const time12HourRegex = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i;
      const time24HourRegex = /^(\d{1,2}):(\d{2})$/;
      
      let hour, minute, ampm;
      
      if (time12HourRegex.test(cleanTime)) {
        const match = cleanTime.match(time12HourRegex);
        hour = parseInt(match[1], 10);
        minute = parseInt(match[2], 10);
        ampm = match[3].toUpperCase();
        
        // Convert to 24-hour format for validation
        if (ampm === 'PM' && hour !== 12) {
          hour += 12;
        } else if (ampm === 'AM' && hour === 12) {
          hour = 0;
        }
      } else if (time24HourRegex.test(cleanTime)) {
        const match = cleanTime.match(time24HourRegex);
        hour = parseInt(match[1], 10);
        minute = parseInt(match[2], 10);
        ampm = hour >= 12 ? 'PM' : 'AM';
      } else {
        console.error('Invalid time format:', timeString);
        return 'Invalid Time';
      }
      
      // Validate hour and minute
      if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
        console.error('Invalid time values:', { hour, minute });
        return 'Invalid Time';
      }
      
      // Convert to 12-hour format
      const hour12 = hour % 12 || 12;
      const formattedMinute = minute.toString().padStart(2, '0');
      
      return `${hour12}:${formattedMinute} ${ampm}`;
    } catch (error) {
      console.error('Error formatting time:', error, 'Input:', timeString);
      return 'Invalid Time';
    }
  };

  // Helper function to safely format currency
  const formatCurrency = (amount: number) => {
    if (isNaN(amount) || !isFinite(amount)) {
      return '0.00';
    }
    return amount.toFixed(2);
  };

  const handleProceedToPayment = async () => {
    if (!user) {
      Alert.alert('Error', 'Please log in to proceed with payment');
      return;
    }

    // Validate required parameters before proceeding
    if (!bookingId) {
      Alert.alert('Error', 'Booking ID is missing. Please try again.');
      return;
    }

    // Ensure booking ID is a number
    const numericBookingId = parseInt(bookingId.toString(), 10);
    if (isNaN(numericBookingId) || numericBookingId <= 0) {
      Alert.alert('Error', 'Invalid booking ID. Please try again.');
      return;
    }

    if (isNaN(totalAmount) || totalAmount <= 0) {
      Alert.alert('Error', 'Invalid payment amount. Please check your booking details.');
      return;
    }

    setLoading(true);

    try {
      console.log('💳 Creating payment invoice for booking:', bookingId);
      console.log('💳 Payment amount:', totalAmount);
      console.log('💳 User authenticated:', !!user);
      console.log('💳 User token available:', !!user?.token);
      console.log('💳 Booking details:', {
        bookingId: numericBookingId,
        totalAmount,
        hourlyRate,
        hours,
        duration
      });

      // Create payment invoice
      const response = await makeApiCall('/payments/create-invoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          booking_id: numericBookingId,
        }),
      });

      console.log('💳 Payment API response status:', response.status);

      if (!response.ok) {
        console.error('💳 Payment API failed with status:', response.status);
        
        try {
          const errorText = await response.text();
          console.error('💳 Payment API error response:', errorText);
          
          try {
            const errorData = JSON.parse(errorText);
            console.error('💳 Parsed error data:', errorData);
            
            // Provide more specific error messages based on the error
            let errorMessage = 'Failed to create payment invoice';
            if (errorData.error) {
              if (errorData.error.includes('API key is forbidden')) {
                errorMessage = 'Payment service is temporarily unavailable. Please try again later or contact support.';
              } else if (errorData.error.includes('insufficient permissions')) {
                errorMessage = 'Payment service configuration issue. Please contact support.';
              } else {
                errorMessage = errorData.error;
              }
            } else if (errorData.message) {
              errorMessage = errorData.message;
            }
            
            Alert.alert('Payment Error', errorMessage);
          } catch (parseError) {
            console.error('💳 Could not parse error response as JSON:', parseError);
            Alert.alert('Payment Error', 'Failed to create payment invoice. Please try again.');
          }
        } catch (textError) {
          console.error('💳 Could not read error response text:', textError);
          Alert.alert('Payment Error', 'Network error. Please check your connection and try again.');
        }
        return;
      }

      const data = await response.json();
      console.log('💳 Payment API success response:', data);

      if (data.success) {
        // Redirect to Xendit checkout
        const { invoice_url } = data;
        
        // For React Native, we'll use WebView to redirect to Xendit
        router.push({
          pathname: '/xendit-checkout',
          params: {
            invoiceUrl: invoice_url,
            bookingId: bookingId,
            paymentId: data.payment.id,
          },
        });
      } else {
        Alert.alert('Error', data.error || 'Failed to create payment invoice');
      }
    } catch (error) {
      console.error('💳 Payment creation error:', error);
      Alert.alert('Error', 'Failed to create payment. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booking Summary</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Sitter Information */}
        <View style={styles.sitterCard}>
          <View style={styles.sitterInfo}>
            <Image
              source={{
                uri: sitterImage || 'https://via.placeholder.com/60x60?text=Sitter',
              }}
              style={styles.sitterImage}
            />
            <View style={styles.sitterDetails}>
              <Text style={styles.sitterName}>{sitterName || 'Pet Sitter'}</Text>
              <Text style={styles.sitterRate}>₱{sitterRate || '25'}/hour</Text>
            </View>
          </View>
        </View>

        {/* Booking Details */}
        <View style={styles.detailsCard}>
          <Text style={styles.cardTitle}>Booking Details</Text>
          
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="calendar-outline" size={20} color="#3B82F6" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Date</Text>
              <Text style={styles.detailValue}>
                {selectedDate ? formatDate(selectedDate) : 'Not specified'}
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="time-outline" size={20} color="#3B82F6" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Time</Text>
              <Text style={styles.detailValue}>
                {startTime && endTime 
                  ? `${formatTime(startTime)} - ${formatTime(endTime)}`
                  : 'Not specified'
                }
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="paw-outline" size={20} color="#3B82F6" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Pet</Text>
              <Text style={styles.detailValue}>
                {petName || 'My Pet'} ({petType || 'Dog'})
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="construct-outline" size={20} color="#3B82F6" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Service</Text>
              <Text style={styles.detailValue}>
                {serviceType || 'Pet Sitting'}
              </Text>
            </View>
          </View>

          {description && (
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons name="document-text-outline" size={20} color="#3B82F6" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Notes</Text>
                <Text style={styles.detailValue}>{description}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Payment Breakdown */}
        <View style={styles.paymentCard}>
          <Text style={styles.cardTitle}>Payment Breakdown</Text>
          
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Service Fee ({formatCurrency(hours)} hours)</Text>
            <Text style={styles.paymentValue}>₱{formatCurrency(totalAmount)}</Text>
          </View>
          
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Platform Fee (10%)</Text>
            <Text style={styles.paymentValue}>₱{formatCurrency(appFee)}</Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.paymentRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>₱{formatCurrency(totalAmount)}</Text>
          </View>
          
          <View style={styles.sitterNote}>
            <Ionicons name="information-circle-outline" size={16} color="#10B981" />
            <Text style={styles.sitterNoteText}>
              Sitter will receive ₱{formatCurrency(sitterAmount)} after platform fee
            </Text>
          </View>
        </View>

        {/* Payment Method Info */}
        <View style={styles.paymentMethodCard}>
          <View style={styles.paymentMethodHeader}>
            <Ionicons name="card-outline" size={24} color="#3B82F6" />
            <Text style={styles.paymentMethodTitle}>Secure Payment</Text>
          </View>
          <Text style={styles.paymentMethodDescription}>
            You will be redirected to Xendit's secure payment page to complete your transaction.
            We accept all major credit cards, debit cards, and digital wallets.
          </Text>
        </View>
      </ScrollView>

      {/* Proceed to Payment Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.paymentButton, loading && styles.paymentButtonDisabled]}
          onPress={handleProceedToPayment}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <>
              <Ionicons name="card" size={24} color="#FFF" />
              <Text style={styles.paymentButtonText}>
                Proceed to Payment - ₱{formatCurrency(totalAmount)}
              </Text>
              <Ionicons name="arrow-forward" size={20} color="#FFF" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sitterCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sitterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sitterImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  sitterDetails: {
    flex: 1,
  },
  sitterName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  sitterRate: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '500',
  },
  detailsCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EBF4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  paymentCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  paymentLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  paymentValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F59E0B',
  },
  sitterNote: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 12,
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
  },
  sitterNoteText: {
    fontSize: 12,
    color: '#10B981',
    marginLeft: 8,
    flex: 1,
  },
  paymentMethodCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    marginTop: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  paymentMethodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  paymentMethodTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  paymentMethodDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  bottomContainer: {
    padding: 20,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  paymentButton: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  paymentButtonDisabled: {
    opacity: 0.6,
  },
  paymentButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 8,
  },
});

export default BookingSummaryScreen;
