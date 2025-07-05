import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Image,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface UserRoleSelectionScreenProps {
  onRoleSelected: (role: 'Pet Owner' | 'Pet Sitter') => void;
  onLogin: (role?: 'Pet Owner' | 'Pet Sitter') => void;
  onRegister: (role?: 'Pet Owner' | 'Pet Sitter') => void;
}

const UserRoleSelectionScreen: React.FC<UserRoleSelectionScreenProps> = ({
  onRoleSelected,
  onLogin,
  onRegister,
}) => {
  const [selectedRole, setSelectedRole] = useState<'Pet Owner' | 'Pet Sitter' | null>(null);

  const handleRoleSelect = (role: 'Pet Owner' | 'Pet Sitter') => {
    setSelectedRole(role);
    onRoleSelected(role);
    // Go directly to signup form for the selected role
    onRegister(role);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Image
            source={require('../../assets/images/icon.png')}
            style={styles.logo}
          />
          <Text style={styles.title}>Welcome to Petsit Connect</Text>
          <Text style={styles.subtitle}>
            Choose your role to get started
          </Text>
        </View>

        <View style={styles.roleContainer}>
          <TouchableOpacity
            style={[styles.roleCard, selectedRole === 'Pet Owner' && styles.selectedRoleCard]}
            onPress={() => handleRoleSelect('Pet Owner')}
          >
            <View style={styles.roleIcon}>
              <Ionicons name="person" size={48} color="#4CAF50" />
            </View>
            <Text style={styles.roleTitle}>Pet Owner</Text>
            <Text style={styles.roleDescription}>
              Find trusted pet sitters to care for your beloved pets
            </Text>
            <View style={styles.roleFeatures}>
              <View style={styles.feature}>
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                <Text style={styles.featureText}>Find verified sitters</Text>
              </View>
              <View style={styles.feature}>
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                <Text style={styles.featureText}>Book appointments</Text>
              </View>
              <View style={styles.feature}>
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                <Text style={styles.featureText}>Track your pets</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.roleCard, selectedRole === 'Pet Sitter' && styles.selectedRoleCard]}
            onPress={() => handleRoleSelect('Pet Sitter')}
          >
            <View style={styles.roleIcon}>
              <Ionicons name="paw" size={48} color="#FF9800" />
            </View>
            <Text style={styles.roleTitle}>Pet Sitter</Text>
            <Text style={styles.roleDescription}>
              Offer your pet care services and earn money doing what you love
            </Text>
            <View style={styles.roleFeatures}>
              <View style={styles.feature}>
                <Ionicons name="checkmark-circle" size={16} color="#FF9800" />
                <Text style={styles.featureText}>Set your rates</Text>
              </View>
              <View style={styles.feature}>
                <Ionicons name="checkmark-circle" size={16} color="#FF9800" />
                <Text style={styles.featureText}>Manage bookings</Text>
              </View>
              <View style={styles.feature}>
                <Ionicons name="checkmark-circle" size={16} color="#FF9800" />
                <Text style={styles.featureText}>Build your profile</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.authOptions}>
          <Text style={styles.authText}>Already have an account?</Text>
          <TouchableOpacity style={styles.signInButton} onPress={() => onLogin()}>
            <Text style={styles.signInButtonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
  roleContainer: {
    marginBottom: 40,
  },
  roleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  selectedRoleCard: {
    borderWidth: 2,
    borderColor: '#F59E0B',
    backgroundColor: '#FFFBEB',
  },
  roleIcon: {
    alignItems: 'center',
    marginBottom: 16,
  },
  roleTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 8,
  },
  roleDescription: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  roleFeatures: {
    gap: 8,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 8,
  },
  authOptions: {
    alignItems: 'center',
  },
  authText: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 16,
  },
  signInButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  signInButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default UserRoleSelectionScreen; 