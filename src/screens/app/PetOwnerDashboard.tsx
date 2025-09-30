import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Image, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import authService from '../../services/authService';
// @ts-ignore
import FindIcon from '../../assets/icons/find.png';
// @ts-ignore
import BookIcon from '../../assets/icons/book.png';
// @ts-ignore
import PetsHeartIcon from '../../assets/icons/petsheart.png';
// @ts-ignore
import MessageIcon from '../../assets/icons/message.png';

interface Booking {
  id: string;
  petImage: any;
  petName: string;
  sitterName: string;
  status: string;
  cost: string;
  date: string;
  time: string;
}

const upcomingBookings: Booking[] = [
  // New users start with no bookings
];

const ownerStats = {
  totalSpent: '₱0', // New users start with ₱0 spent
  activeBookings: 0, // New users start with 0 active bookings
  thisWeek: '₱0', // New users start with ₱0 spent this week
};

const quickActions = [
  { title: 'Find Sitter', icon: FindIcon, color: '#A7F3D0', route: '/find-sitter-map' },
  { title: 'Book Service', icon: BookIcon, color: '#DDD6FE', route: '/pet-owner-jobs' },
  { title: 'My Pets', icon: PetsHeartIcon, color: '#FDE68A', route: '/my-pets' },
  { title: 'Messages', icon: MessageIcon, color: '#BAE6FD', route: '/pet-owner-messages' },
];

const reflectionColors = {
  bookings: '#10B981',
  upcoming: '#8B5CF6',
  week: '#F97316',
};

const PetOwnerDashboard = () => {
  const router = useRouter();
  const { user, profileUpdateTrigger } = useAuth();
  const [imageError, setImageError] = useState<boolean>(false);

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

      // Check if user is a pet owner
      if (user.role !== 'pet_owner') {
        console.log('🚪 User is not a pet owner, redirecting to onboarding');
        router.replace('/onboarding');
        return;
      }

      // User is authenticated and is a pet owner
      // User data is now available from AuthContext
    } catch (error) {
      console.error('Error checking authentication:', error);
      router.replace('/onboarding');
    }
  };

  // Refresh user data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('📱 PetOwnerDashboard: Screen focused, checking authentication');
      checkAuthentication();
    }, [])
  );


  // Helper function to validate image URI
  const isValidImageUri = (uri: string | null): boolean => {
    if (!uri || uri.trim() === '') return false;
    // Check if it's a valid URL or local file path
    const isValid = uri.startsWith('http') || uri.startsWith('file://') || uri.startsWith('content://') || uri.startsWith('data:') || uri.startsWith('/storage/') || uri.includes('profile_images/');
    console.log('🔍 PetOwnerDashboard: isValidImageUri check:', { uri, isValid });
    return isValid;
  };

  // Helper function to get full image URL
  const getFullImageUrl = (uri: string | null): string | null => {
    if (!uri) return null;
    if (uri.startsWith('http')) return uri;
    if (uri.startsWith('/storage/')) {
      const fullUrl = `http://192.168.100.192:8000${uri}`;
      console.log('🔗 PetOwnerDashboard: Generated URL for /storage/ path:', fullUrl);
      return fullUrl;
    }
    if (uri.startsWith('profile_images/')) {
      const fullUrl = `http://192.168.100.192:8000/storage/${uri}`;
      console.log('🔗 PetOwnerDashboard: Generated URL for profile_images/ path:', fullUrl);
      return fullUrl;
    }
    const fullUrl = `http://192.168.100.192:8000/storage/${uri}`;
    console.log('🔗 PetOwnerDashboard: Generated URL for fallback path:', fullUrl);
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
    console.log('🔄 PetOwnerDashboard: Profile update detected, refreshing profile image');
    setImageError(false);
  }, [profileUpdateTrigger, user?.profileImage]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Header */}
        <View style={styles.headerCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Image source={require('../../assets/images/logo.png')} style={{ width: 28, height: 28, marginRight: 8 }} />
            <Text style={styles.headerTitle}>Pet Owner Dashboard</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => router.push('/pet-owner-notifications')} style={{ marginRight: 16 }}>
              <Ionicons name="notifications-outline" size={24} color="#222" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/pet-owner-profile')} style={styles.profileButton}>
              <Image
                key={`profile-${user?.id}-${user?.profileImage || 'default'}-${profileUpdateTrigger}-${Date.now()}`}
                source={(() => {
                  console.log('🖼️ PetOwnerDashboard: Image source decision:');
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
                  console.log('❌ PetOwnerDashboard: Profile image failed to load:', error.nativeEvent.error);
                  console.log('❌ PetOwnerDashboard: Failed image URI:', user?.profileImage);
                  console.log('❌ PetOwnerDashboard: Full URL:', getFullImageUrl(user?.profileImage || ''));
                  handleImageError();
                }}
                onLoad={() => {
                  console.log('✅ PetOwnerDashboard: Profile image loaded successfully:', user?.profileImage);
                  console.log('✅ PetOwnerDashboard: Full URL:', getFullImageUrl(user?.profileImage || ''));
                  handleImageLoad();
                }}
                defaultSource={require('../../assets/images/default-avatar.png')}
                resizeMode="cover"
                fadeDuration={0}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Spending Summary (mirrors Total Income card) */}
        <LinearGradient colors={['#10B981', '#8B5CF6', '#F97316']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.totalIncomeSection}>
          <Text style={styles.totalIncomeLabel}>Total Spent</Text>
          <Text style={styles.totalIncomeAmount}>{ownerStats.totalSpent}</Text>
        </LinearGradient>

        {/* Stats Cards (mirrors sitter) */}
        <View style={styles.statsRow}>
          <View style={[styles.statsCard, { backgroundColor: '#10B981', shadowColor: '#10B981', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.5, shadowRadius: 24, elevation: 16 }]}> 
            <View style={styles.statsIcon}>
              <Ionicons name="briefcase" size={24} color="#fff" />
            </View>
            <Text style={styles.statsValueWhite}>{ownerStats.activeBookings}</Text>
            <Text style={styles.statsLabelWhite}>Active Bookings</Text>
            <View style={[styles.reflection, { backgroundColor: reflectionColors.bookings }]} />
          </View>

          <View style={[styles.statsCard, { backgroundColor: '#8B5CF6', shadowColor: '#8B5CF6', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.5, shadowRadius: 24, elevation: 16 }]}> 
            <View style={styles.statsIcon}>
              <Ionicons name="calendar" size={24} color="#fff" />
            </View>
            <Text style={styles.statsValueWhite}>{upcomingBookings.length}</Text>
            <Text style={styles.statsLabelWhite}>Upcoming</Text>
            <View style={[styles.reflection, { backgroundColor: reflectionColors.upcoming }]} />
          </View>

          <View style={[styles.statsCard, { backgroundColor: '#F97316', shadowColor: '#F97316', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.5, shadowRadius: 24, elevation: 16 }]}> 
            <View style={styles.statsIcon}>
              <Ionicons name="trending-up" size={24} color="#fff" />
            </View>
            <Text style={styles.statsValueWhite}>{ownerStats.thisWeek}</Text>
            <Text style={styles.statsLabelWhite}>This Week</Text>
            <View style={[styles.reflection, { backgroundColor: reflectionColors.week }]} />
          </View>
        </View>

        {/* Quick Actions (owner routes) */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsRow}>
          {quickActions.map((action) => (
            <TouchableOpacity key={action.title} style={styles.quickAction} onPress={() => router.push(action.route as any)}>
              <View style={[styles.quickActionIcon, { backgroundColor: action.color }]}> 
                <Image source={action.icon} style={styles.quickActionImage} resizeMode="contain" />
              </View>
              <Text style={styles.quickActionLabel}>{action.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Upcoming Bookings (mirrors sitter Upcoming Jobs) */}
        <View style={styles.sectionRowAligned}>
          <Text style={styles.sectionTitle}>Upcoming Bookings</Text>
          <TouchableOpacity>
            <Text style={styles.sectionAction}>View All</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.upcomingJobsRow}>
          {upcomingBookings.map((b, idx) => (
            <View key={b.id} style={[styles.upcomingJobCard, { backgroundColor: ['#A7F3D0', '#DDD6FE', '#FDE68A', '#BAE6FD'][idx % 4] }]}> 
              <Image source={b.petImage} style={styles.jobPetImage} />
              <Text style={styles.jobPetName}>{b.petName}</Text>
              <Text style={styles.jobOwnerName}>{b.sitterName}</Text>
              <View style={styles.jobStatusBadge}><Text style={styles.jobStatusText}>{b.status}</Text></View>
              <Text style={styles.jobEarnings}>{b.cost}</Text>
              <View style={styles.jobMetaRow}>
                <Ionicons name="calendar-outline" size={16} color="#888" style={{ marginRight: 4 }} />
                <Text style={styles.jobMetaText}>{b.date}</Text>
              </View>
              <View style={styles.jobMetaRow}>
                <Ionicons name="time-outline" size={16} color="#888" style={{ marginRight: 4 }} />
                <Text style={styles.jobMetaText}>{b.time}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // Reuse sitter layout styles for a consistent look-and-feel
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
    marginBottom: 4,
  },
  totalIncomeAmount: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
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
  sectionAction: {
    color: '#F59E0B',
    fontWeight: '600',
    fontSize: 15,
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
  profileButton: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  profileImage: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
});

export default PetOwnerDashboard;