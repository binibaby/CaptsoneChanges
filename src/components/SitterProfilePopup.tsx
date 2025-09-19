import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
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
  onMessage: (sitterId: string) => void;
  onViewBadges: (sitterId: string) => void;
  onViewCertificates: (sitterId: string) => void;
}

const SitterProfilePopup: React.FC<SitterProfilePopupProps> = ({
  sitter = null,
  visible,
  onClose,
  onMessage,
  onViewBadges,
  onViewCertificates,
}) => {
  const router = useRouter();
  const [imageError, setImageError] = useState(false);
  
  // Reset image error state when sitter changes
  useEffect(() => {
    setImageError(false);
    if (sitter) {
      console.log('🖼️ Popup - Sitter data received:', {
        id: sitter.id,
        name: sitter.name,
        profileImage: sitter.profileImage,
        imageSource: sitter.imageSource,
        images: sitter.images,
        petTypes: sitter.petTypes,
        selectedBreeds: sitter.selectedBreeds,
        allKeys: Object.keys(sitter)
      });
      console.log('🖼️ Popup - Raw sitter object:', JSON.stringify(sitter, null, 2));
    }
  }, [sitter?.id]);
  
  if (!sitter) {
    return null;
  }

  // Helper function to get proper image source (same as in FindSitterMapScreen)
  const getImageSource = (sitter: any) => {
    const imageSource = sitter.profileImage || sitter.imageSource || sitter.images?.[0];
    
    console.log('🖼️ Popup - getImageSource called for sitter:', sitter.name);
    console.log('🖼️ Popup - imageSource:', imageSource);
    console.log('🖼️ Popup - sitter keys:', Object.keys(sitter));
    
    if (!imageSource) {
      console.log('🖼️ Popup - No image source, using default avatar');
      return require('../assets/images/default-avatar.png');
    }
    
    // If it's a URL (starts with http), use it directly
    if (typeof imageSource === 'string' && (imageSource.startsWith('http') || imageSource.startsWith('https'))) {
      console.log('🖼️ Popup - Using HTTP URL:', imageSource);
      return { uri: imageSource };
    }
    
    // If it's a relative URL (starts with /storage/), convert to full URL
    if (typeof imageSource === 'string' && imageSource.startsWith('/storage/')) {
      const fullUrl = `http://172.20.10.2:8000${imageSource}`;
      console.log('🖼️ Popup - Converting storage URL to full URL:', fullUrl);
      return { uri: fullUrl };
    }
    
    // If it's already a require() object, use it directly
    if (typeof imageSource === 'object' && imageSource.uri !== undefined) {
      console.log('🖼️ Popup - Using object with URI:', imageSource);
      return imageSource;
    }
    
    // For any other string (local paths), treat as URI
    if (typeof imageSource === 'string') {
      console.log('🖼️ Popup - Using string as URI:', imageSource);
      return { uri: imageSource };
    }
    
    // If it's already a require() object, use it directly
    console.log('🖼️ Popup - Using require object:', imageSource);
    return imageSource;
  };

  const formatSpecialties = (specialties: string[]) => {
    if (!specialties || specialties.length === 0) return 'General Pet Care';
    return specialties.join(', ');
  };

  const formatPetTypes = (petTypes: ('dogs' | 'cats')[]) => {
    return petTypes.map(type => type.charAt(0).toUpperCase() + type.slice(1)).join(' & ');
  };

  // Breed mapping for converting IDs to readable names
  const breedMapping: { [key: string]: string } = {
    // Dog breeds
    'labrador': 'Labrador Retriever',
    'golden': 'Golden Retriever',
    'german-shepherd': 'German Shepherd',
    'bulldog': 'Bulldog',
    'beagle': 'Beagle',
    'poodle': 'Poodle',
    'rottweiler': 'Rottweiler',
    'yorkshire': 'Yorkshire Terrier',
    'boxer': 'Boxer',
    'dachshund': 'Dachshund',
    // Cat breeds
    'persian': 'Persian',
    'siamese': 'Siamese',
    'maine-coon': 'Maine Coon',
    'ragdoll': 'Ragdoll',
    'british-shorthair': 'British Shorthair',
    'abyssinian': 'Abyssinian',
    'russian-blue': 'Russian Blue',
    'bengal': 'Bengal',
    'sphynx': 'Sphynx',
    'scottish-fold': 'Scottish Fold',
  };

  const formatBreedNames = (breeds: string[]) => {
    return breeds.map(breed => {
      // If it's already a readable name, return it
      if (breedMapping[breed]) {
        return breedMapping[breed];
      }
      // If it's already a readable name (not an ID), return as is
      return breed;
    });
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
                  source={imageError ? require('../assets/images/default-avatar.png') : getImageSource(sitter)}
                  style={styles.avatar}
                  onError={(error) => {
                    console.log('❌ Popup - Image failed to load:', error.nativeEvent.error);
                    console.log('❌ Popup - Image source was:', getImageSource(sitter));
                    setImageError(true);
                  }}
                  onLoad={() => {
                    console.log('✅ Popup - Image loaded successfully');
                    setImageError(false);
                  }}
                  defaultSource={require('../assets/images/default-avatar.png')}
                  resizeMode="cover"
                />
              </View>
              <View style={styles.userDetails}>
                <Text style={styles.userName}>
                  {sitter.name || 'Enter Your Name'}
                </Text>
                <Text style={styles.userLocation}>
                  📍 {sitter.location?.address || `${sitter.location?.latitude?.toFixed(4)}, ${sitter.location?.longitude?.toFixed(4)}`}
                </Text>
                <View style={styles.ratingContainer}>
                  <Text style={styles.reviewsText}>{sitter.reviews} reviews</Text>
                </View>
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
              <Text style={styles.infoValue}>
                {(() => {
                  // Check multiple sources for pet types
                  const petTypes = sitter.petTypes || [];
                  console.log('🐾 Pet Types Debug:', { 
                    petTypes: sitter.petTypes, 
                    final: petTypes 
                  });
                  
                  if (petTypes && petTypes.length > 0) {
                    return formatPetTypes(petTypes);
                  }
                  return 'No pet types specified'; // Fallback
                })()}
              </Text>
            </View>

            {/* Breeds */}
            <View style={styles.infoRow}>
              <Ionicons name="heart" size={16} color="#F59E0B" />
              <Text style={styles.infoLabel}>Breeds:</Text>
              <Text style={styles.infoValue}>
                {(() => {
                  // Check multiple sources for breeds
                  const breeds = sitter.selectedBreeds || [];
                  console.log('🐕 Breeds Debug:', { 
                    selectedBreeds: sitter.selectedBreeds, 
                    final: breeds 
                  });
                  
                  if (breeds && breeds.length > 0) {
                    // Filter out empty strings and handle various data formats
                    const validBreeds = breeds.filter(breed => breed && breed.trim() !== '');
                    if (validBreeds.length > 0) {
                      const formattedBreeds = formatBreedNames(validBreeds);
                      return formattedBreeds.join(', ');
                    }
                  }
                  return 'No breeds specified'; // Fallback
                })()}
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
    position: 'relative',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
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
});

export default SitterProfilePopup;
