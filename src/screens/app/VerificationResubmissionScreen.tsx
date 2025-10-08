import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import verificationService from '../../services/verificationService';

const { width } = Dimensions.get('window');

interface DocumentType {
  type: string;
  name: string;
  description: string;
}

const VerificationResubmissionScreen: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedDocumentType, setSelectedDocumentType] = useState<string>('');
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [images, setImages] = useState({
    frontId: null as string | null,
    backId: null as string | null,
    selfie: null as string | null,
  });
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
    address: string;
  } | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');

  useEffect(() => {
    loadDocumentTypes();
    loadRejectionReason();
  }, []);

  const loadDocumentTypes = async () => {
    try {
      const response = await verificationService.getPhilippineIdTypes();
      if (response.success) {
        setDocumentTypes(response.philippine_ids);
      }
    } catch (error) {
      console.error('Error loading document types:', error);
    }
  };

  const loadRejectionReason = async () => {
    // This would typically come from the verification data
    // For now, we'll set a placeholder
    setRejectionReason('Document quality is insufficient for verification');
  };

  const pickImage = async (type: 'frontId' | 'backId' | 'selfie') => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: type === 'selfie' ? [1, 1] : [16, 10],
        quality: 0.8,
      });

      if (!result.canceled) {
        setImages(prev => ({
          ...prev,
          [type]: result.assets[0].uri,
        }));
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const takePhoto = async (type: 'frontId' | 'backId' | 'selfie') => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera permission is needed to take photos');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: type === 'selfie' ? [1, 1] : [16, 10],
        quality: 0.8,
      });

      if (!result.canceled) {
        setImages(prev => ({
          ...prev,
          [type]: result.assets[0].uri,
        }));
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Location permission is needed for verification');
        return;
      }

      setLoading(true);
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const [address] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      setLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        address: `${address.street || ''} ${address.city || ''} ${address.region || ''} ${address.country || ''}`.trim(),
      });
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get location');
    } finally {
      setLoading(false);
    }
  };

  const submitResubmission = async () => {
    if (!selectedDocumentType) {
      Alert.alert('Error', 'Please select a document type');
      return;
    }

    if (!images.frontId || !images.backId || !images.selfie) {
      Alert.alert('Error', 'Please provide all required images');
      return;
    }

    if (!location) {
      Alert.alert('Error', 'Please provide your location');
      return;
    }

    try {
      setLoading(true);
      
      const formData = new FormData();
      formData.append('document_type', selectedDocumentType);
      formData.append('front_id_image', {
        uri: images.frontId,
        type: 'image/jpeg',
        name: 'front_id.jpg',
      } as any);
      formData.append('back_id_image', {
        uri: images.backId,
        type: 'image/jpeg',
        name: 'back_id.jpg',
      } as any);
      formData.append('selfie_image', {
        uri: images.selfie,
        type: 'image/jpeg',
        name: 'selfie.jpg',
      } as any);
      formData.append('latitude', location.latitude.toString());
      formData.append('longitude', location.longitude.toString());
      formData.append('address', location.address);
      formData.append('is_resubmission', 'true');

      const response = await verificationService.submitEnhancedVerification(formData);
      
      if (response.success) {
        Alert.alert(
          'Resubmission Successful',
          'Your ID verification has been resubmitted for review. You will be notified once the admin reviews your documents.',
          [
            {
              text: 'OK',
              onPress: () => router.back(),
            },
          ]
        );
      } else {
        Alert.alert('Error', response.message || 'Failed to submit resubmission');
      }
    } catch (error) {
      console.error('Error submitting resubmission:', error);
      Alert.alert('Error', 'Failed to submit resubmission');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Select Document Type</Text>
      <Text style={styles.stepDescription}>
        Choose the type of Philippine ID you want to use for verification
      </Text>
      
      <ScrollView style={styles.documentTypesContainer}>
        {documentTypes.map((doc) => (
          <TouchableOpacity
            key={doc.type}
            style={[
              styles.documentTypeCard,
              selectedDocumentType === doc.type && styles.selectedDocumentTypeCard,
            ]}
            onPress={() => setSelectedDocumentType(doc.type)}
          >
            <Text style={[
              styles.documentTypeName,
              selectedDocumentType === doc.type && styles.selectedDocumentTypeName,
            ]}>
              {doc.name}
            </Text>
            <Text style={styles.documentTypeDescription}>
              {doc.description}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity
        style={[styles.nextButton, !selectedDocumentType && styles.disabledButton]}
        onPress={() => setStep(2)}
        disabled={!selectedDocumentType}
      >
        <Text style={styles.nextButtonText}>Next: Front ID</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Front ID Photo</Text>
      <Text style={styles.stepDescription}>
        Take a clear photo of the front of your {documentTypes.find(d => d.type === selectedDocumentType)?.name}
      </Text>
      
      <View style={styles.imageContainer}>
        {images.frontId ? (
          <Image source={{ uri: images.frontId }} style={styles.imagePreview} />
        ) : (
          <View style={styles.placeholderImage}>
            <Ionicons name="camera" size={50} color="#ccc" />
            <Text style={styles.placeholderText}>Front ID Photo</Text>
          </View>
        )}
      </View>

      <View style={styles.imageButtons}>
        <TouchableOpacity
          style={styles.imageButton}
          onPress={() => takePhoto('frontId')}
        >
          <Ionicons name="camera" size={20} color="#007AFF" />
          <Text style={styles.imageButtonText}>Take Photo</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.imageButton}
          onPress={() => pickImage('frontId')}
        >
          <Ionicons name="image" size={20} color="#007AFF" />
          <Text style={styles.imageButtonText}>Choose from Gallery</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.navigationButtons}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setStep(1)}
        >
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.nextButton, !images.frontId && styles.disabledButton]}
          onPress={() => setStep(3)}
          disabled={!images.frontId}
        >
          <Text style={styles.nextButtonText}>Next: Back ID</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Back ID Photo</Text>
      <Text style={styles.stepDescription}>
        Take a clear photo of the back of your {documentTypes.find(d => d.type === selectedDocumentType)?.name}
      </Text>
      
      <View style={styles.imageContainer}>
        {images.backId ? (
          <Image source={{ uri: images.backId }} style={styles.imagePreview} />
        ) : (
          <View style={styles.placeholderImage}>
            <Ionicons name="camera" size={50} color="#ccc" />
            <Text style={styles.placeholderText}>Back ID Photo</Text>
          </View>
        )}
      </View>

      <View style={styles.imageButtons}>
        <TouchableOpacity
          style={styles.imageButton}
          onPress={() => takePhoto('backId')}
        >
          <Ionicons name="camera" size={20} color="#007AFF" />
          <Text style={styles.imageButtonText}>Take Photo</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.imageButton}
          onPress={() => pickImage('backId')}
        >
          <Ionicons name="image" size={20} color="#007AFF" />
          <Text style={styles.imageButtonText}>Choose from Gallery</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.navigationButtons}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setStep(2)}
        >
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.nextButton, !images.backId && styles.disabledButton]}
          onPress={() => setStep(4)}
          disabled={!images.backId}
        >
          <Text style={styles.nextButtonText}>Next: Selfie</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Selfie Photo</Text>
      <Text style={styles.stepDescription}>
        Take a clear selfie photo for identity verification
      </Text>
      
      <View style={styles.imageContainer}>
        {images.selfie ? (
          <Image source={{ uri: images.selfie }} style={styles.selfiePreview} />
        ) : (
          <View style={styles.placeholderImage}>
            <Ionicons name="person" size={50} color="#ccc" />
            <Text style={styles.placeholderText}>Selfie Photo</Text>
          </View>
        )}
      </View>

      <View style={styles.imageButtons}>
        <TouchableOpacity
          style={styles.imageButton}
          onPress={() => takePhoto('selfie')}
        >
          <Ionicons name="camera" size={20} color="#007AFF" />
          <Text style={styles.imageButtonText}>Take Selfie</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.imageButton}
          onPress={() => pickImage('selfie')}
        >
          <Ionicons name="image" size={20} color="#007AFF" />
          <Text style={styles.imageButtonText}>Choose from Gallery</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.navigationButtons}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setStep(3)}
        >
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.nextButton, !images.selfie && styles.disabledButton]}
          onPress={() => setStep(5)}
          disabled={!images.selfie}
        >
          <Text style={styles.nextButtonText}>Next: Location</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStep5 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Location Verification</Text>
      <Text style={styles.stepDescription}>
        We need to verify your location for security purposes
      </Text>
      
      <View style={styles.locationContainer}>
        {location ? (
          <View style={styles.locationInfo}>
            <Ionicons name="location" size={24} color="#4CAF50" />
            <View style={styles.locationDetails}>
              <Text style={styles.locationAddress}>{location.address}</Text>
              <Text style={styles.locationCoordinates}>
                {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.locationPlaceholder}>
            <Ionicons name="location-outline" size={50} color="#ccc" />
            <Text style={styles.placeholderText}>Location not captured</Text>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={styles.locationButton}
        onPress={getCurrentLocation}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name="location" size={20} color="#fff" />
            <Text style={styles.locationButtonText}>
              {location ? 'Update Location' : 'Get Current Location'}
            </Text>
          </>
        )}
      </TouchableOpacity>

      <View style={styles.navigationButtons}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setStep(4)}
        >
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.nextButton, !location && styles.disabledButton]}
          onPress={() => setStep(6)}
          disabled={!location}
        >
          <Text style={styles.nextButtonText}>Next: Review</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStep6 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Review & Submit</Text>
      <Text style={styles.stepDescription}>
        Review your information before submitting for verification
      </Text>

      <View style={styles.reviewContainer}>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Document Type:</Text>
          <Text style={styles.reviewValue}>
            {documentTypes.find(d => d.type === selectedDocumentType)?.name}
          </Text>
        </View>

        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Front ID:</Text>
          <Text style={styles.reviewValue}>
            {images.frontId ? '✓ Provided' : '✗ Missing'}
          </Text>
        </View>

        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Back ID:</Text>
          <Text style={styles.reviewValue}>
            {images.backId ? '✓ Provided' : '✗ Missing'}
          </Text>
        </View>

        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Selfie:</Text>
          <Text style={styles.reviewValue}>
            {images.selfie ? '✓ Provided' : '✗ Missing'}
          </Text>
        </View>

        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Location:</Text>
          <Text style={styles.reviewValue}>
            {location ? '✓ Captured' : '✗ Missing'}
          </Text>
        </View>

        <View style={styles.rejectionReasonContainer}>
          <Text style={styles.rejectionReasonTitle}>Previous Rejection Reason:</Text>
          <Text style={styles.rejectionReasonText}>{rejectionReason}</Text>
        </View>
      </View>

      <View style={styles.navigationButtons}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setStep(5)}
        >
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.disabledButton]}
          onPress={submitResubmission}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Submit for Review</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Resubmit ID Verification</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(step / 6) * 100}%` }]} />
        </View>
        <Text style={styles.progressText}>Step {step} of 6</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
        {step === 5 && renderStep5()}
        {step === 6 && renderStep6()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
  },
  progressText: {
    textAlign: 'center',
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  stepContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
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
    marginBottom: 24,
    lineHeight: 24,
  },
  documentTypesContainer: {
    maxHeight: 300,
  },
  documentTypeCard: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  selectedDocumentTypeCard: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  documentTypeName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  selectedDocumentTypeName: {
    color: '#007AFF',
  },
  documentTypeDescription: {
    fontSize: 14,
    color: '#666',
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  imagePreview: {
    width: width - 80,
    height: 200,
    borderRadius: 8,
  },
  selfiePreview: {
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  placeholderImage: {
    width: width - 80,
    height: 200,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  placeholderText: {
    marginTop: 8,
    fontSize: 16,
    color: '#999',
  },
  imageButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  imageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  imageButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  locationContainer: {
    marginBottom: 20,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  locationDetails: {
    marginLeft: 12,
    flex: 1,
  },
  locationAddress: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  locationCoordinates: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  locationPlaceholder: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    marginBottom: 20,
  },
  locationButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  reviewContainer: {
    marginBottom: 24,
  },
  reviewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  reviewLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  reviewValue: {
    fontSize: 16,
    color: '#666',
  },
  rejectionReasonContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffeaa7',
  },
  rejectionReasonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 8,
  },
  rejectionReasonText: {
    fontSize: 14,
    color: '#856404',
    lineHeight: 20,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  backButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  nextButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  nextButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  submitButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
  },
  submitButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#ccc',
    borderColor: '#ccc',
  },
});

export default VerificationResubmissionScreen;
