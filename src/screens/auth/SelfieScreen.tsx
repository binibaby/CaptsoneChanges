import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { getApiUrl, getAuthHeaders } from '../../constants/config';

interface SelfieScreenProps {
  userData?: any;
  phoneVerified?: boolean;
  frontImage?: string;
  backImage?: string;
  onSelfieComplete?: (userData: any) => void;
}

const SelfieScreen: React.FC<SelfieScreenProps> = ({ userData: propUserData, phoneVerified: propPhoneVerified, frontImage: propFrontImage, backImage: propBackImage, onSelfieComplete }) => {
  const navigation = useNavigation();
  const route = useRoute();
  
  // Get data from either props or route params
  const userData = propUserData || (route.params as any)?.userData;
  const phoneVerified = propPhoneVerified ?? (route.params as any)?.phoneVerified;
  const frontImage = propFrontImage || (route.params as any)?.frontImage;
  const backImage = propBackImage || (route.params as any)?.backImage;
  
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
        user_id: userData?.id || '1',
        document_type: 'ph_national_id',
        document_number: '123456789',
        front_image: frontImageBase64,
        back_image: backImageBase64,
        selfie_image: selfieImageBase64,
        has_front_image: !!frontImageBase64,
        has_back_image: !!backImageBase64,
        has_selfie_image: !!selfieImageBase64,
      };

      const response = await fetch(getApiUrl('/api/verification/submit-simple'), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);
      
      if (data.success) {
        Alert.alert(
          'Success!', 
          'Your ID and face have been verified successfully!',
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
      Alert.alert('Error', 'Failed to submit verification. Please try again.');
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
              // Call the public skip verification API (no token required during onboarding)
              const response = await fetch(getApiUrl('/api/verification/skip-public'), {
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
              Alert.alert('Error', 'Failed to skip verification. Please try again.');
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
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Take a Selfie</Text>
        <Text style={styles.subtitle}>
          Take a clear photo of your face for verification
        </Text>

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

        <TouchableOpacity 
          style={styles.skipButton} 
          onPress={handleSkip}
        >
          <Text style={styles.skipButtonText}>Skip for Now</Text>
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
              <Text style={styles.submitButtonText}>Submit Verification</Text>
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
    borderRadius: 8,
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
    borderRadius: 8,
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
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 10,
  },
  backButtonText: {
    color: '#333',
    fontSize: 18,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#10B981',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 10,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default SelfieScreen; 