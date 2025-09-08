import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { ActivityIndicator, Alert, Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import verificationService from '../../services/verificationService';

const IDVerificationScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { firstName, lastName, age, phone } = (route.params as any) || {};
  const [idImage, setIdImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pickIdImage = async () => {
    const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
    if (cameraPermission.granted === false) {
      Alert.alert('Camera Permission Required', 'Please allow camera access to take ID photos.');
      return;
    }
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 2],
        quality: 0.8,
        cameraType: ImagePicker.CameraType.back,
        allowsMultipleSelection: false,
        selectionLimit: 1,
        presentationStyle: Platform.OS === 'ios' ? ImagePicker.UIImagePickerPresentationStyle.FULL_SCREEN : undefined,
        videoQuality: ImagePicker.UIImagePickerControllerQualityType.High,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setIdImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Camera Error', 'Failed to open camera. Please try again.');
    }
  };

  const handleSubmit = async () => {
    if (!idImage) {
      Alert.alert('Error', 'Please upload your ID image');
      return;
    }
    setLoading(true);
    try {
      // Call backend for blurriness and Veriff check
      const result = await verificationService.submitVerification({
        document_type: 'ph_national_id', // or let user select
        document_image: idImage,
      });
      if (result.success) {
        Alert.alert('Success', 'ID verified! You can now enter the app.', [
          { text: 'Continue', onPress: () => navigation.navigate('PetSitterDashboard') }
        ]);
      } else {
        Alert.alert('Verification Failed', result.message || 'Your ID could not be verified.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to verify ID. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color="#333" />
      </TouchableOpacity>

      <Text style={styles.title}>ID Verification</Text>
      <Text style={styles.subtitle}>Upload a clear photo of your government-issued ID</Text>
      
      {idImage ? (
        <Image source={{ uri: idImage }} style={styles.idImage} />
      ) : (
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.selfieButton} onPress={pickIdImage}>
            <Text style={styles.selfieButtonText}>📷 Take ID Photo</Text>
          </TouchableOpacity>
        </View>
      )}
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.continueButton, loading && styles.disabledButton]} 
          onPress={handleSubmit} 
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.continueButtonText}>Submit Verification</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 1,
    padding: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  idImage: {
    width: 240,
    height: 160,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  buttonContainer: {
    width: '75%',
    marginBottom: 30,
    alignSelf: 'center',
    marginTop: 20,
    paddingHorizontal: 20,
  },
  selfieButton: {
    backgroundColor: '#F59E0B',
    paddingVertical: 18,
    borderRadius: 15,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#E67E22',
  },
  selfieButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  continueButton: {
    backgroundColor: '#F59E0B',
    paddingVertical: 18,
    borderRadius: 15,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#E67E22',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#FFD7A0',
    shadowOpacity: 0.1,
    borderColor: '#FFE4B3',
    opacity: 0.7,
  },
});

export default IDVerificationScreen; 