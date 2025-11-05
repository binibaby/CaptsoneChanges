import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';

interface Certificate {
  id: string;
  name: string;
  image: string;
  date: string;
  issuer: string;
}

interface AddButtonItem {
  id: string;
  isAddButton: boolean;
}

type CertificateItem = Certificate | AddButtonItem;

interface CertificateAlbumProps {
  visible: boolean;
  onClose: () => void;
  certificates: Certificate[];
  onAddCertificate: (certificate: Omit<Certificate, 'id'>) => void;
  onDeleteCertificate?: (certificateId: string) => void;
}

const CertificateAlbum: React.FC<CertificateAlbumProps> = ({
  visible,
  onClose,
  certificates,
  onAddCertificate,
  onDeleteCertificate,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const { user } = useAuth();

  // Helper function to get proper image source using network service
  const getImageSource = (imagePath: string) => {
    if (!imagePath) return { uri: 'https://via.placeholder.com/150' };
    
    // If it's a URL (starts with http), use it directly
    if (imagePath.startsWith('http')) {
      return { uri: imagePath };
    }
    
    // If it's a storage path (starts with /storage/), construct full URL using network service
    if (imagePath.startsWith('/storage/')) {
      const { networkService } = require('../services/networkService');
      const fullUrl = networkService.getImageUrl(imagePath);
      return { uri: fullUrl };
    }
    
    // For any other string, treat as URI
    return { uri: imagePath };
  };

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Camera permission is required to take certificate photos');
        return;
      }

      Alert.alert(
        'Select Certificate Image',
        'Choose how you want to add your certificate',
        [
          {
            text: 'Camera',
            onPress: () => openCamera(),
          },
          {
            text: 'Photo Library',
            onPress: () => openImageLibrary(),
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to open image picker');
    }
  };

  const openCamera = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        handleImageSelected(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const openImageLibrary = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        handleImageSelected(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const handleImageSelected = async (imageUri: string) => {
    Alert.prompt(
      'Certificate Name',
      'Enter the name of this certificate',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Add',
          onPress: async (name?: string) => {
            if (name && name.trim()) {
              try {
                // Upload image to server first
                const serverImageUrl = await uploadImageToServer(imageUri);
                
                const newCertificate: Omit<Certificate, 'id'> = {
                  name: name.trim(),
                  image: serverImageUrl,
                  date: new Date().toLocaleDateString(),
                  issuer: 'Self-Added',
                };
                onAddCertificate(newCertificate);
              } catch (error) {
                console.error('Error uploading certificate image:', error);
                Alert.alert('Error', 'Failed to upload certificate image. Please try again.');
              }
            }
          },
        },
      ],
      'plain-text',
      ''
    );
  };

  const uploadImageToServer = async (imageUri: string): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append('image', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'certificate_image.jpg',
      } as any);

      if (!user?.token) {
        throw new Error('No authentication token available');
      }

      const { makeApiCall } = await import('../services/networkService');
      const response = await makeApiCall('/api/profile/upload-certificate-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Certificate image uploaded successfully:', result.full_url);
        return result.full_url;
      } else {
        throw new Error(result.message || 'Upload failed');
      }
    } catch (error) {
      console.error('❌ Error uploading certificate image:', error);
      throw error;
    }
  };

  const handleDelete = (certificateId: string, certificateName: string) => {
    Alert.alert(
      'Delete Certificate',
      `Are you sure you want to delete "${certificateName}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            if (onDeleteCertificate) {
              onDeleteCertificate(certificateId);
            }
          },
        },
      ]
    );
  };

  const renderCertificate = ({ item }: { item: CertificateItem }) => {
    // Type guard to check if it's a Certificate
    if ('isAddButton' in item && item.isAddButton) {
      return renderAddButton();
    }
    
    const certificate = item as Certificate;
    return (
      <View style={styles.certificateItem}>
        <View style={styles.imageWrapper}>
          <Image source={getImageSource(certificate.image)} style={styles.certificateImage} />
          {onDeleteCertificate && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDelete(certificate.id, certificate.name)}
              activeOpacity={0.7}
            >
              <Ionicons name="trash" size={16} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.certificateInfo}>
          <Text style={styles.certificateName} numberOfLines={2}>
            {certificate.name}
          </Text>
          <Text style={styles.certificateIssuer}>{certificate.issuer}</Text>
          <Text style={styles.certificateDate}>{certificate.date}</Text>
        </View>
      </View>
    );
  };

  const renderAddButton = () => (
    <TouchableOpacity style={styles.addButton} onPress={pickImage}>
      <Ionicons name="add" size={16} color="#F59E0B" />
      <Text style={styles.addButtonText}>Add Certificate</Text>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Certificates</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          {certificates.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="medal-outline" size={80} color="#ccc" />
              <Text style={styles.emptyTitle}>No Certificates Yet</Text>
              <Text style={styles.emptySubtitle}>
                Add your pet care certificates to showcase your qualifications
              </Text>
              {renderAddButton()}
            </View>
          ) : (
            <FlatList
              data={[...certificates, { id: 'add', isAddButton: true }] as CertificateItem[]}
              renderItem={({ item }) => renderCertificate({ item })}
              keyExtractor={(item) => item.id}
              numColumns={2}
              contentContainerStyle={styles.grid}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  closeButton: {
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
  content: {
    flex: 1,
    padding: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  grid: {
    paddingBottom: 20,
  },
  certificateItem: {
    flex: 1,
    margin: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageWrapper: {
    position: 'relative',
    marginBottom: 8,
  },
  certificateImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  deleteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FF6B6B',
    borderRadius: 20,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 10,
  },
  certificateInfo: {
    marginTop: 8,
  },
  certificateName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  certificateIssuer: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  certificateDate: {
    fontSize: 12,
    color: '#999',
  },
  addButton: {
    width: 80,
    height: 80,
    margin: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#F59E0B',
    borderStyle: 'dashed',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#F59E0B',
    marginTop: 2,
    textAlign: 'center',
  },
});

export default CertificateAlbum;
