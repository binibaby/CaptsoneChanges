import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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

// These will be replaced with dynamic state

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
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  const [ownerStats, setOwnerStats] = useState({
    totalSpent: '₱0',
    activeBookings: 0,
    thisWeek: '₱0',
  });
  
  console.log('💳 Current ownerStats state:', ownerStats);
  
  // Test: Force update the state to see if UI updates
  useEffect(() => {
    console.log('💳 ownerStats changed:', ownerStats);
  }, [ownerStats]);

  useEffect(() => {
    checkAuthentication();
    loadDashboardData();
  }, []);

  // Load dashboard data
  const loadDashboardData = async () => {
    console.log('🚀 loadDashboardData function called!');
    try {
      console.log('📊 Loading dashboard data...');
      console.log('🔍 Current user from context:', user);
      console.log('🔍 User ID:', user?.id);
      console.log('🔍 User role:', user?.role);
      console.log('🔍 User token available:', !!user?.token);
      console.log('🔍 User token (first 20 chars):', user?.token?.substring(0, 20));
      
      // Load bookings and payments data
      const { makeApiCall } = await import('../../services/networkService');
      
      // Get user's bookings
      console.log('💳 About to fetch bookings data...');
      const bookingsResponse = await makeApiCall('/bookings', {
        method: 'GET',
      });
      console.log('💳 Bookings response received, status:', bookingsResponse.status);
      
      if (bookingsResponse.ok) {
        const bookingsData = await bookingsResponse.json();
        console.log('📅 Bookings data:', bookingsData);
        
        // Process bookings data
        console.log('💳 Processing bookings data...');
        const activeBookings = bookingsData.bookings?.filter((booking: any) => 
          booking.status === 'active' || booking.status === 'confirmed'
        ) || [];
        console.log('💳 Active bookings found:', activeBookings.length);
        
        // Filter upcoming bookings (confirmed status and future dates/times)
        const now = new Date();
        const upcomingBookingsData = bookingsData.bookings?.filter((booking: any) => {
          if (booking.status !== 'confirmed') return false;
          
          // Check if booking is in the future
          const bookingDate = new Date(booking.date);
          const bookingTime = booking.start_time || booking.time;
          
          if (bookingTime) {
            // Parse time and create full datetime
            const [hours, minutes] = bookingTime.split(':');
            const fullDateTime = new Date(bookingDate);
            fullDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
            
            return fullDateTime > now;
          }
          
          // If no time, just check if date is today or future
          bookingDate.setHours(0, 0, 0, 0);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          return bookingDate >= today;
        }).map((booking: any) => {
          // Format date and time for display
          const date = new Date(booking.date);
          const formattedDate = date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: 'numeric'
          });
          
          let formattedTime = '';
          if (booking.start_time && booking.end_time) {
            const startTime = booking.start_time;
            const endTime = booking.end_time;
            formattedTime = `${startTime} - ${endTime}`;
          } else if (booking.time) {
            formattedTime = booking.time;
          }
          
          return {
            ...booking,
            date: formattedDate,
            time: formattedTime,
            petImage: booking.pet_image ? { uri: booking.pet_image } : require('../../assets/images/cat.png')
          };
        }) || [];
        
        console.log('💳 Setting upcoming bookings:', upcomingBookingsData.length);
        setUpcomingBookings(upcomingBookingsData);
        console.log('💳 About to fetch payments data...');
        
        // Get payments data
        const paymentsResponse = await makeApiCall('/payments/history', {
          method: 'GET',
        });
        console.log('💳 Payments response received');
        
        console.log('💳 Payments API response status:', paymentsResponse.status);
        console.log('💳 Payments API response ok:', paymentsResponse.ok);
        
        if (paymentsResponse.ok) {
          const paymentsData = await paymentsResponse.json();
          console.log('💳 Payments data:', paymentsData);
          
          // Handle paginated response - payments are in 'data' array
          const payments = paymentsData.data || paymentsData.payments || [];
          console.log('💳 Found payments:', payments.length);
          console.log('💳 Payments array:', payments);
          
          // Calculate total spent
          const totalSpent = payments.reduce((total: number, payment: any) => {
            console.log(`💳 Processing payment ${payment.id}:`, {
              status: payment.status,
              amount: payment.amount,
              amountType: typeof payment.amount,
              rawAmount: payment.amount
            });
            if (payment.status === 'completed') {
              // Convert amount to number - handle string format like "300000.00"
              const amount = parseFloat(payment.amount || 0);
              console.log(`💳 Payment ${payment.id}: Status=${payment.status}, RawAmount="${payment.amount}", ParsedAmount=${amount}, Running total: ${total + amount}`);
              return total + amount;
            }
            console.log(`💳 Payment ${payment.id}: Status=${payment.status}, Skipping (not completed)`);
            return total;
          }, 0);
          
          // Calculate this week's spending
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
          
          const thisWeekSpent = payments.reduce((total: number, payment: any) => {
            if (payment.status === 'completed' && payment.processed_at) {
              const paymentDate = new Date(payment.processed_at);
              if (paymentDate >= oneWeekAgo) {
                const amount = parseFloat(payment.amount || 0);
                console.log(`💳 This week payment ${payment.id}: Amount=${amount}`);
                return total + amount;
              }
            }
            return total;
          }, 0);
          
          console.log('💳 Calculated totals:', { totalSpent, thisWeekSpent });
          
          const newOwnerStats = {
            totalSpent: `₱${totalSpent.toLocaleString()}`,
            activeBookings: activeBookings.length,
            thisWeek: `₱${thisWeekSpent.toLocaleString()}`,
          };
          console.log('💳 Setting owner stats:', newOwnerStats);
          console.log('💳 Calculated values:', { totalSpent, thisWeekSpent, activeBookings: activeBookings.length });
          
          // Use calculated values (should be correct now)
          console.log('💳 Setting owner stats:', newOwnerStats);
          setOwnerStats(newOwnerStats);
        } else {
          console.log('💳 Payments API response not ok:', paymentsResponse.status);
        }
      } else {
        console.log('💳 Bookings API response not ok');
      }
    } catch (error) {
      console.error('❌ Error loading dashboard data:', error);
    }
    console.log('💳 loadDashboardData function completed');
  };

  // Handle pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    console.log('🔄 Refreshing dashboard data...');
    
    try {
      await loadDashboardData();
    } catch (error) {
      console.error('❌ Error refreshing dashboard data:', error);
    } finally {
      setRefreshing(false);
    }
  }, [user?.token]);

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
      console.log('📱 PetOwnerDashboard: Screen focused, checking authentication and refreshing data');
      checkAuthentication();
      loadDashboardData();
    }, [user?.token])
  );


  // Helper function to validate image URI
  const isValidImageUri = (uri: string | null): boolean => {
    if (!uri || uri.trim() === '') return false;
    // Check if it's a valid URL or local file path
    const isValid = uri.startsWith('http') || uri.startsWith('file://') || uri.startsWith('content://') || uri.startsWith('data:') || uri.startsWith('/storage/') || uri.includes('profile_images/');
    console.log('🔍 PetOwnerDashboard: isValidImageUri check:', { uri, isValid });
    return isValid;
  };

  // Helper function to get full image URL using network service
  const getFullImageUrl = (uri: string | null): string | null => {
    if (!uri) return null;
    if (uri.startsWith('http')) return uri;
    
    // Import network service dynamically to avoid circular dependencies
    const { networkService } = require('../../services/networkService');
    const baseUrl = networkService.getBaseUrl();
    
    if (uri.startsWith('/storage/')) {
      const fullUrl = `${baseUrl}${uri}`;
      console.log('🔗 PetOwnerDashboard: Generated URL for /storage/ path:', fullUrl);
      return fullUrl;
    }
    if (uri.startsWith('profile_images/')) {
      const fullUrl = `${baseUrl}/storage/${uri}`;
      console.log('🔗 PetOwnerDashboard: Generated URL for profile_images/ path:', fullUrl);
      return fullUrl;
    }
    const fullUrl = `${baseUrl}/storage/${uri}`;
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
      <ScrollView 
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#10B981', '#8B5CF6', '#F97316']} // Android
            tintColor="#10B981" // iOS
            title="Refreshing dashboard..." // iOS
            titleColor="#666" // iOS
          />
        }
      >
        {/* Header */}
        <View style={styles.headerCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Image source={require('../../assets/images/logo.png')} style={{ width: 28, height: 28, marginRight: 8 }} />
            <Text style={styles.headerTitle}>Pet Owner Dashboard</Text>
            {refreshing && (
              <ActivityIndicator 
                size="small" 
                color="#10B981" 
                style={{ marginLeft: 8 }} 
              />
            )}
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
          <Text style={styles.totalIncomeAmount}>
            {(() => {
              console.log('💳 Rendering total spent:', ownerStats.totalSpent);
              console.log('💳 Owner stats object:', ownerStats);
              return ownerStats.totalSpent || '₱0.00';
            })()}
          </Text>
        </LinearGradient>

        {/* Stats Cards (mirrors sitter) */}
        <View style={styles.statsRow}>
          <View style={[styles.statsCard, { backgroundColor: '#10B981', shadowColor: '#10B981', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.5, shadowRadius: 24, elevation: 16 }]}> 
            <View style={styles.statsIcon}>
              <Ionicons name="briefcase" size={24} color="#fff" />
            </View>
            <Text style={styles.statsValueWhite}>
              {(() => {
                console.log('💳 Rendering active bookings:', ownerStats.activeBookings);
                return ownerStats.activeBookings || 0;
              })()}
            </Text>
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
            <Text style={styles.statsValueWhite}>
              {(() => {
                console.log('💳 Rendering this week:', ownerStats.thisWeek);
                return ownerStats.thisWeek || '₱0.00';
              })()}
            </Text>
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

        {/* Upcoming Bookings */}
        <View style={styles.sectionRowAligned}>
          <Text style={styles.sectionTitle}>Upcoming Bookings</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.upcomingJobsRow}>
          {upcomingBookings.map((b, idx) => (
            <View key={b.id} style={[styles.upcomingJobCard, { backgroundColor: ['#A7F3D0', '#DDD6FE', '#FDE68A', '#BAE6FD'][idx % 4] }]}> 
              <Image source={b.petImage} style={styles.jobPetImage} />
              <Text style={styles.jobPetName}>{b.petName}</Text>
              <Text style={styles.jobOwnerName}>{b.sitterName}</Text>
              <View style={styles.jobStatusBadge}><Text style={styles.jobStatusText}>Upcoming</Text></View>
              <Text style={styles.jobEarnings}>{b.cost}</Text>
              <View style={styles.jobMetaRow}>
                <Text style={styles.jobMetaText}>{b.date}</Text>
              </View>
              <View style={styles.jobMetaRow}>
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