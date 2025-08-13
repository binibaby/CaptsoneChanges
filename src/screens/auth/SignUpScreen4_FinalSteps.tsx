import { Ionicons } from '@expo/vector-icons';
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
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('other');
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isFormValid = () => {
    return firstName.trim() && lastName.trim() && phone.trim() && age.trim() && address.trim();
  };

  const handleComplete = async () => {
    console.log('Step 4 - Final registration data:', { firstName, lastName, phone, age, gender, address });
    
    if (!isFormValid()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (parseInt(age) < 1 || parseInt(age) > 120) {
      Alert.alert('Error', 'Please enter a valid age (1-120)');
      return;
    }

    setIsLoading(true);
    try {
      const user = {
        id: '1',
        firstName,
        lastName,
        phone,
        age: parseInt(age),
        address,
        gender,
        userRole,
        selectedPetTypes,
        selectedBreeds,
        isVerified: false,
        verificationPending: userRole === 'Pet Sitter',
        createdAt: new Date().toISOString(),
      };

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
      <Text style={styles.progressText}>4/4</Text>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerSection}>
          <View style={styles.iconContainer}>
            <Image source={require('../../assets/images/logo.png')} style={styles.logoImage} />
          </View>
          <Text style={styles.title}>Complete Your Profile</Text>
          <Text style={styles.description}>
            Please provide your personal information to complete your registration.
          </Text>
        </View>

        <View style={styles.formSection}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>First Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your first name"
              value={firstName}
              onChangeText={setFirstName}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Last Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your last name"
              value={lastName}
              onChangeText={setLastName}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Phone Number *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your phone number (e.g., 09123456789)"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Age *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your age"
              value={age}
              onChangeText={setAge}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Gender *</Text>
            <View style={styles.genderContainer}>
              <TouchableOpacity
                style={[styles.genderButton, gender === 'male' && styles.genderButtonActive]}
                onPress={() => setGender('male')}
              >
                <Ionicons 
                  name="male" 
                  size={20} 
                  color={gender === 'male' ? '#fff' : '#666'} 
                />
                <Text style={[styles.genderButtonText, gender === 'male' && styles.genderButtonTextActive]}>
                  Male
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.genderButton, gender === 'female' && styles.genderButtonActive]}
                onPress={() => setGender('female')}
              >
                <Ionicons 
                  name="female" 
                  size={20} 
                  color={gender === 'female' ? '#fff' : '#666'} 
                />
                <Text style={[styles.genderButtonText, gender === 'female' && styles.genderButtonTextActive]}>
                  Female
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.genderButton, gender === 'other' && styles.genderButtonActive]}
                onPress={() => setGender('other')}
              >
                <Ionicons 
                  name="person" 
                  size={20} 
                  color={gender === 'other' ? '#fff' : '#666'} 
                />
                <Text style={[styles.genderButtonText, gender === 'other' && styles.genderButtonTextActive]}>
                  Other
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Address *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Enter your address"
              value={address}
              onChangeText={setAddress}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.continueButton, (!isFormValid() || isLoading) && styles.disabledButton]}
          onPress={handleComplete}
          disabled={!isFormValid() || isLoading}
        >
          <Text style={styles.continueButtonText}>
            {isLoading 
              ? 'Creating Account...' 
              : 'Complete Registration'
            }
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 1,
    padding: 8,
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
  },
  headerSection: {
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 20,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFBEB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  logoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#333',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  formSection: {
    paddingHorizontal: 10,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 15,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#F8F9FA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  genderButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 4,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  genderButtonActive: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
    shadowColor: '#F59E0B',
    shadowOpacity: 0.3,
  },
  genderButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginLeft: 4,
  },
  genderButtonTextActive: {
    color: '#FFFFFF',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    width: '75%',
    marginBottom: 30,
    alignSelf: 'center',
  },
  continueButton: {
    backgroundColor: '#F59E0B',
    paddingVertical: 16,
    borderRadius: 15,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledButton: {
    backgroundColor: '#FFD7A0',
    shadowOpacity: 0.1,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default SignUpScreen4_FinalSteps;