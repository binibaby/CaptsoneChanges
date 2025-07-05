import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Image,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import MapView, { Callout, Marker, PROVIDER_GOOGLE } from 'react-native-maps';

const PET_SITTERS = [
  {
    id: '1',
    name: 'Sarah Johnson',
    latlng: { latitude: 37.78825, longitude: -122.4324 },
    avatar: require('../../assets/images/default-avatar.png'),
    rate: 25,
    badges: [
      { icon: 'checkmark-circle', color: '#4CAF50', label: 'Verified' },
      { icon: 'star', color: '#FFD700', label: '4.9' },
    ],
    distance: '0.5 miles',
  },
  {
    id: '2',
    name: 'Mike Chen',
    latlng: { latitude: 37.78925, longitude: -122.4344 },
    avatar: require('../../assets/images/default-avatar.png'),
    rate: 30,
    badges: [
      { icon: 'paw', color: '#FF9800', label: 'Dog Expert' },
      { icon: 'star', color: '#FFD700', label: '4.7' },
    ],
    distance: '1.2 miles',
  },
  {
    id: '3',
    name: 'Emma Davis',
    latlng: { latitude: 37.78725, longitude: -122.4314 },
    avatar: require('../../assets/images/default-avatar.png'),
    rate: 28,
    badges: [
      { icon: 'checkmark-circle', color: '#4CAF50', label: 'Verified' },
      { icon: 'star', color: '#FFD700', label: '5.0' },
    ],
    distance: '0.8 miles',
  },
];

const FindSitterMapScreen = () => {
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  const handleSitterPress = (sitterId: string) => {
    // Navigate to sitter profile
    console.log('Navigate to sitter profile:', sitterId);
  };

  const handleFilterPress = (filter: string) => {
    setSelectedFilter(filter);
  };

  // Filter sitters if needed (for now, show all)
  const filteredSitters = PET_SITTERS;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Find Pet Sitters</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="filter" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Map View */}
      <View style={styles.mapContainer}>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={StyleSheet.absoluteFill}
          initialRegion={{
            latitude: 37.78825,
            longitude: -122.4324,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
        >
          {filteredSitters.map((sitter) => (
            <Marker
              key={sitter.id}
              coordinate={sitter.latlng}
              title={sitter.name}
              description={`$${sitter.rate}/hr`}
            >
              <View style={{ alignItems: 'center' }}>
                <Image source={sitter.avatar} style={{ width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: '#fff' }} />
                <Text style={{ backgroundColor: '#fff', paddingHorizontal: 6, borderRadius: 8, fontSize: 12, marginTop: 2 }}>
                  ${sitter.rate}/hr
                </Text>
              </View>
              <Callout tooltip>
                <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 12, alignItems: 'center', minWidth: 160, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 }}>
                  <Image source={sitter.avatar} style={{ width: 48, height: 48, borderRadius: 24, marginBottom: 6 }} />
                  <Text style={{ fontWeight: 'bold', fontSize: 16, color: '#222' }}>{sitter.name}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 4 }}>
                    {sitter.badges.map((badge, idx) => (
                      <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginRight: 8 }}>
                        <Ionicons name={badge.icon as any} size={14} color={badge.color} />
                        <Text style={{ fontSize: 13, color: '#666', marginLeft: 2 }}>{badge.label}</Text>
                      </View>
                    ))}
                  </View>
                  <Text style={{ color: '#10B981', fontWeight: 'bold', fontSize: 15 }}>${sitter.rate}/hr</Text>
                  <TouchableOpacity
                    style={{ marginTop: 8, backgroundColor: '#F59E0B', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 6 }}
                    onPress={() => handleSitterPress(sitter.id)}
                  >
                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>View Profile</Text>
                  </TouchableOpacity>
                </View>
              </Callout>
            </Marker>
          ))}
        </MapView>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterTab, selectedFilter === 'all' && styles.activeFilterTab]}
          onPress={() => handleFilterPress('all')}
        >
          <Text style={[styles.filterTabText, selectedFilter === 'all' && styles.activeFilterTabText]}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, selectedFilter === 'dogs' && styles.activeFilterTab]}
          onPress={() => handleFilterPress('dogs')}
        >
          <Text style={[styles.filterTabText, selectedFilter === 'dogs' && styles.activeFilterTabText]}>
            Dogs
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, selectedFilter === 'cats' && styles.activeFilterTab]}
          onPress={() => handleFilterPress('cats')}
        >
          <Text style={[styles.filterTabText, selectedFilter === 'cats' && styles.activeFilterTabText]}>
            Cats
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, selectedFilter === 'verified' && styles.activeFilterTab]}
          onPress={() => handleFilterPress('verified')}
        >
          <Text style={[styles.filterTabText, selectedFilter === 'verified' && styles.activeFilterTabText]}>
            Verified
          </Text>
        </TouchableOpacity>
      </View>

      {/* Sitters List */}
      <View style={styles.sittersContainer}>
        <Text style={styles.sittersTitle}>Nearby Pet Sitters</Text>
        {filteredSitters.map((sitter) => (
          <TouchableOpacity key={sitter.id} style={styles.sitterCard} onPress={() => handleSitterPress(sitter.id)}>
            <Image source={sitter.avatar} style={styles.sitterAvatar} />
            <View style={styles.sitterInfo}>
              <Text style={styles.sitterName}>{sitter.name}</Text>
              <Text style={styles.sitterLocation}>📍 {sitter.distance}</Text>
              <View style={styles.sitterBadges}>
                {sitter.badges.map((badge, idx) => (
                  <View key={idx} style={styles.badge}>
                    <Ionicons name={badge.icon as any} size={12} color={badge.color} />
                    <Text style={styles.badgeText}>{badge.label}</Text>
                  </View>
                ))}
              </View>
            </View>
            <View style={styles.sitterRate}>
              <Text style={styles.rateText}>${sitter.rate}</Text>
              <Text style={styles.rateUnit}>/hour</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  filterButton: {
    padding: 5,
  },
  mapContainer: {
    flex: 1,
    marginHorizontal: 20,
    marginVertical: 10,
    borderRadius: 15,
    overflow: 'hidden',
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapPlaceholderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ccc',
    marginTop: 20,
  },
  mapPlaceholderSubtext: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 10,
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
  },
  filterTab: {
    padding: 10,
  },
  activeFilterTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#F59E0B',
  },
  filterTabText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  activeFilterTabText: {
    color: '#F59E0B',
  },
  sittersContainer: {
    padding: 20,
  },
  sittersTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  sitterCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  sitterAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  sitterInfo: {
    flex: 1,
  },
  sitterName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  sitterLocation: {
    fontSize: 14,
    color: '#666',
  },
  sitterBadges: {
    flexDirection: 'row',
    marginTop: 5,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  badgeText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 5,
  },
  sitterRate: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rateText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F59E0B',
  },
  rateUnit: {
    fontSize: 14,
    color: '#666',
  },
});

export default FindSitterMapScreen; 