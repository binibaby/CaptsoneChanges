import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { makeApiCall } from '../../services/networkService';

interface WalletTransaction {
  id: number;
  type: 'credit' | 'debit';
  amount: number;
  status: 'completed' | 'processing' | 'failed';
  reference_number: string;
  notes: string;
  created_at: string;
  processed_at?: string;
  bank_name?: string;
  account_number?: string;
}

interface Bank {
  code: string;
  name: string;
}

const EWalletScreen: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [cashOutLoading, setCashOutLoading] = useState(false);
  const [showCashOutModal, setShowCashOutModal] = useState(false);
  const [availableBanks, setAvailableBanks] = useState<Bank[]>([]);
  
  // Cash out form state
  const [cashOutAmount, setCashOutAmount] = useState('');
  const [selectedBank, setSelectedBank] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');

  useEffect(() => {
    loadWalletData();
    loadAvailableBanks();
  }, []);

  const loadWalletData = async () => {
    try {
      setLoading(true);
      const response = await makeApiCall('/wallet', {
        method: 'GET',
      });
      const data = await response.json();

      if (data.balance !== undefined) {
        setWalletBalance(data.balance);
      }
      if (data.transactions) {
        setTransactions(data.transactions);
      }
    } catch (error) {
      console.error('Error loading wallet data:', error);
      Alert.alert('Error', 'Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableBanks = async () => {
    try {
      const response = await makeApiCall('/wallet/banks', {
        method: 'GET',
      });
      const data = await response.json();
      
      // Ensure we always have an array
      if (Array.isArray(data)) {
        setAvailableBanks(data);
      } else if (data && Array.isArray(data.banks)) {
        setAvailableBanks(data.banks);
      } else {
        // Fallback to common Philippine banks if API fails
        setAvailableBanks([
          { code: 'BDO', name: 'BDO Unibank' },
          { code: 'BPI', name: 'Bank of the Philippine Islands' },
          { code: 'MBTC', name: 'Metrobank' },
          { code: 'PNB', name: 'Philippine National Bank' },
          { code: 'RCBC', name: 'Rizal Commercial Banking Corporation' },
          { code: 'SECB', name: 'Security Bank' },
          { code: 'UBP', name: 'Union Bank of the Philippines' },
          { code: 'CHINABANK', name: 'China Banking Corporation' },
        ]);
      }
    } catch (error) {
      console.error('Error loading banks:', error);
      // Fallback to common Philippine banks if API fails
      setAvailableBanks([
        { code: 'BDO', name: 'BDO Unibank' },
        { code: 'BPI', name: 'Bank of the Philippine Islands' },
        { code: 'MBTC', name: 'Metrobank' },
        { code: 'PNB', name: 'Philippine National Bank' },
        { code: 'RCBC', name: 'Rizal Commercial Banking Corporation' },
        { code: 'SECB', name: 'Security Bank' },
        { code: 'UBP', name: 'Union Bank of the Philippines' },
        { code: 'CHINABANK', name: 'China Banking Corporation' },
      ]);
    }
  };

  const handleCashOut = async () => {
    if (!cashOutAmount || !selectedBank || !accountHolderName || !accountNumber) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const amount = parseFloat(cashOutAmount);
    if (amount < 100 || amount > 50000) {
      Alert.alert('Error', 'Amount must be between ₱100 and ₱50,000');
      return;
    }

    if (amount > walletBalance) {
      Alert.alert('Error', 'Insufficient wallet balance');
      return;
    }

    setCashOutLoading(true);

    try {
      const response = await makeApiCall('/wallet/cash-out', {
        method: 'POST',
        body: JSON.stringify({
          amount: amount,
          bank_code: selectedBank,
          account_holder_name: accountHolderName,
          account_number: accountNumber,
        }),
      });
      const data = await response.json();

      if (data.success) {
        Alert.alert(
          'Cash Out Request Submitted',
          'Your cash out request has been submitted successfully. You will receive a notification once it\'s processed.',
          [
            {
              text: 'OK',
              onPress: () => {
                setShowCashOutModal(false);
                resetCashOutForm();
                loadWalletData(); // Refresh wallet data
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', data.error || 'Failed to process cash out request');
      }
    } catch (error) {
      console.error('Cash out error:', error);
      Alert.alert('Error', 'Failed to process cash out request. Please try again.');
    } finally {
      setCashOutLoading(false);
    }
  };

  const resetCashOutForm = () => {
    setCashOutAmount('');
    setSelectedBank('');
    setAccountHolderName('');
    setAccountNumber('');
  };

  const formatCurrency = (amount: number) => {
    return `₱${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTransactionIcon = (type: string) => {
    return type === 'credit' ? 'arrow-down-circle' : 'arrow-up-circle';
  };

  const getTransactionColor = (type: string) => {
    return type === 'credit' ? '#10B981' : '#EF4444';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#10B981';
      case 'processing':
        return '#F59E0B';
      case 'failed':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const renderTransaction = ({ item }: { item: WalletTransaction }) => (
    <View style={styles.transactionItem}>
      <View style={styles.transactionIcon}>
        <Ionicons
          name={getTransactionIcon(item.type)}
          size={24}
          color={getTransactionColor(item.type)}
        />
      </View>
      <View style={styles.transactionDetails}>
        <Text style={styles.transactionType}>
          {item.type === 'credit' ? 'Payment Received' : 'Cash Out'}
        </Text>
        <Text style={styles.transactionNotes}>{item.notes}</Text>
        <Text style={styles.transactionDate}>{formatDate(item.created_at)}</Text>
        {item.bank_name && (
          <Text style={styles.transactionBank}>
            {item.bank_name} ••••{item.account_number?.slice(-4)}
          </Text>
        )}
      </View>
      <View style={styles.transactionAmount}>
        <Text
          style={[
            styles.transactionAmountText,
            { color: getTransactionColor(item.type) },
          ]}
        >
          {item.type === 'credit' ? '+' : '-'}{formatCurrency(item.amount)}
        </Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) + '20' },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              { color: getStatusColor(item.status) },
            ]}
          >
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderCashOutModal = () => (
    <Modal
      visible={showCashOutModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity
            onPress={() => setShowCashOutModal(false)}
            style={styles.modalCloseButton}
          >
            <Ionicons name="close" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Cash Out</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Amount</Text>
            <TextInput
              style={styles.formInput}
              placeholder="Enter amount (₱100 - ₱50,000)"
              value={cashOutAmount}
              onChangeText={setCashOutAmount}
              keyboardType="numeric"
            />
            <Text style={styles.formHelper}>
              Available balance: {formatCurrency(walletBalance)}
            </Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Bank</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.bankContainer}>
                {(availableBanks || []).map((bank) => (
                  <TouchableOpacity
                    key={bank.code}
                    style={[
                      styles.bankOption,
                      selectedBank === bank.code && styles.selectedBankOption,
                    ]}
                    onPress={() => setSelectedBank(bank.code)}
                  >
                    <Text
                      style={[
                        styles.bankOptionText,
                        selectedBank === bank.code && styles.selectedBankOptionText,
                      ]}
                    >
                      {bank.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Account Holder Name</Text>
            <TextInput
              style={styles.formInput}
              placeholder="Enter account holder name"
              value={accountHolderName}
              onChangeText={setAccountHolderName}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Account Number</Text>
            <TextInput
              style={styles.formInput}
              placeholder="Enter account number"
              value={accountNumber}
              onChangeText={setAccountNumber}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.cashOutInfo}>
            <Ionicons name="information-circle-outline" size={20} color="#3B82F6" />
            <Text style={styles.cashOutInfoText}>
              Cash out requests are processed within 1-3 business days. You will receive a notification once the transaction is completed.
            </Text>
          </View>
        </ScrollView>

        <View style={styles.modalFooter}>
          <TouchableOpacity
            style={[
              styles.cashOutButton,
              cashOutLoading && styles.cashOutButtonDisabled,
            ]}
            onPress={handleCashOut}
            disabled={cashOutLoading}
          >
            {cashOutLoading ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={styles.cashOutButtonText}>
                Cash Out {cashOutAmount ? formatCurrency(parseFloat(cashOutAmount)) : ''}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>E-Wallet</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading wallet data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>E-Wallet</Text>
        <TouchableOpacity onPress={loadWalletData} style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <Ionicons name="wallet-outline" size={32} color="#3B82F6" />
            <Text style={styles.balanceTitle}>Current Balance</Text>
          </View>
          <Text style={styles.balanceAmount}>{formatCurrency(walletBalance)}</Text>
          <TouchableOpacity
            style={styles.cashOutButton}
            onPress={() => setShowCashOutModal(true)}
            disabled={walletBalance < 100}
          >
            <Ionicons name="arrow-up-circle" size={20} color="#FFF" />
            <Text style={styles.cashOutButtonText}>Cash Out</Text>
          </TouchableOpacity>
        </View>

        {/* Transaction History */}
        <View style={styles.transactionsSection}>
          <Text style={styles.sectionTitle}>Transaction History</Text>
          {transactions.length > 0 ? (
            <FlatList
              data={transactions}
              renderItem={renderTransaction}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyStateText}>No transactions yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Your payment history will appear here
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {renderCashOutModal()}
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
  refreshButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
  },
  balanceCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
    marginTop: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  balanceTitle: {
    fontSize: 16,
    color: '#6B7280',
    marginLeft: 8,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 24,
  },
  cashOutButton: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  cashOutButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
    elevation: 0,
  },
  cashOutButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  transactionsSection: {
    marginTop: 24,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  transactionItem: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  transactionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  transactionNotes: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  transactionBank: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  transactionAmountText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
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
  modalCloseButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  formGroup: {
    marginTop: 24,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#FFF',
  },
  formHelper: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  bankContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  bankOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFF',
  },
  selectedBankOption: {
    borderColor: '#3B82F6',
    backgroundColor: '#EBF4FF',
  },
  bankOptionText: {
    fontSize: 14,
    color: '#6B7280',
  },
  selectedBankOptionText: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  cashOutInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 24,
    padding: 16,
    backgroundColor: '#EBF4FF',
    borderRadius: 12,
  },
  cashOutInfoText: {
    fontSize: 14,
    color: '#3B82F6',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  modalFooter: {
    padding: 20,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
});

export default EWalletScreen;