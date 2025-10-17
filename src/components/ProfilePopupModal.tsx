import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

interface ProfileData {
  id: string;
  name: string;
  profile_image?: string;
  phone?: string;
  address?: string;
  rating?: number;
  role: 'pet_sitter' | 'pet_owner';
}

interface ProfilePopupModalProps {
  visible: boolean;
  onClose: () => void;
  profileData: ProfileData | null;
  userRole: 'pet_sitter' | 'pet_owner';
}

const ProfilePopupModal: React.FC<ProfilePopupModalProps> = ({
  visible,
  onClose,
  profileData,
  userRole
}) => {
  console.log('🔍 ProfilePopupModal render:', { visible, profileData, userRole });
  
  if (!profileData) {
    console.log('🔍 ProfilePopupModal: No profile data, returning null');
    return null;
  }

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Ionicons key={i} name="star" size={16} color="#FFD700" />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <Ionicons key="half" name="star-half" size={16} color="#FFD700" />
      );
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Ionicons key={`empty-${i}`} name="star-outline" size={16} color="#FFD700" />
      );
    }

    return stars;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Profile</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Profile Image and Basic Info */}
            <View style={styles.profileSection}>
              <Image
                source={
                  profileData.profile_image
                    ? { uri: profileData.profile_image }
                    : require('../assets/images/default-avatar.png')
                }
                style={styles.profileImage}
              />
              <Text style={styles.name}>{profileData.name}</Text>
              <Text style={styles.role}>
                {profileData.role === 'pet_sitter' ? 'Pet Sitter' : 'Pet Owner'}
              </Text>
            </View>

            {/* Contact Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Contact Information</Text>
              
              <View style={styles.infoRow}>
                <Ionicons name="call" size={20} color="#8B5CF6" />
                <Text style={styles.infoText}>09639283365</Text>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="location" size={20} color="#8B5CF6" />
                <Text style={styles.infoText}>Dagupan, Pangasinan</Text>
              </View>
            </View>

            {/* Ratings (for sitters) */}
            {profileData.role === 'pet_sitter' && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Rating</Text>
                <View style={styles.ratingContainer}>
                  <View style={styles.starsContainer}>
                    {renderStars(4.5)}
                  </View>
                  <Text style={styles.ratingText}>
                    4.5/5.0
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>
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
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  role: {
    fontSize: 16,
    color: '#6B7280',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    marginLeft: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
  },
});

export default ProfilePopupModal;
