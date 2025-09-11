import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

interface PaymentScreenProps {
  bookingId: number;
  amount: number;
  petSitterName: string;
  bookingDetails: any;
}

const PaymentScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { bookingId, amount, petSitterName, bookingDetails } = route.params as PaymentScreenProps;

  const [selectedMethod, setSelectedMethod] = useState<'card' | 'gcash' | 'maya'>('card');
  const [loading, setLoading] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  // Calculate fees
  const platformFee = (amount * 20) / 100; // 20% platform fee
  const sitterAmount = amount - platformFee;

  const paymentMethods = [
    {
      id: 'card',
      name: 'Credit/Debit Card',
      icon: 'card-outline',
      color: '#4F46E5'
    },
    {
      id: 'gcash',
      name: 'GCash',
      icon: 'phone-portrait-outline',
      color: '#007DFF'
    },
    {
      id: 'maya',
      name: 'Maya (PayMaya)',
      icon: 'wallet-outline',
      color: '#00D4AA'
    }
  ];

  const processPayment = async () => {
    if (loading) return;

    // Validation
    if (selectedMethod === 'card') {
      if (!cardNumber || !expiryDate || !cvv) {
        Alert.alert('Error', 'Please fill in all card details');
        return;
      }
    } else if (!phoneNumber) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }

    setLoading(true);

    try {
      const token = await getAuthToken(); // Get from AsyncStorage or context
      const apiUrl = 'http://172.20.10.2:8000/api';

      let endpoint = '';
      let body: any = {
        booking_id: bookingId,
        amount: amount
      };

      if (selectedMethod === 'card') {
        endpoint = '/payments/stripe';
        body.payment_method_id = 'pm_card_visa'; // In real app, use Stripe SDK
      } else if (selectedMethod === 'gcash') {
        endpoint = '/payments/gcash';
        body.phone_number = phoneNumber;
      } else if (selectedMethod === 'maya') {
        endpoint = '/payments/maya';
        body.phone_number = phoneNumber;
      }

      const response = await fetch(`${apiUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (data.success) {
        Alert.alert(
          'Payment Successful!',
          `Payment of ₱${amount} processed successfully.\nPlatform fee: ₱${platformFee}\nSitter receives: ₱${sitterAmount}`,
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Home')
            }
          ]
        );
      } else {
        Alert.alert('Payment Failed', data.message || 'Payment could not be processed');
      }
    } catch (error) {
      Alert.alert('Error', 'Payment failed. Please try again.');
      console.error('Payment error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAuthToken = async () => {
    // Get token from AsyncStorage or your auth context
    // For demo purposes, return a mock token
    return 'mock_token';
  };

  const renderCardForm = () => (
    <View style={styles.formContainer}>
      <Text style={styles.formTitle}>Card Details</Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Card Number</Text>
        <TextInput
          style={styles.input}
          placeholder="1234 5678 9012 3456"
          value={cardNumber}
          onChangeText={setCardNumber}
          keyboardType="numeric"
          maxLength={19}
        />
      </View>

      <View style={styles.row}>
        <View style={[styles.inputContainer, { flex: 1, marginRight: 10 }]}>
          <Text style={styles.inputLabel}>Expiry Date</Text>
          <TextInput
            style={styles.input}
            placeholder="MM/YY"
            value={expiryDate}
            onChangeText={setExpiryDate}
            keyboardType="numeric"
            maxLength={5}
          />
        </View>
        
        <View style={[styles.inputContainer, { flex: 1, marginLeft: 10 }]}>
          <Text style={styles.inputLabel}>CVV</Text>
          <TextInput
            style={styles.input}
            placeholder="123"
            value={cvv}
            onChangeText={setCvv}
            keyboardType="numeric"
            maxLength={4}
            secureTextEntry
          />
        </View>
      </View>
    </View>
  );

  const renderMobileForm = () => (
    <View style={styles.formContainer}>
      <Text style={styles.formTitle}>
        {selectedMethod === 'gcash' ? 'GCash' : 'Maya'} Details
      </Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Mobile Number</Text>
        <TextInput
          style={styles.input}
          placeholder="+63 9XX XXX XXXX"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          keyboardType="phone-pad"
        />
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => {
          if (navigation.canGoBack()) {
            navigation.goBack();
          } else {
            navigation.navigate('pet-sitter-dashboard' as never);
          }
        }}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Booking Summary */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Booking Summary</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Pet Sitter:</Text>
          <Text style={styles.summaryValue}>{petSitterName}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Service Amount:</Text>
          <Text style={styles.summaryValue}>₱{amount.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Platform Fee (20%):</Text>
          <Text style={styles.summaryValue}>₱{platformFee.toFixed(2)}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.summaryRow}>
          <Text style={styles.totalLabel}>Total to Pay:</Text>
          <Text style={styles.totalValue}>₱{amount.toFixed(2)}</Text>
        </View>
        <Text style={styles.noteText}>
          Sitter will receive ₱{sitterAmount.toFixed(2)} after platform fee
        </Text>
      </View>

      {/* Payment Methods */}
      <View style={styles.methodsContainer}>
        <Text style={styles.sectionTitle}>Select Payment Method</Text>
        
        {paymentMethods.map((method) => (
          <TouchableOpacity
            key={method.id}
            style={[
              styles.methodCard,
              selectedMethod === method.id && styles.selectedMethod
            ]}
            onPress={() => setSelectedMethod(method.id as any)}
          >
            <View style={[styles.methodIcon, { backgroundColor: method.color }]}>
              <Ionicons name={method.icon as any} size={24} color="#FFF" />
            </View>
            <Text style={styles.methodName}>{method.name}</Text>
            <View style={styles.radioButton}>
              {selectedMethod === method.id && (
                <View style={styles.radioButtonInner} />
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Payment Form */}
      {selectedMethod === 'card' ? renderCardForm() : renderMobileForm()}

      {/* Pay Button */}
      <TouchableOpacity
        style={[styles.payButton, loading && styles.payButtonDisabled]}
        onPress={processPayment}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <>
            <Text style={styles.payButtonText}>
              Pay ₱{amount.toFixed(2)}
            </Text>
            <Ionicons name="arrow-forward" size={20} color="#FFF" />
          </>
        )}
      </TouchableOpacity>

      {/* Security Note */}
      <View style={styles.securityNote}>
        <Ionicons name="shield-checkmark" size={16} color="#10B981" />
        <Text style={styles.securityText}>
          Your payment is secured with 256-bit SSL encryption
        </Text>
      </View>
    </ScrollView>
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
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  summaryCard: {
    backgroundColor: '#FFF',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#111827',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
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
    fontSize: 16,
    fontWeight: '700',
    color: '#F59E0B',
  },
  noteText: {
    fontSize: 12,
    color: '#10B981',
    marginTop: 8,
    fontStyle: 'italic',
  },
  methodsContainer: {
    margin: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    color: '#111827',
  },
  methodCard: {
    backgroundColor: '#FFF',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  selectedMethod: {
    borderColor: '#F59E0B',
    backgroundColor: '#FFFBEB',
  },
  methodIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  methodName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F59E0B',
  },
  formContainer: {
    backgroundColor: '#FFF',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    color: '#111827',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: '#374151',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFF',
  },
  row: {
    flexDirection: 'row',
  },
  payButton: {
    backgroundColor: '#F59E0B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    margin: 20,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  payButtonDisabled: {
    opacity: 0.6,
  },
  payButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
    marginRight: 8,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  securityText: {
    fontSize: 12,
    color: '#10B981',
    marginLeft: 4,
  },
});

export default PaymentScreen; 