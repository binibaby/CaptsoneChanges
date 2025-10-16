import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { getAuthHeaders } from '../../constants/config';
import { makeApiCall } from '../../services/networkService';

interface SelfieScreenProps {
  userData?: any;
  phoneVerified?: boolean;
  frontImage?: string;
  backImage?: string;
  documentType?: string;
  onSelfieComplete?: (userData: any) => void;
}

const SelfieScreen: React.FC<SelfieScreenProps> = ({ userData: propUserData, phoneVerified: propPhoneVerified, frontImage: propFrontImage, backImage: propBackImage, documentType: propDocumentType, onSelfieComplete }) => {
  const navigation = useNavigation();
  const route = useRoute();
  
  // Get data from either props or route params
  const userData = propUserData || (route.params as any)?.userData;
  const phoneVerified = propPhoneVerified ?? (route.params as any)?.phoneVerified;
  const frontImage = propFrontImage || (route.params as any)?.frontImage;
  const backImage = propBackImage || (route.params as any)?.backImage;
  const documentType = propDocumentType || (route.params as any)?.documentType || 'ph_national_id';
  
  console.log('SelfieScreen - propUserData:', propUserData);
  console.log('SelfieScreen - propPhoneVerified:', propPhoneVerified);
  console.log('SelfieScreen - propFrontImage:', propFrontImage);
  console.log('SelfieScreen - propBackImage:', propBackImage);
  console.log('SelfieScreen - route.params:', route.params);
  console.log('SelfieScreen - final userData:', userData);
  console.log('SelfieScreen - final phoneVerified:', phoneVerified);
  console.log('SelfieScreen - final frontImage:', frontImage);
  console.log('SelfieScreen - final backImage:', backImage);
  console.log('SelfieScreen - onSelfieComplete callback:', !!onSelfieComplete);

  const [selfieImage, setSelfieImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
    address: string;
    accuracy: number;
  } | null>(null);

  // Capture current location when component mounts
  useEffect(() => {
    captureCurrentLocation();
  }, []);

  const captureCurrentLocation = async () => {
    try {
      console.log('📍 SelfieScreen - Requesting location permission...');
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        console.log('❌ SelfieScreen - Location permission denied');
        Alert.alert(
          'Location Permission Required',
          'Please enable location access to capture your verification location.',
          [{ text: 'OK' }]
        );
        return;
      }

      console.log('📍 SelfieScreen - Getting current location...');
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      console.log('📍 SelfieScreen - Location captured:', location);

      // Reverse geocode to get address
      const addressResponse = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      const address = addressResponse[0] 
        ? `${addressResponse[0].street || ''} ${addressResponse[0].streetNumber || ''} ${addressResponse[0].district || ''} ${addressResponse[0].city || ''} ${addressResponse[0].region || ''} ${addressResponse[0].country || ''}`.trim()
        : 'Unknown Location';

      const locationData = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        address: address,
        accuracy: location.coords.accuracy || 0,
      };

      console.log('📍 SelfieScreen - Location data:', locationData);
      setCurrentLocation(locationData);
    } catch (error) {
      console.error('❌ SelfieScreen - Location capture error:', error);
      Alert.alert(
        'Location Error',
        'Failed to capture your location. Please ensure location services are enabled.',
        [{ text: 'OK' }]
      );
    }
  };

  const takeSelfie = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Camera permission is required to take a selfie');
        return;
      }

      setIsLoading(true);
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1], // Square aspect for selfie
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelfieImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take selfie. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const createFormData = (uri: string, fieldName: string) => {
    const formData = new FormData();
    const filename = uri.split('/').pop() || 'image.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';
    
    formData.append(fieldName, {
      uri,
      name: filename,
      type,
    } as any);
    
    return formData;
  };

  const submitVerification = async () => {
    if (!selfieImage) {
      Alert.alert('Error', 'Please take a selfie');
      return;
    }

    setIsSubmitting(true);
    try {
      // Convert images to base64 for JSON submission
      const convertImageToBase64 = async (uri: string): Promise<string> => {
        try {
          const response = await fetch(uri);
          const blob = await response.blob();
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const result = reader.result as string;
              resolve(result.split(',')[1]); // Remove data:image/jpeg;base64, prefix
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        } catch (error) {
          console.error('Error converting image to base64:', error);
          throw new Error('Failed to process image');
        }
      };

      // Convert all images to base64
      const frontImageBase64 = frontImage ? await convertImageToBase64(frontImage) : '';
      const backImageBase64 = backImage ? await convertImageToBase64(backImage) : '';
      const selfieImageBase64 = await convertImageToBase64(selfieImage);

      const payload = {
        user_id: userData?.id || null,
        document_type: documentType,
        document_number: '123456789',
        document_image: selfieImageBase64, // Use selfie as the main document image
        first_name: userData?.firstName || userData?.first_name || 'Unknown',
        last_name: userData?.lastName || userData?.last_name || 'Unknown',
        phone: userData?.phone || '+639000000000',
        front_image: frontImageBase64,
        back_image: backImageBase64,
        selfie_image: selfieImageBase64,
        has_front_image: !!frontImageBase64,
        has_back_image: !!backImageBase64,
        has_selfie_image: !!selfieImageBase64,
        // Add actual location data
        selfie_latitude: currentLocation?.latitude || null,
        selfie_longitude: currentLocation?.longitude || null,
        selfie_address: currentLocation?.address || null,
        location_accuracy: currentLocation?.accuracy || null,
      };

      console.log('📦 SelfieScreen - Payload being sent:', {
        user_id: payload.user_id,
        document_type: payload.document_type,
        front_image_size: frontImageBase64 ? frontImageBase64.length : 0,
        back_image_size: backImageBase64 ? backImageBase64.length : 0,
        selfie_image_size: selfieImageBase64 ? selfieImageBase64.length : 0,
        location: currentLocation ? `${currentLocation.address} (${currentLocation.latitude}, ${currentLocation.longitude})` : 'No location'
      });

      // Get authentication token
      const authToken = userData?.token;
      console.log('🔐 SelfieScreen - Auth token:', authToken ? 'Present' : 'Missing');
      console.log('🔐 SelfieScreen - Token value:', authToken);
      console.log('🔐 SelfieScreen - User data:', userData);
      
      if (!authToken) {
        Alert.alert('Error', 'Authentication required. Please log in again.');
        return;
      }

      const headers = getAuthHeaders(authToken);
      console.log('🔐 SelfieScreen - Headers being sent:', headers);
      console.log('📦 SelfieScreen - Payload being sent:', {
        ...payload,
        document_image: payload.document_image ? `[${payload.document_image.length} chars]` : 'empty',
        front_image: payload.front_image ? `[${payload.front_image.length} chars]` : 'empty',
        back_image: payload.back_image ? `[${payload.back_image.length} chars]` : 'empty',
        selfie_image: payload.selfie_image ? `[${payload.selfie_image.length} chars]` : 'empty',
      });

      let response = await makeApiCall('/api/verification/submit-simple', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload),
      });

      console.log('Response status:', response.status);
      
      // Handle 401 Unauthorized - try to refresh token and retry
      if (response.status === 401) {
        console.log('🔄 401 Unauthorized - attempting token refresh');
        try {
          const { default: authService } = await import('../../services/authService');
          await authService.refreshUserToken();
          
          // Get updated user data with new token
          const refreshedUser = await authService.getCurrentUser();
          if (refreshedUser?.token && refreshedUser.token !== authToken) {
            console.log('✅ Token refreshed successfully, retrying verification submission');
            
            // Update userData with new token
            const updatedUserData = { ...userData, token: refreshedUser.token };
            
            // Retry with new token
            const newHeaders = getAuthHeaders(refreshedUser.token);
            response = await makeApiCall('/api/verification/submit-simple', {
              method: 'POST',
              headers: newHeaders,
              body: JSON.stringify(payload),
            });
            
            console.log('Retry response status:', response.status);
          } else {
            console.error('❌ Token refresh failed - no new token available');
            Alert.alert('Authentication Error', 'Your session has expired. Please log in again.');
            return;
          }
        } catch (refreshError) {
          console.error('❌ Token refresh failed:', refreshError);
          Alert.alert('Authentication Error', 'Your session has expired. Please log in again.');
          return;
        }
      }
      
      const data = await response.json();
      console.log('Response data:', data);
      
      if (data.success) {
        Alert.alert(
          'Verification Submitted!', 
          'Your ID verification has been submitted for admin review. You will be notified within 24 hours of the admin\'s decision. You cannot start jobs until your verification is approved.',
          [
            {
              text: 'OK',
              onPress: () => {
                // Use callback if available, otherwise use navigation
                if (onSelfieComplete) {
                  console.log('Using callback for completion');
                  onSelfieComplete(userData);
                } else {
                  console.log('Using navigation reset');
                  // Navigate to the main app
                  navigation.reset({
                    index: 0,
                    routes: [{ name: 'PetSitterDashboard' }],
                  });
                }
              },
            },
          ]
        );
      } else {
        Alert.alert('Verification Failed', data.message || 'Verification failed. Please try again.');
      }
    } catch (error) {
      console.error('Verification error:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        userData: userData,
        hasSelfieImage: !!selfieImage,
        hasFrontImage: !!frontImage,
        hasBackImage: !!backImage
      });
      Alert.alert('Error', `Failed to submit verification: ${error instanceof Error ? error.message : 'Network error'}. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    Alert.alert(
      'Skip ID Verification',
      'You can skip ID verification for now and complete it later. Your account will be created but ID verification will be marked as pending.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Skip for Now',
          onPress: async () => {
            try {
              // Use network service for better connectivity
              const response = await makeApiCall('/api/verification/skip-public', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                  user_id: (userData as any)?.user?.id || (userData as any)?.id,
                  phone: (userData as any)?.phone,
                }),
              });

              const data = await response.json();
              
              if (data.success) {
                Alert.alert(
                  'Skipped for now',
                  'You can use the app but please complete your ID verification later from your profile.',
                  [
                    {
                      text: 'OK',
                      onPress: () => {
                        // Complete registration without ID verification
                        if (onSelfieComplete) {
                          console.log('Using callback for completion without verification');
                          onSelfieComplete(userData);
                        } else {
                          console.log('Using navigation reset without verification');
                          // Navigate to the main app
                          navigation.reset({
                            index: 0,
                            routes: [{ name: 'PetSitterDashboard' }],
                          });
                        }
                      },
                    },
                  ]
                );
              } else {
                Alert.alert('Error', data.message || 'Failed to skip verification');
              }
            } catch (error) {
              console.error('Skip verification error:', error);
              console.error('Error details:', {
                message: error instanceof Error ? error.message : 'Unknown error',
                userData: userData,
                userId: (userData as any)?.user?.id || (userData as any)?.id,
                phone: (userData as any)?.phone
              });
              Alert.alert('Error', `Failed to skip verification: ${error instanceof Error ? error.message : 'Network error'}. Please try again.`);
            }
          },
        },
      ]
    );
  };

  const handleBack = () => {
    if (onSelfieComplete) {
      // Go back to previous step in auth flow
      console.log('Going back in auth flow');
      // This would need to be handled by the parent component
    } else {
      // Check if we can go back, otherwise navigate to a safe screen
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        // If no previous screen, navigate to onboarding
        navigation.navigate('onboarding' as never);
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Take a Selfie</Text>
        <Text style={styles.subtitle}>
          Take a clear photo of your face for verification
        </Text>

        {/* Location Display */}
        {currentLocation && (
          <View style={styles.locationContainer}>
            <Text style={styles.locationTitle}>📍 Verification Location</Text>
            <Text style={styles.locationText}>{currentLocation.address}</Text>
            <Text style={styles.locationCoords}>
              {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
            </Text>
            <Text style={styles.locationAccuracy}>
              Accuracy: {currentLocation.accuracy ? `${Math.round(currentLocation.accuracy)}m` : 'Unknown'}
            </Text>
          </View>
        )}

        <View style={styles.imageContainer}>
          {selfieImage ? (
            <Image source={{ uri: selfieImage }} style={styles.previewImage} />
          ) : (
            <View style={styles.placeholderContainer}>
              <Text style={styles.placeholderText}>No selfie taken</Text>
            </View>
          )}
        </View>

        <TouchableOpacity 
          style={[styles.cameraButton, isLoading && styles.buttonDisabled]} 
          onPress={takeSelfie}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.cameraButtonText}>
              {selfieImage ? 'Retake Selfie' : 'Take Selfie'}
            </Text>
          )}
        </TouchableOpacity>


        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.submitButton, (!selfieImage || isSubmitting) && styles.buttonDisabled]} 
            onPress={submitVerification}
            disabled={!selfieImage || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Submit</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  imageContainer: {
    flex: 1,
    marginBottom: 30,
    justifyContent: 'center',
  },
  previewImage: {
    width: 200,
    height: 200,
    borderRadius: 100,
    alignSelf: 'center',
    resizeMode: 'cover',
  },
  placeholderContainer: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    alignSelf: 'center',
  },
  placeholderText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  cameraButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 100,
    alignItems: 'center',
    marginBottom: 30,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  cameraButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  skipButton: {
    backgroundColor: '#F59E0B',
    padding: 15,
    borderRadius: 100,
    alignItems: 'center',
    marginBottom: 20,
  },
  skipButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  backButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 100,  
    alignItems: 'center',
    marginRight: 10,
  },
  backButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#10B981',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 100,
    alignItems: 'center',
    marginLeft: 10,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  locationContainer: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
    lineHeight: 20,
  },
  locationCoords: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  locationAccuracy: {
    fontSize: 12,
    color: '#6b7280',
  },
});

export default SelfieScreen; 