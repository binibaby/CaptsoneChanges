import { Ionicons } from '@expo/vector-icons';
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
import LocationPermissionHelper from '../../components/LocationPermissionHelper';
import SitterProfilePopup from '../../components/SitterProfilePopup';
import { useAuth } from '../../contexts/AuthContext';
import realtimeLocationService from '../../services/realtimeLocationService';

// Web-only version - no react-native-maps imports
const FindSitterMapScreen = () => {
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [sitters, setSitters] = useState<any[]>([]);
  const [selectedSitter, setSelectedSitter] = useState<any>(null);
  const [showProfilePopup, setShowProfilePopup] = useState<boolean>(false);
  const router = useRouter();
  const { currentLocation, userAddress, isLocationTracking, startLocationTracking } = useAuth();

  const handleBack = () => {
    router.back();
  };

  const handleSitterPress = async (sitterId: string) => {
    // Find and show sitter profile popup from real-time data
    const sitter = sitters.find(s => s.id === sitterId);
    if (sitter) {
      setSelectedSitter(sitter);
      setShowProfilePopup(true);
    }
  };

  const handleClosePopup = () => {
    setShowProfilePopup(false);
    setSelectedSitter(null);
  };

  const handleFollow = (sitterId: string) => {
    console.log('Follow sitter:', sitterId);
    // TODO: Implement follow functionality
  };

  const handleMessage = (sitterId: string) => {
    console.log('Message sitter:', sitterId);
    // TODO: Navigate to messaging
  };

  const handleViewBadges = (sitterId: string) => {
    console.log('View badges for sitter:', sitterId);
    // TODO: Navigate to badges view
  };

  const handleViewCertificates = (sitterId: string) => {
    console.log('View certificates for sitter:', sitterId);
    // TODO: Navigate to certificates view
  };

  // Helper function to get proper image source
  const getImageSource = (sitter: any) => {
    const imageSource = sitter.imageSource || sitter.images?.[0] || sitter.profileImage;
    
    console.log(`🖼️ Getting image source for ${sitter.name}:`, {
      imageSource,
      type: typeof imageSource,
      isString: typeof imageSource === 'string',
      isUrl: typeof imageSource === 'string' && (imageSource.startsWith('http') || imageSource.startsWith('https'))
    });
    
    if (!imageSource) {
      console.log('📷 No image source found, using default avatar');
      return require('../../assets/images/default-avatar.png');
    }
    
    // If it's a URL (starts with http), use it directly
    if (typeof imageSource === 'string' && (imageSource.startsWith('http') || imageSource.startsWith('https'))) {
      console.log('🌐 Using URL image:', imageSource);
      return { uri: imageSource };
    }
    
    // If it's already a require() object, use it directly
    if (typeof imageSource === 'object' && imageSource.uri !== undefined) {
      console.log('✅ Using existing URI object');
      return imageSource;
    }
    
    // For any other string (local paths), treat as URI
    if (typeof imageSource === 'string') {
      console.log('📁 Using string as URI:', imageSource);
      return { uri: imageSource };
    }
    
    // If it's already a require() object, use it directly
    console.log('✅ Using existing image object');
    return imageSource;
  };

  const handleFilterPress = (filter: string) => {
    setSelectedFilter(filter);
  };

  // Load sitters from real-time location service
  useEffect(() => {
    if (currentLocation) {
      // Get nearby sitters from real-time service via API
      realtimeLocationService.getSittersNearby(
        currentLocation.coords.latitude,
        currentLocation.coords.longitude,
        2 // 2km radius for testing
      ).then((nearbySitters) => {
        setSitters(nearbySitters);
        console.log('📍 Found nearby sitters:', nearbySitters.length);
        nearbySitters.forEach((sitter, index) => {
          console.log(`🗺️ Sitter ${index + 1} (${sitter.name}):`, {
            hasImages: !!sitter.images,
            imageCount: sitter.images?.length || 0,
            firstImage: sitter.images?.[0],
            hasProfileImage: !!sitter.profileImage,
            profileImage: sitter.profileImage,
            allKeys: Object.keys(sitter)
          });
        });
      }).catch((error) => {
        console.error('❌ Error loading nearby sitters:', error);
        setSitters([]);
      });
    }
  }, [currentLocation]);

  // Subscribe to real-time updates (only once, not dependent on currentLocation)
  useEffect(() => {
    const unsubscribe = realtimeLocationService.subscribe((allSitters) => {
      // Only update if we have a current location and the sitters data has changed
      if (currentLocation && allSitters.length > 0) {
        // Filter sitters based on current location instead of making another API call
        const nearbySitters = allSitters.filter(sitter => {
          if (!sitter.location) return false;
          
          // Calculate distance (simple approximation)
          const latDiff = Math.abs(sitter.location.latitude - currentLocation.coords.latitude);
          const lonDiff = Math.abs(sitter.location.longitude - currentLocation.coords.longitude);
          const distance = Math.sqrt(latDiff * latDiff + lonDiff * lonDiff) * 111; // Rough km conversion
          
          return distance <= 2; // 2km radius
        });
        
        setSitters(nearbySitters);
        console.log('🔄 Real-time update - nearby sitters:', nearbySitters.length);
      }
    });

    return unsubscribe;
  }, []); // Remove currentLocation dependency to prevent infinite loop

  // Filter sitters based on selected filter
  const filteredSitters = useMemo(() => {
    if (selectedFilter === 'all') return sitters;
    return sitters.filter(sitter => sitter.petTypes.includes(selectedFilter as 'dogs' | 'cats'));
  }, [sitters, selectedFilter]);

  // Compute a sensible initial region around the first sitter or user location
  const initialRegion: Region = useMemo(() => {
    if (currentLocation) {
      return {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      };
    }
    if (filteredSitters.length > 0) {
      const first = filteredSitters[0];
      return {
        latitude: first.location.latitude,
        longitude: first.location.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      };
    }
    // Default to San Francisco
    return {
      latitude: 37.7749,
      longitude: -122.4194,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    };
  }, [currentLocation, filteredSitters]);

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


      {/* Map View */}
      <View style={styles.mapContainer}>
        {Platform.OS === 'web' ? (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' }]}>
            <Text style={{ fontSize: 18, color: '#666' }}>🗺️ Interactive Map</Text>
            <Text style={{ fontSize: 14, color: '#999', marginTop: 8 }}>Available on mobile devices</Text>
            <Text style={{ fontSize: 12, color: '#ccc', marginTop: 4 }}>Tap on sitters below to view profiles</Text>
          </View>
        ) : !currentLocation ? (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' }]}>
            <LocationPermissionHelper
              onPermissionGranted={() => {
                console.log('Location permission granted for map');
              }}
              onPermissionDenied={() => {
                console.log('Location permission denied for map');
              }}
            />
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
                coordinate={sitter.location}
                title={sitter.name}
                description={`₱${sitter.hourlyRate}/hr • ${sitter.rating}⭐ • ${sitter.isOnline ? 'Available' : 'Offline'}`}
                onPress={() => handleSitterPress(sitter.id)}
              >
                <View style={styles.markerContainer}>
                  <View style={[styles.markerIcon, { backgroundColor: sitter.isOnline ? '#10B981' : '#6B7280' }]}>
                    <Image 
                      source={getImageSource(sitter)} 
                      style={styles.markerProfileImage}
                    />
                  </View>
                  {sitter.isOnline && (
                    <View style={styles.onlinePulse} />
                  )}
                </View>
              </Marker>
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
            <View style={styles.avatarContainer}>
              <View style={[styles.onlineIndicator, { backgroundColor: sitter.isOnline ? '#10B981' : '#6B7280' }]} />
              <Image 
                source={getImageSource(sitter)} 
                style={styles.sitterAvatar} 
              />
            </View>
            <View style={styles.sitterInfo}>
              <Text style={styles.sitterName}>{sitter.name}</Text>
              <Text style={styles.sitterLocation}>📍 {sitter.location.address}</Text>
              <View style={styles.sitterBadges}>
                <View style={styles.badge}>
                  <Ionicons name="star" size={12} color="#FFD700" />
                  <Text style={styles.badgeText}>{sitter.rating}</Text>
                </View>
                <View style={styles.badge}>
                  <Ionicons name="time" size={12} color="#F59E0B" />
                  <Text style={styles.badgeText}>{sitter.experience}</Text>
                </View>
                <View style={styles.badge}>
                  <Ionicons name="paw" size={12} color="#10B981" />
                  <Text style={styles.badgeText}>{sitter.petTypes.join(', ')}</Text>
                </View>
              </View>
            </View>
            <View style={styles.sitterRate}>
              <Text style={styles.rateText}>₱{sitter.hourlyRate}</Text>
              <Text style={styles.rateUnit}>/hour</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Sitter Profile Popup */}
      <SitterProfilePopup
        sitter={selectedSitter}
        visible={showProfilePopup}
        onClose={handleClosePopup}
        onFollow={handleFollow}
        onMessage={handleMessage}
        onViewBadges={handleViewBadges}
        onViewCertificates={handleViewCertificates}
      />
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
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  markerIcon: {
    backgroundColor: '#F59E0B',
    borderRadius: 25,
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    borderWidth: 3,
    borderColor: '#fff',
    overflow: 'hidden',
  },
  markerProfileImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#fff',
  },
  onlinePulse: {
    position: 'absolute',
    top: -5,
    left: -5,
    right: -5,
    bottom: -5,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 15,
  },
  onlineIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#fff',
    zIndex: 1,
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