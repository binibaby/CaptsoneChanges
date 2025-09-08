import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
    Image,
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import { useAuth } from '../../contexts/AuthContext';

// Web-only version - no react-native-maps imports
const FindSitterMapScreen = () => {
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const router = useRouter();
  const { currentLocation, userAddress, isLocationTracking, startLocationTracking } = useAuth();

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

  // Compute a sensible initial region around the first sitter
  const initialRegion: Region = useMemo(() => {
    const first = PET_SITTERS[0];
    return {
      latitude: first.latlng.latitude,
      longitude: first.latlng.longitude,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    };
  }, []);

  const [userRegion, setUserRegion] = useState<Region | null>(null);
  const mapRef = useRef<MapView | null>(null);

  useEffect(() => {
    // Start location tracking with 2km radius for this screen
    startLocationTracking(2000);
  }, []);

  // Update user region when location changes
  useEffect(() => {
    if (currentLocation) {
      const region: Region = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      };
      setUserRegion(region);
      
      // Smoothly move map to user location
      if (mapRef.current) {
        requestAnimationFrame(() => {
          mapRef.current?.animateToRegion(region, 600);
        });
      }
    }
  }, [currentLocation]);

  // Location status indicator
  const renderLocationStatus = () => {
    if (!isLocationTracking) {
      return (
        <View style={styles.locationStatus}>
          <Ionicons name="location-outline" size={16} color="#FF6B6B" />
          <Text style={styles.locationStatusText}>Location tracking inactive</Text>
        </View>
      );
    }

    if (!currentLocation) {
      return (
        <View style={styles.locationStatus}>
          <Ionicons name="location-outline" size={16} color="#FFA500" />
          <Text style={styles.locationStatusText}>Getting your location...</Text>
        </View>
      );
    }

    return (
      <View style={styles.locationStatus}>
        <Ionicons name="location" size={16} color="#4CAF50" />
        <Text style={styles.locationStatusText}>
          {userAddress || 'Location detected'}
        </Text>
      </View>
    );
  };

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

      {/* Location Status Indicator */}
      {renderLocationStatus()}

      {/* Map View */}
      <View style={styles.mapContainer}>
        {Platform.OS === 'web' ? (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' }]}>
            <Text style={{ fontSize: 18, color: '#666' }}>🗺️ Interactive Map</Text>
            <Text style={{ fontSize: 14, color: '#999', marginTop: 8 }}>Available on mobile devices</Text>
            <Text style={{ fontSize: 12, color: '#ccc', marginTop: 4 }}>Tap on sitters below to view profiles</Text>
          </View>
        ) : (
          <MapView
            style={StyleSheet.absoluteFill}
            initialRegion={initialRegion}
            showsUserLocation
            showsPointsOfInterest={false}
            ref={(r) => (mapRef.current = r)}
          >
            {filteredSitters.map((sitter) => (
              <Marker
                key={sitter.id}
                coordinate={sitter.latlng}
                title={sitter.name}
                description={`${sitter.distance} • $${sitter.rate}/hr`}
                onPress={() => handleSitterPress(sitter.id)}
              />
            ))}
          </MapView>
        )}
      </View>

      {/* Recenter button */}
      {Platform.OS !== 'web' && (
        <TouchableOpacity
          onPress={() => {
            const target = userRegion ?? initialRegion;
            mapRef.current?.animateToRegion(target, 600);
          }}
          style={{ position: 'absolute', right: 20, top: 160, backgroundColor: '#fff', borderRadius: 20, padding: 10, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8 }}
        >
          <Ionicons name="locate" size={20} color="#333" />
        </TouchableOpacity>
      )}

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

const PET_SITTERS = [
  // New users start with no pet sitters in the area
];

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
  locationStatus: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 10,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  locationStatusText: {
    marginLeft: 5,
    fontSize: 14,
    color: '#333',
  },
});

export default FindSitterMapScreen; 