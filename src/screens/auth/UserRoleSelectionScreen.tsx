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
            source={require('../../assets/images/logo.png')}
            style={styles.logo}
          />
          <Text style={styles.title}>Welcome to Petsit Connect</Text>
          <Text style={styles.subtitle}>
            Choose your role to get started
          </Text>
        </View>

        <View style={styles.roleContainer}>
          <TouchableOpacity
            style={[styles.roleButton, selectedRole === 'Pet Owner' && styles.selectedRoleButton]}
            onPress={() => handleRoleSelect('Pet Owner')}
          >
            <Ionicons name="person" size={50} color={selectedRole === 'Pet Owner' ? '#F59E0B' : '#4CAF50'} />
            <Text style={[styles.roleButtonText, selectedRole === 'Pet Owner' && styles.selectedRoleButtonText]}>
              Pet Owner
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.roleButton, selectedRole === 'Pet Sitter' && styles.selectedRoleButton]}
            onPress={() => handleRoleSelect('Pet Sitter')}
          >
            <Ionicons name="paw" size={50} color={selectedRole === 'Pet Sitter' ? '#F59E0B' : '#FF9800'} />
            <Text style={[styles.roleButtonText, selectedRole === 'Pet Sitter' && styles.selectedRoleButtonText]}>
              Pet Sitter
            </Text>
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
    backgroundColor: '#fff',
    padding: 20,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
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
    textAlign: 'center',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
    color: '#666',
  },
  roleContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 40,
  },
  roleButton: {
    width: 120,
    height: 120,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 10,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  selectedRoleButton: {
    borderColor: '#F59E0B',
    backgroundColor: '#FFFBEB',
  },
  roleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
  },
  selectedRoleButtonText: {
    color: '#F59E0B',
  },
  authOptions: {
    alignItems: 'center',
  },
  authText: {
    fontSize: 16,
    color: '#666',
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