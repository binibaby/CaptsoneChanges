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

interface PetType {
  id: 'dogs' | 'cats';
  name: string;
  image: any; // Using 'any' for require results, as exact type can be complex
}

interface SignUpScreen2_PetTypeProps {
  userRole: 'Pet Owner' | 'Pet Sitter';
  onNext: (selectedPetTypes: ('dogs' | 'cats')[]) => void;
  onBack?: () => void;
}

const petTypes: PetType[] = [
  { id: 'dogs', name: 'Dogs', image: require('../../assets/images/dog.png') },
  { id: 'cats', name: 'Cats', image: require('../../assets/images/cat.png') },
];

const SignUpScreen2_PetType: React.FC<SignUpScreen2_PetTypeProps> = ({ userRole, onNext, onBack }) => {
  const [selectedPetTypes, setSelectedPetTypes] = useState<('dogs' | 'cats')[]>([]);

  const handleSelectPetType = (typeId: 'dogs' | 'cats') => {
    if (selectedPetTypes.includes(typeId)) {
      setSelectedPetTypes(selectedPetTypes.filter((id) => id !== typeId));
    } else {
      setSelectedPetTypes([...selectedPetTypes, typeId]);
    }
  };

  const handleContinue = () => {
    if (selectedPetTypes.length > 0) {
      onNext(selectedPetTypes);
    } else {
      alert('Please select at least one pet type.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {onBack && (
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
      )}
      <Text style={styles.progressText}>2/4</Text>

      <View style={styles.content}>
        <Text style={styles.title}>Tell us about your pets</Text>
        <Text style={styles.description}>
          What type of animal are you looking to {userRole === 'Pet Owner' ? 'find a sitter for' : 'sit'}?
          Don't worry, you can always change this later.
        </Text>

        <View style={styles.petTypeContainer}>
          {petTypes.map((type: PetType) => (
            <TouchableOpacity
              key={type.id}
              style={[
                styles.petTypeButton,
                selectedPetTypes.includes(type.id) && styles.selectedPetTypeButton,
              ]}
              onPress={() => handleSelectPetType(type.id)}
            >
              <Image source={type.image} style={styles.petTypeImage} />
              <Text
                style={[
                  styles.petTypeButtonText,
                  selectedPetTypes.includes(type.id) && styles.selectedPetTypeButtonText,
                ]}
              >
                {type.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.continueButton, selectedPetTypes.length === 0 && styles.disabledButton]}
          onPress={handleContinue}
          disabled={selectedPetTypes.length === 0}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
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
  petTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 20,
  },
  petTypeButton: {
    width: 100,
    height: 100,
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
  selectedPetTypeButton: {
    borderColor: '#F59E0B',
    backgroundColor: '#FFFBEB',
  },
  petTypeImage: {
    width: 50,
    height: 50,
    marginBottom: 5,
  },
  petTypeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  selectedPetTypeButtonText: {
    color: '#F59E0B',
  },
  buttonContainer: {
    width: '75%',
    marginBottom: 30,
    alignSelf: 'center',
  },
  continueButton: {
    backgroundColor: '#F59E0B',
    paddingVertical: 15,
    borderRadius: 15,
    alignItems: 'center',
    width: '100%',
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

export default SignUpScreen2_PetType; 