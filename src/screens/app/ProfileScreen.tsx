import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    Image,
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
  const { user, logout, updateUserProfile, refresh, isLoading } = useAuth();
  const router = useRouter();
  
  console.log('ProfileScreen: Rendering with user:', user);
  console.log('ProfileScreen: User details:', {
    id: user?.id,
    name: user?.name,
    email: user?.email,
    role: user?.userRole,
    phone: user?.phone,
    address: user?.address
  });
  
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newSpecialty, setNewSpecialty] = useState('');
  const [profileData, setProfileData] = useState<{
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    age: string;
    gender: string;
    address: string;
    experience: string;
    hourlyRate: string;
    aboutMe: string;
    specialties: string[];
    petBreeds: string[];
  }>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    age: '',
    gender: '',
    address: '',
    experience: '',
    hourlyRate: '',
    aboutMe: '',
    specialties: [],
    petBreeds: [],
  });

  console.log('ProfileScreen: Current profileData:', profileData);

  // Show loading state while auth context is loading
  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>Loading profile...</Text>
      </View>
    );
  }

  // Update profileData when user changes
  React.useEffect(() => {
    console.log('ProfileScreen: useEffect triggered with user:', user);
    console.log('ProfileScreen: Current profileImage state:', profileImage);
    if (user) {
      console.log('Profile screen: Loading user data from auth context:', user);
      console.log('Profile screen: User profileImage field:', user.profileImage);
      
      // Set profile image from user data
      if (user.profileImage) {
        console.log('ProfileScreen: Setting profile image from user data:', user.profileImage);
        setProfileImage(user.profileImage);
      } else {
        console.log('ProfileScreen: No profile image in user data');
        setProfileImage(null);
      }
      
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
        address: user.address || '',
        experience: user.experience || '',
        hourlyRate: user.hourlyRate || '',
        aboutMe: user.aboutMe || '',
        specialties: user.specialties || [],
        petBreeds: user.selectedBreeds || [],
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
        aboutMe: '',
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

  const pickProfileImage = async () => {
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
        setProfileImage(imageUri);
        
        // Upload image to backend
        await uploadProfileImage(imageUri);
      }
    } catch (error) {
      Alert.alert('Camera Error', 'Failed to open camera. Please try again.');
    }
  };

  const uploadProfileImage = async (imageUri: string) => {
    try {
      const formData = new FormData();
      formData.append('profile_image', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'profile_image.jpg',
      } as any);

      console.log('Uploading profile image to:', 'http://172.20.10.2:8000/api/profile/upload-image');
      console.log('User token:', user?.token ? 'Present' : 'Missing');

      const response = await fetch('http://172.20.10.2:8000/api/profile/upload-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user?.token || ''}`,
          'Accept': 'application/json',
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
        // Update the local state immediately to show the new image
        setProfileImage(result.profile_image);
        // Update the user context with the new profile image
        await updateUserProfile({ profileImage: result.profile_image });
        Alert.alert('Success', 'Profile image updated successfully!');
      } else {
        console.error('Failed to upload profile image:', result.message);
        Alert.alert('Error', result.message || 'Failed to upload profile image');
      }
    } catch (error) {
      console.error('Error uploading profile image:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      Alert.alert('Error', `Failed to upload profile image: ${errorMessage}`);
    }
  };

  const handleSaveProfile = async () => {
    try {
      // Validate profileData exists and has required fields
      if (!profileData) {
        console.error('ProfileScreen: profileData is null or undefined');
        Alert.alert('Error', 'Profile data is missing. Please try again.');
        return;
      }

      // Ensure firstName and lastName have fallback values
      const firstName = profileData.firstName || '';
      const lastName = profileData.lastName || '';
      
      console.log('ProfileScreen: Saving profile with data:', {
        firstName,
        lastName,
        email: profileData.email,
        phone: profileData.phone,
      });

      // Save the profile data to the auth context
      await updateUserProfile({
        firstName,
        lastName,
        email: profileData.email || '',
        phone: profileData.phone || '',
        age: profileData.age ? parseInt(profileData.age) : undefined,
        gender: profileData.gender || '',
        address: profileData.address || '',
        experience: profileData.experience || '',
        hourlyRate: profileData.hourlyRate || '',
        aboutMe: profileData.aboutMe || '',
        specialties: profileData.specialties || [],
      });
      
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    }
  };

  const menuItems = [
    {
      icon: 'person-outline',
      title: 'Edit Profile',
      onPress: () => setIsEditing(true),
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

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <TouchableOpacity onPress={pickProfileImage}>
          <Image
              source={profileImage ? { uri: profileImage } : require('../../assets/images/default-avatar.png')}
            style={styles.profileImage}
          />
            <View style={styles.cameraIconOverlay}>
              <Ionicons name="camera" size={20} color="#fff" />
            </View>
          </TouchableOpacity>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {(profileData.firstName || profileData.lastName)
                ? `${profileData.firstName || ''} ${profileData.lastName || ''}`.trim()
                : 'Enter Your Name'
              }
            </Text>
            {profileData.address ? (
              <View style={styles.locationContainer}>
                <Ionicons name="location" size={16} color="#FF6B6B" />
                <Text style={styles.locationText}>{profileData.address}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Debug Info - Remove this after testing */}
        {__DEV__ && (
          <View style={styles.debugInfo}>
            <Text style={styles.debugText}>Debug: User ID: {user?.id || 'None'}</Text>
            <Text style={styles.debugText}>Debug: User Name: {user?.name || 'None'}</Text>
            <Text style={styles.debugText}>Debug: User Role: {user?.userRole || 'None'}</Text>
            <Text style={styles.debugText}>Debug: Profile Data - First: {profileData.firstName || 'None'}</Text>
            <Text style={styles.debugText}>Debug: Profile Data - Last: {profileData.lastName || 'None'}</Text>
            <Text style={styles.debugText}>Debug: Profile Data - Email: {profileData.email || 'None'}</Text>
            <Text style={styles.debugText}>Debug: Profile Data - Phone: {profileData.phone || 'None'}</Text>
            <Text style={styles.debugText}>Debug: Profile Data - Address: {profileData.address || 'None'}</Text>
            <Text style={styles.debugText}>Debug: Profile Data - Experience: {profileData.experience || 'None'}</Text>
            <Text style={styles.debugText}>Debug: Profile Data - Hourly Rate: {profileData.hourlyRate || 'None'}</Text>
            <Text style={styles.debugText}>Debug: Profile Data - About Me: {profileData.aboutMe || 'None'}</Text>
            <Text style={styles.debugText}>Debug: Profile Data - Specialties: {profileData.specialties.length > 0 ? profileData.specialties.join(', ') : 'None'}</Text>
            <Text style={styles.debugText}>Debug: Profile Data - Pet Breeds: {profileData.petBreeds.length > 0 ? profileData.petBreeds.join(', ') : 'None'}</Text>
          </View>
        )}

        {/* Professional Metrics Section */}
        <View style={styles.statsSection}>
          {user?.userRole === 'Pet Sitter' ? (
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
                <Text style={styles.statNumber}>{profileData.specialties.length > 0 ? profileData.specialties.length.toString() : '0'}</Text>
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
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.disabledInput]}
              value={`${profileData.firstName || ''} ${profileData.lastName || ''}`.trim()}
              onChangeText={(text) => {
                const names = text.split(' ');
                setProfileData({
                  ...profileData,
                  firstName: names[0] || '',
                  lastName: names.slice(1).join(' ') || ''
                });
              }}
              editable={isEditing}
              placeholder="Enter your full name"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.disabledInput]}
              value={profileData.email}
              onChangeText={(text) => setProfileData({...profileData, email: text})}
              editable={isEditing}
              placeholder="Enter your email"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Phone</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.disabledInput]}
              value={profileData.phone}
              onChangeText={(text) => setProfileData({...profileData, phone: text})}
              editable={isEditing}
              placeholder="Enter your phone number"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Location</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.disabledInput]}
              value={profileData.address}
              onChangeText={(text) => setProfileData({...profileData, address: text})}
              editable={isEditing}
              placeholder="Enter your address"
            />
          </View>

          {user?.userRole === 'Pet Sitter' && (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Years of Experience</Text>
                <TextInput
                  style={[styles.input, !isEditing && styles.disabledInput]}
                  value={profileData.experience}
                  onChangeText={(text) => setProfileData({...profileData, experience: text})}
                  editable={isEditing}
                  placeholder="e.g., 3, 1.5, 0.5"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Hourly Rate (₱)</Text>
                <TextInput
                  style={[styles.input, !isEditing && styles.disabledInput]}
                  value={profileData.hourlyRate}
                  onChangeText={(text) => setProfileData({...profileData, hourlyRate: text})}
                  editable={isEditing}
                  placeholder="e.g., 25"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>About Me</Text>
                <TextInput
                  style={[styles.textArea, !isEditing && styles.disabledInput]}
                  value={profileData.aboutMe}
                  onChangeText={(text) => setProfileData({...profileData, aboutMe: text})}
                  editable={isEditing}
                  placeholder="Tell us about yourself..."
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Specialties</Text>
                {isEditing ? (
                  <>
                    <View style={styles.specialtiesContainer}>
                      {profileData.specialties.map((specialty, index) => (
                        <View key={index} style={styles.specialtyTag}>
                          <Text style={styles.specialtyText}>{specialty}</Text>
                          <TouchableOpacity
                            style={styles.removeSpecialtyButton}
                            onPress={() => setProfileData({
                              ...profileData, 
                              specialties: profileData.specialties.filter((_, i) => i !== index)
                            })}
                          >
                            <Ionicons name="close" size={16} color="#666" />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                    <View style={styles.addSpecialtyContainer}>
                      <TextInput
                        style={styles.specialtyInput}
                        placeholder="Add a specialty (e.g., Dog training, Cat care)"
                        placeholderTextColor="#999"
                        value={newSpecialty}
                        onChangeText={setNewSpecialty}
                        onSubmitEditing={() => {
                          if (newSpecialty.trim()) {
                            setProfileData({
                              ...profileData, 
                              specialties: [...profileData.specialties, newSpecialty.trim()]
                            });
                            setNewSpecialty('');
                          }
                        }}
                      />
                      <TouchableOpacity
                        style={[styles.addSpecialtyButton, !newSpecialty.trim() && styles.disabledAddButton]}
                        onPress={() => {
                          if (newSpecialty.trim()) {
                            setProfileData({
                              ...profileData, 
                              specialties: [...profileData.specialties, newSpecialty.trim()]
                            });
                            setNewSpecialty('');
                          }
                        }}
                        disabled={!newSpecialty.trim()}
                      >
                        <Ionicons name="add" size={20} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  </>
                ) : (
                  <>
                    {profileData.specialties.length > 0 ? (
                      <View style={styles.specialtiesContainer}>
                        {profileData.specialties.map((specialty, index) => (
                          <View key={index} style={styles.specialtyTag}>
                            <Text style={styles.specialtyText}>{specialty}</Text>
                          </View>
                        ))}
                      </View>
                    ) : (
                      <Text style={styles.emptyText}>No specialties added yet</Text>
                    )}
                  </>
                )}
              </View>
            </>
          )}

          {user?.userRole === 'Pet Owner' && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Preferred Pet Breeds</Text>
              {profileData.petBreeds.length > 0 ? (
                <View style={styles.specialtiesContainer}>
                  {profileData.petBreeds.map((breed, index) => (
                    <View key={index} style={styles.specialtyTag}>
                      <Text style={styles.specialtyText}>{breed}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.emptyText}>No pet breeds selected yet</Text>
              )}
            </View>
          )}
        </View>

        {/* Save/Cancel Buttons when editing */}
        {isEditing && (
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.saveButton} 
              onPress={handleSaveProfile}
            >
              <Text style={styles.saveButtonText}>Save Changes</Text>
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
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 5,
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
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#fff',
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
  disabledInput: {
    backgroundColor: '#f8f8f8',
    color: '#666',
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
});

export default ProfileScreen; 