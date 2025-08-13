import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
// @ts-ignore
import FindIcon from '../../assets/icons/find.png';
// @ts-ignore
import BookIcon from '../../assets/icons/book.png';
// @ts-ignore
import PetsHeartIcon from '../../assets/icons/petsheart.png';
// @ts-ignore
import MessageIcon from '../../assets/icons/message.png';

const upcomingBookings = [
  {
    id: 'b1',
    sitterName: 'Sarah Johnson',
    petName: 'Mochi',
    date: 'Dec 15, 2024',
    time: '2:00 PM - 6:00 PM',
    status: 'Confirmed',
    petImage: require('../../assets/images/cat.png'),
    cost: '$45',
  },
];

const ownerStats = {
  totalSpent: '$1,240',
  activeBookings: 2,
  thisWeek: '$120',
};

const quickActions = [
  { title: 'Find Sitter', icon: FindIcon, color: '#A7F3D0', route: '/find-sitter-map' },
  { title: 'Book Service', icon: BookIcon, color: '#DDD6FE', route: '/pet-owner-jobs' },
  { title: 'My Pets', icon: PetsHeartIcon, color: '#FDE68A', route: '/my-pets' },
  { title: 'Messages', icon: MessageIcon, color: '#BAE6FD', route: '/pet-owner-messages' },
];

const reflectionColors = {
  bookings: '#10B981',
  upcoming: '#8B5CF6',
  week: '#F97316',
};

const PetOwnerDashboard = () => {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Header */}
        <View style={styles.headerCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Image source={require('../../assets/images/logo.png')} style={{ width: 28, height: 28, marginRight: 8 }} />
            <Text style={styles.headerTitle}>Pet Owner Dashboard</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => router.push('/pet-owner-notifications')} style={{ marginRight: 16 }}>
              <Ionicons name="notifications-outline" size={24} color="#222" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/pet-owner-profile')}>
              <Ionicons name="person-circle" size={28} color="#222" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Spending Summary (mirrors Total Income card) */}
        <LinearGradient colors={['#10B981', '#8B5CF6', '#F97316']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.totalIncomeSection}>
          <Text style={styles.totalIncomeLabel}>Total Spent</Text>
          <Text style={styles.totalIncomeAmount}>{ownerStats.totalSpent}</Text>
        </LinearGradient>

        {/* Stats Cards (mirrors sitter) */}
        <View style={styles.statsRow}>
          <View style={[styles.statsCard, { backgroundColor: '#10B981', shadowColor: '#10B981', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.5, shadowRadius: 24, elevation: 16 }]}> 
            <View style={styles.statsIcon}>
              <Ionicons name="briefcase" size={24} color="#fff" />
            </View>
            <Text style={styles.statsValueWhite}>{ownerStats.activeBookings}</Text>
            <Text style={styles.statsLabelWhite}>Active Bookings</Text>
            <View style={[styles.reflection, { backgroundColor: reflectionColors.bookings }]} />
          </View>

          <View style={[styles.statsCard, { backgroundColor: '#8B5CF6', shadowColor: '#8B5CF6', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.5, shadowRadius: 24, elevation: 16 }]}> 
            <View style={styles.statsIcon}>
              <Ionicons name="calendar" size={24} color="#fff" />
            </View>
            <Text style={styles.statsValueWhite}>{upcomingBookings.length}</Text>
            <Text style={styles.statsLabelWhite}>Upcoming</Text>
            <View style={[styles.reflection, { backgroundColor: reflectionColors.upcoming }]} />
          </View>

          <View style={[styles.statsCard, { backgroundColor: '#F97316', shadowColor: '#F97316', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.5, shadowRadius: 24, elevation: 16 }]}> 
            <View style={styles.statsIcon}>
              <Ionicons name="trending-up" size={24} color="#fff" />
            </View>
            <Text style={styles.statsValueWhite}>{ownerStats.thisWeek}</Text>
            <Text style={styles.statsLabelWhite}>This Week</Text>
            <View style={[styles.reflection, { backgroundColor: reflectionColors.week }]} />
          </View>
        </View>

        {/* Quick Actions (owner routes) */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsRow}>
          {quickActions.map((action) => (
            <TouchableOpacity key={action.title} style={styles.quickAction} onPress={() => router.push(action.route as any)}>
              <View style={[styles.quickActionIcon, { backgroundColor: action.color }]}> 
                <Image source={action.icon} style={styles.quickActionImage} resizeMode="contain" />
              </View>
              <Text style={styles.quickActionLabel}>{action.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Upcoming Bookings (mirrors sitter Upcoming Jobs) */}
        <View style={styles.sectionRowAligned}>
          <Text style={styles.sectionTitle}>Upcoming Bookings</Text>
          <TouchableOpacity>
            <Text style={styles.sectionAction}>View All</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.upcomingJobsRow}>
          {upcomingBookings.map((b, idx) => (
            <View key={b.id} style={[styles.upcomingJobCard, { backgroundColor: ['#A7F3D0', '#DDD6FE', '#FDE68A', '#BAE6FD'][idx % 4] }]}> 
              <Image source={b.petImage} style={styles.jobPetImage} />
              <Text style={styles.jobPetName}>{b.petName}</Text>
              <Text style={styles.jobOwnerName}>{b.sitterName}</Text>
              <View style={styles.jobStatusBadge}><Text style={styles.jobStatusText}>{b.status}</Text></View>
              <Text style={styles.jobEarnings}>{b.cost}</Text>
              <View style={styles.jobMetaRow}>
                <Ionicons name="calendar-outline" size={16} color="#888" style={{ marginRight: 4 }} />
                <Text style={styles.jobMetaText}>{b.date}</Text>
              </View>
              <View style={styles.jobMetaRow}>
                <Ionicons name="time-outline" size={16} color="#888" style={{ marginRight: 4 }} />
                <Text style={styles.jobMetaText}>{b.time}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // Reuse sitter layout styles for a consistent look-and-feel
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222',
  },
  totalIncomeSection: {
    backgroundColor: '#F59E0B',
    borderRadius: 18,
    marginHorizontal: 16,
    marginTop: 18,
    marginBottom: 24,
    padding: 20,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 16,
  },
  totalIncomeLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  totalIncomeAmount: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
    marginHorizontal: 20,
    marginBottom: 16,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 24,
  },
  quickAction: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  quickActionImage: {
    width: 28,
    height: 28,
  },
  quickActionLabel: {
    fontSize: 12,
    color: '#222',
    fontWeight: '600',
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 24,
  },
  statsCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  statsIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  statsValueWhite: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  statsLabelWhite: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
    textAlign: 'center',
    opacity: 0.9,
  },
  sectionAction: {
    color: '#F59E0B',
    fontWeight: '600',
    fontSize: 15,
  },
  jobPetImage: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F8F8F8',
  },
  jobPetName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
  },
  jobOwnerName: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  jobStatusBadge: {
    backgroundColor: '#10B981',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 2,
    marginBottom: 4,
  },
  jobStatusText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  jobEarnings: {
    color: '#10B981',
    fontWeight: 'bold',
    fontSize: 15,
  },
  jobMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  jobMetaText: {
    color: '#888',
    fontSize: 13,
    marginRight: 8,
  },
  reflection: {
    position: 'absolute',
    bottom: 8,
    left: '10%',
    right: '10%',
    height: 24,
    borderRadius: 16,
    opacity: 0.5,
    zIndex: 1,
  },
  upcomingJobsRow: {
    flexDirection: 'row',
    paddingLeft: 16,
    paddingRight: 8,
    gap: 12,
  },
  upcomingJobCard: {
    width: 140,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    marginRight: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionRowAligned: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginTop: 0,
    marginBottom: 16,
  },
});

export default PetOwnerDashboard;