import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
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
  const [imageLoading, setImageLoading] = useState(true);
  const [buttonPressed, setButtonPressed] = useState(false);
  const currentImageSource = useRef<any>(null);

  // Use real certificates from sitter object, fallback to empty array if none
  const sitterCertificates = sitter?.certificates || [];

  
  // Reset image error state when sitter changes
  useEffect(() => {
    setImageError(false);
    setImageLoading(true);
    
    // Set a timeout to prevent loading state from staying true indefinitely
    const timeout = setTimeout(() => {
      setImageLoading(false);
    }, 3000); // 3 second timeout
    
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
      
      // Additional debugging for image fields
      console.log('🖼️ Popup - Image field analysis:', {
        'sitter.profileImage': sitter.profileImage,
        'sitter.imageSource': sitter.imageSource,
        'sitter.images': sitter.images,
        'sitter.images?.[0]': sitter.images?.[0],
        'typeof profileImage': typeof sitter.profileImage,
        'typeof imageSource': typeof sitter.imageSource,
        'profileImage starts with http': sitter.profileImage?.startsWith('http'),
        'imageSource starts with http': sitter.imageSource?.startsWith('http'),
      });
    }
    
    return () => clearTimeout(timeout);
  }, [sitter?.id, sitter?.profileImage, sitter?.imageSource, sitter?.images]);

  // Stable image source calculation to prevent flickering
  const getImageSource = () => {
    if (!sitter) {
      currentImageSource.current = require('../assets/images/default-avatar.png');
      return currentImageSource.current;
    }
    
    // Priority order: profileImage > imageSource > images[0]
    const source = sitter.profileImage || sitter.imageSource || sitter.images?.[0];
    
    if (!source || source === null || source === undefined || source === '') {
      currentImageSource.current = require('../assets/images/default-avatar.png');
      return currentImageSource.current;
    }
    
    // If it's a URL (starts with http), use it directly
    if (typeof source === 'string' && (source.startsWith('http') || source.startsWith('https'))) {
      currentImageSource.current = { uri: source };
      return currentImageSource.current;
    }
    
    // If it's a relative URL (starts with /storage/), convert to full URL
    if (typeof source === 'string' && source.startsWith('/storage/')) {
      const { networkService } = require('../services/networkService');
      const fullUrl = networkService.getImageUrl(source);
      currentImageSource.current = { uri: fullUrl };
      return currentImageSource.current;
    }
    
    // If it's already a require() object, use it directly
    if (typeof source === 'object' && source.uri !== undefined) {
      currentImageSource.current = source;
      return currentImageSource.current;
    }
    
    // For any other string (local paths), treat as URI
    if (typeof source === 'string') {
      currentImageSource.current = { uri: source };
      return currentImageSource.current;
    }
    
    // Fallback to default avatar
    currentImageSource.current = require('../assets/images/default-avatar.png');
    return currentImageSource.current;
  };
  
  if (!sitter) {
    return null;
  }

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
    <>
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
                    key={`popup-avatar-${sitter?.id}-${sitter?.profileImage || 'default'}`}
                    source={imageError || imageLoading ? require('../assets/images/default-avatar.png') : (currentImageSource.current || getImageSource())}
                    style={styles.avatar}
                    onError={(error) => {
                      console.log('❌ Popup - Image failed to load:', error.nativeEvent.error);
                      console.log('❌ Popup - Failed image source:', currentImageSource.current);
                      setImageError(true);
                      setImageLoading(false);
                    }}
                    onLoad={() => {
                      console.log('✅ Popup - Image loaded successfully');
                      setImageError(false);
                      setImageLoading(false);
                    }}
                    defaultSource={require('../assets/images/default-avatar.png')}
                    resizeMode="cover"
                    fadeDuration={0}
                  />
                </View>
                <View style={styles.userDetails}>
                  <View style={styles.nameAndVerification}>
                    <Text style={styles.userName}>
                      {sitter?.name || 'Loading...'}
                    </Text>
                    {/* Verification Status Badge */}
                    {sitter?.isVerified ? (
                      <View style={styles.verifiedBadge}>
                        <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                        <Text style={styles.verifiedText}>Verified</Text>
                      </View>
                    ) : (
                      <View style={styles.unverifiedBadge}>
                        <Ionicons name="warning" size={16} color="#F59E0B" />
                        <Text style={styles.unverifiedText}>Not Verified</Text>
                      </View>
                    )}
                  </View>
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
                  activeOpacity={0.7}
                >
                  <Ionicons name="ribbon" size={16} color="#fff" />
                  <Text style={styles.credentialText}>View Badges</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[
                    styles.credentialButton,
                    sitterCertificates.length === 0 && styles.credentialButtonDisabled
                  ]}
                  onPress={() => {
                    console.log('🔍 Certificate button pressed!');
                    setButtonPressed(true);
                    console.log('🔍 sitterCertificates:', sitterCertificates);
                    console.log('🔍 sitterCertificates.length:', sitterCertificates.length);
                    
                    if (sitterCertificates.length > 0) {
                      console.log('✅ Navigating to certificate screen with certificates:', sitterCertificates);
                      // Close the popup first
                      onClose();
                      // Navigate to certificate screen
                      router.push({
                        pathname: '/sitter-certificates',
                        params: {
                          sitterName: sitter?.name || 'Pet Sitter',
                          certificates: JSON.stringify(sitterCertificates)
                        }
                      });
                    } else {
                      console.log('❌ No certificates available, showing alert');
                      // Show alert if no certificates available
                      Alert.alert(
                        'No Certificates',
                        'This sitter has not uploaded any certificates yet.',
                        [{ text: 'OK' }]
                      );
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons 
                    name="medal" 
                    size={16} 
                    color={sitterCertificates.length === 0 ? "#ccc" : "#fff"} 
                  />
                  <Text style={[
                    styles.credentialText,
                    sitterCertificates.length === 0 && styles.credentialTextDisabled
                  ]}>
                    View Certificates {sitterCertificates.length > 0 && `(${sitterCertificates.length})`}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Bottom Section - Action Buttons */}
              <View style={styles.actionsSection}>
                <TouchableOpacity 
                  style={styles.credentialButton}
                  onPress={() => {
                    // Check if sitter is verified before allowing messaging
                    if (!sitter.isVerified) {
                      Alert.alert(
                        '⚠️ Sitter Not Verified',
                        'This pet sitter has not completed ID verification yet. They cannot accept bookings or respond to messages until verified.',
                        [{ text: 'OK' }]
                      );
                      return;
                    }
                    onClose();
                    onMessage(sitter.id);
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="chatbubble-outline" size={16} color="#fff" />
                  <Text style={styles.credentialText}>Message</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.credentialButton}
                  onPress={() => {
                    // Check if sitter is verified before allowing booking
                    if (!sitter.isVerified) {
                      Alert.alert(
                        '⚠️ Sitter Not Verified',
                        'This pet sitter has not completed ID verification yet. They cannot accept bookings until verified.',
                        [{ text: 'OK' }]
                      );
                      return;
                    }
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
                  activeOpacity={0.7}
                >
                  <Ionicons name="calendar" size={16} color="#fff" />
                  <Text style={styles.credentialText}>Book Now</Text>
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

      
    </>
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
  nameAndVerification: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginRight: 8,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  verifiedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
    marginLeft: 4,
  },
  unverifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  unverifiedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F59E0B',
    marginLeft: 4,
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
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
    gap: 8,
  },
  credentialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 18,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    minWidth: 90,
    justifyContent: 'center',
  },
  credentialText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#fff',
    marginLeft: 4,
  },
  credentialButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  credentialTextDisabled: {
    color: '#ccc',
  },
  actionsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
    gap: 8,
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
