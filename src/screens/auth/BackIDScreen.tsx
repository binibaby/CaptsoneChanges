import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { getApiUrl, getAuthHeaders } from '../../constants/config';
import {
    ActivityIndicator,
    Alert,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface BackIDScreenProps {
  userData?: any;
  phoneVerified?: boolean;
  frontImage?: string;
  onBackIDComplete?: (phoneVerified: boolean, frontImage: string, backImage: string) => void;
}

const BackIDScreen: React.FC<BackIDScreenProps> = ({ userData: propUserData, phoneVerified: propPhoneVerified, frontImage: propFrontImage, onBackIDComplete }) => {
  const navigation = useNavigation();
  const route = useRoute();
  
  // Get data from either props or route params
  const userData = propUserData || (route.params as any)?.userData;
  const phoneVerified = propPhoneVerified ?? (route.params as any)?.phoneVerified ?? false;
  const frontImage = propFrontImage || (route.params as any)?.frontImage;
  
  console.log('BackIDScreen - propUserData:', propUserData);
  console.log('BackIDScreen - propPhoneVerified:', propPhoneVerified);
  console.log('BackIDScreen - propFrontImage:', propFrontImage);
  console.log('BackIDScreen - route.params:', route.params);
  console.log('BackIDScreen - final userData:', userData);
  console.log('BackIDScreen - final phoneVerified:', phoneVerified);
  console.log('BackIDScreen - final frontImage:', frontImage);
  console.log('BackIDScreen - onBackIDComplete callback:', !!onBackIDComplete);

  const [backImage, setBackImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const takePhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Camera permission is required to take ID photos');
        return;
      }

      setIsLoading(true);
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setBackImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    if (!backImage) {
      Alert.alert('Error', 'Please take a photo of the back of your ID');
      return;
    }

    // Use callback if available, otherwise use navigation
    if (onBackIDComplete) {
      console.log('Using callback for navigation');
      onBackIDComplete(phoneVerified, frontImage, backImage);
    } else {
      console.log('Using navigation prop');
      // Navigate to selfie screen with all collected data
      navigation.navigate('Selfie', {
        userData: userData,
        phoneVerified: phoneVerified,
        frontImage: frontImage,
        backImage: backImage,
      });
    }
  };

  const handleSkip = async () => {
    Alert.alert(
      'Skip Back ID Photo',
      'You can skip the back ID photo for now and complete it later.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Skip for Now',
          onPress: async () => {
            try {
              // Call the public skip verification API to avoid token requirement during onboarding
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
                        // Navigate to selfie screen without back image
                        if (onBackIDComplete) {
                          onBackIDComplete(phoneVerified, frontImage, '');
                        } else {
                          navigation.navigate('Selfie', {
                            userData: userData,
                            phoneVerified: phoneVerified,
                            frontImage: frontImage,
                            backImage: '',
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
    if (onBackIDComplete) {
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
        <Text style={styles.title}>Back ID Photo</Text>
        <Text style={styles.subtitle}>
          Take a clear photo of the back of your ID
        </Text>

        <View style={styles.imageContainer}>
          {backImage ? (
            <Image source={{ uri: backImage }} style={styles.previewImage} />
          ) : (
            <View style={styles.placeholderContainer}>
              <Text style={styles.placeholderText}>No image selected</Text>
            </View>
          )}
        </View>

        <TouchableOpacity 
          style={[styles.cameraButton, isLoading && styles.buttonDisabled]} 
          onPress={takePhoto}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.cameraButtonText}>
              {backImage ? 'Retake Photo' : 'Take Photo'}
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
            style={[styles.nextButton, !backImage && styles.buttonDisabled]} 
            onPress={handleNext}
            disabled={!backImage}
          >
            <Text style={styles.nextButtonText}>Next</Text>
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
    width: '100%',
    height: 300,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  placeholderContainer: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  placeholderText: {
    fontSize: 16,
    color: '#999',
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
    padding: 15,
    borderRadius: 100,  
    alignItems: 'center',
    marginRight: 10,
  },
  backButtonText: {
    color: '#333',
    fontSize: 18,
    fontWeight: '600',
  },
  nextButton: {
    flex: 1,
    backgroundColor: '#10B981',
    padding: 15,
    borderRadius: 100,
    alignItems: 'center',
    marginLeft: 10,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default BackIDScreen; 