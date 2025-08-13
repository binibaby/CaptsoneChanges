import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface Breed {
  id: string;
  name: string;
  category: 'dogs' | 'cats';
}

interface SignUpScreen3_BreedPreferencesProps {
  userRole: 'Pet Owner' | 'Pet Sitter';
  selectedPetTypes: ('dogs' | 'cats')[];
  onNext: (selectedBreeds: string[]) => void;
  onBack?: () => void;
}

const dogBreeds: Breed[] = [
  { id: 'labrador', name: 'Labrador Retriever', category: 'dogs' },
  { id: 'golden', name: 'Golden Retriever', category: 'dogs' },
  { id: 'german-shepherd', name: 'German Shepherd', category: 'dogs' },
  { id: 'bulldog', name: 'Bulldog', category: 'dogs' },
  { id: 'beagle', name: 'Beagle', category: 'dogs' },
  { id: 'poodle', name: 'Poodle', category: 'dogs' },
  { id: 'rottweiler', name: 'Rottweiler', category: 'dogs' },
  { id: 'yorkshire', name: 'Yorkshire Terrier', category: 'dogs' },
  { id: 'boxer', name: 'Boxer', category: 'dogs' },
  { id: 'dachshund', name: 'Dachshund', category: 'dogs' },
];

const catBreeds: Breed[] = [
  { id: 'persian', name: 'Persian', category: 'cats' },
  { id: 'siamese', name: 'Siamese', category: 'cats' },
  { id: 'maine-coon', name: 'Maine Coon', category: 'cats' },
  { id: 'ragdoll', name: 'Ragdoll', category: 'cats' },
  { id: 'british-shorthair', name: 'British Shorthair', category: 'cats' },
  { id: 'abyssinian', name: 'Abyssinian', category: 'cats' },
  { id: 'russian-blue', name: 'Russian Blue', category: 'cats' },
  { id: 'bengal', name: 'Bengal', category: 'cats' },
  { id: 'sphynx', name: 'Sphynx', category: 'cats' },
  { id: 'scottish-fold', name: 'Scottish Fold', category: 'cats' },
];

const SignUpScreen3_BreedPreferences: React.FC<SignUpScreen3_BreedPreferencesProps> = ({ 
  userRole, 
  selectedPetTypes, 
  onNext, 
  onBack 
}) => {
  const [selectedBreeds, setSelectedBreeds] = useState<string[]>([]);

  const handleSelectBreed = (breedId: string) => {
    if (selectedBreeds.includes(breedId)) {
      setSelectedBreeds(selectedBreeds.filter((id) => id !== breedId));
    } else {
      setSelectedBreeds([...selectedBreeds, breedId]);
    }
  };

  const handleContinue = () => {
    onNext(selectedBreeds);
  };

  const allBreeds = [...dogBreeds, ...catBreeds];
  const availableBreeds = allBreeds.filter((breed) => selectedPetTypes.includes(breed.category));

  return (
    <SafeAreaView style={styles.container}>
      {onBack && (
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
      )}
      <Text style={styles.progressText}>3/4</Text>

      <View style={styles.content}>
        <Text style={styles.title}>Breed Preferences</Text>
        <Text style={styles.description}>
          Select the breeds you {userRole === 'Pet Owner' ? 'have or prefer' : 'are comfortable with'}.
          You can select multiple breeds 
        </Text>

        <View style={styles.breedContainer}>
          {availableBreeds.map((breed: Breed) => (
            <TouchableOpacity
              key={breed.id}
              style={[
                styles.breedButton,
                selectedBreeds.includes(breed.id) && styles.selectedBreedButton,
              ]}
              onPress={() => handleSelectBreed(breed.id)}
            >
              <Text
                style={[
                  styles.breedButtonText,
                  selectedBreeds.includes(breed.id) && styles.selectedBreedButtonText,
                ]}
              >
                {breed.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.continueButton, selectedBreeds.length === 0 && styles.disabledButton]}
          onPress={handleContinue}
          disabled={selectedBreeds.length === 0}
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
  breedContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingBottom: 20,
  },
  breedButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    margin: 5,
    backgroundColor: '#f5f5f5',
  },
  selectedBreedButton: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
  },
  breedButtonText: {
    fontSize: 14,
    color: '#333',
  },
  selectedBreedButtonText: {
    color: '#fff',
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
  continueButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#FFD7A0',
  },
});

export default SignUpScreen3_BreedPreferences; 