import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
    Image,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const upcomingJobColors = ['#A7F3D0', '#DDD6FE', '#FDE68A', '#BAE6FD'];

const upcomingBookings: any[] = [
  // New users start with no bookings
];

const earningsData = {
  thisWeek: '$0', // New users start with $0 earnings
  thisMonth: '$0', // New users start with $0 earnings
  totalEarnings: '$0', // New users start with $0 total earnings
  completedJobs: 0, // New users start with 0 completed jobs
};

const quickActions: { title: string; icon: any; color: string; route: string }[] = [
  { title: 'Set Availability', icon: require('../../assets/icons/availability.png'), color: '#A7F3D0', route: '/pet-sitter-availability' },
  { title: 'View Requests', icon: require('../../assets/icons/req.png'), color: '#DDD6FE', route: '/pet-sitter-requests' },
  { title: 'My Schedule', icon: require('../../assets/icons/sched.png'), color: '#FDE68A', route: '/pet-sitter-schedule' },
  { title: 'Messages', icon: require('../../assets/icons/message2.png'), color: '#BAE6FD', route: '/pet-sitter-messages' },
];

const reflectionColors = {
  jobs: '#10B981',
  upcoming: '#8B5CF6',
  week: '#F97316',
};

const PetSitterDashboard = () => {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Header */}
        <View style={styles.headerCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Image source={require('../../assets/images/logo.png')} style={{ width: 28, height: 28, marginRight: 8 }} />
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

        {/* Total Income Section */}
        <TouchableOpacity onPress={() => router.push('/e-wallet' as any)}>
          <LinearGradient
            colors={['#10B981', '#8B5CF6', '#F97316']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.totalIncomeSection}
          >
            <View style={styles.totalIncomeContent}>
              <View style={styles.totalIncomeHeader}>
                <Ionicons name="wallet" size={24} color="#fff" />
                <Text style={styles.totalIncomeLabel}>Total Income</Text>
              </View>
              <Text style={styles.totalIncomeAmount}>{earningsData.totalEarnings}</Text>
              <View style={styles.totalIncomeHint}>
                <Ionicons name="arrow-forward" size={16} color="#fff" />
                <Text style={styles.totalIncomeHintText}>Tap to view E-Wallet</Text>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Stats Cards */}
        <View style={styles.statsRow}>
          <View style={[styles.statsCard, {
            backgroundColor: '#10B981',
            shadowColor: '#10B981',
            shadowOffset: { width: 0, height: 16 },
            shadowOpacity: 0.5,
            shadowRadius: 24,
            elevation: 16,
          }]}
          >
            <View style={styles.statsIcon}>
              <Ionicons name="checkmark-circle" size={24} color="#fff" />
            </View>
            <Text style={styles.statsValueWhite}>{earningsData.completedJobs}</Text>
            <Text style={styles.statsLabelWhite}>Jobs Completed</Text>
            <View style={[styles.reflection, { backgroundColor: reflectionColors.jobs }]} />
          </View>

          <View style={[styles.statsCard, {
            backgroundColor: '#8B5CF6',
            shadowColor: '#8B5CF6',
            shadowOffset: { width: 0, height: 16 },
            shadowOpacity: 0.5,
            shadowRadius: 24,
            elevation: 16,
          }]}
          >
            <View style={styles.statsIcon}>
              <Ionicons name="calendar" size={24} color="#fff" />
            </View>
            <Text style={styles.statsValueWhite}>{upcomingBookings.length}</Text>
            <Text style={styles.statsLabelWhite}>Upcoming Jobs</Text>
            <View style={[styles.reflection, { backgroundColor: reflectionColors.upcoming }]} />
          </View>

          <View style={[styles.statsCard, {
            backgroundColor: '#F97316',
            shadowColor: '#F97316',
            shadowOffset: { width: 0, height: 16 },
            shadowOpacity: 0.5,
            shadowRadius: 24,
            elevation: 16,
          }]}
          >
            <View style={styles.statsIcon}>
              <Ionicons name="trending-up" size={24} color="#fff" />
            </View>
            <Text style={styles.statsValueWhite}>{earningsData.thisWeek}</Text>
            <Text style={styles.statsLabelWhite}>This Week</Text>
            <View style={[styles.reflection, { backgroundColor: reflectionColors.week }]} />
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsRow}>
          {quickActions.map((action) => (
            <TouchableOpacity key={action.title} style={styles.quickAction} onPress={() => router.push(action.route as any)}>
              <View style={[styles.quickActionIcon, { backgroundColor: action.color }]}> 
                <Image 
                  source={action.icon} 
                  style={styles.quickActionImage}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.quickActionLabel}>{action.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Upcoming Jobs */}
        <View style={styles.sectionRowAligned}>
          <Text style={styles.sectionTitle}>Upcoming Jobs</Text>
          <TouchableOpacity>
            <Text style={styles.sectionAction}>View All</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.upcomingJobsRow}>
          {upcomingBookings.map((job, idx) => (
            <View key={job.id} style={[styles.upcomingJobCard, { backgroundColor: upcomingJobColors[idx % upcomingJobColors.length] }]}>
              <Image source={job.petImage} style={styles.jobPetImage} />
              <Text style={styles.jobPetName}>{job.petName}</Text>
              <Text style={styles.jobOwnerName}>{job.ownerName}</Text>
              <View style={styles.jobStatusBadge}><Text style={styles.jobStatusText}>{job.status}</Text></View>
              <Text style={styles.jobEarnings}>{job.earnings}</Text>
              <View style={styles.jobMetaRow}>
                <Ionicons name="calendar-outline" size={16} color="#888" style={{ marginRight: 4 }} />
                <Text style={styles.jobMetaText}>{job.date}</Text>
              </View>
              <View style={styles.jobMetaRow}>
                <Ionicons name="time-outline" size={16} color="#888" style={{ marginRight: 4 }} />
                <Text style={styles.jobMetaText}>{job.time}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
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
    marginLeft: 8,
  },
  totalIncomeAmount: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  totalIncomeContent: {
    alignItems: 'center',
  },
  totalIncomeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  totalIncomeHint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    opacity: 0.9,
  },
  totalIncomeHintText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
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
  statsValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 4,
  },
  statsLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    textAlign: 'center',
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
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 8,
  },
  sectionAction: {
    color: '#F59E0B',
    fontWeight: '600',
    fontSize: 15,
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

export default PetSitterDashboard; 