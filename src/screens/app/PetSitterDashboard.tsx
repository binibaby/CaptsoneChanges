import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    Image,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const upcomingJobs = [
  {
    id: '1',
    petName: 'Mochi',
    ownerName: 'Emma Wilson',
    date: 'Dec 15, 2024',
    time: '2:00 PM - 6:00 PM',
    status: 'Confirmed',
    petImage: require('../../assets/images/mochi.png'),
    earnings: '$45',
  },
];

const earningsData = {
  thisWeek: '$320',
  thisMonth: '$1,240',
  totalEarnings: '$3,850',
  completedJobs: 28,
};

const quickActions: { title: string; icon: any; color: string; route: string }[] = [
  { title: 'Set Availability', icon: 'calendar', color: '#F59E0B', route: '/pet-sitter-availability' },
  { title: 'View Requests', icon: 'clipboard', color: '#10B981', route: '/pet-sitter-requests' },
  { title: 'My Schedule', icon: 'clock', color: '#EF4444', route: '/pet-sitter-schedule' },
  { title: 'Messages', icon: 'message-circle', color: '#3B82F6', route: '/pet-sitter-messages' },
];

const PetSitterDashboard = () => {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Header */}
        <View style={styles.headerCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Image source={require('../../assets/images/pawprint.png')} style={{ width: 28, height: 28, marginRight: 8 }} />
            <Text style={styles.headerTitle}>Pet Sitter Dashboard</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => router.push('/pet-sitter-notifications')} style={{ marginRight: 16 }}>
              <Ionicons name="notifications-outline" size={24} color="#222" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/pet-sitter-profile')}>
              <Ionicons name="person-circle" size={28} color="#222" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Welcome Card */}
        <View style={styles.welcomeCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.welcomeTitle}>Welcome back!</Text>
            <Text style={styles.welcomeSubtitle}>Ready to help pets and earn money?</Text>
          </View>
          <TouchableOpacity style={styles.welcomeButton} onPress={() => router.push('/pet-sitter-availability')}>
            <Text style={styles.welcomeButtonText}>Set Availability</Text>
            <Ionicons name="arrow-forward" size={16} color="#fff" style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        </View>

        {/* Earnings Overview */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Earnings Overview</Text>
          <TouchableOpacity>
            <Text style={styles.sectionAction}>View Details</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.earningsGrid}>
          <View style={styles.earningsCard}><Text style={styles.earningsLabel}>This Week</Text><Text style={styles.earningsValue}>{earningsData.thisWeek}</Text></View>
          <View style={styles.earningsCard}><Text style={styles.earningsLabel}>This Month</Text><Text style={styles.earningsValue}>{earningsData.thisMonth}</Text></View>
          <View style={styles.earningsCard}><Text style={styles.earningsLabel}>Total</Text><Text style={styles.earningsValue}>{earningsData.totalEarnings}</Text></View>
          <View style={styles.earningsCard}><Text style={styles.earningsLabel}>Jobs Completed</Text><Text style={styles.earningsValue}>{earningsData.completedJobs}</Text></View>
        </View>

        {/* Quick Actions */}
        <Text style={[styles.sectionTitle, { marginTop: 28, marginBottom: 12 }]}>Quick Actions</Text>
        <View style={styles.quickActionsRow}>
          {quickActions.map((action) => (
            <TouchableOpacity key={action.title} style={styles.quickAction} onPress={() => router.push(action.route as any)}>
              <View style={[styles.quickActionIcon, { backgroundColor: action.color }]}> 
                <Feather name={action.icon as any} size={24} color="#fff" />
              </View>
              <Text style={styles.quickActionLabel}>{action.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Upcoming Jobs */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Upcoming Jobs</Text>
          <TouchableOpacity>
            <Text style={styles.sectionAction}>View All</Text>
          </TouchableOpacity>
        </View>
        {upcomingJobs.map((job) => (
          <View key={job.id} style={styles.jobCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Image source={job.petImage} style={styles.jobPetImage} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.jobPetName}>{job.petName}</Text>
                <Text style={styles.jobOwnerName}>{job.ownerName}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <View style={styles.jobStatusBadge}><Text style={styles.jobStatusText}>{job.status}</Text></View>
                <Text style={styles.jobEarnings}>{job.earnings}</Text>
              </View>
            </View>
            <View style={styles.jobMetaRow}>
              <Ionicons name="calendar-outline" size={16} color="#888" style={{ marginRight: 4 }} />
              <Text style={styles.jobMetaText}>{job.date}</Text>
              <Ionicons name="time-outline" size={16} color="#888" style={{ marginLeft: 16, marginRight: 4 }} />
              <Text style={styles.jobMetaText}>{job.time}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
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
  welcomeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F59E0B',
    borderRadius: 18,
    marginHorizontal: 16,
    marginTop: 18,
    marginBottom: 18,
    padding: 18,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  welcomeTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  welcomeSubtitle: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.9,
  },
  welcomeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FBBF24',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginLeft: 12,
  },
  welcomeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
    marginRight: 2,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
  },
  sectionAction: {
    color: '#F59E0B',
    fontWeight: '600',
    fontSize: 15,
  },
  earningsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: 12,
    marginBottom: 8,
  },
  earningsCard: {
    width: '48%',
    backgroundColor: '#F8F8F8',
    borderRadius: 14,
    margin: '1%',
    padding: 16,
    alignItems: 'center',
    marginBottom: 8,
  },
  earningsLabel: {
    color: '#888',
    fontSize: 13,
    marginBottom: 4,
  },
  earningsValue: {
    color: '#222',
    fontWeight: 'bold',
    fontSize: 18,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 12,
    marginBottom: 18,
  },
  quickAction: {
    alignItems: 'center',
    flex: 1,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  quickActionLabel: {
    fontSize: 13,
    color: '#222',
    fontWeight: '500',
    textAlign: 'center',
  },
  jobCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    marginHorizontal: 16,
    marginTop: 10,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
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
});

export default PetSitterDashboard; 