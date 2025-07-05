import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Image,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface Job {
  id: string;
  petSitterName: string;
  petName: string;
  date: string;
  time: string;
  duration: string;
  rate: string;
  status: 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled';
  avatar: any;
  petImage: any;
  location: string;
}

const PetOwnerJobsScreen = () => {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState<'upcoming' | 'past'>('upcoming');
  const [jobs, setJobs] = useState<Job[]>([
    {
      id: '1',
      petSitterName: 'Sarah Johnson',
      petName: 'Max',
      date: 'Dec 16, 2024',
      time: '2:00 PM - 4:00 PM',
      duration: '2 hours',
      rate: '$50',
      status: 'confirmed',
      avatar: require('../../assets/images/default-avatar.png'),
      petImage: require('../../assets/images/dog.png'),
      location: 'San Francisco, CA',
    },
    {
      id: '2',
      petSitterName: 'Emma Wilson',
      petName: 'Luna',
      date: 'Dec 17, 2024',
      time: '9:00 AM - 5:00 PM',
      duration: '8 hours',
      rate: '$200',
      status: 'pending',
      avatar: require('../../assets/images/default-avatar.png'),
      petImage: require('../../assets/images/cat.png'),
      location: 'San Francisco, CA',
    },
    {
      id: '3',
      petSitterName: 'Mike Chen',
      petName: 'Max',
      date: 'Dec 15, 2024',
      time: '1:00 PM - 3:00 PM',
      duration: '2 hours',
      rate: '$50',
      status: 'completed',
      avatar: require('../../assets/images/default-avatar.png'),
      petImage: require('../../assets/images/dog.png'),
      location: 'San Francisco, CA',
    },
    {
      id: '4',
      petSitterName: 'Lisa Park',
      petName: 'Luna',
      date: 'Dec 14, 2024',
      time: '10:00 AM - 12:00 PM',
      duration: '2 hours',
      rate: '$40',
      status: 'completed',
      avatar: require('../../assets/images/default-avatar.png'),
      petImage: require('../../assets/images/cat.png'),
      location: 'San Francisco, CA',
    },
  ]);

  const handleBack = () => {
    router.back();
  };

  const handleJobPress = (job: Job) => {
    // Navigate to job details
    console.log('View job details:', job.id);
  };

  const handleCancelJob = (jobId: string) => {
    // Cancel job logic
    console.log('Cancel job:', jobId);
  };

  const handleContactSitter = (job: Job) => {
    router.push('/pet-owner-messages');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#F59E0B';
      case 'confirmed':
        return '#4CAF50';
      case 'in-progress':
        return '#3B82F6';
      case 'completed':
        return '#9C27B0';
      case 'cancelled':
        return '#FF4444';
      default:
        return '#666';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'confirmed':
        return 'Confirmed';
      case 'in-progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const upcomingJobs = jobs.filter(job => ['pending', 'confirmed', 'in-progress'].includes(job.status));
  const pastJobs = jobs.filter(job => ['completed', 'cancelled'].includes(job.status));

  const currentJobs = selectedTab === 'upcoming' ? upcomingJobs : pastJobs;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Bookings</Text>
        <TouchableOpacity style={styles.newBookingButton} onPress={() => router.push('/find-sitter-map')}>
          <Ionicons name="add" size={24} color="#F59E0B" />
        </TouchableOpacity>
      </View>

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, selectedTab === 'upcoming' && styles.activeTab]} 
          onPress={() => setSelectedTab('upcoming')}
        >
          <Text style={[styles.tabText, selectedTab === 'upcoming' && styles.activeTabText]}>
            Upcoming ({upcomingJobs.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, selectedTab === 'past' && styles.activeTab]} 
          onPress={() => setSelectedTab('past')}
        >
          <Text style={[styles.tabText, selectedTab === 'past' && styles.activeTabText]}>
            Past ({pastJobs.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {currentJobs.length > 0 ? (
          currentJobs.map((job) => (
            <View key={job.id} style={styles.jobCard}>
              <View style={styles.jobHeader}>
                <View style={styles.sitterInfo}>
                  <Image source={job.avatar} style={styles.sitterAvatar} />
                  <View style={styles.sitterDetails}>
                    <Text style={styles.sitterName}>{job.petSitterName}</Text>
                    <Text style={styles.locationText}>📍 {job.location}</Text>
                  </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(job.status) }]}>
                  <Text style={styles.statusText}>{getStatusText(job.status)}</Text>
                </View>
              </View>

              <View style={styles.petInfo}>
                <Image source={job.petImage} style={styles.petImage} />
                <View style={styles.petDetails}>
                  <Text style={styles.petName}>{job.petName}</Text>
                  <Text style={styles.bookingDate}>{job.date}</Text>
                </View>
              </View>

              <View style={styles.bookingDetails}>
                <View style={styles.detailItem}>
                  <Ionicons name="time-outline" size={16} color="#666" />
                  <Text style={styles.detailText}>{job.time}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Ionicons name="calendar-outline" size={16} color="#666" />
                  <Text style={styles.detailText}>{job.duration}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Ionicons name="cash-outline" size={16} color="#666" />
                  <Text style={styles.detailText}>{job.rate}</Text>
                </View>
              </View>

              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={styles.contactButton}
                  onPress={() => handleContactSitter(job)}
                >
                  <Ionicons name="chatbubbles-outline" size={16} color="#3B82F6" />
                  <Text style={styles.contactButtonText}>Message</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.detailsButton}
                  onPress={() => handleJobPress(job)}
                >
                  <Text style={styles.detailsButtonText}>View Details</Text>
                </TouchableOpacity>
                
                {job.status === 'confirmed' && (
                  <TouchableOpacity 
                    style={styles.cancelButton}
                    onPress={() => handleCancelJob(job.id)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons 
              name={selectedTab === 'upcoming' ? 'calendar-outline' : 'checkmark-circle-outline'} 
              size={64} 
              color="#ccc" 
            />
            <Text style={styles.emptyTitle}>
              {selectedTab === 'upcoming' ? 'No upcoming bookings' : 'No past bookings'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {selectedTab === 'upcoming' 
                ? 'Find a pet sitter to get started!' 
                : 'Your completed bookings will appear here.'
              }
            </Text>
            {selectedTab === 'upcoming' && (
              <TouchableOpacity 
                style={styles.findSitterButton}
                onPress={() => router.push('/find-sitter-map')}
              >
                <Text style={styles.findSitterButtonText}>Find Pet Sitter</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  newBookingButton: {
    padding: 5,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#F59E0B',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  jobCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sitterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sitterAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  sitterDetails: {
    flex: 1,
  },
  sitterName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  locationText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  petInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  petImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  petDetails: {
    flex: 1,
  },
  petName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  bookingDate: {
    fontSize: 12,
    color: '#666',
  },
  bookingDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    color: '#666',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  contactButtonText: {
    color: '#3B82F6',
    fontSize: 12,
    fontWeight: '600',
  },
  detailsButton: {
    flex: 1,
    backgroundColor: '#F0F0F0',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  detailsButtonText: {
    color: '#333',
    fontSize: 12,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#FFE8E8',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: '#FF4444',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 20,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  findSitterButton: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  findSitterButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PetOwnerJobsScreen; 