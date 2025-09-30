import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Image,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import LocationDisplay from '../../components/LocationDisplay';
import { useAuth } from '../../contexts/AuthContext';

const PetOwnerDashboardScreen = () => {
  const router = useRouter();
  const { user, profileUpdateTrigger } = useAuth();
  const [imageError, setImageError] = useState<boolean>(false);
  const [imageRefreshKey, setImageRefreshKey] = useState<number>(0);
  
  // Helper function to check if image URI is valid
  const isValidImageUri = (uri: string | undefined): boolean => {
    if (!uri) return false;
    const isValid = uri.startsWith('http') || uri.startsWith('file://') || uri.includes('profile_images/') || uri.startsWith('/storage/');
    console.log('🔍 PetOwnerDashboardScreen: isValidImageUri check:', { uri, isValid });
    return isValid;
  };

  // Helper function to get full image URL
  const getFullImageUrl = (uri: string): string => {
    if (uri.startsWith('http')) {
      return uri;
    }
    if (uri.startsWith('/storage/')) {
      const fullUrl = `http://192.168.100.192:8000${uri}`;
      console.log('🔗 PetOwnerDashboardScreen: Generated URL for /storage/ path:', fullUrl);
      return fullUrl;
    }
    if (uri.includes('profile_images/')) {
      const fullUrl = `http://192.168.100.192:8000/storage/${uri}`;
      console.log('🔗 PetOwnerDashboardScreen: Generated URL for profile_images/ path:', fullUrl);
      return fullUrl;
    }
    const fullUrl = `http://192.168.100.192:8000/storage/${uri}`;
    console.log('🔗 PetOwnerDashboardScreen: Generated URL for fallback path:', fullUrl);
    return fullUrl;
  };

  // Handle image load error
  const handleImageError = () => {
    setImageError(true);
  };

  // Handle image load success
  const handleImageLoad = () => {
    setImageError(false);
  };

  // Reset image error when profile updates
  useEffect(() => {
    console.log('🔄 PetOwnerDashboardScreen: Profile update detected, refreshing profile image');
    console.log('🔄 PetOwnerDashboardScreen: Profile update trigger:', profileUpdateTrigger);
    console.log('🔄 PetOwnerDashboardScreen: User profile image:', user?.profileImage);
    console.log('🔄 PetOwnerDashboardScreen: Is valid image URI:', user?.profileImage ? isValidImageUri(user.profileImage) : false);
    console.log('🔄 PetOwnerDashboardScreen: Full image URL:', user?.profileImage ? getFullImageUrl(user.profileImage) : 'No image');
    setImageError(false);
    // Force image refresh by updating the key
    setImageRefreshKey(prev => prev + 1);
  }, [profileUpdateTrigger, user?.profileImage]);
  
  const { currentLocation, userAddress } = useAuth();
  
  console.log('PetOwnerDashboardScreen render:', {
    hasUser: !!user,
    hasCurrentLocation: !!currentLocation,
    hasUserAddress: !!userAddress
  });

  const handleFindSitter = () => {
    router.push('/find-sitter-map');
  };

  const handleViewProfile = () => {
    router.push('/pet-owner-profile');
  };

  const handleViewJobs = () => {
    router.push('/pet-owner-jobs');
  };

  const handleViewMessages = () => {
    router.push('/pet-owner-messages');
  };

  const handleViewNotifications = () => {
    router.push('/pet-owner-notifications');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>Good morning, {user?.name || 'User'}! 👋</Text>
            <Text style={styles.subtitle}>Ready to find care for your pets?</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={handleViewNotifications} style={{ marginRight: 16 }}>
              <Ionicons name="notifications-outline" size={24} color="#222" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.profileButton} onPress={handleViewProfile}>
              <Image 
                key={`profile-${user?.id}-${user?.profileImage || 'default'}-${profileUpdateTrigger}-${imageRefreshKey}-${Date.now()}`}
                source={(() => {
                  console.log('🖼️ PetOwnerDashboardScreen: Image source decision:');
                  console.log('  - user?.profileImage:', user?.profileImage);
                  console.log('  - isValidImageUri:', user?.profileImage ? isValidImageUri(user.profileImage) : false);
                  console.log('  - imageError:', imageError);
                  
                  if (user?.profileImage && isValidImageUri(user.profileImage) && !imageError) {
                    const fullUrl = getFullImageUrl(user.profileImage);
                    console.log('  - Using profile image with URL:', fullUrl);
                    return { 
                      uri: fullUrl,
                      cache: 'reload' // Force reload to prevent white image
                    };
                  } else {
                    console.log('  - Using default avatar');
                    return require('../../assets/images/default-avatar.png');
                  }
                })()}
                style={styles.profileImage}
                onError={(error) => {
                  console.log('❌ PetOwnerDashboardScreen: Profile image failed to load:', error.nativeEvent.error);
                  console.log('❌ PetOwnerDashboardScreen: Failed image URI:', user?.profileImage);
                  console.log('❌ PetOwnerDashboardScreen: Full URL:', getFullImageUrl(user?.profileImage || ''));
                  handleImageError();
                }}
                onLoad={() => {
                  console.log('✅ PetOwnerDashboardScreen: Profile image loaded successfully:', user?.profileImage);
                  console.log('✅ PetOwnerDashboardScreen: Full URL:', getFullImageUrl(user?.profileImage || ''));
                  handleImageLoad();
                }}
                defaultSource={require('../../assets/images/default-avatar.png')}
                resizeMode="cover"
                fadeDuration={0}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Location Status */}
        <View style={styles.locationContainer}>
          <Text style={styles.locationTitle}>📍 Your Current Location</Text>
          <LocationDisplay showAddress={true} showCoordinates={false} />
        </View>

        {/* Quick Actions */}
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <View style={styles.actionGrid}>
            <TouchableOpacity style={styles.actionCard} onPress={handleFindSitter}>
              <View style={styles.actionIcon}>
                <Ionicons name="search" size={24} color="#4CAF50" />
              </View>
              <Text style={styles.actionTitle}>Find Sitter</Text>
              <Text style={styles.actionSubtitle}>Browse nearby pet sitters</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard} onPress={handleViewJobs}>
              <View style={styles.actionIcon}>
                <Ionicons name="briefcase" size={24} color="#2196F3" />
              </View>
              <Text style={styles.actionTitle}>My Jobs</Text>
              <Text style={styles.actionSubtitle}>View active bookings</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard} onPress={handleViewMessages}>
              <View style={styles.actionIcon}>
                <Ionicons name="chatbubbles" size={24} color="#FF9800" />
              </View>
              <Text style={styles.actionTitle}>Messages</Text>
              <Text style={styles.actionSubtitle}>Chat with sitters</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard} onPress={handleViewNotifications}>
              <View style={styles.actionIcon}>
                <Ionicons name="notifications" size={24} color="#9C27B0" />
              </View>
              <Text style={styles.actionTitle}>Notifications</Text>
              <Text style={styles.actionSubtitle}>Stay updated</Text>
            </TouchableOpacity>
          </View>

          {/* Location Info Card */}
          {currentLocation && (
            <View style={styles.locationCard}>
              <Text style={styles.locationCardTitle}>📍 Location Information</Text>
              <View style={styles.locationDetails}>
                <View style={styles.locationDetail}>
                  <Text style={styles.locationLabel}>Latitude:</Text>
                  <Text style={styles.locationValue}>
                    {currentLocation.coords.latitude.toFixed(6)}
                  </Text>
                </View>
                <View style={styles.locationDetail}>
                  <Text style={styles.locationLabel}>Longitude:</Text>
                  <Text style={styles.locationValue}>
                    {currentLocation.coords.longitude.toFixed(6)}
                  </Text>
                </View>
                <View style={styles.locationDetail}>
                  <Text style={styles.locationLabel}>Accuracy:</Text>
                  <Text style={styles.locationValue}>
                    {currentLocation.coords.accuracy?.toFixed(1)}m
                  </Text>
                </View>
                {userAddress && (
                  <View style={styles.locationDetail}>
                    <Text style={styles.locationLabel}>Address:</Text>
                    <Text style={styles.locationValue} numberOfLines={2}>
                      {userAddress}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
  } catch (error) {
    console.error('PetOwnerDashboardScreen error:', error);
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Something went wrong loading the dashboard</Text>
          <Text style={styles.errorSubtext}>Please try again later</Text>
        </View>
      </SafeAreaView>
    );
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  profileButton: {
    padding: 8,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  locationContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  actionCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  actionSubtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  locationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  locationCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  locationDetails: {
    gap: 12,
  },
  locationDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  locationLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    flex: 1,
  },
  locationValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    flex: 2,
    textAlign: 'right',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FF6B6B',
    textAlign: 'center',
    marginBottom: 10,
  },
  errorSubtext: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default PetOwnerDashboardScreen;
