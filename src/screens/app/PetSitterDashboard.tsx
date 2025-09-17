import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    Image,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import SitterLocationSharing from '../../components/SitterLocationSharing';
import { getAuthHeaders } from '../../constants/config';
import authService from '../../services/authService';
import { Booking, bookingService } from '../../services/bookingService';
import { makeApiCall } from '../../services/networkService';
import { notificationService } from '../../services/notificationService';

const upcomingJobColors = ['#A7F3D0', '#DDD6FE', '#FDE68A', '#BAE6FD'];

interface EarningsData {
  thisWeek: string;
  thisMonth: string;
  totalEarnings: string;
  completedJobs: number;
}

const quickActions: { title: string; icon: any; color: string; route: string }[] = [
  { title: 'Set Availability', icon: require('../../assets/icons/availability.png'), color: '#A7F3D0', route: '/pet-sitter-availability' },
  { title: 'View Requests', icon: require('../../assets/icons/req.png'), color: '#DDD6FE', route: '/pet-sitter-requests' },
  { title: 'My Schedule', icon: require('../../assets/icons/sched.png'), color: '#FDE68A', route: '/pet-sitter-schedule' },
  { title: 'Messages', icon: require('../../assets/icons/message2.png'), color: '#BAE6FD', route: '/pet-sitter-messages' },
];

const reflectionColors = {
  jobs: '#10B981',
  upcoming: '#8B5CF6',
  week: '#F97316',
};

const PetSitterDashboard = () => {
  const router = useRouter();
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  const [earningsData, setEarningsData] = useState<EarningsData>({
    thisWeek: '₱0',
    thisMonth: '₱0',
    totalEarnings: '₱0',
    completedJobs: 0,
  });
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [notificationCount, setNotificationCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastLoadTime, setLastLoadTime] = useState<number>(0);
  const [imageError, setImageError] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Check if user is logged out and redirect to onboarding
  useEffect(() => {
    const checkLogoutStatus = async () => {
      try {
        const loggedOut = await AsyncStorage.getItem('user_logged_out');
        if (loggedOut === 'true') {
          console.log('PetSitterDashboard: User was logged out, redirecting to onboarding');
          router.replace('/onboarding');
        }
      } catch (error) {
        console.error('Error checking logout status:', error);
      }
    };
    
    checkLogoutStatus();
  }, [router]);

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

      // Check if user is a pet sitter
      if (user.role !== 'pet_sitter') {
        console.log('🚪 User is not a pet sitter, redirecting to onboarding');
        router.replace('/onboarding');
        return;
      }

      // User is authenticated and is a pet sitter
      loadUserData();
    } catch (error) {
      console.error('Error checking authentication:', error);
      router.replace('/onboarding');
    }
  };

  // Refresh user data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('📱 PetSitterDashboard: Screen focused, checking authentication');
      checkAuthentication();
    }, [])
  );

  useEffect(() => {
    if (currentUserId) {
      loadDashboardData();
      loadNotificationCount();
      
      // Subscribe to booking updates with aggressive debouncing
      const unsubscribe = bookingService.subscribe(() => {
        const now = Date.now();
        if (now - lastLoadTime > 10000) { // Only reload if more than 10 seconds have passed
          console.log('🔄 Booking update received, reloading dashboard data');
          loadDashboardData();
          loadNotificationCount();
          setLastLoadTime(now);
        } else {
          console.log('🚫 Skipping dashboard reload due to recent update');
        }
      });

      // Subscribe to notification updates to refresh count
      const notificationUnsubscribe = notificationService.subscribe(() => {
        console.log('🔄 Notification update received, refreshing count');
        loadNotificationCount();
      });

      return () => {
        unsubscribe();
        notificationUnsubscribe();
      };
    }
  }, [currentUserId]); // Removed lastLoadTime from dependencies to prevent infinite loop

  const loadUserData = async () => {
    try {
      const user = await authService.getCurrentUser();
      setCurrentUserId(user?.id || null);
      setCurrentUser(user);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  // Helper function to validate image URI
  const isValidImageUri = (uri: string | null): boolean => {
    if (!uri || uri.trim() === '') return false;
    // Check if it's a valid URL or local file path
    return uri.startsWith('http') || uri.startsWith('file://') || uri.startsWith('content://') || uri.startsWith('data:') || uri.startsWith('/storage/');
  };

  // Helper function to get full image URL
  const getFullImageUrl = (uri: string | null): string | null => {
    if (!uri) return null;
    if (uri.startsWith('http')) return uri;
    if (uri.startsWith('/storage/')) return `http://192.168.100.184:8000${uri}`;
    return uri;
  };

  // Handle image load error
  const handleImageError = () => {
    setImageError(true);
  };

  // Handle image load success
  const handleImageLoad = () => {
    setImageError(false);
  };

  const loadDashboardData = async () => {
    if (!currentUserId || isLoading) return;

    setIsLoading(true);
    try {
      console.log('🔄 Loading dashboard data for user:', currentUserId);
      console.log('📡 Fetching fresh data from API...');
      
      // Load all bookings first to debug
      const allBookings = await bookingService.getBookings();
      console.log('📊 All bookings in storage:', allBookings.length);
      
      const sitterBookings = await bookingService.getSitterBookings(currentUserId);
      console.log('👤 Sitter bookings for user', currentUserId, ':', sitterBookings.length);
      sitterBookings.forEach(booking => {
        console.log(`  - ${booking.date} (${booking.status}): ${booking.startTime}-${booking.endTime}`);
      });
      
      // Load upcoming bookings
      const upcoming = await bookingService.getUpcomingSitterBookings(currentUserId);
      console.log('📅 Upcoming bookings found:', upcoming.length);
      upcoming.forEach(booking => {
        console.log(`  - ${booking.date} (${booking.status}): ${booking.startTime}-${booking.endTime}`);
      });
      setUpcomingBookings(upcoming);

      // Load earnings data
      const earnings = await bookingService.getSitterEarnings(currentUserId);
      console.log('💰 Earnings data:', earnings);
      setEarningsData({
        thisWeek: `₱${earnings.thisWeek.toFixed(0)}`,
        thisMonth: `₱${earnings.thisMonth.toFixed(0)}`,
        totalEarnings: `₱${earnings.total.toFixed(0)}`,
        completedJobs: earnings.completedJobs,
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadNotificationCount = async () => {
    try {
      const user = await authService.getCurrentUser();
      if (!user) return;

      console.log('🔔 Loading notification count for user:', user.id);

      // Get or create token for the user
      let token = user.token;
      if (!token) {
        if (user.id === '5') {
          token = '64|dTO5Gio05Om1Buxtkta02gVpvQnetCTMrofsLjeudda0034b';
        } else if (user.id === '21') {
          token = '67|uCtobaBZatzbzDOeK8k1DytVHby0lpa07ERJJczu3cdfa507';
        } else {
          console.log('❌ No token available for user:', user.id);
          return;
        }
      }

      console.log('🔑 Using token for API call');

      const response = await makeApiCall(
        '/api/notifications/unread-count',
        {
          method: 'GET',
          headers: getAuthHeaders(token || undefined),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setNotificationCount(data.unread_count || 0);
        console.log('📱 Notification count updated from API:', data.unread_count);
      } else {
        console.log('⚠️ API call failed, trying local notifications');
        // Fallback to local notification service
        const localCount = await notificationService.getUnreadCount();
        setNotificationCount(localCount);
        console.log('📱 Notification count from local storage:', localCount);
        
        // Debug: Show all notifications
        const allNotifications = await notificationService.getNotifications();
        console.log('📋 All notifications in storage:', allNotifications.length);
        allNotifications.forEach(notification => {
          console.log(`  - ${notification.type}: ${notification.title} (read: ${notification.isRead})`);
        });
      }
    } catch (error) {
      console.error('❌ Error loading notification count:', error);
      // Fallback to local notification service
      try {
        const localCount = await notificationService.getUnreadCount();
        setNotificationCount(localCount);
        console.log('📱 Fallback notification count from local storage:', localCount);
        
        // Debug: Show all notifications in fallback
        const allNotifications = await notificationService.getNotifications();
        console.log('📋 All notifications in fallback:', allNotifications.length);
        allNotifications.forEach(notification => {
          console.log(`  - ${notification.type}: ${notification.title} (read: ${notification.isRead})`);
        });
      } catch (fallbackError) {
        console.error('❌ Fallback notification count failed:', fallbackError);
      }
    }
  };


  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Header */}
        <View style={styles.headerCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Image source={require('../../assets/images/logo.png')} style={{ width: 28, height: 28, marginRight: 8 }} />
            <Text style={styles.headerTitle}>Pet Sitter Dashboard</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => router.push('/pet-sitter-notifications')} style={{ marginRight: 16, position: 'relative' }}>
              <Ionicons name="notifications-outline" size={24} color="#222" />
              {notificationCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {notificationCount > 99 ? '99+' : notificationCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/pet-sitter-profile')} style={styles.profileButton}>
              <Image
                source={
                  currentUser?.profileImage && isValidImageUri(currentUser.profileImage) && !imageError 
                    ? { uri: getFullImageUrl(currentUser.profileImage) } 
                    : require('../../assets/images/default-avatar.png')
                }
                style={styles.profileImage}
                onError={handleImageError}
                onLoad={handleImageLoad}
                defaultSource={require('../../assets/images/default-avatar.png')}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Total Income Section */}
        <TouchableOpacity onPress={() => router.push('/e-wallet' as any)}>
          <LinearGradient
            colors={['#10B981', '#8B5CF6', '#F97316']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.totalIncomeSection}
          >
            <View style={styles.totalIncomeContent}>
              <View style={styles.totalIncomeHeader}>
                <Ionicons name="wallet" size={24} color="#fff" />
                <Text style={styles.totalIncomeLabel}>Total Income</Text>
              </View>
              <Text style={styles.totalIncomeAmount}>{earningsData.totalEarnings}</Text>
              <View style={styles.totalIncomeHint}>
                <Ionicons name="arrow-forward" size={16} color="#fff" />
                <Text style={styles.totalIncomeHintText}>Tap to view E-Wallet</Text>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Stats Cards */}
        <View style={styles.statsRow}>
          <TouchableOpacity 
            style={[styles.statsCard, {
              backgroundColor: '#10B981',
              shadowColor: '#10B981',
              shadowOffset: { width: 0, height: 16 },
              shadowOpacity: 0.5,
              shadowRadius: 24,
              elevation: 16,
            }]}
            onPress={() => router.push('/completed-jobs' as any)}
          >
            <View style={styles.statsIcon}>
              <Ionicons name="checkmark-circle" size={24} color="#fff" />
            </View>
            <Text style={styles.statsValueWhite}>{earningsData.completedJobs}</Text>
            <Text style={styles.statsLabelWhite}>Jobs Completed</Text>
            <View style={[styles.reflection, { backgroundColor: reflectionColors.jobs }]} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.statsCard, {
              backgroundColor: '#8B5CF6',
              shadowColor: '#8B5CF6',
              shadowOffset: { width: 0, height: 16 },
              shadowOpacity: 0.5,
              shadowRadius: 24,
              elevation: 16,
            }]}
            onPress={() => router.push('/upcoming-jobs' as any)}
          >
            <View style={styles.statsIcon}>
              <Ionicons name="calendar" size={24} color="#fff" />
            </View>
            <Text style={styles.statsValueWhite}>{upcomingBookings.length}</Text>
            <Text style={styles.statsLabelWhite}>Upcoming Jobs</Text>
            <View style={[styles.reflection, { backgroundColor: reflectionColors.upcoming }]} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.statsCard, {
              backgroundColor: '#F97316',
              shadowColor: '#F97316',
              shadowOffset: { width: 0, height: 16 },
              shadowOpacity: 0.5,
              shadowRadius: 24,
              elevation: 16,
            }]}
            onPress={() => router.push('/earnings' as any)}
          >
            <View style={styles.statsIcon}>
              <Ionicons name="trending-up" size={24} color="#fff" />
            </View>
            <Text style={styles.statsValueWhite}>{earningsData.thisWeek}</Text>
            <Text style={styles.statsLabelWhite}>This Week</Text>
            <View style={[styles.reflection, { backgroundColor: reflectionColors.week }]} />
          </TouchableOpacity>
        </View>

        {/* Location Sharing Component */}
        <SitterLocationSharing />

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsRow}>
          {quickActions.map((action) => (
            <TouchableOpacity key={action.title} style={styles.quickAction} onPress={() => router.push(action.route as any)}>
              <View style={[styles.quickActionIcon, { backgroundColor: action.color }]}> 
                <Image 
                  source={action.icon} 
                  style={styles.quickActionImage}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.quickActionLabel}>{action.title}</Text>
            </TouchableOpacity>
          ))}
        </View>


        {/* Upcoming Jobs */}
        <View style={styles.sectionRowAligned}>
          <Text style={styles.sectionTitle}>Upcoming Jobs</Text>
          <TouchableOpacity>
            <Text style={styles.sectionAction}>View All</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.upcomingJobsRow}>
          {upcomingBookings.map((booking, idx) => {
            // Fix earnings calculation with proper error handling
            let totalEarnings = 0;
            try {
              console.log('💰 Dashboard calculating earnings for:', booking);
              
              // Handle malformed time data
              let startTime = booking.startTime;
              let endTime = booking.endTime;
              
              // If time contains weird format like "2025-09-10T18:0", extract just the time part
              if (startTime && startTime.includes('T')) {
                const timeMatch = startTime.match(/(\d{1,2}):(\d{2})/);
                if (timeMatch) {
                  startTime = `${timeMatch[1]}:${timeMatch[2]}`;
                }
              }
              
              if (endTime && endTime.includes('T')) {
                const timeMatch = endTime.match(/(\d{1,2}):(\d{2})/);
                if (timeMatch) {
                  endTime = `${timeMatch[1]}:${timeMatch[2]}`;
                }
              }
              
              if (startTime && endTime) {
                const start = new Date(`2000-01-01 ${startTime}`);
                const end = new Date(`2000-01-01 ${endTime}`);
                
                if (end <= start) {
                  end.setDate(end.getDate() + 1);
                }
                
                const diffMs = end.getTime() - start.getTime();
                const hours = diffMs / (1000 * 60 * 60);
                
                // Use the user's actual hourly rate from profile
                const hourlyRate = currentUser?.hourlyRate || 25;
                totalEarnings = Math.ceil(hours * hourlyRate);
                
                console.log('💰 Dashboard earnings calculated:', { 
                  startTime, 
                  endTime, 
                  hours: hours.toFixed(2), 
                  rate: hourlyRate, 
                  total: totalEarnings 
                });
              } else {
                console.log('❌ Missing time data for earnings calculation:', { startTime, endTime });
                totalEarnings = 0;
              }
            } catch (error) {
              console.error('❌ Error calculating dashboard earnings:', error);
              totalEarnings = 0;
            }
            
            return (
              <TouchableOpacity 
                key={booking.id} 
                style={[styles.upcomingJobCard, { backgroundColor: upcomingJobColors[idx % upcomingJobColors.length] }]}
                onPress={() => {
                  console.log('🔴 Dashboard job card pressed!');
                  router.push({
                    pathname: '/booking',
                    params: {
                      jobId: booking.id,
                      petOwnerName: booking.petOwnerName,
                      date: booking.date,
                      startTime: booking.startTime,
                      endTime: booking.endTime,
                      status: booking.status,
                      petName: booking.petName,
                      specialInstructions: booking.specialInstructions || '',
                      hourlyRate: booking.hourlyRate?.toString() || '0'
                    }
                  });
                }}
              >
                <Text style={styles.jobOwnerName}>{booking.petOwnerName}</Text>
                <Text style={styles.jobEarnings}>₱{totalEarnings.toFixed(0)}</Text>
                <View style={styles.jobMetaRow}>
                  <Ionicons name="time-outline" size={16} color="#888" style={{ marginRight: 4 }} />
                  <Text style={styles.jobMetaText}>
                    {(() => {
                      try {
                        // Clean up the time format
                        let startTime = booking.startTime;
                        let endTime = booking.endTime;
                        
                        if (startTime && startTime.includes('T')) {
                          const timeMatch = startTime.match(/(\d{1,2}):(\d{2})/);
                          if (timeMatch) {
                            startTime = `${timeMatch[1]}:${timeMatch[2]}`;
                          }
                        }
                        
                        if (endTime && endTime.includes('T')) {
                          const timeMatch = endTime.match(/(\d{1,2}):(\d{2})/);
                          if (timeMatch) {
                            endTime = `${timeMatch[1]}:${timeMatch[2]}`;
                          }
                        }
                        
                        // Convert to 12-hour format
                        const formatTime = (time24: string) => {
                          if (!time24) return 'Invalid Time';
                          const [hours, minutes] = time24.split(':');
                          const hour = parseInt(hours, 10);
                          const ampm = hour >= 12 ? 'PM' : 'AM';
                          const hour12 = hour % 12 || 12;
                          return `${hour12}:${minutes} ${ampm}`;
                        };
                        
                        return `${formatTime(startTime)} - ${formatTime(endTime)}`;
                      } catch (error) {
                        return 'Time not set';
                      }
                    })()}
                  </Text>
                </View>
                <View style={styles.jobStatusBadge}>
                  <Text style={styles.jobStatusText}>{booking.status}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
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
    marginLeft: 8,
  },
  totalIncomeAmount: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  totalIncomeContent: {
    alignItems: 'center',
  },
  totalIncomeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  totalIncomeHint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    opacity: 0.9,
  },
  totalIncomeHintText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
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
  statsValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 4,
  },
  statsLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    textAlign: 'center',
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
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 8,
  },
  sectionAction: {
    color: '#F59E0B',
    fontWeight: '600',
    fontSize: 15,
  },
  jobCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    marginHorizontal: 16,
    marginTop: 10,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
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
    fontSize: 10,
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

export default PetSitterDashboard; 