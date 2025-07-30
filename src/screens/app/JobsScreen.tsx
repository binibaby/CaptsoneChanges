import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  FlatList,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import BadgeDisplay from '../../components/BadgeDisplay';

interface Job {
  id: string;
  title: string;
  petName: string;
  petType: string;
  location: string;
  duration: string;
  rate: string;
  ownerName: string;
  ownerImage: any;
  petImage: any;
  description: string;
  requirements: string[];
  postedTime: string;
  isVerified?: boolean;
  badges?: any[];
}

// Remove all mockJobs and only display jobs from API. Show empty state if no jobs.

const JobsScreen = () => {
  const [selectedFilter, setSelectedFilter] = useState('all');

  const filters = [
    { id: 'all', label: 'All Jobs' },
    { id: 'dogs', label: 'Dogs' },
    { id: 'cats', label: 'Cats' },
    { id: 'urgent', label: 'Urgent' },
  ];

  const filteredJobs = []; // No mock data, so filteredJobs will be empty

  const handleApply = (jobId: string) => {
    console.log('Applied for job:', jobId);
    // TODO: Implement job application logic
  };

  const renderJobCard = ({ item }: { item: Job }) => (
    <View style={styles.jobCard}>
      <View style={styles.jobHeader}>
        <View style={styles.ownerInfo}>
          <Image source={item.ownerImage} style={styles.ownerImage} />
          <View>
            <View style={styles.ownerHeader}>
              <Text style={styles.ownerName}>{item.ownerName}</Text>
              {item.isVerified && (
                <Ionicons name="shield-checkmark" size={16} color="#10B981" />
              )}
            </View>
            <Text style={styles.postedTime}>{item.postedTime}</Text>
            {item.badges && item.badges.length > 0 && (
              <BadgeDisplay badges={item.badges} size="small" maxDisplay={2} />
            )}
          </View>
        </View>
        <View style={styles.rateContainer}>
          <Text style={styles.rate}>{item.rate}</Text>
        </View>
      </View>

      <View style={styles.petInfo}>
        <Image source={item.petImage} style={styles.petImage} />
        <View style={styles.petDetails}>
          <Text style={styles.jobTitle}>{item.title}</Text>
          <Text style={styles.petName}>{item.petName} • {item.petType}</Text>
          <Text style={styles.location}>{item.location}</Text>
          <Text style={styles.duration}>Duration: {item.duration}</Text>
        </View>
      </View>

      <Text style={styles.description}>{item.description}</Text>

      <View style={styles.requirementsContainer}>
        <Text style={styles.requirementsTitle}>Requirements:</Text>
        {item.requirements.map((req, index) => (
          <Text key={index} style={styles.requirement}>• {req}</Text>
        ))}
      </View>

      <TouchableOpacity 
        style={styles.applyButton}
        onPress={() => handleApply(item.id)}
      >
        <Text style={styles.applyButtonText}>Apply Now</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Available Jobs</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="filter" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={filters}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterTab,
                selectedFilter === item.id && styles.filterTabActive
              ]}
              onPress={() => setSelectedFilter(item.id)}
            >
              <Text style={[
                styles.filterTabText,
                selectedFilter === item.id && styles.filterTabTextActive
              ]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Jobs List */}
      <FlatList
        data={filteredJobs}
        keyExtractor={(item) => item.id}
        renderItem={renderJobCard}
        contentContainerStyle={styles.jobsList}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  filterButton: {
    padding: 5,
  },
  filterContainer: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  filterTab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginHorizontal: 5,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  filterTabActive: {
    backgroundColor: '#F59E0B',
  },
  filterTabText: {
    fontSize: 14,
    color: '#666',
  },
  filterTabTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  jobsList: {
    padding: 15,
  },
  jobCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  ownerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ownerImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  ownerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  ownerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  postedTime: {
    fontSize: 12,
    color: '#666',
  },
  rateContainer: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  rate: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  petInfo: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  petImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  petDetails: {
    flex: 1,
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  petName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  location: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  duration: {
    fontSize: 14,
    color: '#666',
  },
  description: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 15,
  },
  requirementsContainer: {
    marginBottom: 15,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  requirement: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  applyButton: {
    backgroundColor: '#F59E0B',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});


export default JobsScreen; 