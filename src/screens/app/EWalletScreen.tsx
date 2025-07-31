import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

interface Transaction {
  id: number;
  type: 'earning' | 'cashout' | 'fee';
  amount: number;
  description: string;
  date: string;
  status: 'completed' | 'pending' | 'failed';
}

const EWalletScreen: React.FC = () => {
  const navigation = useNavigation();
  
  const [balance, setBalance] = useState(0);
  const [pendingEarnings, setPendingEarnings] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showCashoutModal, setShowCashoutModal] = useState(false);
  const [cashoutAmount, setCashoutAmount] = useState('');
  const [selectedBank, setSelectedBank] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const banks = [
    'BPI (Bank of the Philippine Islands)',
    'BDO (Banco de Oro)',
    'Metrobank',
    'UnionBank',
    'Security Bank',
    'Chinabank',
    'Landbank',
    'PNB (Philippine National Bank)',
    'RCBC',
    'Maybank'
  ];

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    setLoading(true);
    try {
      const token = await getAuthToken();
              const response = await fetch('http://192.168.100.145:8000/api/wallet/balance', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (data.success) {
        setBalance(data.balance);
      } else {
        Alert.alert('Error', 'Failed to load balance.');
      }

              const responseEarnings = await fetch('http://192.168.100.145:8000/api/wallet/pending_earnings', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const earningsData = await responseEarnings.json();
      if (earningsData.success) {
        setPendingEarnings(earningsData.pending_earnings);
      } else {
        Alert.alert('Error', 'Failed to load pending earnings.');
      }

              const responseTransactions = await fetch('http://192.168.100.145:8000/api/wallet/transactions', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const transactionsData = await responseTransactions.json();
      if (transactionsData.success) {
        setTransactions(transactionsData.transactions);
      } else {
        Alert.alert('Error', 'Failed to load transactions.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load wallet data. Please try again.');
      console.error('Error loading wallet data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadWalletData();
    setRefreshing(false);
  };

  const processCashout = async () => {
    if (!cashoutAmount || !selectedBank || !accountNumber) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const amount = parseFloat(cashoutAmount);
    if (amount <= 0 || amount > balance) {
      Alert.alert('Error', 'Invalid amount. Please enter a valid amount within your balance.');
      return;
    }

    if (amount < 100) {
      Alert.alert('Error', 'Minimum cashout amount is ₱100.00');
      return;
    }

    setLoading(true);

    try {
      const token = await getAuthToken();
              const response = await fetch('http://192.168.100.145:8000/api/wallet/cashout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amount,
          bank: selectedBank,
          account_number: accountNumber
        })
      });

      const data = await response.json();

      if (data.success) {
        // Update local state
        setBalance(balance - amount);
        const newTransaction: Transaction = {
          id: Date.now(),
          type: 'cashout',
          amount: -amount,
          description: `Cash out to ${selectedBank}`,
          date: new Date().toISOString().split('T')[0],
          status: 'pending'
        };
        setTransactions([newTransaction, ...transactions]);

        Alert.alert(
          'Cashout Successful!',
          `₱${amount.toFixed(2)} has been sent to your ${selectedBank} account. Processing may take 1-3 business days.`,
          [
            {
              text: 'OK',
              onPress: () => {
                setShowCashoutModal(false);
                setCashoutAmount('');
                setSelectedBank('');
                setAccountNumber('');
              }
            }
          ]
        );
      } else {
        Alert.alert('Cashout Failed', data.message || 'Unable to process cashout');
      }
    } catch (error) {
      Alert.alert('Error', 'Cashout failed. Please try again.');
      console.error('Cashout error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAuthToken = async () => {
    // Get token from AsyncStorage or your auth context
    return 'mock_token';
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'earning': return 'add-circle';
      case 'cashout': return 'remove-circle';
      case 'fee': return 'remove';
      default: return 'help-circle';
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'earning': return '#10B981';
      case 'cashout': return '#EF4444';
      case 'fee': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#10B981';
      case 'pending': return '#F59E0B';
      case 'failed': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const renderCashoutModal = () => {
    if (!showCashoutModal) return null;

    return (
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Cash Out</Text>
            <TouchableOpacity onPress={() => setShowCashoutModal(false)}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            <Text style={styles.balanceText}>
              Available Balance: ₱{balance.toFixed(2)}
            </Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Amount to Cash Out</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter amount (min ₱100)"
                value={cashoutAmount}
                onChangeText={setCashoutAmount}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Select Bank</Text>
              <ScrollView style={styles.bankList} nestedScrollEnabled>
                {banks.map((bank, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.bankOption,
                      selectedBank === bank && styles.selectedBank
                    ]}
                    onPress={() => setSelectedBank(bank)}
                  >
                    <Text style={[
                      styles.bankText,
                      selectedBank === bank && styles.selectedBankText
                    ]}>
                      {bank}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Account Number</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your account number"
                value={accountNumber}
                onChangeText={setAccountNumber}
                keyboardType="numeric"
              />
            </View>

            <TouchableOpacity
              style={[styles.cashoutButton, loading && styles.cashoutButtonDisabled]}
              onPress={processCashout}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.cashoutButtonText}>Cash Out</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>E-Wallet</Text>
        <TouchableOpacity onPress={onRefresh}>
          <Ionicons name="refresh" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Balance Cards */}
        <View style={styles.balanceContainer}>
          <View style={styles.balanceCard}>
            <View style={styles.balanceIcon}>
              <Ionicons name="wallet" size={24} color="#F59E0B" />
            </View>
            <View style={styles.balanceInfo}>
              <Text style={styles.balanceLabel}>Available Balance</Text>
              <Text style={styles.balanceAmount}>₱{balance.toFixed(2)}</Text>
            </View>
          </View>

          <View style={styles.balanceCard}>
            <View style={styles.balanceIcon}>
              <Ionicons name="time" size={24} color="#10B981" />
            </View>
            <View style={styles.balanceInfo}>
              <Text style={styles.balanceLabel}>Pending Earnings</Text>
              <Text style={styles.balanceAmount}>₱{pendingEarnings.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowCashoutModal(true)}
          >
            <Ionicons name="card" size={20} color="#FFF" />
            <Text style={styles.actionButtonText}>Cash Out</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={() => navigation.navigate('TransactionHistory')}
          >
            <Ionicons name="list" size={20} color="#F59E0B" />
            <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>View All</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Transactions */}
        <View style={styles.transactionsContainer}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          
          {loading ? (
            <ActivityIndicator size="large" color="#F59E0B" />
          ) : transactions.length === 0 ? (
            <Text style={styles.noTransactionsText}>No recent transactions.</Text>
          ) : (
            transactions.slice(0, 5).map((transaction) => (
              <View key={transaction.id} style={styles.transactionItem}>
                <View style={[
                  styles.transactionIcon,
                  { backgroundColor: getTransactionColor(transaction.type) + '20' }
                ]}>
                  <Ionicons
                    name={getTransactionIcon(transaction.type) as any}
                    size={16}
                    color={getTransactionColor(transaction.type)}
                  />
                </View>
                
                <View style={styles.transactionDetails}>
                  <Text style={styles.transactionDescription}>
                    {transaction.description}
                  </Text>
                  <View style={styles.transactionMeta}>
                    <Text style={styles.transactionDate}>{transaction.date}</Text>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(transaction.status) + '20' }
                    ]}>
                      <Text style={[
                        styles.statusText,
                        { color: getStatusColor(transaction.status) }
                      ]}>
                        {transaction.status}
                      </Text>
                    </View>
                  </View>
                </View>
                
                <Text style={[
                  styles.transactionAmount,
                  { color: getTransactionColor(transaction.type) }
                ]}>
                  {transaction.amount > 0 ? '+' : ''}₱{Math.abs(transaction.amount).toFixed(2)}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {renderCashoutModal()}
    </View>
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
  content: {
    flex: 1,
  },
  balanceContainer: {
    padding: 20,
    gap: 12,
  },
  balanceCard: {
    backgroundColor: '#FFF',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  balanceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  balanceInfo: {
    flex: 1,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#F59E0B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  secondaryButton: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#F59E0B',
  },
  transactionsContainer: {
    backgroundColor: '#FFF',
    margin: 20,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    color: '#111827',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  transactionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  transactionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  transactionDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 12,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  modalBody: {
    padding: 20,
  },
  balanceText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#F59E0B',
    marginBottom: 20,
    textAlign: 'center',
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
  bankList: {
    maxHeight: 120,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
  },
  bankOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  selectedBank: {
    backgroundColor: '#FEF3C7',
  },
  bankText: {
    fontSize: 14,
    color: '#374151',
  },
  selectedBankText: {
    color: '#F59E0B',
    fontWeight: '500',
  },
  cashoutButton: {
    backgroundColor: '#F59E0B',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  cashoutButtonDisabled: {
    opacity: 0.6,
  },
  cashoutButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  noTransactionsText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingVertical: 20,
  },
});

export default EWalletScreen; 