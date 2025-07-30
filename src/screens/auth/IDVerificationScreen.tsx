import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import verificationService from '../../services/verificationService';

const IDVerificationScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { firstName, lastName, age, phone } = route.params;
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
        first_name: firstName,
        last_name: lastName,
        age,
        phone,
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
      <Text style={styles.title}>ID Verification</Text>
      <Text style={styles.subtitle}>Upload a clear photo of your government-issued ID</Text>
      {idImage ? (
        <Image source={{ uri: idImage }} style={styles.idImage} />
      ) : (
        <TouchableOpacity style={styles.uploadButton} onPress={pickIdImage}>
          <Text style={styles.uploadButtonText}>Take ID Photo</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Submit</Text>}
      </TouchableOpacity>
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
  uploadButton: {
    backgroundColor: '#F59E0B',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    marginBottom: 24,
  },
  uploadButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  button: {
    backgroundColor: '#10B981',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
});

export default IDVerificationScreen; 