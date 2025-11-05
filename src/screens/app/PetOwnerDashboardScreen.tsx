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
import { notificationService } from '../../services/notificationService';
import { simpleMessagingService } from '../../services/simpleMessagingService';

const PetOwnerDashboardScreen = () => {
  const router = useRouter();
  const { user, profileUpdateTrigger } = useAuth();
  const [imageError, setImageError] = useState<boolean>(false);
  const [imageRefreshKey, setImageRefreshKey] = useState<number>(0);
  const [notificationCount, setNotificationCount] = useState<number>(0);
  const [messageCount, setMessageCount] = useState<number>(0);
  
  console.log('🔔 PetOwnerDashboardScreen: Component rendered');
  console.log('🔔 PetOwnerDashboardScreen: Current notification count:', notificationCount);
  console.log('🔔 PetOwnerDashboardScreen: Current message count:', messageCount);
  
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
    try {
      const { networkService } = require('../../services/networkService');
      const storagePath = uri.startsWith('/storage/') ? uri : `/storage/${uri}`;
      const fullUrl = networkService.getImageUrl(storagePath);
      console.log('🔗 PetOwnerDashboardScreen: Generated URL:', fullUrl);
      return fullUrl;
    } catch (error) {
      console.error('Error getting image URL, using fallback:', error);
      const { API_BASE_URL } = require('../../constants/config');
      const storagePath = uri.startsWith('/storage/') ? uri : `/storage/${uri}`;
      return `${API_BASE_URL}${storagePath}`;
    }
  };

  // Handle image load error
  const handleImageError = () => {
    setImageError(true);
  };

  // Handle image load success
  const handleImageLoad = () => {
    setImageError(false);
  };

  // Load notification and message counts
  useEffect(() => {
    const loadCounts = async () => {
      try {
        console.log('🔔 PetOwnerDashboardScreen: Loading notification count...');
        
        // Force refresh notifications from API
        await notificationService.forceRefreshFromAPI();
        
        const notificationCount = await notificationService.getUnreadCount();
        console.log('🔔 PetOwnerDashboardScreen: Notification count loaded:', notificationCount);
        console.log('🔔 PetOwnerDashboardScreen: Setting notification count state to:', notificationCount);
        setNotificationCount(notificationCount);
        console.log('🔔 PetOwnerDashboardScreen: State set, current state should be:', notificationCount);
        
        const messageCount = await simpleMessagingService.getUnreadCountForUser('owner');
        console.log('📱 PetOwnerDashboardScreen: Message count loaded:', messageCount);
        setMessageCount(messageCount);
      } catch (error) {
        console.error('Error loading counts:', error);
      }
    };

    loadCounts();

    // Subscribe to notification updates
    const notificationUnsubscribe = notificationService.subscribe(async () => {
      console.log('🔄 PetOwnerDashboardScreen: Notification update received, refreshing count...');
      const count = await notificationService.getUnreadCount();
      console.log('🔄 PetOwnerDashboardScreen: Updated notification count:', count);
      setNotificationCount(count);
      console.log('🔄 PetOwnerDashboardScreen: State updated to:', count);
    });

    return notificationUnsubscribe;
  }, []);

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
    console.log('🔔 PetOwnerDashboardScreen: Notification button clicked, count:', notificationCount);
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
            {/* Debug: Show notification count */}
            <View style={{ backgroundColor: '#ffeb3b', padding: 8, marginTop: 4, borderRadius: 4 }}>
              <Text style={{ fontSize: 14, color: '#000', fontWeight: 'bold' }}>
                🔍 DEBUG: Notifications: {notificationCount} | Messages: {messageCount}
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={handleViewNotifications} style={{ marginRight: 16, position: 'relative' }}>
              <Ionicons name="notifications-outline" size={24} color="#222" />
              {(() => {
                console.log('🔔 PetOwnerDashboardScreen: Rendering notification badge, count:', notificationCount);
                return notificationCount > 0 && (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationBadgeText}>
                      {notificationCount > 99 ? '99+' : notificationCount}
                    </Text>
                  </View>
                );
              })()}
            </TouchableOpacity>
            {/* Debug: Manual refresh button */}
            <TouchableOpacity 
              onPress={async () => {
                console.log('🔄 Manual refresh triggered');
                await notificationService.forceRefreshFromAPI();
                const count = await notificationService.getUnreadCount();
                setNotificationCount(count);
                console.log('🔄 Manual refresh result:', count);
              }}
              style={{ marginRight: 8, padding: 4 }}
            >
              <Ionicons name="refresh" size={20} color="#666" />
            </TouchableOpacity>
            {/* Debug: Test button */}
            <TouchableOpacity 
              onPress={() => {
                console.log('🧪 Test button clicked - setting count to 5');
                setNotificationCount(5);
              }}
              style={{ marginRight: 8, padding: 8, backgroundColor: '#4CAF50', borderRadius: 4 }}
            >
              <Text style={{ fontSize: 14, color: '#fff', fontWeight: 'bold' }}>TEST</Text>
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
                {messageCount > 0 && (
                  <View style={styles.messageBadge}>
                    <Text style={styles.messageBadgeText}>
                      {messageCount > 99 ? '99+' : messageCount}
                    </Text>
                  </View>
                )}
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
  notificationBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  messageBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  messageBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default PetOwnerDashboardScreen;
