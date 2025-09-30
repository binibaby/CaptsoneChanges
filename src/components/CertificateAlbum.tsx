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

interface Certificate {
  id: string;
  name: string;
  image: string;
  date: string;
  issuer: string;
}

interface CertificateAlbumProps {
  visible: boolean;
  onClose: () => void;
  certificates: Certificate[];
  onAddCertificate: (certificate: Omit<Certificate, 'id'>) => void;
  onDeleteCertificate: (id: string) => void;
}

const CertificateAlbum: React.FC<CertificateAlbumProps> = ({
  visible,
  onClose,
  certificates,
  onAddCertificate,
  onDeleteCertificate,
}) => {
  const [isAdding, setIsAdding] = useState(false);

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

  const handleImageSelected = (imageUri: string) => {
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
          onPress: (name) => {
            if (name && name.trim()) {
              const newCertificate: Omit<Certificate, 'id'> = {
                name: name.trim(),
                image: imageUri,
                date: new Date().toLocaleDateString(),
                issuer: 'Self-Added',
              };
              onAddCertificate(newCertificate);
            }
          },
        },
      ],
      'plain-text',
      ''
    );
  };

  const renderCertificate = ({ item }: { item: Certificate }) => (
    <View style={styles.certificateItem}>
      <Image source={{ uri: item.image }} style={styles.certificateImage} />
      <View style={styles.certificateInfo}>
        <Text style={styles.certificateName} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.certificateIssuer}>{item.issuer}</Text>
        <Text style={styles.certificateDate}>{item.date}</Text>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => {
          Alert.alert(
            'Delete Certificate',
            'Are you sure you want to delete this certificate?',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: () => onDeleteCertificate(item.id) },
            ]
          );
        }}
      >
        <Ionicons name="trash-outline" size={20} color="#ef4444" />
      </TouchableOpacity>
    </View>
  );

  const renderAddButton = () => (
    <TouchableOpacity style={styles.addButton} onPress={pickImage}>
      <Ionicons name="add" size={40} color="#F59E0B" />
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
              data={[...certificates, { id: 'add', isAddButton: true }]}
              renderItem={({ item }) => 
                item.isAddButton ? renderAddButton() : renderCertificate({ item })
              }
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
  certificateImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
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
  deleteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  addButton: {
    flex: 1,
    margin: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
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
    fontSize: 14,
    fontWeight: '600',
    color: '#F59E0B',
    marginTop: 8,
  },
});

export default CertificateAlbum;
