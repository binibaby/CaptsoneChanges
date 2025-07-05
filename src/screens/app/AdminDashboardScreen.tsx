import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Dimensions,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import adminService, { AdminStats } from '../../services/adminService';

const { width } = Dimensions.get('window');

const AdminDashboardScreen: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const statsData = await adminService.getAdminStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error loading admin data:', error);
      Alert.alert('Error', 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const StatCard = ({ title, value, subtitle, icon, color }: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: string;
    color: string;
  }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statHeader}>
        <Ionicons name={icon as any} size={24} color={color} />
        <Text style={styles.statTitle}>{title}</Text>
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading admin dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
          <Ionicons name="refresh" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.dashboardContent}>
          <Text style={styles.sectionTitle}>Platform Statistics</Text>
          <View style={styles.statsGrid}>
            <StatCard
              title="Total Users"
              value={stats?.totalUsers || 0}
              icon="people"
              color="#007AFF"
            />
            <StatCard
              title="Pet Owners"
              value={stats?.totalPetOwners || 0}
              icon="person"
              color="#4CAF50"
            />
            <StatCard
              title="Pet Sitters"
              value={stats?.totalPetSitters || 0}
              icon="paw"
              color="#FF9800"
            />
            <StatCard
              title="Total Bookings"
              value={stats?.totalBookings || 0}
              icon="calendar"
              color="#9C27B0"
            />
            <StatCard
              title="Active Bookings"
              value={stats?.activeBookings || 0}
              icon="time"
              color="#2196F3"
            />
            <StatCard
              title="Pending Verifications"
              value={stats?.pendingVerifications || 0}
              icon="shield-checkmark"
              color="#F44336"
            />
            <StatCard
              title="Revenue"
              value={`$${(stats?.revenue || 0).toLocaleString()}`}
              icon="cash"
              color="#4CAF50"
            />
            <StatCard
              title="Average Rating"
              value={`${stats?.averageRating || 0}★`}
              icon="star"
              color="#FFC107"
            />
          </View>

          <View style={styles.quickActions}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionGrid}>
              <TouchableOpacity style={styles.actionCard}>
                <Ionicons name="people" size={32} color="#007AFF" />
                <Text style={styles.actionTitle}>Manage Users</Text>
                <Text style={styles.actionSubtitle}>View and manage all users</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionCard}>
                <Ionicons name="chatbubbles" size={32} color="#FF9800" />
                <Text style={styles.actionTitle}>Support Tickets</Text>
                <Text style={styles.actionSubtitle}>Handle user support</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionCard}>
                <Ionicons name="shield-checkmark" size={32} color="#4CAF50" />
                <Text style={styles.actionTitle}>Verifications</Text>
                <Text style={styles.actionSubtitle}>Review sitter documents</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionCard}>
                <Ionicons name="settings" size={32} color="#9C27B0" />
                <Text style={styles.actionTitle}>System Settings</Text>
                <Text style={styles.actionSubtitle}>Configure app settings</Text>
              </TouchableOpacity>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E1E5E9',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  refreshButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
  },
  dashboardContent: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  statCard: {
    width: (width - 48) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statTitle: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statSubtitle: {
    fontSize: 12,
    color: '#999999',
  },
  quickActions: {
    marginTop: 16,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: (width - 48) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 12,
    marginBottom: 4,
    textAlign: 'center',
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
  },
});

export default AdminDashboardScreen; 