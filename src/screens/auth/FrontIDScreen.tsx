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

interface FrontIDScreenProps {
  userData?: any;
  phoneVerified?: boolean;
  onFrontIDComplete?: (phoneVerified: boolean, frontImage: string) => void;
}

const FrontIDScreen: React.FC<FrontIDScreenProps> = ({ userData: propUserData, phoneVerified: propPhoneVerified, onFrontIDComplete }) => {
  const navigation = useNavigation();
  const route = useRoute();
  
  // Get data from either props or route params
  const userData = propUserData || route.params?.userData;
  const phoneVerified = propPhoneVerified ?? route.params?.phoneVerified;
  
  console.log('FrontIDScreen - propUserData:', propUserData);
  console.log('FrontIDScreen - propPhoneVerified:', propPhoneVerified);
  console.log('FrontIDScreen - route.params:', route.params);
  console.log('FrontIDScreen - final userData:', userData);
  console.log('FrontIDScreen - final phoneVerified:', phoneVerified);
  console.log('FrontIDScreen - onFrontIDComplete callback:', !!onFrontIDComplete);

  const [frontImage, setFrontImage] = useState<string | null>(null);
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
        setFrontImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    if (!frontImage) {
      Alert.alert('Error', 'Please take a photo of the front of your ID');
      return;
    }

    // Use callback if available, otherwise use navigation
    if (onFrontIDComplete) {
      console.log('Using callback for navigation');
      onFrontIDComplete(phoneVerified, frontImage);
    } else {
      console.log('Using navigation prop');
      // Navigate to back ID screen with all collected data
      navigation.navigate('BackID', {
        userData: userData,
        phoneVerified: phoneVerified,
        frontImage: frontImage,
      });
    }
  };

  const handleBack = () => {
    if (onFrontIDComplete) {
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
        <Text style={styles.title}>Front ID Photo</Text>
        <Text style={styles.subtitle}>
          Take a clear photo of the front of your ID
        </Text>

        <View style={styles.imageContainer}>
          {frontImage ? (
            <Image source={{ uri: frontImage }} style={styles.previewImage} />
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
              {frontImage ? 'Retake Photo' : 'Take Photo'}
            </Text>
          )}
        </TouchableOpacity>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.nextButton, !frontImage && styles.buttonDisabled]} 
            onPress={handleNext}
            disabled={!frontImage}
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
  nextButton: {
    flex: 1,
    backgroundColor: '#10B981',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 10,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default FrontIDScreen; 