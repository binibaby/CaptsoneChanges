import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Dimensions,
    Image,
    Modal,
    ScrollView,
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

interface CertificateViewerProps {
  visible: boolean;
  onClose: () => void;
  certificates: Certificate[];
  sitterName: string;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const CertificateViewer: React.FC<CertificateViewerProps> = ({
  visible,
  onClose,
  certificates,
  sitterName,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Helper function to get proper image source using network service
  const getImageSource = (imagePath: string) => {
    if (!imagePath) return null;
    
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

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const goToNext = () => {
    if (currentIndex < certificates.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const currentCertificate = certificates[currentIndex];

  if (!visible) {
    return null;
  }

  if (certificates.length === 0) {
    return (
      <Modal visible={visible} animationType="fade" presentationStyle="fullScreen">
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.headerInfo}>
              <Text style={styles.sitterName}>{sitterName}'s Certificates</Text>
              <Text style={styles.certificateCount}>No certificates available</Text>
            </View>
            <View style={styles.placeholder} />
          </View>

          {/* Empty State */}
          <View style={styles.emptyContainer}>
            <Ionicons name="medal-outline" size={80} color="#ccc" />
            <Text style={styles.emptyTitle}>No Certificates</Text>
            <Text style={styles.emptyMessage}>
              This sitter hasn't uploaded any certificates yet.
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionContainer}>
            <TouchableOpacity style={styles.actionButton} onPress={onClose}>
              <Ionicons name="checkmark" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="fade" presentationStyle="fullScreen">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.sitterName}>{sitterName}'s Certificates</Text>
            <Text style={styles.certificateCount}>
              {currentIndex + 1} of {certificates.length}
            </Text>
          </View>
          <View style={styles.placeholder} />
        </View>

        {/* Certificate Display */}
        <View style={styles.certificateContainer}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <Image
              source={getImageSource(currentCertificate.image)}
              style={styles.certificateImage}
              resizeMode="contain"
            />
          </ScrollView>
        </View>

        {/* Certificate Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.certificateName}>{currentCertificate.name}</Text>
          <View style={styles.infoRow}>
            <Ionicons name="business-outline" size={16} color="#666" />
            <Text style={styles.infoText}>{currentCertificate.issuer}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={16} color="#666" />
            <Text style={styles.infoText}>{currentCertificate.date}</Text>
          </View>
        </View>

        {/* Navigation Controls */}
        {certificates.length > 1 && (
          <View style={styles.navigationContainer}>
            <TouchableOpacity
              style={[
                styles.navButton,
                currentIndex === 0 && styles.navButtonDisabled,
              ]}
              onPress={goToPrevious}
              disabled={currentIndex === 0}
            >
              <Ionicons
                name="chevron-back"
                size={24}
                color={currentIndex === 0 ? '#ccc' : '#F59E0B'}
              />
            </TouchableOpacity>

            <View style={styles.dotsContainer}>
              {certificates.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    index === currentIndex && styles.activeDot,
                  ]}
                />
              ))}
            </View>

            <TouchableOpacity
              style={[
                styles.navButton,
                currentIndex === certificates.length - 1 && styles.navButtonDisabled,
              ]}
              onPress={goToNext}
              disabled={currentIndex === certificates.length - 1}
            >
              <Ionicons
                name="chevron-forward"
                size={24}
                color={currentIndex === certificates.length - 1 ? '#ccc' : '#F59E0B'}
              />
            </TouchableOpacity>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={onClose}>
            <Ionicons name="checkmark" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  closeButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
  },
  headerInfo: {
    flex: 1,
    alignItems: 'center',
  },
  sitterName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  certificateCount: {
    fontSize: 14,
    color: '#ccc',
  },
  placeholder: {
    width: 40,
  },
  certificateContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  certificateImage: {
    width: screenWidth - 40,
    height: screenHeight * 0.6,
    borderRadius: 8,
  },
  infoContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  certificateName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 8,
  },
  navigationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
  },
  navButton: {
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  navButtonDisabled: {
    backgroundColor: '#f0f0f0',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ddd',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#F59E0B',
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  actionContainer: {
    padding: 20,
    backgroundColor: '#fff',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F59E0B',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#000',
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 20,
    marginBottom: 10,
  },
  emptyMessage: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default CertificateViewer;
