import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface SignUpScreen1_UserRoleProps {
  onNext: (userRole: 'Pet Owner' | 'Pet Sitter') => void;
  onBack?: () => void;
}

const SignUpScreen1_UserRole: React.FC<SignUpScreen1_UserRoleProps> = ({ onNext, onBack }) => {
  const [selectedRole, setSelectedRole] = useState<'Pet Owner' | 'Pet Sitter' | null>(null);

  const handleContinue = () => {
    if (selectedRole) {
      onNext(selectedRole);
    } else {
      // Optionally show a warning if no role is selected
      alert('Please select a role to continue.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {onBack && (
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
      )}
      <Text style={styles.progressText}>1/4</Text>

      <View style={styles.content}>
        <Text style={styles.title}>Tell us about yourself</Text>
        <Text style={styles.description}>
          Are you a Pet Owner or a Pet Sitter ready to find matches for pets?
        </Text>

        <View style={styles.roleContainer}>
          <TouchableOpacity
            style={[styles.roleButton, selectedRole === 'Pet Owner' && styles.selectedRoleButton]}
            onPress={() => setSelectedRole('Pet Owner')}
          >
            <Ionicons name="person" size={50} color={selectedRole === 'Pet Owner' ? '#F59E0B' : '#4CAF50'} />
            <Text style={[styles.roleButtonText, selectedRole === 'Pet Owner' && styles.selectedRoleButtonText]}>
              Pet Owner
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.roleButton, selectedRole === 'Pet Sitter' && styles.selectedRoleButton]}
            onPress={() => setSelectedRole('Pet Sitter')}
          >
            <Ionicons name="paw" size={50} color={selectedRole === 'Pet Sitter' ? '#F59E0B' : '#FF9800'} />
            <Text style={[styles.roleButtonText, selectedRole === 'Pet Sitter' && styles.selectedRoleButtonText]}>
              Pet Sitter
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.continueButton, !selectedRole && styles.disabledButton]}
        onPress={handleContinue}
        disabled={!selectedRole}
      >
        <Text style={styles.continueButtonText}>Continue</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 1,
  },
  progressText: {
    alignSelf: 'flex-end',
    fontSize: 16,
    color: '#666',
    marginTop: 20,
    marginRight: 10,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    color: '#333',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
    color: '#666',
    lineHeight: 24,
  },
  roleContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 20,
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
  continueButton: {
    backgroundColor: '#F59E0B',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    width: '75%',
    marginBottom: 20,
  },
  disabledButton: {
    backgroundColor: '#FFD7A0',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default SignUpScreen1_UserRole; 