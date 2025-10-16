import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import verificationService from '../../services/verificationService';

const { width } = Dimensions.get('window');

interface LocationData {
  latitude: number;
  longitude: number;
  address: string;
  accuracy: number;
}

const EnhancedIDVerificationScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { firstName, lastName, age, phone } = (route.params as any) || {};
  
  const [frontIdImage, setFrontIdImage] = useState<string | null>(null);
  const [backIdImage, setBackIdImage] = useState<string | null>(null);
  const [selfieImage, setSelfieImage] = useState<string | null>(null);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission Required',
          'We need your location to verify your identity. Please enable location access.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
    }
  };

  const getCurrentLocation = async () => {
    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required for verification.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      // Get address from coordinates
      const addressResponse = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      const address = addressResponse[0];
      const fullAddress = `${address.street || ''} ${address.streetNumber || ''}, ${address.city || ''}, ${address.region || ''} ${address.postalCode || ''}`.trim();

      setLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        address: fullAddress,
        accuracy: location.coords.accuracy || 0,
      });

      Alert.alert(
        'Location Captured',
        `Location: ${fullAddress}\nAccuracy: ${Math.round(location.coords.accuracy || 0)}m`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Location Error', 'Failed to get your location. Please try again.');
    } finally {
      setLocationLoading(false);
    }
  };

  const pickImage = async (type: 'front' | 'back' | 'selfie') => {
    const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
    if (cameraPermission.granted === false) {
      Alert.alert('Camera Permission Required', 'Please allow camera access to take photos.');
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: type === 'selfie' ? [1, 1] : [3, 2],
        quality: 0.8,
        cameraType: type === 'selfie' ? ImagePicker.CameraType.front : ImagePicker.CameraType.back,
        allowsMultipleSelection: false,
        selectionLimit: 1,
        presentationStyle: Platform.OS === 'ios' ? ImagePicker.UIImagePickerPresentationStyle.FULL_SCREEN : undefined,
        videoQuality: ImagePicker.UIImagePickerControllerQualityType.High,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        if (type === 'front') {
          setFrontIdImage(result.assets[0].uri);
        } else if (type === 'back') {
          setBackIdImage(result.assets[0].uri);
        } else if (type === 'selfie') {
          setSelfieImage(result.assets[0].uri);
        }
      }
    } catch (error) {
      Alert.alert('Camera Error', 'Failed to open camera. Please try again.');
    }
  };

  const handleSubmit = async () => {
    if (!frontIdImage || !backIdImage || !selfieImage) {
      Alert.alert('Error', 'Please upload all required images (Front ID, Back ID, and Selfie)');
      return;
    }

    if (!location) {
      Alert.alert('Error', 'Please capture your current location for verification');
      return;
    }

    setLoading(true);
    try {
      const result = await verificationService.submitEnhancedVerification({
        front_id_image: frontIdImage,
        back_id_image: backIdImage,
        selfie_image: selfieImage,
        location: location,
        document_type: 'ph_national_id', // or let user select
      });

      if (result.success) {
        Alert.alert(
          'Verification Submitted',
          'Your ID verification has been submitted for review. You will be notified within 24 hours of the admin\'s decision. You cannot start jobs until your verification is approved.',
          [
            { 
              text: 'Continue', 
              onPress: () => navigation.navigate('PetSitterDashboard' as never) 
            }
          ]
        );
      } else {
        Alert.alert('Verification Failed', result.message || 'Your verification could not be submitted.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to submit verification. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Step 1: Front ID Photo</Text>
            <Text style={styles.stepDescription}>
              Take a clear photo of the front of your government-issued ID
            </Text>
            {frontIdImage ? (
              <Image source={{ uri: frontIdImage }} style={styles.idImage} />
            ) : (
              <TouchableOpacity style={styles.captureButton} onPress={() => pickImage('front')}>
                <Ionicons name="camera" size={32} color="#F59E0B" />
                <Text style={styles.captureButtonText}>📷 Take Front ID Photo</Text>
              </TouchableOpacity>
            )}
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Step 2: Back ID Photo</Text>
            <Text style={styles.stepDescription}>
              Take a clear photo of the back of your government-issued ID
            </Text>
            {backIdImage ? (
              <Image source={{ uri: backIdImage }} style={styles.idImage} />
            ) : (
              <TouchableOpacity style={styles.captureButton} onPress={() => pickImage('back')}>
                <Ionicons name="camera" size={32} color="#F59E0B" />
                <Text style={styles.captureButtonText}>📷 Take Back ID Photo</Text>
              </TouchableOpacity>
            )}
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Step 3: Selfie Photo</Text>
            <Text style={styles.stepDescription}>
              Take a clear selfie photo for identity verification
            </Text>
            {selfieImage ? (
              <Image source={{ uri: selfieImage }} style={styles.selfieImage} />
            ) : (
              <TouchableOpacity style={styles.captureButton} onPress={() => pickImage('selfie')}>
                <Ionicons name="camera" size={32} color="#F59E0B" />
                <Text style={styles.captureButtonText}>📷 Take Selfie</Text>
              </TouchableOpacity>
            )}
          </View>
        );

      case 4:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Step 4: Location Verification</Text>
            <Text style={styles.stepDescription}>
              Capture your current location to verify your address matches your ID
            </Text>
            {location ? (
              <View style={styles.locationContainer}>
                <Ionicons name="location" size={24} color="#10B981" />
                <Text style={styles.locationText}>{location.address}</Text>
                <Text style={styles.locationAccuracy}>
                  Accuracy: {Math.round(location.accuracy)}m
                </Text>
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.captureButton} 
                onPress={getCurrentLocation}
                disabled={locationLoading}
              >
                {locationLoading ? (
                  <ActivityIndicator color="#F59E0B" size="small" />
                ) : (
                  <Ionicons name="location" size={32} color="#F59E0B" />
                )}
                <Text style={styles.captureButtonText}>
                  {locationLoading ? 'Getting Location...' : '📍 Capture Location'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return frontIdImage !== null;
      case 2: return backIdImage !== null;
      case 3: return selfieImage !== null;
      case 4: return location !== null;
      default: return false;
    }
  };

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => {
          if (navigation.canGoBack()) {
            navigation.goBack();
          } else {
            navigation.navigate('onboarding' as never);
          }
        }}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Enhanced ID Verification</Text>
        <View style={styles.stepIndicator}>
          <Text style={styles.stepText}>{currentStep}/4</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: `${(currentStep / 4) * 100}%` }]} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderStep()}

        {/* Important Notice */}
        <View style={styles.noticeContainer}>
          <Ionicons name="information-circle" size={20} color="#F59E0B" />
          <Text style={styles.noticeText}>
            Your verification will be reviewed by our admin team within 24 hours. 
            You cannot start jobs until your verification is approved for safety reasons.
          </Text>
        </View>
      </ScrollView>

      {/* Navigation Buttons */}
      <View style={styles.buttonContainer}>
        {currentStep > 1 && (
          <TouchableOpacity style={styles.prevButton} onPress={prevStep}>
            <Text style={styles.prevButtonText}>Previous</Text>
          </TouchableOpacity>
        )}
        
        {currentStep < 4 ? (
          <TouchableOpacity 
            style={[styles.nextButton, !canProceed() && styles.disabledButton]} 
            onPress={nextStep}
            disabled={!canProceed()}
          >
            <Text style={styles.nextButtonText}>Next</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[styles.submitButton, loading && styles.disabledButton]} 
            onPress={handleSubmit}
            disabled={loading || !canProceed()}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.submitButtonText}>Submit Verification</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
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
    paddingTop: 50,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  stepIndicator: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  stepText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  progressContainer: {
    height: 4,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 20,
    borderRadius: 2,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  stepContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  idImage: {
    width: width * 0.8,
    height: (width * 0.8) * 0.67,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selfieImage: {
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: width * 0.3,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  captureButton: {
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#F59E0B',
    borderStyle: 'dashed',
    paddingVertical: 40,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    width: width * 0.8,
  },
  captureButtonText: {
    color: '#F59E0B',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  locationContainer: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#10B981',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    width: width * 0.8,
  },
  locationText: {
    color: '#065F46',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  locationAccuracy: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 4,
  },
  noticeContainer: {
    flexDirection: 'row',
    backgroundColor: '#FEF3C7',
    padding: 16,
    borderRadius: 8,
    marginVertical: 20,
    alignItems: 'flex-start',
  },
  noticeText: {
    color: '#92400E',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 12,
  },
  prevButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  prevButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    flex: 1,
    backgroundColor: '#F59E0B',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#D1D5DB',
    opacity: 0.6,
  },
});

export default EnhancedIDVerificationScreen;
