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
  const userData = propUserData || route.params?.userData;
  const phoneVerified = propPhoneVerified ?? route.params?.phoneVerified;
  const frontImage = propFrontImage || route.params?.frontImage;
  const backImage = propBackImage || route.params?.backImage;
  
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
      // Create form data with all images and user data
      const formData = new FormData();
      
      // Add user data from step 4
      formData.append('first_name', userData.firstName);
      formData.append('last_name', userData.lastName);
      formData.append('email', userData.email);
      formData.append('phone', userData.phone);
      formData.append('age', userData.age || '');
      formData.append('gender', userData.gender || '');
      formData.append('address', userData.address || '');
      
      // Add images
      const frontFilename = frontImage.split('/').pop() || 'front.jpg';
      const backFilename = backImage.split('/').pop() || 'back.jpg';
      const selfieFilename = selfieImage.split('/').pop() || 'selfie.jpg';
      
      formData.append('front_image', {
        uri: frontImage,
        name: frontFilename,
        type: 'image/jpeg',
      } as any);
      
      formData.append('back_image', {
        uri: backImage,
        name: backFilename,
        type: 'image/jpeg',
      } as any);
      
      formData.append('selfie_image', {
        uri: selfieImage,
        name: selfieFilename,
        type: 'image/jpeg',
      } as any);

      const response = await fetch('http://192.168.100.145:8001/api/verification/submit-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      const data = await response.json();
      
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
      Alert.alert('Error', 'Failed to submit verification. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
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