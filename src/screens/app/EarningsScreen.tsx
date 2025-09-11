import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import authService from '../../services/authService';
import { bookingService } from '../../services/bookingService';

interface EarningsData {
  thisWeek: number;
  thisMonth: number;
  total: number;
  completedJobs: number;
}

const EarningsScreen = () => {
  const router = useRouter();
  const [earningsData, setEarningsData] = useState<EarningsData>({
    thisWeek: 0,
    thisMonth: 0,
    total: 0,
    completedJobs: 0,
  });
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      loadEarningsData();
      
      // Subscribe to booking updates with debouncing
      const unsubscribe = bookingService.subscribe(() => {
        // Only reload if not already loading
        if (!loading) {
          loadEarningsData();
        }
      });

      return unsubscribe;
    }
  }, [currentUserId]); // Removed loading from dependencies to prevent infinite loop

  const loadUserData = async () => {
    try {
      const user = await authService.getCurrentUser();
      setCurrentUserId(user?.id || null);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadEarningsData = async () => {
    if (!currentUserId) return;

    try {
      console.log('🔄 Loading earnings data for user:', currentUserId);
      const earnings = await bookingService.getSitterEarnings(currentUserId);
      console.log('💰 Earnings data loaded:', earnings);
      setEarningsData(earnings);
    } catch (error) {
      console.error('Error loading earnings data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleViewCompletedJobs = () => {
    router.push('/completed-jobs');
  };

  const handleViewUpcomingJobs = () => {
    router.push('/upcoming-jobs');
  };

  const formatCurrency = (amount: number) => {
    return `₱${amount.toFixed(0)}`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Earnings</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading earnings data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Earnings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Total Earnings Card */}
        <LinearGradient
          colors={['#10B981', '#8B5CF6', '#F97316']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.totalEarningsCard}
        >
          <View style={styles.totalEarningsContent}>
            <View style={styles.totalEarningsHeader}>
              <Ionicons name="wallet" size={24} color="#fff" />
              <Text style={styles.totalEarningsLabel}>Total Earnings</Text>
            </View>
            <Text style={styles.totalEarningsAmount}>{formatCurrency(earningsData.total)}</Text>
            <Text style={styles.totalEarningsSubtext}>
              From {earningsData.completedJobs} completed job{earningsData.completedJobs !== 1 ? 's' : ''}
            </Text>
          </View>
        </LinearGradient>

        {/* Earnings Breakdown */}
        <View style={styles.breakdownSection}>
          <Text style={styles.sectionTitle}>Earnings Breakdown</Text>
          
          <View style={styles.breakdownCards}>
            <View style={styles.breakdownCard}>
              <View style={styles.breakdownIcon}>
                <Ionicons name="calendar" size={24} color="#3B82F6" />
              </View>
              <View style={styles.breakdownContent}>
                <Text style={styles.breakdownLabel}>This Week</Text>
                <Text style={styles.breakdownAmount}>{formatCurrency(earningsData.thisWeek)}</Text>
              </View>
            </View>

            <View style={styles.breakdownCard}>
              <View style={styles.breakdownIcon}>
                <Ionicons name="calendar-outline" size={24} color="#8B5CF6" />
              </View>
              <View style={styles.breakdownContent}>
                <Text style={styles.breakdownLabel}>This Month</Text>
                <Text style={styles.breakdownAmount}>{formatCurrency(earningsData.thisMonth)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <TouchableOpacity style={styles.actionCard} onPress={handleViewCompletedJobs}>
            <View style={styles.actionIcon}>
              <Ionicons name="checkmark-circle" size={24} color="#10B981" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>View Completed Jobs</Text>
              <Text style={styles.actionSubtitle}>
                {earningsData.completedJobs} job{earningsData.completedJobs !== 1 ? 's' : ''} completed
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={handleViewUpcomingJobs}>
            <View style={styles.actionIcon}>
              <Ionicons name="calendar" size={24} color="#3B82F6" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>View Upcoming Jobs</Text>
              <Text style={styles.actionSubtitle}>Manage your schedule</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Earnings Tips */}
        <View style={styles.tipsSection}>
          <Text style={styles.sectionTitle}>Earnings Tips</Text>
          
          <View style={styles.tipCard}>
            <Ionicons name="bulb" size={20} color="#F59E0B" />
            <Text style={styles.tipText}>
              Complete more jobs to increase your total earnings
            </Text>
          </View>
          
          <View style={styles.tipCard}>
            <Ionicons name="star" size={20} color="#F59E0B" />
            <Text style={styles.tipText}>
              Maintain high ratings to get more booking requests
            </Text>
          </View>
          
          <View style={styles.tipCard}>
            <Ionicons name="time" size={20} color="#F59E0B" />
            <Text style={styles.tipText}>
              Set your availability to maximize earning opportunities
            </Text>
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
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerSpacer: {
    width: 24,
  },
  backButton: {
    position: 'absolute',
    left: 16,
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  content: {
    flex: 1,
  },
  totalEarningsCard: {
    margin: 16,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  totalEarningsContent: {
    alignItems: 'center',
  },
  totalEarningsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalEarningsLabel: {
    fontSize: 16,
    color: '#fff',
    marginLeft: 8,
    fontWeight: '500',
  },
  totalEarningsAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  totalEarningsSubtext: {
    fontSize: 14,
    color: '#E5E7EB',
    textAlign: 'center',
  },
  breakdownSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  breakdownCards: {
    flexDirection: 'row',
    gap: 12,
  },
  breakdownCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  breakdownIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  breakdownContent: {
    flex: 1,
  },
  breakdownLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  breakdownAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  actionsSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  actionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  tipsSection: {
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  tipCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tipText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
});

export default EarningsScreen;

