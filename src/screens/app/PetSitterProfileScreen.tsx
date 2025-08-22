import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Alert,
    Image,
    Modal,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';

const PetSitterProfileScreen = () => {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    bio: '',
    hourlyRate: '',
    location: '',
    specialties: [] as string[],
    experience: '',
    rating: 0,
    reviews: 0,
  });
  const [verifyModalVisible, setVerifyModalVisible] = useState(false);
  const [selectedIDType, setSelectedIDType] = useState('');
  const [idImage, setIdImage] = useState<string | null>(null);
  const [verifiedIDs, setVerifiedIDs] = useState([
    { type: 'gov', label: 'Gov ID', icon: 'checkmark-circle', color: '#4CAF50', verified: true },
    { type: 'driver', label: "Driver's License", icon: 'car', color: '#2196F3', verified: false },
    { type: 'student', label: 'Student ID', icon: 'school', color: '#9C27B0', verified: false },
    { type: 'passport', label: 'Passport', icon: 'airplane', color: '#FF9800', verified: false },
  ]);

  // Update profile data when user changes
  useEffect(() => {
    if (user) {
      console.log('PetSitterProfileScreen: Loading user data from auth context:', user);
      setProfile({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        bio: user.aboutMe || '',
        hourlyRate: user.hourlyRate || '',
        location: user.address || '',
        specialties: user.specialties || [],
        experience: user.experience || '',
        rating: 0, // New user starts with 0 rating
        reviews: 0, // New user starts with 0 reviews
      });
    }
  }, [user]);

  const handleBack = () => {
    router.back();
  };

  const handleSave = () => {
    setIsEditing(false);
    Alert.alert('Success', 'Profile updated successfully!');
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset to original values if needed
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: () => router.replace('/auth') }
      ]
    );
  };

  const openVerifyModal = () => {
    setVerifyModalVisible(true);
  };

  const closeVerifyModal = () => {
    setVerifyModalVisible(false);
    setSelectedIDType('');
    setIdImage(null);
  };

  const pickImage = async () => {
    // Request camera permissions first
    const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
    
    if (cameraPermission.granted === false) {
      Alert.alert("Camera Permission Required", "Please allow camera access to take ID photos.");
      return;
    }

    try {
      // Force camera mode with explicit settings
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
        cameraType: ImagePicker.CameraType.back,
        allowsMultipleSelection: false,
        selectionLimit: 1,
        presentationStyle: Platform.OS === 'ios' ? ImagePicker.UIImagePickerPresentationStyle.FULL_SCREEN : undefined,
        videoQuality: ImagePicker.UIImagePickerControllerQualityType.High,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setIdImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Camera Error', 'Failed to open camera. Please try again.');
    }
  };

  const submitVerification = () => {
    // Mock admin approval: set verified true for selectedIDType
    setVerifiedIDs((prev) =>
      prev.map((id) =>
        id.type === selectedIDType ? { ...id, verified: true } : id
      )
    );
    closeVerifyModal();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#FF4444" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <Image source={require('../../assets/images/default-avatar.png')} style={styles.profileImage} />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{profile.name}</Text>
            {/* Badge Row */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              {verifiedIDs.filter((id) => id.verified).map((id) => (
                <View key={id.type} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F5E9', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, marginRight: 8 }}>
                  <Ionicons name={id.icon as any} size={14} color={id.color} />
                  <Text style={{ color: id.color, fontWeight: 'bold', fontSize: 13, marginLeft: 4 }}>{id.label}</Text>
                </View>
              ))}
            </View>
            <View style={styles.ratingContainer}>
              <Text style={styles.reviewsText}>({profile.reviews} reviews)</Text>
            </View>
            <Text style={styles.locationText}>📍 {profile.location}</Text>
          </View>
        </View>

        {/* Verify Your ID Button */}
        <TouchableOpacity style={{ marginTop: 8, alignSelf: 'flex-start', backgroundColor: '#F59E0B', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 7 }} onPress={openVerifyModal}>
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>Verify Your ID</Text>
        </TouchableOpacity>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{profile.experience}</Text>
            <Text style={styles.statLabel}>Experience</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>${profile.hourlyRate}</Text>
            <Text style={styles.statLabel}>Per Hour</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{profile.specialties.length}</Text>
            <Text style={styles.statLabel}>Specialties</Text>
          </View>
        </View>

        {/* Edit/Save Buttons */}
        <View style={styles.actionButtons}>
          {isEditing ? (
            <View style={styles.editButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Profile Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.disabledInput]}
              value={profile.name}
              onChangeText={(text) => setProfile({...profile, name: text})}
              editable={isEditing}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.disabledInput]}
              value={profile.email}
              onChangeText={(text) => setProfile({...profile, email: text})}
              editable={isEditing}
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Phone</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.disabledInput]}
              value={profile.phone}
              onChangeText={(text) => setProfile({...profile, phone: text})}
              editable={isEditing}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Location</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.disabledInput]}
              value={profile.location}
              onChangeText={(text) => setProfile({...profile, location: text})}
              editable={isEditing}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Hourly Rate ($)</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.disabledInput]}
              value={profile.hourlyRate}
              onChangeText={(text) => setProfile({...profile, hourlyRate: text})}
              editable={isEditing}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Bio */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About Me</Text>
          <TextInput
            style={[styles.bioInput, !isEditing && styles.disabledInput]}
            value={profile.bio}
            onChangeText={(text) => setProfile({...profile, bio: text})}
            editable={isEditing}
            multiline
            numberOfLines={4}
            placeholder="Tell pet owners about yourself..."
          />
        </View>

        {/* Specialties */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Specialties</Text>
          <View style={styles.specialtiesContainer}>
            {profile.specialties.map((specialty, index) => (
              <View key={index} style={styles.specialtyChip}>
                <Text style={styles.specialtyText}>{specialty}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <TouchableOpacity style={styles.actionItem} onPress={() => router.push('/pet-sitter-availability')}>
            <Ionicons name="calendar-outline" size={24} color="#F59E0B" />
            <Text style={styles.actionText}>Set Availability</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionItem} onPress={() => router.push('/pet-sitter-requests')}>
            <Ionicons name="mail-outline" size={24} color="#4CAF50" />
            <Text style={styles.actionText}>View Requests</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionItem} onPress={() => router.push('/pet-sitter-schedule')}>
            <Ionicons name="time-outline" size={24} color="#3B82F6" />
            <Text style={styles.actionText}>My Schedule</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal for ID Verification */}
      <Modal visible={verifyModalVisible} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '85%' }}>
            <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 12 }}>Verify Your ID</Text>
            <Text style={{ marginBottom: 8 }}>Select ID Type:</Text>
            {verifiedIDs.map((id) => (
              <TouchableOpacity key={id.type} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }} onPress={() => setSelectedIDType(id.type)}>
                <Ionicons name={id.icon as any} size={18} color={id.color} />
                <Text style={{ marginLeft: 8, color: id.color, fontWeight: 'bold', fontSize: 15 }}>{id.label}</Text>
                {selectedIDType === id.type && <Ionicons name="checkmark" size={18} color="#4CAF50" style={{ marginLeft: 8 }} />}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={{ marginTop: 12, backgroundColor: '#F59E0B', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 7, alignSelf: 'flex-start' }} onPress={pickImage}>
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>{idImage ? 'Capture Again' : 'Open Camera to Capture'}</Text>
            </TouchableOpacity>
            {idImage && (
              <Image source={{ uri: idImage }} style={{ width: 120, height: 80, borderRadius: 8, marginTop: 10, alignSelf: 'center' }} />
            )}
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 18 }}>
              <TouchableOpacity onPress={closeVerifyModal} style={{ marginRight: 16 }}>
                <Text style={{ color: '#888', fontWeight: 'bold', fontSize: 15 }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={submitVerification} disabled={!selectedIDType || !idImage} style={{ backgroundColor: (!selectedIDType || !idImage) ? '#F0F0F0' : '#4CAF50', borderRadius: 8, paddingHorizontal: 18, paddingVertical: 8 }}>
                <Text style={{ color: (!selectedIDType || !idImage) ? '#aaa' : '#fff', fontWeight: 'bold', fontSize: 15 }}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  logoutButton: {
    padding: 5,
  },
  content: {
    flex: 1,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 15,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  reviewsText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 5,
  },
  locationText: {
    fontSize: 14,
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 20,
    marginBottom: 10,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F59E0B',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  actionButtons: {
    padding: 20,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  editButton: {
    backgroundColor: '#F59E0B',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  editButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#E0E0E0',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  inputGroup: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  disabledInput: {
    backgroundColor: '#F8F9FA',
    color: '#666',
  },
  bioInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#fff',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  specialtiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  specialtyChip: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginRight: 8,
    marginBottom: 8,
  },
  specialtyText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  actionText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 15,
  },
});

export default PetSitterProfileScreen; 