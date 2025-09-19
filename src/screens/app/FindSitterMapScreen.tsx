import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    AppState,
    Image,
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import PlatformMap, { PlatformMarker } from '../../components/PlatformMap';
import SitterProfilePopup from '../../components/SitterProfilePopup';
import { useAuth } from '../../contexts/AuthContext';
import authService from '../../services/authService';
import realtimeLocationService from '../../services/realtimeLocationService';

// Lazy import for react-native-maps to avoid duplicate registration
const getMapComponents = () => {
  if (Platform.OS === 'web') {
    return { MapView: null, Marker: null };
  }
  
  try {
    const Maps = require('react-native-maps');
    return {
      MapView: Maps.default || Maps.MapView,
      Marker: Maps.Marker
    };
  } catch (error) {
    console.warn('react-native-maps not available:', error);
    return { MapView: null, Marker: null };
  }
};

// Type definitions for react-native-maps
interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

// Web-only version - no react-native-maps imports
const FindSitterMapScreen = () => {
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [sitters, setSitters] = useState<any[]>([]);
  const [selectedSitter, setSelectedSitter] = useState<any>(null);
  const [showProfilePopup, setShowProfilePopup] = useState<boolean>(false);
  const router = useRouter();
  const { currentLocation, userAddress, isLocationTracking, startLocationTracking, profileUpdateTrigger } = useAuth();

  // Check authentication and initialize
  useEffect(() => {
    checkAuthentication();
  }, []);

  // Check authentication status
  const checkAuthentication = async () => {
    try {
      // Check if user is logged out
      const loggedOut = await AsyncStorage.getItem('user_logged_out');
      if (loggedOut === 'true') {
        console.log('🚪 User is logged out, redirecting to onboarding');
        router.replace('/onboarding');
        return;
      }

      // Check if user is authenticated
      const user = await authService.getCurrentUser();
      if (!user) {
        console.log('🚪 No user found, redirecting to onboarding');
        router.replace('/onboarding');
        return;
      }

      // User is authenticated, initialize
      setSitters([]);
    } catch (error) {
      console.error('Error checking authentication:', error);
      router.replace('/onboarding');
    }
  };

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


  const handleMessage = (sitterId: string) => {
    // TODO: Navigate to messaging
  };

  const handleViewBadges = (sitterId: string) => {
    // TODO: Navigate to badges view
  };

  const handleViewCertificates = (sitterId: string) => {
    // TODO: Navigate to certificates view
  };

  const handleRefreshSitters = async () => {
    console.log('🔄 Manual refresh: Force clearing everything and fetching fresh data');
    // Force clear everything and refresh from backend
    if (currentLocation) {
      await realtimeLocationService.forceClearAndRefresh(
        currentLocation.coords.latitude,
        currentLocation.coords.longitude,
        50 // 50km radius
      );
    } else {
      console.log('⚠️ No current location available for force refresh');
    }
  };

  // Helper function to get proper image source
  const getImageSource = (sitter: any) => {
    const imageSource = sitter.profileImage || sitter.imageSource || sitter.images?.[0];
    
    if (!imageSource) {
      return require('../../assets/images/default-avatar.png');
    }
    
    // If it's a URL (starts with http), use it directly
    if (typeof imageSource === 'string' && (imageSource.startsWith('http') || imageSource.startsWith('https'))) {
      return { uri: imageSource };
    }
    
    // If it's a relative URL (starts with /storage/), convert to full URL
    if (typeof imageSource === 'string' && imageSource.startsWith('/storage/')) {
      const fullUrl = `http://172.20.10.2:8000${imageSource}`;
      return { uri: fullUrl };
    }
    
    // If it's already a require() object, use it directly
    if (typeof imageSource === 'object' && imageSource.uri !== undefined) {
      return imageSource;
    }
    
    // For any other string (local paths), treat as URI
    if (typeof imageSource === 'string') {
      return { uri: imageSource };
    }
    
    // If it's already a require() object, use it directly
    return imageSource;
  };

  const handleFilterPress = (filter: string) => {
    setSelectedFilter(filter);
  };

  // Load sitters from real-time location service
  const loadSittersFromAPI = async (forceRefresh: boolean = false) => {
    console.log('🔄 loadSittersFromAPI called with forceRefresh:', forceRefresh);
    console.log('📍 Current location:', currentLocation);
    
    if (!currentLocation) {
      console.log('📍 No location available, showing empty state');
      setSitters([]);
      return;
    }

    try {
      // Get nearby sitters from real-time service via API
      const nearbySitters = await realtimeLocationService.getSittersNearby(
        currentLocation.coords.latitude,
        currentLocation.coords.longitude,
        2, // 2km radius for testing
        forceRefresh
      );
      
      console.log('📍 API returned sitters:', nearbySitters?.length || 0);
      console.log('📍 Raw sitters data:', nearbySitters);
      
      if (nearbySitters && nearbySitters.length > 0) {
        setSitters(nearbySitters);
        console.log('📍 Found nearby sitters from API:', nearbySitters.length);
        
        nearbySitters.forEach((sitter, index) => {
          console.log(`🗺️ Sitter ${index + 1} (${sitter.name}):`, {
            hasImages: !!sitter.images,
            imageCount: sitter.images?.length || 0,
            firstImage: sitter.images?.[0],
            hasProfileImage: !!sitter.profileImage,
            profileImage: sitter.profileImage,
            imageSource: sitter.imageSource,
            allKeys: Object.keys(sitter)
          });
        });
      } else {
        console.log('📍 No sitters from API, showing empty state');
        setSitters([]);
      }
    } catch (error) {
      console.error('❌ Error loading nearby sitters, showing empty state:', error);
      setSitters([]);
    }
  };

  // Initial load
  useEffect(() => {
    loadSittersFromAPI();
  }, [currentLocation]);

  // Refresh sitter data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('🗺️ FindSitterMapScreen: Screen focused, refreshing sitter data');
      loadSittersFromAPI(true); // Force refresh to get latest data
    }, [currentLocation])
  );

  // Also refresh when app state changes (user might have updated profile)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        console.log('🗺️ FindSitterMapScreen: App became active, refreshing sitter data');
        loadSittersFromAPI(true); // Force refresh to get latest data
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [currentLocation]);

  // Refresh when profile is updated (triggered by profileUpdateTrigger)
  useEffect(() => {
    if (profileUpdateTrigger && profileUpdateTrigger > 0) {
      console.log('🗺️ FindSitterMapScreen: Profile updated, refreshing sitter data');
      loadSittersFromAPI(true); // Force refresh to get latest data
    }
  }, [profileUpdateTrigger]);

  // Periodic refresh to ensure we get the latest sitter status
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      console.log('🔄 Periodic refresh of sitters list');
      loadSittersFromAPI();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(refreshInterval);
  }, [currentLocation]);

  // Refresh when app comes back to foreground
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        console.log('🔄 App became active, refreshing sitters list');
        loadSittersFromAPI(true); // Force refresh when app becomes active
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [currentLocation]);

  // Subscribe to real-time updates (only once, not dependent on currentLocation)
  useEffect(() => {
    const unsubscribe: () => void = realtimeLocationService.subscribe((allSitters) => {
      // Always update if we have a current location, even if no sitters are available
      if (currentLocation) {
        // Filter sitters based on current location instead of making another API call
        const nearbySitters = allSitters.filter(sitter => {
          if (!sitter.location) return false;
          
          // Calculate distance (simple approximation)
          const latDiff = Math.abs(sitter.location.latitude - currentLocation.coords.latitude);
          const lonDiff = Math.abs(sitter.location.longitude - currentLocation.coords.longitude);
          const distance = Math.sqrt(latDiff * latDiff + lonDiff * lonDiff) * 111; // Rough km conversion
          
          return distance <= 50; // 50km radius
        });
        
        setSitters(nearbySitters);
        console.log('🔄 Real-time update - nearby sitters:', nearbySitters.length);
      }
    });

    return () => unsubscribe();
  }, []); // Remove currentLocation dependency to prevent infinite loop

  // Force refresh sitters when screen comes into focus (to ensure fresh data after logout)
  useFocusEffect(
    useCallback(() => {
      console.log('🔄 FindSitterMapScreen: Screen focused, forcing sitter refresh');
      console.log('📍 Current location:', currentLocation);
      console.log('📍 Location tracking status:', isLocationTracking);
      // Force clear everything and refresh from backend
      if (currentLocation) {
        realtimeLocationService.forceClearAndRefresh(
          currentLocation.coords.latitude,
          currentLocation.coords.longitude,
          50 // 50km radius
        );
      } else {
        console.log('⚠️ No current location available for sitter fetch');
      }
    }, [currentLocation])
  );

  // Add periodic refresh to ensure fresh data across devices
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      console.log('🔄 Periodic refresh: Checking for fresh sitter data');
      if (currentLocation) {
        // Force refresh from backend every 30 seconds
        realtimeLocationService.forceClearAndRefresh(
          currentLocation.coords.latitude,
          currentLocation.coords.longitude,
          50 // 50km radius
        );
      }
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(refreshInterval);
  }, [currentLocation]);

  // Filter sitters based on selected filter
  const filteredSitters = useMemo(() => {
    if (selectedFilter === 'all') return sitters;
    return sitters.filter(sitter => sitter.petTypes.includes(selectedFilter as 'dogs' | 'cats'));
  }, [sitters, selectedFilter]);

  // Compute a sensible initial region around the first sitter or user location
  const initialRegion: Region = useMemo(() => {
    if (currentLocation) {
      return {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
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
  const mapRef = useRef<any>(null);

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
        <TouchableOpacity style={styles.refreshButton} onPress={handleRefreshSitters}>
          <Ionicons name="refresh" size={24} color="#333" />
        </TouchableOpacity>
      </View>


      {/* Map View */}
      <View style={styles.mapContainer}>
        {!currentLocation ? (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' }]}>
            <View style={styles.noLocationContainer}>
              <Ionicons name="location-outline" size={48} color="#D1D5DB" />
              <Text style={styles.noLocationTitle}>Location Required</Text>
              <Text style={styles.noLocationText}>
                Enable location services to find nearby pet sitters
              </Text>
            </View>
          </View>
        ) : (
          <PlatformMap
            style={StyleSheet.absoluteFill}
            initialRegion={initialRegion}
            showsUserLocation
            showsPointsOfInterest={false}
            ref={mapRef}
          >
            {filteredSitters.map((sitter) => (
              <PlatformMarker
                key={sitter.id}
                coordinate={sitter.location}
                title={sitter.name}
                description={`₱${sitter.hourlyRate}/hr • ${sitter.isOnline ? 'Available' : 'Offline'}`}
                onPress={() => handleSitterPress(sitter.id)}
              >
                <View style={styles.markerContainer}>
                  <View style={[
                    styles.markerProfileImage,
                    { borderColor: sitter.isOnline ? '#10B981' : '#6B7280' }
                  ]}>
                    <Image 
                      source={getImageSource(sitter)} 
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 21,
                      }}
                      resizeMode="cover"
                    />
                  </View>
                  {sitter.isOnline && (
                    <View style={styles.onlinePulse} />
                  )}
                </View>
              </PlatformMarker>
            ))}
          </PlatformMap>
        )}
      </View>

      {/* Recenter button */}
      {Platform.OS !== 'web' && (
        <TouchableOpacity
          onPress={() => {
            const target = userRegion ?? initialRegion;
            // @ts-ignore - PlatformMap handles the ref internally
            mapRef.current?.animateToRegion?.(target, 600);
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
        {filteredSitters.length > 0 ? (
          filteredSitters.map((sitter) => (
            <TouchableOpacity key={sitter.id} style={styles.sitterCard} onPress={() => handleSitterPress(sitter.id)}>
              <View style={styles.avatarContainer}>
                <View style={[styles.onlineIndicator, { backgroundColor: sitter.isOnline ? '#10B981' : '#6B7280' }]} />
                <Image 
                  source={getImageSource(sitter)} 
                  style={styles.sitterAvatar}
                  onError={(error) => {
                    console.log('❌ Map - Sitter list image failed to load:', error.nativeEvent.error);
                  }}
                  defaultSource={require('../../assets/images/default-avatar.png')}
                  resizeMode="cover"
                />
              </View>
              <View style={styles.sitterInfo}>
                <Text style={styles.sitterName}>{sitter.name}</Text>
                <Text style={styles.sitterLocation}>📍 {sitter.location.address}</Text>
                <View style={styles.sitterBadges}>
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
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="paw-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyStateTitle}>No Pet Sitters Available</Text>
            <Text style={styles.emptyStateText}>
              {currentLocation 
                ? "No pet sitters are currently available in your area. Try expanding your search radius or check back later."
                : "Enable location services to find nearby pet sitters."
              }
            </Text>
          </View>
        )}
      </View>

      {/* Sitter Profile Popup */}
      <SitterProfilePopup
        sitter={selectedSitter}
        visible={showProfilePopup}
        onClose={handleClosePopup}
        onMessage={handleMessage}
        onViewBadges={handleViewBadges}
        onViewCertificates={handleViewCertificates}
      />
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
  refreshButton: {
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
    borderWidth: 4,
    borderColor: '#fff',
    overflow: 'hidden',
  },
  markerProfileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 4,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
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
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  noLocationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  noLocationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  noLocationText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default FindSitterMapScreen;