import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import CertificateViewer from './CertificateViewer';

interface Certificate {
  id: string;
  name: string;
  image: string;
  date: string;
  issuer: string;
}

interface CertificatePopupProps {
  visible: boolean;
  onClose: () => void;
  certificates: Certificate[];
  sitterName: string;
}

const CertificatePopup: React.FC<CertificatePopupProps> = ({
  visible,
  onClose,
  certificates,
  sitterName,
}) => {
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [imageErrors, setImageErrors] = useState<{ [key: string]: boolean }>({});

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

  // Debug logging
  console.log('🎯 CertificatePopup render:', {
    visible,
    certificatesLength: certificates.length,
    sitterName,
    certificates
  });

  const handleCertificatePress = (certificate: Certificate) => {
    setSelectedCertificate(certificate);
    setViewerVisible(true);
  };

  const handleCloseViewer = () => {
    setViewerVisible(false);
    setSelectedCertificate(null);
  };

  const handleImageError = (certificateId: string) => {
    setImageErrors(prev => ({
      ...prev,
      [certificateId]: true
    }));
  };

  const renderCertificate = ({ item }: { item: Certificate }) => {
    const hasImageError = imageErrors[item.id] || false;
    
    return (
      <TouchableOpacity
        style={styles.certificateItem}
        onPress={() => handleCertificatePress(item)}
        activeOpacity={0.8}
      >
        <View style={styles.imageContainer}>
          {!hasImageError ? (
            <Image 
              source={getImageSource(item.image)} 
              style={styles.certificateImage}
              onError={(error) => {
                console.log('❌ Certificate image error:', error.nativeEvent.error);
                console.log('❌ Image URI:', item.image);
                handleImageError(item.id);
              }}
              onLoad={() => {
                console.log('✅ Certificate image loaded:', item.name);
              }}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="document-outline" size={40} color="#9ca3af" />
              <Text style={styles.placeholderText}>Certificate Image</Text>
            </View>
          )}
          <View style={styles.viewOverlay}>
            <Ionicons name="eye" size={20} color="#fff" />
          </View>
        </View>
        <View style={styles.certificateInfo}>
          <Text style={styles.certificateName} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={styles.certificateIssuer}>{item.issuer}</Text>
          <Text style={styles.certificateDate}>{item.date}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="medal-outline" size={80} color="#ccc" />
      <Text style={styles.emptyTitle}>No Certificates</Text>
      <Text style={styles.emptyMessage}>
        This sitter hasn't uploaded any certificates yet.
      </Text>
    </View>
  );

  return (
    <>
      <Modal
        visible={true}
        transparent={false}
        animationType="slide"
        onRequestClose={onClose}
      >
        <View style={[styles.container, { backgroundColor: 'red' }]}>
          {/* Debug indicator */}
          <View style={{
            position: 'absolute',
            top: 50,
            left: 20,
            right: 20,
            backgroundColor: 'yellow',
            padding: 10,
            zIndex: 9999,
            borderRadius: 5
          }}>
            <Text style={{ color: 'black', fontSize: 16, fontWeight: 'bold' }}>
              DEBUG: Modal is visible - {certificates.length} certificates
            </Text>
          </View>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
              <View style={styles.headerInfo}>
                <Text style={styles.headerTitle}>{sitterName}'s Certificates</Text>
                <Text style={styles.certificateCount}>
                  {certificates.length} certificate{certificates.length !== 1 ? 's' : ''}
                </Text>
              </View>
              <View style={styles.placeholder} />
            </View>

            {/* Content */}
            <View style={styles.content}>
              {certificates.length === 0 ? (
                renderEmptyState()
              ) : (
                <FlatList
                  data={certificates}
                  renderItem={renderCertificate}
                  keyExtractor={(item) => item.id}
                  numColumns={2}
                  contentContainerStyle={styles.grid}
                  showsVerticalScrollIndicator={false}
                />
              )}
            </View>
          </View>
      </Modal>

      {/* Individual Certificate Viewer */}
      {selectedCertificate && (
        <CertificateViewer
          visible={viewerVisible}
          onClose={handleCloseViewer}
          certificates={[selectedCertificate]}
          sitterName={sitterName}
        />
      )}
    </>
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
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#F59E0B',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  closeButton: {
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  headerInfo: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
    textAlign: 'center',
  },
  certificateCount: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  placeholder: {
    width: 50,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  grid: {
    paddingBottom: 20,
  },
  certificateItem: {
    flex: 1,
    margin: 8,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    position: 'relative',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  certificateImage: {
    width: '100%',
    height: 140,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  imagePlaceholder: {
    width: '100%',
    height: 140,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 8,
    fontWeight: '500',
  },
  certificateInfo: {
    flex: 1,
  },
  certificateName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 6,
    lineHeight: 20,
  },
  certificateIssuer: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
    fontWeight: '500',
  },
  certificateDate: {
    fontSize: 13,
    color: '#9ca3af',
    fontWeight: '400',
  },
  viewOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 20,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 18,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 28,
    fontWeight: '400',
  },
});

export default CertificatePopup;
