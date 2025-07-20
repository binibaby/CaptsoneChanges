import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    Image,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const PetOwnerProfileScreen = () => {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: 'John Davis',
    email: 'john.davis@email.com',
    phone: '+1 (555) 987-6543',
    address: '123 Main St, San Francisco, CA 94102',
    bio: 'Pet lover and proud owner of Max, a friendly Golden Retriever. Looking for reliable pet sitters in the area.',
    pets: [
      { name: 'Max', type: 'Dog', breed: 'Golden Retriever', age: '3 years' },
      { name: 'Luna', type: 'Cat', breed: 'Siamese', age: '2 years' }
    ],
    emergencyContact: 'Sarah Davis',
    emergencyPhone: '+1 (555) 123-4567',
  });

  const [selectedPet, setSelectedPet] = useState<null | typeof profile.pets[0]>(null);
  const [modalVisible, setModalVisible] = useState(false);

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

  const handleAddPet = () => {
    Alert.alert('Add Pet', 'This feature will be available soon!');
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
            <Text style={styles.profileSubtitle}>Pet Owner</Text>
            <Text style={styles.locationText}>📍 San Francisco, CA</Text>
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
        {/* Personal Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <Text style={[styles.input, styles.disabledInput]}>{profile.name}</Text>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <Text style={[styles.input, styles.disabledInput]}>{profile.email}</Text>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Phone</Text>
            <Text style={[styles.input, styles.disabledInput]}>{profile.phone}</Text>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Address</Text>
            <Text style={[styles.input, styles.disabledInput]}>{profile.address}</Text>
          </View>
        </View>
        {/* Bio */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About Me</Text>
          <Text style={[styles.bioInput, styles.disabledInput]}>{profile.bio}</Text>
        </View>
        {/* My Pets */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Pets</Text>
            {isEditing && (
              <TouchableOpacity style={styles.addButton} onPress={handleAddPet}>
                <Ionicons name="add" size={20} color="#F59E0B" />
              </TouchableOpacity>
            )}
          </View>
          {profile.pets.map((pet, index) => (
            <View key={index} style={styles.petCard}>
              <Image 
                source={pet.type === 'Dog' ? require('../../assets/images/dog.png') : require('../../assets/images/cat.png')} 
                style={styles.petImage} 
              />
              <View style={styles.petInfo}>
                <Text style={styles.petName}>{pet.name}</Text>
                <Text style={styles.petDetails}>{pet.breed} • {pet.age}</Text>
              </View>
              {isEditing && (
                <TouchableOpacity style={styles.editPetButton}>
                  <Ionicons name="pencil" size={16} color="#666" />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
        {/* Emergency Contact */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Emergency Contact</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Contact Name</Text>
            <Text style={[styles.input, styles.disabledInput]}>{profile.emergencyContact}</Text>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Contact Phone</Text>
            <Text style={[styles.input, styles.disabledInput]}>{profile.emergencyPhone}</Text>
          </View>
        </View>
        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <TouchableOpacity style={styles.actionItem} onPress={() => router.push('/pet-owner-jobs')}>
            <Ionicons name="briefcase-outline" size={24} color="#F59E0B" />
            <Text style={styles.actionText}>My Bookings</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionItem} onPress={() => router.push('/pet-owner-messages')}>
            <Ionicons name="chatbubbles-outline" size={24} color="#4CAF50" />
            <Text style={styles.actionText}>Messages</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionItem} onPress={() => router.push('/find-sitter-map')}>
            <Ionicons name="map-outline" size={24} color="#3B82F6" />
            <Text style={styles.actionText}>Find Pet Sitters</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  profileSubtitle: {
    fontSize: 14,
    color: '#F59E0B',
    fontWeight: '600',
    marginBottom: 5,
  },
  locationText: {
    fontSize: 14,
    color: '#666',
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  addButton: {
    padding: 5,
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
  petCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  petImage: {
    width: 54,
    height: 54,
    borderRadius: 12,
    marginRight: 15,
  },
  petInfo: {
    flex: 1,
  },
  petName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  petDetails: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  editPetButton: {
    padding: 8,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  // New styles for inline colors and margins
  colorFF4444: {
    color: '#FF4444',
  },
  marginRight15: {
    marginRight: 15,
  },
  colorF59E0B: {
    color: '#F59E0B',
  },
  color4CAF50: {
    color: '#4CAF50',
  },
  color3B82F6: {
    color: '#3B82F6',
  },
});

export default PetOwnerProfileScreen; 