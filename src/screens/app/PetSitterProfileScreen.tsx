import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
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
import CertificateAlbum from '../../components/CertificateAlbum';

const PetSitterProfileScreen = () => {
  const router = useRouter();
  const { user, logout, updateUserProfile, currentLocation, userAddress, startLocationTracking } = useAuth();
  
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
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
  const [profileImage, setProfileImage] = useState<string | null>(user?.profileImage || null);
  const [imageError, setImageError] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [certificateAlbumVisible, setCertificateAlbumVisible] = useState(false);
  const [certificates, setCertificates] = useState([
    // Sample certificates - in real app, these would come from API
    {
      id: '1',
      name: 'Pet First Aid Certification',
      image: 'https://via.placeholder.com/300x200/4CAF50/white?text=Pet+First+Aid',
      date: '2024-01-15',
      issuer: 'Pet Care Academy',
    },
    {
      id: '2',
      name: 'Dog Training Certificate',
      image: 'https://via.placeholder.com/300x200/2196F3/white?text=Dog+Training',
      date: '2024-02-20',
      issuer: 'Canine Training Institute',
    },
  ]);
  const [verifiedIDs, setVerifiedIDs] = useState([
    { type: 'umid', label: 'UMID (Unified Multi-Purpose ID)', icon: 'card', color: '#4CAF50', verified: false },
    { type: 'sss', label: 'SSS ID', icon: 'card', color: '#2196F3', verified: false },
    { type: 'gsis', label: 'GSIS ID', icon: 'card', color: '#9C27B0', verified: false },
    { type: 'philhealth', label: 'PhilHealth ID', icon: 'medical', color: '#00BCD4', verified: false },
    { type: 'passport', label: 'Philippine Passport', icon: 'airplane', color: '#FF9800', verified: false },
    { type: 'driver', label: "Driver's License (LTO)", icon: 'car', color: '#795548', verified: false },
  ]);

  // Auto-populate location field when userAddress is available
  useEffect(() => {
    if (userAddress) {
      console.log('📍 PetSitterProfileScreen: Auto-populating location field with:', userAddress);
      setProfile(prev => ({
        ...prev,
        location: userAddress
      }));
    }
  }, [userAddress]);

  // Start location tracking when user logs in
  useEffect(() => {
    if (user && !currentLocation) {
      console.log('📍 PetSitterProfileScreen: Starting location tracking for user');
      startLocationTracking(1000);
    }
  }, [user, currentLocation, startLocationTracking]);

  // Update profile data when user changes
  useEffect(() => {
    if (user) {
      console.log('📱 PetSitterProfileScreen: Updating profile data from user:', user);
      console.log('📱 PetSitterProfileScreen: user.hourlyRate:', user.hourlyRate);
      console.log('📱 PetSitterProfileScreen: user.experience:', user.experience);
      console.log('📱 PetSitterProfileScreen: user.role:', user.role);
      console.log('📱 PetSitterProfileScreen: user.userRole:', user.userRole);
      
      // Split name into firstName and lastName
      const nameParts = (user.name || '').split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const updatedProfile = {
        firstName: firstName,
        lastName: lastName,
        email: user.email || '',
        phone: user.phone || '',
        bio: user.aboutMe || '',
        hourlyRate: user.hourlyRate || '',
        location: userAddress || '', // Use only real-time location
        specialties: user.specialties || [],
        experience: user.experience || '',
        rating: 0,
        reviews: 0,
      };
      
      console.log('📱 PetSitterProfileScreen: Updated profile object:', updatedProfile);
      console.log('📱 PetSitterProfileScreen: Profile hourlyRate:', updatedProfile.hourlyRate);
      
      setProfile(updatedProfile);
    } else {
      console.log('📱 PetSitterProfileScreen: No user data available');
    }
  }, [user, userAddress]);

  // Refresh user data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('📱 PetSitterProfileScreen: Screen focused, refreshing user data');
      console.log('📱 PetSitterProfileScreen: Current user:', user);
      console.log('📱 PetSitterProfileScreen: Current user hourlyRate:', user?.hourlyRate);
      
      // Force update profile data when screen comes into focus
      if (user) {
        // Split name into firstName and lastName
        const nameParts = (user.name || '').split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        const updatedProfile = {
          firstName: firstName,
          lastName: lastName,
          email: user.email || '',
          phone: user.phone || '',
          bio: user.aboutMe || '',
          hourlyRate: user.hourlyRate || '',
          location: user.address || '',
          specialties: user.specialties || [],
          experience: user.experience || '',
          rating: 0,
          reviews: 0,
        };
        
        console.log('📱 PetSitterProfileScreen: Force updating profile on focus:', updatedProfile);
        setProfile(updatedProfile);
      }
    }, [user])
  );

  const handleBack = () => {
    router.back();
  };

  const handleSave = async () => {
    try {
      // Combine firstName and lastName into full name
      const fullName = `${profile.firstName} ${profile.lastName}`.trim();
      
      // Update the user profile with the new data
      await updateUserProfile({
        name: fullName,
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
        phone: profile.phone,
        aboutMe: profile.bio,
        hourlyRate: profile.hourlyRate,
        address: profile.location,
        specialties: profile.specialties,
        experience: profile.experience,
      });
      
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleAddCertificate = (certificate: any) => {
    const newCertificate = {
      ...certificate,
      id: Date.now().toString(),
    };
    setCertificates([...certificates, newCertificate]);
    Alert.alert('Success', 'Certificate added successfully!');
  };

  const handleDeleteCertificate = (id: string) => {
    setCertificates(certificates.filter(cert => cert.id !== id));
    Alert.alert('Success', 'Certificate deleted successfully!');
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

  const pickProfileImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        allowsMultipleSelection: false,
        selectionLimit: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        setProfileImage(imageUri);
        setImageError(false);
        
        // Upload image to backend
        await uploadProfileImage(imageUri);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const uploadProfileImage = async (imageUri: string) => {
    try {
      setIsUploadingImage(true);
      setImageError(false);
      
      const formData = new FormData();
      formData.append('image', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'profile_image.jpg',
      } as any);

      const { makeApiCall } = await import('../../services/networkService');
      const response = await makeApiCall('/api/profile/upload-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user?.token || ''}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log('PetSitterProfileScreen: Upload successful:', result.profile_image);
        console.log('PetSitterProfileScreen: Backend response fields:');
        console.log('  - result.profile_image:', result.profile_image);
        console.log('  - result.full_url:', result.full_url);
        console.log('  - result.profile_image_url:', result.profile_image_url);
        
        // Use the full URL from backend response if available, otherwise generate it
        const fullImageUrl = result.full_url || result.profile_image_url || getFullImageUrl(result.profile_image);
        console.log('PetSitterProfileScreen: Using full URL from backend:', fullImageUrl);
        
        // Update local state immediately for instant display
        setProfileImage(fullImageUrl);
        setImageError(false);
        
        // Update the user context with storage path for persistence
        await updateUserProfile({ profileImage: result.profile_image });
        console.log('PetSitterProfileScreen: User context updated with storage path');
        
        Alert.alert('Success', 'Profile image updated successfully!');
      } else {
        setImageError(true);
        Alert.alert('Error', result.message || 'Failed to upload profile image');
      }
    } catch (error) {
      console.error('Error uploading profile image:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      Alert.alert('Error', `Failed to upload profile image: ${errorMessage}`);
      setImageError(true);
    } finally {
      setIsUploadingImage(false);
    }
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

  // Helper function to validate image URI
  const isValidImageUri = (uri: string | null): boolean => {
    if (!uri || uri.trim() === '') return false;
    // Check if it's a valid URL or local file path
    return uri.startsWith('http') || uri.startsWith('file://') || uri.startsWith('content://') || uri.startsWith('data:') || uri.startsWith('/storage/');
  };

  // Helper function to get full image URL
  const getFullImageUrl = (uri: string | null): string | null => {
    if (!uri) return null;
    if (uri.startsWith('http')) return uri;
    if (uri.startsWith('file://') || uri.startsWith('content://')) return uri;
    if (uri.startsWith('/storage/') || uri.includes('profile_images/')) {
      const { networkService } = require('../../services/networkService');
      return networkService.getImageUrl(uri.startsWith('/storage/') ? uri : `/storage/${uri}`);
    }
    return uri;
  };

  // Handle image load error
  const handleImageError = () => {
    setImageError(true);
  };

  // Handle image load success
  const handleImageLoad = () => {
    setImageError(false);
  };

  // Profile image persistence - sync when user data changes
  useEffect(() => {
    console.log('🔄 PetSitterProfileScreen: useEffect triggered for profile image sync');
    console.log('🔄 PetSitterProfileScreen: user.profileImage:', user?.profileImage);
    console.log('🔄 PetSitterProfileScreen: current profileImage state:', profileImage);
    
    // Don't sync during upload to prevent blinking
    if (isUploadingImage) {
      console.log('⏳ PetSitterProfileScreen: Skipping sync during upload');
      return;
    }
    
    if (user && user.profileImage && user.profileImage !== profileImage) {
      console.log('✅ PetSitterProfileScreen: Updating profile image from user data:', user.profileImage);
      // Convert storage path to full URL if needed
      const fullUrl = user.profileImage.startsWith('http') ? user.profileImage : getFullImageUrl(user.profileImage);
      console.log('✅ PetSitterProfileScreen: Converted to full URL:', fullUrl);
      setProfileImage(fullUrl);
      setImageError(false);
    } else if (!user?.profileImage && profileImage && !profileImage.startsWith('file://') && !profileImage.startsWith('content://')) {
      // Only clear if the current image is not a local file (camera/gallery pick)
      console.log('❌ PetSitterProfileScreen: User has no profile image, clearing local state');
      setProfileImage(null);
      setImageError(false);
    } else {
      console.log('🔄 PetSitterProfileScreen: Profile image already in sync');
    }
  }, [user?.profileImage, isUploadingImage]);

  // Also sync when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('🎯 PetSitterProfileScreen: useFocusEffect triggered');
      if (user && user.profileImage) {
        console.log('✅ PetSitterProfileScreen: Focus sync - updating profile image:', user.profileImage);
        setProfileImage(user.profileImage);
        setImageError(false);
      } else if (user && !user.profileImage) {
        console.log('❌ PetSitterProfileScreen: Focus sync - no profile image in user data');
        setProfileImage(null);
        setImageError(false);
      }
    }, [user?.profileImage])
  );

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
          <TouchableOpacity onPress={pickProfileImage} style={styles.profileImageContainer}>
            <Image 
              source={
                profileImage 
                  ? { uri: getFullImageUrl(profileImage) } 
                  : require('../../assets/images/default-avatar.png')
              } 
              style={styles.profileImage}
              onError={handleImageError}
              onLoad={handleImageLoad}
              defaultSource={require('../../assets/images/default-avatar.png')}
            />
            <View style={styles.imageEditOverlay}>
              <Ionicons name="camera" size={16} color="#fff" />
            </View>
          </TouchableOpacity>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{`${profile.firstName} ${profile.lastName}`.trim()}</Text>
            
            
            {/* Badge Row */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              {verifiedIDs.filter((id) => id.verified).map((id) => (
                <View key={id.type} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F5E9', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, marginRight: 8 }}>
                  <Ionicons name={id.icon as any} size={14} color={id.color} />
                  <Text style={{ color: id.color, fontWeight: 'bold', fontSize: 13, marginLeft: 4 }}>{id.label}</Text>
                </View>
              ))}
              {/* Show "Not Verified Yet" when no IDs are verified */}
              {verifiedIDs.filter((id) => id.verified).length === 0 && (
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF3E0', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, marginRight: 8, marginTop: 4, marginBottom: 4 }}>
                  <View style={{ backgroundColor: '#FF9800', borderRadius: 12, width: 24, height: 24, alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
                    <Ionicons name="alert-circle" size={16} color="#fff" />
                  </View>
                  <Text style={{ color: '#FF9800', fontWeight: 'bold', fontSize: 14 }}>Not Verified Yet</Text>
                </View>
              )}
            </View>
            <View style={styles.ratingContainer}>
              <Text style={styles.reviewsText}>({profile.reviews} reviews)</Text>
            </View>
          </View>
        </View>

        {/* Verify Your ID and Add Certificates Buttons */}
        <View style={styles.verificationButtonsContainer}>
          <TouchableOpacity 
            style={styles.verifyButton} 
            onPress={openVerifyModal}
            activeOpacity={0.8}
          >
            <View style={styles.verifyButtonContent}>
              <Ionicons name="shield-checkmark" size={16} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.verifyButtonText}>Verify Your ID</Text>
              <Ionicons name="chevron-forward" size={14} color="#fff" style={{ marginLeft: 6 }} />
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.certificatesButton} 
            onPress={() => setCertificateAlbumVisible(true)}
            activeOpacity={0.8}
          >
            <View style={styles.certificatesButtonContent}>
              <Ionicons name="ribbon" size={16} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.certificatesButtonText}>Add Certificates</Text>
              <Ionicons name="chevron-forward" size={14} color="#fff" style={{ marginLeft: 6 }} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{profile.experience}</Text>
            <Text style={styles.statLabel}>Years of Experience</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>₱{profile.hourlyRate || '0'}</Text>
            <Text style={styles.statLabel}>Per Hour</Text>
            {/* Debug info - remove this later */}
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
            <Text style={styles.inputLabel}>First Name</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.disabledInput]}
              value={profile.firstName}
              onChangeText={(text) => setProfile({...profile, firstName: text})}
              editable={isEditing}
              placeholder="Enter your first name"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Last Name </Text>
            <TextInput
              style={[styles.input, !isEditing && styles.disabledInput]}
              value={profile.lastName}
              onChangeText={(text) => setProfile({...profile, lastName: text})}
              editable={isEditing}
              placeholder="Enter your last name (required)"
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
            <View style={styles.locationInputHeader}>
              <Text style={styles.inputLabel}>Location</Text>
              {userAddress && (
                <View style={styles.autoLocationIndicator}>
                  <Ionicons name="location" size={14} color="#4CAF50" />
                  <Text style={styles.autoLocationText}>Auto-detected</Text>
                </View>
              )}
            </View>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={profile.location}
              editable={false}
              selectTextOnFocus={false}
              pointerEvents="none"
              placeholder={userAddress ? "Location auto-detected" : "Getting your location..."}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Hourly Rate (₱)</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.disabledInput]}
              value={profile.hourlyRate}
              onChangeText={(text) => setProfile({...profile, hourlyRate: text})}
              editable={isEditing}
              keyboardType="numeric"
            />
          </View>

        </View>

        {/* Experience Section */}
        <View style={[styles.section, { marginBottom: 20, paddingBottom: 15 }]}>
          <Text style={styles.sectionTitle}>Years of Experience</Text>
          <TextInput
            style={[styles.experienceInput, !isEditing && styles.disabledInput]}
            value={profile.experience}
            onChangeText={(text) => setProfile({...profile, experience: text})}
            editable={isEditing}
            placeholder="e.g., 3, 1.5, 0.5"
            keyboardType="numeric"
          />
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
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 32, width: '90%', maxWidth: 400 }}>
            <Text style={{ fontWeight: 'bold', fontSize: 24, marginBottom: 20, textAlign: 'center' }}>Verify Your ID</Text>
            <Text style={{ marginBottom: 16, fontSize: 16, color: '#666' }}>Select ID Type:</Text>
            {verifiedIDs.map((id) => (
              <TouchableOpacity key={id.type} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, paddingVertical: 8 }} onPress={() => setSelectedIDType(id.type)}>
                <Ionicons name={id.icon as any} size={24} color={id.color} />
                <Text style={{ marginLeft: 12, color: id.color, fontWeight: 'bold', fontSize: 18 }}>{id.label}</Text>
                {selectedIDType === id.type && <Ionicons name="checkmark" size={24} color="#4CAF50" style={{ marginLeft: 12 }} />}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={{ marginTop: 20, backgroundColor: '#F59E0B', borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12, alignSelf: 'center' }} onPress={pickImage}>
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{idImage ? 'Capture Again' : 'Open Camera to Capture'}</Text>
            </TouchableOpacity>
            {idImage && (
              <Image source={{ uri: idImage }} style={{ width: 160, height: 120, borderRadius: 12, marginTop: 16, alignSelf: 'center' }} />
            )}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 24, gap: 16 }}>
              <TouchableOpacity onPress={closeVerifyModal} style={{ flex: 1, backgroundColor: '#E0E0E0', borderRadius: 12, paddingVertical: 12, alignItems: 'center' }}>
                <Text style={{ color: '#666', fontWeight: 'bold', fontSize: 16 }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={submitVerification} disabled={!selectedIDType || !idImage} style={{ flex: 1, backgroundColor: (!selectedIDType || !idImage) ? '#F0F0F0' : '#4CAF50', borderRadius: 12, paddingVertical: 12, alignItems: 'center' }}>
                <Text style={{ color: (!selectedIDType || !idImage) ? '#aaa' : '#fff', fontWeight: 'bold', fontSize: 16 }}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Certificate Album Modal */}
      <CertificateAlbum
        visible={certificateAlbumVisible}
        onClose={() => setCertificateAlbumVisible(false)}
        certificates={certificates}
        onAddCertificate={handleAddCertificate}
        onDeleteCertificate={handleDeleteCertificate}
      />
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
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  locationInputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  autoLocationIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  autoLocationText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
    marginLeft: 4,
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
  experienceInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    backgroundColor: '#fff',
    height: 45,
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
  emptyText: {
    color: '#666',
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 10,
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
  verificationButtonsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 12,
    marginBottom: 12,
    gap: 12,
  },
  verifyButton: {
    flex: 1,
    backgroundColor: '#F59E0B',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  verifyButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  certificatesButton: {
    flex: 1,
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  certificatesButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  certificatesButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  profileImageContainer: {
    position: 'relative',
  },
  imageEditOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#F59E0B',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
});

export default PetSitterProfileScreen; 