import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';

const ProfileScreen = () => {
  const { user, logout, updateUserProfile, refresh, isLoading, currentLocation, userAddress, startLocationTracking } = useAuth();
  const router = useRouter();
  
  console.log('ProfileScreen: Rendering with user:', user);
  console.log('ProfileScreen: User details:', {
    id: user?.id,
    name: user?.name,
    email: user?.email,
    role: user?.userRole,
    phone: user?.phone,
    address: user?.address,
    profileImage: user?.profileImage
  });
  
  const [profileImage, setProfileImage] = useState<string | null>(user?.profileImage || null);
  const [imageError, setImageError] = useState(false);
  const [justUploadedImage, setJustUploadedImage] = useState(false);
  
  console.log('ProfileScreen: Current profileImage state:', profileImage);
  console.log('ProfileScreen: Image error state:', imageError);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageRetryCount, setImageRetryCount] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [cooldownInfo, setCooldownInfo] = useState<any>(null);
  
  const [newSpecialty, setNewSpecialty] = useState('');
  const [requestData, setRequestData] = useState<{
    firstName: string;
    lastName: string;
    phone: string;
    hourlyRate: string;
    experience: string;
    reason: string;
  }>({
    firstName: '',
    lastName: '',
    phone: '',
    hourlyRate: '',
    experience: '',
    reason: '',
  });
  const [profileData, setProfileData] = useState<{
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    age: string;
    gender: string;
    address: string;
    experience?: string;
    hourlyRate?: string;
    specialties?: string[];
    petBreeds: string[];
  }>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    age: '',
    gender: '',
    address: '',
    petBreeds: [],
  });

  console.log('ProfileScreen: Current profileData:', profileData);

  // Helper function to validate image URI
  const isValidImageUri = (uri: string | null): boolean => {
    if (!uri || uri.trim() === '') return false;
    // Check if it's a valid URL or local file path
    return uri.startsWith('http') || 
           uri.startsWith('file://') || 
           uri.startsWith('content://') || 
           uri.startsWith('data:') || 
           uri.startsWith('/storage/') ||
           uri.includes('profile_images/');
  };

  // Helper function to get full image URL
  const getFullImageUrl = (uri: string | null): string | null => {
    console.log('🔗 getFullImageUrl called with:', uri);
    if (!uri) {
      console.log('🔗 getFullImageUrl: No URI provided');
      return null;
    }
    if (uri.startsWith('http')) {
      console.log('🔗 getFullImageUrl: Already HTTP URL:', uri);
      return uri;
    }
    if (uri.startsWith('file://') || uri.startsWith('content://')) {
      console.log('🔗 getFullImageUrl: Local URI:', uri);
      return uri; // Keep local URIs as-is
    }
    if (uri.startsWith('/storage/') || uri.includes('profile_images/')) {
      try {
        const { networkService } = require('../../services/networkService');
        // Ensure the path starts with /storage/ for proper URL generation
        const storagePath = uri.startsWith('/storage/') ? uri : `/storage/${uri}`;
        const fullUrl = networkService.getImageUrl(storagePath);
        console.log('🔗 ProfileScreen: Generated full URL via network service:', fullUrl);
        return fullUrl;
      } catch (error) {
        console.error('❌ ProfileScreen: Error getting image URL:', error);
        // Fallback to hardcoded URL if network service fails
        const storagePath = uri.startsWith('/storage/') ? uri : `/storage/${uri}`;
        const fallbackUrl = `http://192.168.100.192:8000${storagePath}`;
        console.log('🔗 ProfileScreen: Using fallback URL:', fallbackUrl);
        return fallbackUrl;
      }
    }
    console.log('🔗 getFullImageUrl: No processing needed, returning as-is:', uri);
    return uri;
  };

  // Force network detection on component mount
  React.useEffect(() => {
    const forceNetworkDetection = async () => {
      try {
        const { networkService } = require('../../services/networkService');
        console.log('🌐 ProfileScreen: Forcing network detection...');
        await networkService.detectWorkingIP();
        console.log('🌐 ProfileScreen: Network detection complete, base URL:', networkService.getBaseUrl());
      } catch (error) {
        console.error('❌ ProfileScreen: Network detection failed:', error);
      }
    };
    
    forceNetworkDetection();
  }, []);

  // Handle image load error
  const handleImageError = () => {
    console.log('❌ ProfileScreen: Image load failed, retry count:', imageRetryCount);
    if (imageRetryCount < 3) {
      setImageRetryCount(prev => prev + 1);
      setImageError(false);
      // Force re-render by updating the image source
      setTimeout(() => {
        setProfileImage(prev => prev);
      }, 1000);
    } else {
      setImageError(true);
    }
  };

  // Handle image load success
  const handleImageLoad = () => {
    setImageError(false);
    setImageRetryCount(0); // Reset retry count on successful load
  };

  // Sync profile image with user data
  useEffect(() => {
    console.log('🔍 ProfileScreen: useEffect triggered, user profileImage:', user?.profileImage);
    console.log('🔍 ProfileScreen: Current local profileImage state:', profileImage);
    console.log('🔍 ProfileScreen: Is uploading:', isUploadingImage);
    
    // Don't sync during upload or immediately after upload to prevent blinking
    if (isUploadingImage || justUploadedImage) {
      console.log('⏳ ProfileScreen: Skipping sync during upload or just after upload');
      return;
    }
    
    // Always sync with user data when it changes
    if (user?.profileImage && user.profileImage !== profileImage) {
      console.log('✅ ProfileScreen: Updating profile image from user data:', user.profileImage);
      // Convert storage path to full URL if needed
      const fullUrl = user.profileImage.startsWith('http') ? user.profileImage : getFullImageUrl(user.profileImage);
      console.log('✅ ProfileScreen: Converted to full URL:', fullUrl);
      setProfileImage(fullUrl);
      setImageError(false);
    } else if (!user?.profileImage && profileImage && !profileImage.startsWith('file://') && !profileImage.startsWith('content://')) {
      // Only clear if the current image is not a local file (camera/gallery pick)
      console.log('❌ ProfileScreen: User has no profile image, clearing local state');
      setProfileImage(null);
      setImageError(false);
    } else {
      console.log('🔄 ProfileScreen: Profile image already in sync');
    }
  }, [user?.profileImage, isUploadingImage, justUploadedImage]);

  // Show loading state while auth context is loading
  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>Loading profile...</Text>
      </View>
    );
  }

  // Auto-populate location field when userAddress is available
  React.useEffect(() => {
    if (userAddress) {
      console.log('📍 ProfileScreen: Auto-populating location field with:', userAddress);
      setProfileData(prev => ({
        ...prev,
        address: userAddress
      }));
    }
  }, [userAddress]);

  // Initialize request data when editing starts
  React.useEffect(() => {
    if (isEditing && user) {
      const userName = user.name || '';
      const nameParts = userName ? userName.split(' ') : [];
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      setRequestData({
        firstName,
        lastName,
        phone: user.phone || '',
        hourlyRate: user.hourlyRate || '',
        experience: user.experience || '',
        reason: '',
      });
    }
  }, [isEditing, user]);

  // Start location tracking when user logs in
  React.useEffect(() => {
    if (user && !currentLocation) {
      console.log('📍 ProfileScreen: Starting location tracking for user');
      startLocationTracking(1000);
    }
  }, [user, currentLocation, startLocationTracking]);

  // Check cooldown status when component loads
  React.useEffect(() => {
    if (user?.token) {
      checkCooldownStatus();
    }
  }, [user]);

  // Update profileData when user changes
  React.useEffect(() => {
    console.log('🚀 ProfileScreen: Main useEffect triggered with user:', user);
    console.log('🚀 ProfileScreen: Current profileImage state:', profileImage);
    if (user) {
      console.log('📱 Profile screen: Loading user data from auth context:', user);
      console.log('📱 Profile screen: User profileImage field:', user.profileImage);
      
      // Profile image is handled by the separate useEffect above
      console.log('📱 ProfileScreen: Profile image will be handled by sync useEffect');
      
      // Safely extract name parts with proper fallbacks
      const userName = user.name || '';
      const nameParts = userName ? userName.split(' ') : [];
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      console.log('Profile screen: User name parts:', { userName, nameParts, firstName, lastName });
      
      const newProfileData = {
        firstName,
        lastName,
        email: user.email || '',
        phone: user.phone || '',
        age: user.age ? user.age.toString() : '',
        gender: user.gender || '',
        address: userAddress || '', // Use only real-time location
        petBreeds: user.selectedBreeds || [],
        // Only include sitter-specific fields for pet sitters
        ...(user.role === 'pet_sitter' && {
          experience: user.experience || '',
          hourlyRate: user.hourlyRate || '',
          specialties: user.specialties || [],
        }),
      };
      
      console.log('Profile screen: Setting new profile data:', newProfileData);
      setProfileData(newProfileData);
    } else {
      console.log('Profile screen: No user data, starting fresh');
      // Clear all profile data if no user
      setProfileImage(null);
      setProfileData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        age: '',
        gender: '',
        address: '',
        experience: '',
        hourlyRate: '',
        specialties: [],
        petBreeds: [],
      });
    }
  }, [user]);

  const primaryIDs = [
    'Philippine National ID (PhilID)',
    'Philippine Passport',
    'Driver\'s License',
    'SSS ID',
    'GSIS ID',
    'UMID',
    'Voter\'s ID',
    'Senior Citizen ID',
    'Student ID',
    'Company ID'
  ];

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  };

  const handleRefresh = async () => {
    Alert.alert(
      'Start Fresh',
      'This will clear all your data and take you back to onboarding. Are you sure?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Start Fresh',
          style: 'destructive',
          onPress: async () => {
            try {
              await refresh();
              // The app will automatically redirect to onboarding
            } catch (error) {
              console.error('Error refreshing:', error);
              Alert.alert('Error', 'Failed to refresh. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleProfileRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Refresh user data from the server
      await refresh();
      
      // Update profile data with fresh user data
      if (user) {
        const nameParts = (user.name || '').split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        setProfileData({
          firstName: firstName,
          lastName: lastName,
          email: user.email || '',
          phone: user.phone || '',
          address: user.address || '',
          age: String(user.age || ''),
          gender: user.gender || '',
          hourlyRate: user.hourlyRate || '',
          experience: user.experience || '',
          specialties: user.specialties || [],
          petBreeds: (user as any).pet_breeds || [],
        });
      }
    } catch (error) {
      console.error('Error refreshing profile:', error);
      Alert.alert('Error', 'Failed to refresh profile. Please try again.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const pickProfileImage = async () => {
    Alert.alert(
      'Select Profile Image',
      'Choose how you want to add a profile image',
      [
        { text: 'Camera', onPress: takeProfilePhoto },
        { text: 'Photo Library', onPress: pickFromGallery },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const takeProfilePhoto = async () => {
    const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
    if (cameraPermission.granted === false) {
      Alert.alert('Camera Permission Required', 'Please allow camera access to take profile photos.');
      return;
    }
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        cameraType: ImagePicker.CameraType.front,
        allowsMultipleSelection: false,
        selectionLimit: 1,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        console.log('📸 ProfileScreen: Image picked from camera, setting local state:', imageUri);
        setProfileImage(imageUri);
        setImageError(false);
        
        // Upload image to backend
        await uploadProfileImage(imageUri);
      }
    } catch (error) {
      Alert.alert('Camera Error', 'Failed to open camera. Please try again.');
    }
  };

  const pickFromGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.granted === false) {
      Alert.alert('Permission Required', 'Please allow photo library access to select images.');
      return;
    }
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
        console.log('📸 ProfileScreen: Image picked from gallery, setting local state:', imageUri);
        setProfileImage(imageUri);
        setImageError(false);
        
        // Upload image to backend
        await uploadProfileImage(imageUri);
      }
    } catch (error) {
      Alert.alert('Gallery Error', 'Failed to open photo library. Please try again.');
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
      console.log('Uploading profile image using network service');
      console.log('User token:', user?.token ? 'Present' : 'Missing');

      const response = await makeApiCall('/api/profile/upload-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user?.token || ''}`,
        },
        body: formData,
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      // Check if response is ok
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('Upload result:', result);
      
      if (result.success) {
        console.log('Profile image uploaded successfully:', result.profile_image);
        console.log('Full result object:', JSON.stringify(result, null, 2));
        
        // Use the full URL from backend response if available, otherwise generate it
        const fullImageUrl = result.full_url || result.profile_image_url || getFullImageUrl(result.profile_image);
        console.log('ProfileScreen: Backend response fields:');
        console.log('  - result.profile_image:', result.profile_image);
        console.log('  - result.full_url:', result.full_url);
        console.log('  - result.profile_image_url:', result.profile_image_url);
        console.log('ProfileScreen: Using full URL from backend:', fullImageUrl);
        console.log('ProfileScreen: Is valid URI:', isValidImageUri(fullImageUrl));
        console.log('ProfileScreen: Setting local profile image immediately:', fullImageUrl);
        
        // Force the image to display by bypassing validation temporarily
        console.log('ProfileScreen: FORCING IMAGE DISPLAY - bypassing validation');
        setProfileImage(fullImageUrl);
        setImageError(false);
        setJustUploadedImage(true); // Flag to prevent useEffect from overriding
        
        // Also try with a hardcoded URL to test
        const testUrl = `http://192.168.100.192:8000/storage/${result.profile_image}`;
        console.log('ProfileScreen: TEST URL:', testUrl);
        setTimeout(() => {
          console.log('ProfileScreen: Trying test URL after 500ms');
          setProfileImage(testUrl);
        }, 500);
        
        // Update the user context with storage path for persistence
        await updateUserProfile({ profileImage: result.profile_image });
        console.log('ProfileScreen: User context updated with storage path');
        
        // Force refresh user data to ensure we have the latest from backend
        await refresh();
        console.log('ProfileScreen: User data refreshed from backend');
        
        // Clear the flag after a delay to allow normal syncing
        setTimeout(() => {
          setJustUploadedImage(false);
          console.log('ProfileScreen: Cleared justUploadedImage flag');
        }, 2000);
        
        // Test the image URL after a short delay
        setTimeout(() => {
          console.log('🧪 POST-UPLOAD TEST:');
          console.log('  - Local profileImage state:', profileImage);
          console.log('  - User profileImage:', user?.profileImage);
          console.log('  - Generated URL:', getFullImageUrl(profileImage));
          console.log('  - Is valid:', isValidImageUri(profileImage));
          
          // Test if the URL is accessible
          if (fullImageUrl) {
            fetch(fullImageUrl, { method: 'HEAD' })
              .then(response => {
                console.log('🧪 URL accessibility test:', response.status, response.ok ? 'SUCCESS' : 'FAILED');
              })
              .catch(error => {
                console.log('🧪 URL accessibility test FAILED:', error.message);
              });
          }
        }, 1000);
        
        Alert.alert('Success', 'Profile image updated successfully!');
      } else {
        console.error('Failed to upload profile image:', result.message);
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

  const checkCooldownStatus = async () => {
    try {
      const { makeApiCall } = await import('../../services/networkService');
      const response = await makeApiCall('/api/profile/update-request/check-pending', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${user?.token || ''}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.cooldown_info) {
          setCooldownInfo(data.cooldown_info);
        }
      }
    } catch (error) {
      console.error('Error checking cooldown status:', error);
    }
  };


  const handleSubmitProfileRequest = async () => {
    try {
      setIsSubmittingRequest(true);
      
      // Validate required fields
      if (!requestData.firstName.trim() || !requestData.lastName.trim()) {
        Alert.alert('Validation Error', 'First name and last name are required');
        return;
      }
      
      if (!requestData.reason.trim()) {
        Alert.alert('Validation Error', 'Please provide a reason for the changes');
        return;
      }
      
      console.log('ProfileScreen: Submitting profile update request:', requestData);
      
      const { submitProfileUpdateRequest } = await import('../../services/networkService');
      const response = await submitProfileUpdateRequest({
        firstName: requestData.firstName.trim(),
        lastName: requestData.lastName.trim(),
        phone: requestData.phone.trim(),
        hourlyRate: requestData.hourlyRate.trim(),
        experience: requestData.experience.trim(),
        reason: requestData.reason.trim(),
      }, user?.token || '', user?.role || 'pet_owner');
      
      console.log('ProfileScreen: Profile update request response:', response);
      
      if (response.success) {
        Alert.alert(
          'Request Submitted', 
          'Your update request has been submitted. Please wait for the admin to examine and approve your changes.',
          [{ text: 'OK', onPress: () => setIsEditing(false) }]
        );
        // Reset form
        setRequestData({
          firstName: '',
          lastName: '',
          phone: '',
          hourlyRate: '',
          experience: '',
          reason: '',
        });
        // Refresh cooldown status
        await checkCooldownStatus();
      } else {
        // Check if it's a cooldown error
        if (response.cooldown_info && response.cooldown_info.in_cooldown) {
          Alert.alert(
            'Profile Update Cooldown',
            response.message,
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert('Error', response.message || 'Failed to submit request. Please try again.');
        }
      }
    } catch (error) {
      console.error('ProfileScreen: Error submitting profile update request:', error);
      Alert.alert('Error', 'Failed to submit request. Please try again.');
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  const menuItems = [
    {
      icon: 'person-outline',
      title: 'Edit Profile',
      onPress: () => setIsEditing(true),
    },
    {
      icon: 'create-outline',
      title: 'Request Profile Update',
      onPress: () => router.push('/profile-update-request'),
    },
    {
      icon: 'settings-outline',
      title: 'Settings',
      onPress: () => console.log('Settings'),
    },
    {
      icon: 'help-circle-outline',
      title: 'Help & Support',
      onPress: () => console.log('Help & Support'),
    },
    {
      icon: 'document-text-outline',
      title: 'Terms & Privacy',
      onPress: () => console.log('Terms & Privacy'),
    },
    {
      icon: 'log-out-outline',
      title: 'Logout',
      onPress: handleLogout,
      color: '#FF6B6B',
    },
    {
      icon: 'refresh-outline',
      title: 'Start Fresh',
      onPress: handleRefresh,
      color: '#FF6B6B',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="exit-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          contentContainerStyle={[styles.scrollContent]}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleProfileRefresh}
              colors={['#3B82F6']}
              tintColor="#3B82F6"
            />
          }
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <TouchableOpacity onPress={pickProfileImage} disabled={isUploadingImage}>
          {(() => {
            const imageSource = profileImage && isValidImageUri(profileImage) && !imageError 
              ? { 
                  uri: getFullImageUrl(profileImage),
                  cache: 'force-cache'
                } 
              : require('../../assets/images/default-avatar.png');
            
            console.log('🖼️ ProfileScreen: Image rendering debug:', {
              profileImage,
              isValidUri: isValidImageUri(profileImage),
              imageError,
              fullUrl: getFullImageUrl(profileImage),
              willUseDefault: !(profileImage && isValidImageUri(profileImage) && !imageError),
              imageSource,
              userProfileImage: user?.profileImage
            });
            
            return null;
          })()}
          <Image
            source={
              profileImage 
                ? { 
                    uri: getFullImageUrl(profileImage),
                    cache: 'force-cache' // Force cache for better performance
                  } 
                : require('../../assets/images/default-avatar.png')
            }
            style={[styles.profileImage, isUploadingImage && styles.uploadingImage]}
            onError={(error) => {
              console.log('❌ ProfileScreen: Image load error:', error);
              console.log('❌ ProfileScreen: Failed to load image URI:', profileImage);
              console.log('❌ ProfileScreen: Full URL:', getFullImageUrl(profileImage));
              console.log('❌ ProfileScreen: isValidImageUri result:', isValidImageUri(profileImage));
              console.log('❌ ProfileScreen: imageError state:', imageError);
              console.log('❌ ProfileScreen: Error details:', error.nativeEvent);
              handleImageError();
            }}
            onLoad={() => {
              console.log('✅ ProfileScreen: Image loaded successfully:', profileImage);
              console.log('✅ ProfileScreen: Full URL used:', getFullImageUrl(profileImage));
              handleImageLoad();
            }}
            defaultSource={require('../../assets/images/default-avatar.png')}
            resizeMode="cover"
          />
            <View style={styles.cameraIconOverlay}>
              {isUploadingImage ? (
                <Ionicons name="hourglass" size={20} color="#fff" />
              ) : (
                <Ionicons name="camera" size={20} color="#fff" />
              )}
            </View>
          </TouchableOpacity>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {(profileData.firstName || profileData.lastName)
                ? `${profileData.firstName || ''} ${profileData.lastName || ''}`.trim()
                : 'Enter Your Name'
              }
            </Text>
          </View>
        </View>

        {/* Debug Info - Remove this after testing */}
        {__DEV__ && (
          <View style={styles.debugInfo}>
            <Text style={styles.debugText}>Debug: User ID: {user?.id || 'None'}</Text>
            <Text style={styles.debugText}>Debug: User Name: {user?.name || 'None'}</Text>
            <Text style={styles.debugText}>Debug: User Role: {user?.userRole || 'None'}</Text>
            <Text style={styles.debugText}>Debug: User ProfileImage: {user?.profileImage || 'None'}</Text>
            <Text style={styles.debugText}>Debug: Local ProfileImage: {profileImage || 'None'}</Text>
            <Text style={styles.debugText}>Debug: Image Valid: {isValidImageUri(profileImage) ? 'Yes' : 'No'}</Text>
            <Text style={styles.debugText}>Debug: Image Error: {imageError ? 'Yes' : 'No'}</Text>
            <Text style={styles.debugText}>Debug: Full URL: {getFullImageUrl(profileImage) || 'None'}</Text>
            <TouchableOpacity 
              style={styles.testButton} 
              onPress={() => {
                console.log('🧪 TEST: Testing image URL generation...');
                console.log('🧪 TEST: User profileImage:', user?.profileImage);
                console.log('🧪 TEST: Local profileImage:', profileImage);
                console.log('🧪 TEST: Generated URL:', getFullImageUrl(profileImage));
                console.log('🧪 TEST: Is valid URI:', isValidImageUri(profileImage));
                
                // Test the actual URL
                const testUrl = getFullImageUrl(profileImage);
                if (testUrl) {
                  fetch(testUrl, { method: 'HEAD' })
                    .then(response => {
                      console.log('🧪 TEST: URL accessibility test:', response.status, response.ok ? 'SUCCESS' : 'FAILED');
                      Alert.alert('Test Complete', `URL: ${testUrl}\nStatus: ${response.status} ${response.ok ? 'SUCCESS' : 'FAILED'}`);
                    })
                    .catch(error => {
                      console.log('🧪 TEST: URL accessibility test FAILED:', error.message);
                      Alert.alert('Test Complete', `URL: ${testUrl}\nError: ${error.message}`);
                    });
                } else {
                  Alert.alert('Test Complete', 'No URL generated');
                }
              }}
            >
              <Text style={styles.testButtonText}>Test Image URL</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.testButton, { backgroundColor: '#FF6B6B', marginTop: 10 }]} 
              onPress={() => {
                const testUrl = `http://192.168.100.192:8000/storage/profile_images/h0SuQ7rQBRwmpycUgSBgtmsm8CXFTSeTVc7tHJyr.jpg`;
                console.log('🧪 FORCE TEST: Setting hardcoded URL:', testUrl);
                setProfileImage(testUrl);
                setImageError(false);
                Alert.alert('Force Test', `Set hardcoded URL: ${testUrl}`);
              }}
            >
              <Text style={styles.testButtonText}>Force Test Image</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Professional Metrics Section */}
        <View style={styles.statsSection}>
          {user?.role === 'pet_sitter' ? (
            <>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{profileData.experience || '0'}</Text>
                <Text style={styles.statLabel}>Years of Experience</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{profileData.hourlyRate ? `₱${profileData.hourlyRate}` : '₱0'}</Text>
                <Text style={styles.statLabel}>Per Hour</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{profileData.specialties && profileData.specialties.length > 0 ? profileData.specialties.length.toString() : '0'}</Text>
                <Text style={styles.statLabel}>Specialties</Text>
              </View>
            </>
          ) : (
            <>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Bookings</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>0.0</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
          <View style={styles.statItem}>
                <Text style={styles.statNumber}>{profileData.petBreeds.length > 0 ? profileData.petBreeds.length.toString() : '0'}</Text>
            <Text style={styles.statLabel}>Pets</Text>
              </View>
            </>
          )}
        </View>

        {/* Edit Profile Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.editProfileButton} 
            onPress={() => setIsEditing(true)}
          >
            <Text style={styles.editProfileButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Personal Information Section */}
        <View style={styles.infoSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            {isEditing && (
              <View style={styles.editingIndicator}>
                <Ionicons name="create-outline" size={16} color="#F59E0B" />
                <Text style={styles.editingText}>Request Update</Text>
              </View>
            )}
          </View>

          {/* Cooldown Notice - Hidden */}
          {false && cooldownInfo && cooldownInfo.in_cooldown && (
            <View style={styles.cooldownNotice}>
              <Ionicons name="time-outline" size={20} color="#F59E0B" />
              <View style={styles.cooldownTextContainer}>
                <Text style={styles.cooldownTitle}>Profile Update Cooldown</Text>
                <Text style={styles.cooldownMessage}>
                  You cannot request profile changes for {cooldownInfo.days_remaining} more days. 
                  You can request changes again after {cooldownInfo.cooldown_ends_at}.
                </Text>
              </View>
            </View>
          )}
          
          {!isEditing ? (
            // Display current profile information
            <>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>First Name</Text>
                <Text style={styles.infoValue}>{profileData.firstName || 'Not set'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Last Name</Text>
                <Text style={styles.infoValue}>{profileData.lastName || 'Not set'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{profileData.email || 'Not set'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Phone</Text>
                <Text style={styles.infoValue}>{profileData.phone || 'Not set'}</Text>
              </View>
              {user?.role === 'pet_sitter' && (
                <>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Hourly Rate</Text>
                    <Text style={styles.infoValue}>{profileData.hourlyRate ? `₱${profileData.hourlyRate}` : 'Not set'}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Experience</Text>
                    <Text style={styles.infoValue}>{profileData.experience ? `${profileData.experience} years` : 'Not set'}</Text>
                  </View>
                </>
              )}
            </>
          ) : (
            // Profile update request form
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>First Name *</Text>
                <TextInput
                  style={[styles.input, styles.inputEditing]}
                  value={requestData.firstName}
                  onChangeText={(text) => setRequestData({...requestData, firstName: text})}
                  placeholder="Enter your first name"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Last Name *</Text>
                <TextInput
                  style={[styles.input, styles.inputEditing]}
                  value={requestData.lastName}
                  onChangeText={(text) => setRequestData({...requestData, lastName: text})}
                  placeholder="Enter your last name"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone Number</Text>
                <TextInput
                  style={[styles.input, styles.inputEditing]}
                  value={requestData.phone}
                  onChangeText={(text) => setRequestData({...requestData, phone: text})}
                  placeholder="Enter your phone number"
                  keyboardType="phone-pad"
                />
              </View>

              {user?.role === 'pet_sitter' && (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Hourly Rate (₱)</Text>
                    <TextInput
                      style={[styles.input, styles.inputEditing]}
                      value={requestData.hourlyRate}
                      onChangeText={(text) => setRequestData({...requestData, hourlyRate: text})}
                      placeholder="Enter your hourly rate"
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Years of Experience</Text>
                    <TextInput
                      style={[styles.input, styles.inputEditing]}
                      value={requestData.experience}
                      onChangeText={(text) => setRequestData({...requestData, experience: text})}
                      placeholder="e.g., 3, 1.5, 0.5"
                      keyboardType="numeric"
                    />
                  </View>

                </>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Reason for Changes *</Text>
                <TextInput
                  style={[styles.textArea, styles.textAreaEditing]}
                  value={requestData.reason}
                  onChangeText={(text) => setRequestData({...requestData, reason: text})}
                  placeholder="Please explain why you want to update your profile information..."
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </>
          )}

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
              value={profileData.address}
              editable={false}
              selectTextOnFocus={false}
              pointerEvents="none"
              placeholder={userAddress ? "Location auto-detected" : "Getting your location..."}
            />
          </View>
        </View>

        {/* Submit/Cancel Buttons when editing */}
        {isEditing && (
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.saveButton, isSubmittingRequest && styles.disabledButton]} 
              onPress={handleSubmitProfileRequest}
              disabled={isSubmittingRequest}
            >
              {isSubmittingRequest ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={styles.saveButtonText}>Submitting...</Text>
                </View>
              ) : (
                <Text style={styles.saveButtonText}>Submit Request</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={() => setIsEditing(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Menu Items */}
        <View style={styles.menuSection}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={item.onPress}
            >
              <View style={styles.menuItemLeft}>
                <Ionicons 
                  name={item.icon as any} 
                  size={24} 
                  color={item.color || '#333'} 
                />
                <Text style={[styles.menuItemText, item.color && { color: item.color }]}>
                  {item.title}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>
          ))}
        </View>

        {/* App Version */}
        <View style={styles.versionSection}>
          <Text style={styles.versionText}>Petsit Connect v1.0.0</Text>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  logoutButton: {
    padding: 8,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  profileSection: {
    backgroundColor: '#fff',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 15,
  },
  uploadingImage: {
    opacity: 0.7,
  },
  cameraIconOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#F59E0B',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
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
  reviewsText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  buttonContainer: {
    width: '75%',
    marginBottom: 30,
    alignSelf: 'center',
    marginTop: 20,
    paddingHorizontal: 20,
  },
  editProfileButton: {
    backgroundColor: '#F59E0B',
    paddingVertical: 18,
    borderRadius: 15,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#E67E22',
  },
  editProfileButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statsSection: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    paddingVertical: 20,
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F59E0B',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  infoSection: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
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
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  inputEditing: {
    borderColor: '#F59E0B',
    borderWidth: 2,
    backgroundColor: '#FFFBEB',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#fff',
    height: 100,
    textAlignVertical: 'top',
  },
  textAreaEditing: {
    borderColor: '#F59E0B',
    borderWidth: 2,
    backgroundColor: '#FFFBEB',
  },
  disabledInput: {
    backgroundColor: '#f8f8f8',
    color: '#666',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  editingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  editingText: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '500',
    marginLeft: 4,
  },
  cooldownNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  cooldownTextContainer: {
    flex: 1,
    marginLeft: 8,
  },
  cooldownTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 4,
  },
  cooldownMessage: {
    fontSize: 12,
    color: '#92400E',
    lineHeight: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  infoValue: {
    fontSize: 16,
    color: '#666',
    flex: 2,
    textAlign: 'right',
  },
  disabledButton: {
    opacity: 0.6,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  specialtiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  specialtyTag: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  specialtyText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  removeSpecialtyButton: {
    padding: 5,
  },
  addSpecialtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 10,
    marginTop: 10,
  },
  specialtyInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
  },
  addSpecialtyButton: {
    padding: 10,
    backgroundColor: '#4CAF50',
    borderRadius: 12,
  },
  disabledAddButton: {
    backgroundColor: '#ccc',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingVertical: 10,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 18,
    borderRadius: 15,
    alignItems: 'center',
    width: '100%',
    marginBottom: 12,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 18,
    borderRadius: 15,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  menuSection: {
    backgroundColor: '#fff',
    marginBottom: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 15,
  },
  versionSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  versionText: {
    fontSize: 12,
    color: '#999',
  },
  debugInfo: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    marginTop: 10,
    marginBottom: 20,
    borderRadius: 10,
    alignSelf: 'center',
    width: '90%',
  },
  debugText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
  },
  testButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  testButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
});

export default ProfileScreen; 