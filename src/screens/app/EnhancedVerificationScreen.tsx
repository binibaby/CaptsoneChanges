import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import echoService from '../../services/echoService';
import verificationService from '../../services/verificationService';

type VerificationStatus = 'pending' | 'approved' | 'rejected' | 'not_submitted';

interface VerificationData {
  id?: string;
  status: VerificationStatus;
  verification_status?: string;
  document_type?: string;
  document_number?: string;
  is_philippine_id?: boolean;
  verification_score?: number;
  rejection_reason?: string;
  submitted_at?: string;
  verified_at?: string;
  review_deadline?: string;
  badges_earned?: Badge[];
  front_id_image?: string;
  back_id_image?: string;
  selfie_image?: string;
  selfie_address?: string;
  admin_decision?: string;
  admin_reviewed_at?: string;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  earned_at?: string;
}

interface EnhancedVerificationScreenNavigationProp {
  goBack: () => void;
}

const EnhancedVerificationScreen = () => {
  const navigation = useNavigation<EnhancedVerificationScreenNavigationProp>();
  const { user } = useAuth();
  
  const [verification, setVerification] = useState<VerificationData | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Enhanced verification states
  const [showEnhancedVerification, setShowEnhancedVerification] = useState(false);
  const [selectedIdType, setSelectedIdType] = useState('');
  const [frontIdImage, setFrontIdImage] = useState<string | null>(null);
  const [backIdImage, setBackIdImage] = useState<string | null>(null);
  const [selfieImage, setSelfieImage] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [locationAddress, setLocationAddress] = useState('');
  const [locationAccuracy, setLocationAccuracy] = useState(0);
  
  // Real-time connection state
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Philippine ID types
  const philippineIdTypes = [
    { type: 'ph_national_id', name: 'Philippine National ID', description: 'PhilSys National ID' },
    { type: 'ph_drivers_license', name: "Driver's License", description: 'Philippine Driver\'s License' },
    { type: 'sss_id', name: 'SSS ID', description: 'Social Security System ID' },
    { type: 'philhealth_id', name: 'PhilHealth ID', description: 'Philippine Health Insurance ID' },
    { type: 'tin_id', name: 'TIN ID', description: 'Tax Identification Number ID' },
    { type: 'postal_id', name: 'Postal ID', description: 'Postal ID' },
    { type: 'voters_id', name: "Voter's ID", description: 'Voter\'s ID' },
    { type: 'prc_id', name: 'PRC ID', description: 'Professional Regulation Commission ID' },
    { type: 'umid', name: 'UMID', description: 'Unified Multi-Purpose ID' },
    { type: 'owwa_id', name: 'OWWA ID', description: 'Overseas Workers Welfare Administration ID' },
  ];

  // Load verification status on component mount
  useEffect(() => {
    loadVerificationStatus();
    setupRealTimeConnection();
    
    return () => {
      // Cleanup real-time connection
      if (user?.id) {
        echoService.stopListeningToVerificationUpdates(user.id);
      }
      echoService.disconnect();
    };
  }, []);

  // Setup real-time connection
  const setupRealTimeConnection = async () => {
    if (!user?.id) return;

    try {
      // Set auth token for private channels
      const authToken = await getAuthToken();
      if (authToken) {
        echoService.setAuthToken(authToken);
      }

      // Connect to Reverb server
      const connected = await echoService.connect();
      setIsConnected(connected);

      if (connected) {
        // Listen for verification updates
        const channel = echoService.listenToVerificationUpdates(user.id, (data) => {
          console.log('📡 Real-time verification update received:', data);
          setLastUpdate(new Date());
          
          // Update verification status
          if (data.verification) {
            setVerification(data.verification);
          }
          
          // Show success/error message
          if (data.status === 'approved') {
            Alert.alert(
              '🎉 Verification Approved!',
              data.message || 'Your ID verification has been approved!',
              [{ text: 'OK' }]
            );
          } else if (data.status === 'rejected') {
            Alert.alert(
              '❌ Verification Rejected',
              data.message || 'Your ID verification was rejected. Please check the reason and resubmit.',
              [{ text: 'OK' }]
            );
          }
        });

        if (channel) {
          console.log('👂 Real-time listener set up successfully');
        }
      }
    } catch (error) {
      console.error('❌ Failed to setup real-time connection:', error);
      setIsConnected(false);
    }
  };

  // Get auth token
  const getAuthToken = async (): Promise<string> => {
    try {
      const { default: authService } = await import('../../services/authService');
      const currentUser = await authService.getCurrentUser();
      return currentUser?.token || '';
    } catch (error) {
      console.error('Error getting auth token:', error);
      return '';
    }
  };

  // Load verification status
  const loadVerificationStatus = async () => {
    try {
      setIsLoading(true);
      const response = await verificationService.getVerificationStatusFromAPI();
      
      if (response.success) {
        // Note: response.verification is VerificationStatus, not VerificationData
        // setVerification(response.verification || null);
        setBadges(response.badges || []);
      }
    } catch (error) {
      console.error('Error loading verification status:', error);
      Alert.alert('Error', 'Failed to load verification status');
    } finally {
      setIsLoading(false);
    }
  };

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadVerificationStatus();
    setRefreshing(false);
  }, []);

  // Request location permission and get current location
  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required for verification');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setCurrentLocation(location);
      setLocationAccuracy(location.coords.accuracy || 0);

      // Get address from coordinates
      const addressResponse = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (addressResponse.length > 0) {
        const address = addressResponse[0];
        const fullAddress = `${address.street || ''} ${address.city || ''} ${address.region || ''} ${address.country || ''}`.trim();
        setLocationAddress(fullAddress);
      }
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get current location');
    }
  };

  // Pick image from camera or gallery
  const pickImage = async (type: 'front' | 'back' | 'selfie') => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const base64 = `data:image/jpeg;base64,${result.assets[0].base64}`;
        
        switch (type) {
          case 'front':
            setFrontIdImage(base64);
            break;
          case 'back':
            setBackIdImage(base64);
            break;
          case 'selfie':
            setSelfieImage(base64);
            break;
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  // Submit enhanced verification
  const submitEnhancedVerification = async () => {
    if (!selectedIdType || !frontIdImage || !backIdImage || !selfieImage || !currentLocation) {
      Alert.alert('Missing Information', 'Please fill in all required fields and take all required photos');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const verificationData = {
        front_id_image: frontIdImage,
        back_id_image: backIdImage,
        selfie_image: selfieImage,
        location: {
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
          address: locationAddress,
          accuracy: locationAccuracy,
        },
        document_type: selectedIdType,
      };

      const response = await verificationService.submitEnhancedVerification(verificationData);
      
      if (response.success) {
        Alert.alert(
          'Success!',
          'Your enhanced verification has been submitted. You will be notified when it\'s reviewed.',
          [
            {
              text: 'OK',
              onPress: () => {
                setShowEnhancedVerification(false);
                loadVerificationStatus();
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', response.message || 'Failed to submit verification');
      }
    } catch (error) {
      console.error('Error submitting verification:', error);
      Alert.alert('Error', 'Failed to submit verification. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setSelectedIdType('');
    setFrontIdImage(null);
    setBackIdImage(null);
    setSelfieImage(null);
    setCurrentLocation(null);
    setLocationAddress('');
    setLocationAccuracy(0);
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return '#10B981';
      case 'rejected':
        return '#EF4444';
      case 'pending':
        return '#F59E0B';
      default:
        return '#6B7280';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return 'checkmark-circle';
      case 'rejected':
        return 'close-circle';
      case 'pending':
        return 'time';
      default:
        return 'help-circle';
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading verification status...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>ID Verification</Text>
          <View style={styles.connectionStatus}>
            <View style={[styles.statusDot, { backgroundColor: isConnected ? '#10B981' : '#EF4444' }]} />
            <Text style={styles.statusText}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </Text>
          </View>
        </View>

        {/* Real-time indicator */}
        {lastUpdate && (
          <View style={styles.realTimeIndicator}>
            <Ionicons name="radio" size={16} color="#3B82F6" />
            <Text style={styles.realTimeText}>
              Last updated: {lastUpdate.toLocaleTimeString()}
            </Text>
          </View>
        )}

        {/* Verification Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Ionicons
              name={getStatusIcon(verification?.status || 'not_submitted')}
              size={32}
              color={getStatusColor(verification?.status || 'not_submitted')}
            />
            <View style={styles.statusInfo}>
              <Text style={styles.statusTitle}>
                {verification?.status === 'approved' ? 'ID Verified' : 
                 verification?.status === 'rejected' ? 'Verification Rejected' :
                 verification?.status === 'pending' ? 'Under Review' : 'Not Verified'}
              </Text>
              <Text style={styles.statusSubtitle}>
                {verification?.status === 'approved' ? 'Your identity has been verified' :
                 verification?.status === 'rejected' ? verification?.rejection_reason || 'Please resubmit with correct documents' :
                 verification?.status === 'pending' ? 'Admin is reviewing your documents' : 'Submit your ID for verification'}
              </Text>
            </View>
          </View>

        </View>

        {/* Badges */}
        {badges.length > 0 && (
          <View style={styles.badgesSection}>
            <Text style={styles.sectionTitle}>Earned Badges</Text>
            <FlatList
              data={badges}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={[styles.badge, { backgroundColor: item.color + '20' }]}>
                  <Ionicons name={item.icon as any} size={20} color={item.color} />
                  <Text style={[styles.badgeText, { color: item.color }]}>
                    {item.name}
                  </Text>
                </View>
              )}
            />
          </View>
        )}

        {/* Action Button */}
        {(!verification || verification.status === 'rejected') && (
          <TouchableOpacity
            style={styles.submitButton}
            onPress={() => setShowEnhancedVerification(true)}
          >
            <Ionicons name="camera" size={20} color="white" />
            <Text style={styles.submitButtonText}>
              {verification?.status === 'rejected' ? 'Resubmit Verification' : 'Submit ID Verification'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Enhanced Verification Modal */}
        <Modal
          visible={showEnhancedVerification}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowEnhancedVerification(false)}>
                <Ionicons name="close" size={24} color="#1F2937" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Enhanced ID Verification</Text>
              <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.modalContent}>
              {/* ID Type Selection */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>ID Type *</Text>
                <View style={styles.idTypeContainer}>
                  {philippineIdTypes.map((idType) => (
                    <TouchableOpacity
                      key={idType.type}
                      style={[
                        styles.idTypeOption,
                        selectedIdType === idType.type && styles.idTypeOptionSelected,
                      ]}
                      onPress={() => setSelectedIdType(idType.type)}
                    >
                      <Text style={[
                        styles.idTypeText,
                        selectedIdType === idType.type && styles.idTypeTextSelected,
                      ]}>
                        {idType.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Front ID Image */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Front of ID *</Text>
                <TouchableOpacity
                  style={styles.imagePicker}
                  onPress={() => pickImage('front')}
                >
                  {frontIdImage ? (
                    <Image source={{ uri: frontIdImage }} style={styles.previewImage} />
                  ) : (
                    <View style={styles.imagePlaceholder}>
                      <Ionicons name="camera" size={32} color="#9CA3AF" />
                      <Text style={styles.imagePlaceholderText}>Tap to take photo</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              {/* Back ID Image */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Back of ID *</Text>
                <TouchableOpacity
                  style={styles.imagePicker}
                  onPress={() => pickImage('back')}
                >
                  {backIdImage ? (
                    <Image source={{ uri: backIdImage }} style={styles.previewImage} />
                  ) : (
                    <View style={styles.imagePlaceholder}>
                      <Ionicons name="camera" size={32} color="#9CA3AF" />
                      <Text style={styles.imagePlaceholderText}>Tap to take photo</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              {/* Selfie Image */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Selfie with ID *</Text>
                <TouchableOpacity
                  style={styles.imagePicker}
                  onPress={() => pickImage('selfie')}
                >
                  {selfieImage ? (
                    <Image source={{ uri: selfieImage }} style={styles.previewImage} />
                  ) : (
                    <View style={styles.imagePlaceholder}>
                      <Ionicons name="person" size={32} color="#9CA3AF" />
                      <Text style={styles.imagePlaceholderText}>Tap to take selfie</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              {/* Location */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Current Location *</Text>
                <TouchableOpacity
                  style={styles.locationButton}
                  onPress={getCurrentLocation}
                >
                  <Ionicons name="location" size={20} color="#3B82F6" />
                  <Text style={styles.locationButtonText}>
                    {currentLocation ? 'Location Captured' : 'Get Current Location'}
                  </Text>
                </TouchableOpacity>
                {locationAddress && (
                  <Text style={styles.locationAddress}>{locationAddress}</Text>
                )}
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                onPress={submitEnhancedVerification}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={20} color="white" />
                    <Text style={styles.submitButtonText}>Submit Verification</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </SafeAreaView>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#6B7280',
  },
  realTimeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    backgroundColor: '#EBF8FF',
  },
  realTimeText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#3B82F6',
  },
  statusCard: {
    margin: 16,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusInfo: {
    marginLeft: 16,
    flex: 1,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  statusSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  deadlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 8,
    backgroundColor: '#FEF3C7',
    borderRadius: 6,
  },
  deadlineText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#92400E',
  },
  badgesSection: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  badgeText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '500',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 16,
    padding: 16,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 8,
  },
  idTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  idTypeOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  idTypeOptionSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  idTypeText: {
    fontSize: 14,
    color: '#6B7280',
  },
  idTypeTextSelected: {
    color: 'white',
  },
  imagePicker: {
    height: 120,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholder: {
    alignItems: 'center',
  },
  imagePlaceholderText: {
    marginTop: 8,
    fontSize: 14,
    color: '#9CA3AF',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#EBF8FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  locationButtonText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  locationAddress: {
    marginTop: 8,
    fontSize: 12,
    color: '#6B7280',
  },
});

export default EnhancedVerificationScreen;
