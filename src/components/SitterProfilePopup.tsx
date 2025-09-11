import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    Image,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { RealtimeSitter } from '../services/realtimeLocationService';

interface SitterProfilePopupProps {
  sitter: RealtimeSitter | null;
  visible: boolean;
  onClose: () => void;
  onFollow: (sitterId: string) => void;
  onMessage: (sitterId: string) => void;
  onViewBadges: (sitterId: string) => void;
  onViewCertificates: (sitterId: string) => void;
}

const SitterProfilePopup: React.FC<SitterProfilePopupProps> = ({
  sitter = null,
  visible,
  onClose,
  onFollow,
  onMessage,
  onViewBadges,
  onViewCertificates,
}) => {
  const router = useRouter();
  if (!sitter) return null;

  // Debug sitter data
  console.log('🔍 Popup - Sitter data:', {
    name: sitter.name,
    location: sitter.location,
    address: sitter.location?.address,
    hasLocation: !!sitter.location,
    allKeys: Object.keys(sitter)
  });

  // Helper function to get proper image source (same as in FindSitterMapScreen)
  const getImageSource = (sitter: any) => {
    const imageSource = sitter.imageSource || sitter.images?.[0] || sitter.profileImage;
    
    console.log(`🖼️ Popup - Getting image source for ${sitter.name}:`, {
      imageSource,
      type: typeof imageSource,
      isString: typeof imageSource === 'string',
      isUrl: typeof imageSource === 'string' && (imageSource.startsWith('http') || imageSource.startsWith('https'))
    });
    
    if (!imageSource) {
      console.log('📷 Popup - No image source found, using default avatar');
      return require('../assets/images/default-avatar.png');
    }
    
    // If it's a URL (starts with http), use it directly
    if (typeof imageSource === 'string' && (imageSource.startsWith('http') || imageSource.startsWith('https'))) {
      console.log('🌐 Popup - Using URL image:', imageSource);
      return { uri: imageSource };
    }
    
    // If it's already a require() object, use it directly
    if (typeof imageSource === 'object' && imageSource.uri !== undefined) {
      console.log('✅ Popup - Using existing URI object');
      return imageSource;
    }
    
    // For any other string (local paths), treat as URI
    if (typeof imageSource === 'string') {
      console.log('📁 Popup - Using string as URI:', imageSource);
      return { uri: imageSource };
    }
    
    // If it's already a require() object, use it directly
    console.log('✅ Popup - Using existing image object');
    return imageSource;
  };

  const formatSpecialties = (specialties: string[]) => {
    if (!specialties || specialties.length === 0) return 'General Pet Care';
    return specialties.join(', ');
  };

  const formatPetTypes = (petTypes: ('dogs' | 'cats')[]) => {
    return petTypes.map(type => type.charAt(0).toUpperCase() + type.slice(1)).join(' & ');
  };

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
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>

          {/* Profile Card */}
          <View style={styles.profileCard}>
            {/* Top Section - User Info */}
            <View style={styles.userInfoSection}>
              <View style={styles.avatarContainer}>
                <Image
                  source={getImageSource(sitter)}
                  style={styles.avatar}
                />
              </View>
              <View style={styles.userDetails}>
                <Text style={styles.userName}>{sitter.name}</Text>
                <Text style={styles.userLocation}>
                  📍 {sitter.location?.address || 'Location not available'}
                </Text>
                <View style={styles.ratingContainer}>
                  <Text style={styles.reviewsText}>{sitter.reviews} reviews</Text>
                </View>
              </View>
            </View>

            {/* Followers/Following Section */}
            <View style={styles.followSection}>
              <View style={styles.followItem}>
                <Text style={styles.followNumber}>{sitter.followers || 0}</Text>
                <Text style={styles.followLabel}>Followers</Text>
              </View>
              <View style={styles.followDivider} />
              <View style={styles.followItem}>
                <Text style={styles.followNumber}>{sitter.following || 0}</Text>
                <Text style={styles.followLabel}>Following</Text>
              </View>
            </View>

            {/* Middle Section - Credentials */}
            <View style={styles.credentialsSection}>
              <TouchableOpacity 
                style={styles.credentialButton}
                onPress={() => onViewBadges(sitter.id)}
              >
                <Ionicons name="ribbon" size={20} color="#fff" />
                <Text style={styles.credentialText}>View Badges</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.credentialButton}
                onPress={() => onViewCertificates(sitter.id)}
              >
                <Ionicons name="medal" size={20} color="#fff" />
                <Text style={styles.credentialText}>View Certificates</Text>
              </TouchableOpacity>
            </View>

            {/* Bottom Section - Action Buttons */}
            <View style={styles.actionsSection}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => onFollow(sitter.id)}
              >
                <Ionicons name="person-add" size={20} color="#fff" />
                <Text style={styles.actionText}>Follow</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => {
                  onClose();
                  router.push({
                    pathname: '/booking',
                    params: {
                      sitterId: sitter.id,
                      sitterName: sitter.name,
                      sitterRate: (sitter.hourlyRate || 25).toString(),
                      sitterImage: sitter.imageSource || sitter.images?.[0] || sitter.profileImage
                    }
                  });
                }}
              >
                <Ionicons name="calendar" size={20} color="#fff" />
                <Text style={styles.actionText}>Book Now</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Additional Info Card */}
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Pet Sitter Details</Text>
            
            {/* Experience */}
            <View style={styles.infoRow}>
              <Ionicons name="time" size={16} color="#F59E0B" />
              <Text style={styles.infoLabel}>Years of Experience:</Text>
              <Text style={styles.infoValue}>{sitter.experience}</Text>
            </View>

            {/* Specialties */}
            <View style={styles.infoRow}>
              <Ionicons name="star" size={16} color="#F59E0B" />
              <Text style={styles.infoLabel}>Specialties:</Text>
              <Text style={styles.infoValue}>{formatSpecialties(sitter.specialties || [])}</Text>
            </View>

            {/* Pet Types */}
            <View style={styles.infoRow}>
              <Ionicons name="paw" size={16} color="#F59E0B" />
              <Text style={styles.infoLabel}>Pet Types:</Text>
              <Text style={styles.infoValue}>{formatPetTypes(sitter.petTypes)}</Text>
            </View>

            {/* Breeds */}
            <View style={styles.infoRow}>
              <Ionicons name="heart" size={16} color="#F59E0B" />
              <Text style={styles.infoLabel}>Breeds:</Text>
              <Text style={styles.infoValue}>
                {sitter.selectedBreeds?.join(', ') || 'All breeds welcome'}
              </Text>
            </View>

            {/* Hourly Rate */}
            <View style={styles.infoRow}>
              <Ionicons name="cash" size={16} color="#F59E0B" />
              <Text style={styles.infoLabel}>Rate:</Text>
              <Text style={styles.infoValue}>₱{sitter.hourlyRate}/hour</Text>
            </View>

            {/* Bio */}
            <View style={styles.bioContainer}>
              <Text style={styles.bioText}>{sitter.bio}</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  popupContainer: {
    width: '100%',
    maxWidth: 400,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: '#F59E0B',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  profileCard: {
    backgroundColor: '#F59E0B',
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 15,
  },
  userInfoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 15,
  },
  avatarContainer: {
    marginRight: 15,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  userLocation: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 4,
  },
  reviewsText: {
    fontSize: 12,
    color: '#fff',
    marginLeft: 4,
  },
  credentialsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
  },
  credentialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
  },
  credentialText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 6,
  },
  actionsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 6,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
    width: 80,
  },
  infoValue: {
    fontSize: 14,
    color: '#666',
    flex: 1,
    marginLeft: 8,
  },
  bioContainer: {
    marginTop: 10,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  bioText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  followSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
  },
  followItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  followNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  followLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '400',
  },
  followDivider: {
    width: 1,
    height: 25,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 10,
  },
});

export default SitterProfilePopup;
