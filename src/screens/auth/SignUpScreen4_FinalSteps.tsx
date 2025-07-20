import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Alert,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface SignUpScreen4_FinalStepsProps {
  userRole: 'Pet Owner' | 'Pet Sitter';
  selectedPetTypes: ('dogs' | 'cats')[];
  selectedBreeds: string[];
  onComplete: (user: any) => void;
  onBack?: () => void;
}

const SignUpScreen4_FinalSteps: React.FC<SignUpScreen4_FinalStepsProps> = ({ 
  userRole, 
  selectedPetTypes, 
  selectedBreeds, 
  onComplete, 
  onBack 
}) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleComplete = async () => {
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);
    try {
      // Simulate user creation
      const user = {
        id: '1',
        firstName,
        lastName,
        email,
        userRole,
        selectedPetTypes,
        selectedBreeds,
        isVerified: false,
        createdAt: new Date().toISOString(),
      };

      // In a real app, you would call your auth service here
      // await authService.register(user);
      
      onComplete(user);
    } catch (error) {
      Alert.alert('Registration Failed', 'Please try again');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {onBack && (
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
      )}
      <Text style={styles.progressText}>3/4</Text>

      <View style={styles.content}>
        <Text style={styles.title}>Almost There!</Text>
        <Text style={styles.description}>
          Let's create your account and get you started on your pet journey.
        </Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="First Name"
            value={firstName}
            onChangeText={setFirstName}
            autoCapitalize="words"
          />
          <TextInput
            style={styles.input}
            placeholder="Last Name"
            value={lastName}
            onChangeText={setLastName}
            autoCapitalize="words"
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <View style={styles.passwordContainer}>
            <TextInput
              style={[styles.input, styles.passwordInput]}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.passwordToggle}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons
                name={showPassword ? 'eye-off' : 'eye'}
                size={20}
                color="#666"
              />
            </TouchableOpacity>
          </View>
          <View style={styles.passwordContainer}>
            <TextInput
              style={[styles.input, styles.passwordInput]}
              placeholder="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.passwordToggle}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <Ionicons
                name={showConfirmPassword ? 'eye-off' : 'eye'}
                size={20}
                color="#666"
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Account Summary</Text>
          <Text style={styles.summaryText}>Role: {userRole}</Text>
          <Text style={styles.summaryText}>Pet Types: {selectedPetTypes.join(', ')}</Text>
          {selectedBreeds.length > 0 && (
            <Text style={styles.summaryText}>Breeds: {selectedBreeds.join(', ')}</Text>
          )}
        </View>
      </View>

      <TouchableOpacity
        style={[styles.completeButton, isLoading && styles.disabledButton]}
        onPress={handleComplete}
        disabled={isLoading}
      >
        <Text style={styles.completeButtonText}>
          {isLoading ? 'Creating Account...' : 'Create Account'}
        </Text>
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
  inputContainer: {
    width: '100%',
  },
  input: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
    width: '100%',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    marginBottom: 15,
    width: '100%',
  },
  passwordInput: {
    flex: 1,
    marginBottom: 0,
    backgroundColor: 'transparent',
  },
  passwordToggle: {
    padding: 15,
  },
  summaryContainer: {
    width: '100%',
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#333',
  },
  summaryText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 5,
    color: '#666',
  },
  completeButton: {
    backgroundColor: '#F59E0B',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
});

export default SignUpScreen4_FinalSteps; 