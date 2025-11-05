import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { RealtimeSitter } from '../services/realtimeLocationService';

interface SimpleSitterProfilePopupProps {
  sitter: RealtimeSitter | null;
  visible: boolean;
  onClose: () => void;
}

const SimpleSitterProfilePopup: React.FC<SimpleSitterProfilePopupProps> = ({
  sitter = null,
  visible,
  onClose,
}) => {
  const router = useRouter();
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const currentImageSource = useRef<any>(null);

  // Get image source
  const getImageSource = () => {
    if (!sitter) return require('../assets/images/default-avatar.png');
    
    if (sitter.profileImage) {
      if (typeof sitter.profileImage === 'string') {
        if (sitter.profileImage.startsWith('http://') || sitter.profileImage.startsWith('https://')) {
          currentImageSource.current = { uri: sitter.profileImage };
          return currentImageSource.current;
        }
        // Try to construct full URL using network service
        const { networkService } = require('../services/networkService');
        const fullUrl = networkService.getImageUrl(`/storage/${sitter.profileImage}`);
        currentImageSource.current = { uri: fullUrl };
        return currentImageSource.current;
      }
    }
    
    if (sitter.imageSource) {
      if (typeof sitter.imageSource === 'string') {
        if (sitter.imageSource.startsWith('http://') || sitter.imageSource.startsWith('https://')) {
          currentImageSource.current = { uri: sitter.imageSource };
          return currentImageSource.current;
        }
        const { networkService } = require('../services/networkService');
        const fullUrl = networkService.getImageUrl(`/storage/${sitter.imageSource}`);
        currentImageSource.current = { uri: fullUrl };
        return currentImageSource.current;
      }
    }
    
    if (sitter.images && sitter.images.length > 0) {
      const firstImage = sitter.images[0];
      if (typeof firstImage === 'string') {
        if (firstImage.startsWith('http://') || firstImage.startsWith('https://')) {
          currentImageSource.current = { uri: firstImage };
          return currentImageSource.current;
        }
        const { networkService } = require('../services/networkService');
        const fullUrl = networkService.getImageUrl(`/storage/${firstImage}`);
        currentImageSource.current = { uri: fullUrl };
        return currentImageSource.current;
      }
    }
    
    return require('../assets/images/default-avatar.png');
  };

  useEffect(() => {
    if (visible && sitter) {
      setImageError(false);
      setImageLoading(true);
      currentImageSource.current = getImageSource();
    }
  }, [visible, sitter]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.popupContainer}>
          {/* Close button */}
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={20} color="#fff" />
          </TouchableOpacity>

          {/* Main Profile Card */}
          <View style={styles.profileCard}>
            {/* Profile Content */}
            <View style={styles.cardContent}>
              {/* Profile Avatar Section */}
              <View style={styles.avatarSection}>
                <View style={styles.avatarContainer}>
                  <Image
                    key={`simple-avatar-${sitter?.id}-${sitter?.profileImage || 'default'}`}
                    source={imageError || imageLoading ? require('../assets/images/default-avatar.png') : (currentImageSource.current || getImageSource())}
                    style={styles.avatar}
                    onError={(error) => {
                      setImageError(true);
                      setImageLoading(false);
                    }}
                    onLoad={() => {
                      setImageError(false);
                      setImageLoading(false);
                    }}
                    defaultSource={require('../assets/images/default-avatar.png')}
                    resizeMode="cover"
                    fadeDuration={0}
                  />
                </View>
              </View>
              
              {/* Name and Verification Section */}
              <View style={styles.nameSection}>
                <Text style={styles.userName}>
                  {sitter?.name || 'Loading...'}
                </Text>
                {sitter?.isVerified && (
                  <View style={styles.verifiedBadge}>
                    <View style={styles.verifiedIconContainer}>
                      <Ionicons name="checkmark" size={12} color="#fff" />
                    </View>
                    <Text style={styles.verifiedText}>Verified Sitter</Text>
                  </View>
                )}
                {sitter?.hourlyRate && (
                  <View style={styles.rateContainer}>
                    <Ionicons name="cash-outline" size={14} color="#666" />
                    <Text style={styles.rateText}>₱{sitter.hourlyRate}/hour</Text>
                  </View>
                )}
              </View>

              {/* Divider */}
              <View style={styles.divider} />

              {/* Book Now Button - Professional and prominent */}
              <TouchableOpacity 
                style={styles.bookButton}
                onPress={() => {
                  // Allow booking directly - no verification checks
                  onClose();
                  router.push({
                    pathname: '/booking',
                    params: {
                      sitterId: sitter?.id || '',
                      sitterName: sitter?.name || 'Pet Sitter',
                      sitterRate: (sitter?.hourlyRate || 25).toString(),
                      sitterImage: sitter?.imageSource || sitter?.images?.[0] || sitter?.profileImage
                    }
                  });
                }}
                activeOpacity={0.85}
              >
                <View style={styles.bookButtonGradient}>
                  <View style={styles.bookButtonContent}>
                    <Ionicons name="calendar-outline" size={18} color="#fff" />
                    <Text style={styles.bookButtonText}>Book Now</Text>
                    <Ionicons name="arrow-forward" size={16} color="#fff" />
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  popupContainer: {
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: -50,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6B7280',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 6,
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  cardContent: {
    padding: 32,
    alignItems: 'center',
  },
  avatarSection: {
    marginBottom: 24,
    alignItems: 'center',
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  nameSection: {
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  userName: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 8,
    gap: 5,
  },
  verifiedIconContainer: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
    letterSpacing: 0.1,
  },
  rateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  rateText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    letterSpacing: 0.1,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 24,
  },
  bookButton: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  bookButtonGradient: {
    backgroundColor: '#1F2937',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  bookButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  bookButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.8,
  },
});

export default SimpleSitterProfilePopup;

