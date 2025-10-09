import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActionSheetIOS,
    Alert,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { networkService } from '../../services/networkService';

interface Pet {
    id: string;
    name: string;
    age: string;
    breed: string;
    type: string;
    image?: string;
    notes?: string;
    createdAt: string;
}

const MyPetsScreen = () => {
    const router = useRouter();
    const { user } = useAuth();
    const [pets, setPets] = useState<Pet[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [addPetModalVisible, setAddPetModalVisible] = useState(false);
    const [petDetailsModalVisible, setPetDetailsModalVisible] = useState(false);
    const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
    const [petsLoaded, setPetsLoaded] = useState(false);
    const [imageLoadErrors, setImageLoadErrors] = useState<Set<string>>(new Set());
    const [validImages, setValidImages] = useState<Set<string>>(new Set());
    const [newPet, setNewPet] = useState({
        name: '',
        age: '',
        breed: '',
        type: 'Dog',
        image: null as string | null,
    });
    const scrollViewRef = useRef<ScrollView>(null);

    // Helper function to get the correct image URL
    const getImageUrl = (imagePath: string): string => {
        if (!imagePath) return '';
        if (imagePath.startsWith('http')) return imagePath;
        
        const baseUrl = networkService.getBaseUrl();
        if (!baseUrl) {
            console.log('❌ No base URL available for image:', imagePath);
            return imagePath;
        }
        
        // Handle different path formats
        let fullUrl: string;
        if (imagePath.startsWith('/storage/')) {
            // Direct storage path
            fullUrl = `${baseUrl}${imagePath}`;
        } else if (imagePath.startsWith('storage/')) {
            // Storage path without leading slash
            fullUrl = `${baseUrl}/${imagePath}`;
        } else {
            // Other paths
            const cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
            fullUrl = `${baseUrl}/${cleanPath}`;
        }
        
        console.log('🖼️ Constructed image URL:', fullUrl);
        console.log('🖼️ Original path:', imagePath);
        
        return fullUrl;
    };

    // Test if image URL is accessible and valid
    const testImageUrl = async (url: string): Promise<boolean> => {
        try {
            const response = await fetch(url, { method: 'HEAD' });
            if (!response.ok) {
                console.log(`🔍 Image URL test: ${url} - ❌ Not accessible (${response.status})`);
                return false;
            }
            
            const contentLength = response.headers.get('content-length');
            const contentType = response.headers.get('content-type');
            
            console.log(`🔍 Image URL test: ${url} - ✅ Accessible`);
            console.log(`🔍 Content-Length: ${contentLength} bytes`);
            console.log(`🔍 Content-Type: ${contentType}`);
            
            // Check if it's a valid image and has reasonable size
            const size = contentLength ? parseInt(contentLength) : 0;
            const isValidImage = contentType && contentType.startsWith('image/');
            const hasReasonableSize = size > 50; // At least 50 bytes (very low threshold)
            
            if (!isValidImage) {
                console.log(`🔍 Image URL test: ❌ Invalid content type: ${contentType}`);
                return false;
            }
            
            if (!hasReasonableSize) {
                console.log(`🔍 Image URL test: ❌ File too small: ${size} bytes`);
                return false;
            }
            
            console.log(`🔍 Image URL test: ✅ Valid image (${size} bytes, ${contentType})`);
            return true;
        } catch (error) {
            console.log(`🔍 Image URL test: ${url} - ❌ Error:`, error);
            return false;
        }
    };

    // Save pets to local storage
    const savePetsToStorage = async (petsData: Pet[]) => {
        try {
            await AsyncStorage.setItem('user_pets', JSON.stringify(petsData));
            console.log('💾 Pets saved to local storage:', petsData.length, 'pets');
        } catch (error) {
            console.error('❌ Error saving pets to storage:', error);
        }
    };

    // Load pets from local storage
    const loadPetsFromStorage = async (): Promise<Pet[]> => {
        try {
            const storedPets = await AsyncStorage.getItem('user_pets');
            if (storedPets) {
                const pets = JSON.parse(storedPets);
                console.log('💾 Pets loaded from local storage:', pets.length, 'pets');
                
                // Remove duplicates based on pet ID
                const uniquePets = pets.filter((pet: Pet, index: number, self: Pet[]) => 
                    index === self.findIndex(p => p.id === pet.id)
                );
                
                if (uniquePets.length !== pets.length) {
                    console.log('🧹 Removed duplicate pets:', pets.length - uniquePets.length, 'duplicates');
                    // Save the cleaned pets back to storage
                    await savePetsToStorage(uniquePets);
                }
                
                return uniquePets;
            }
        } catch (error) {
            console.error('❌ Error loading pets from storage:', error);
        }
        return [];
    };

    useEffect(() => {
        console.log('MyPetsScreen: User changed:', user);
        if (user) {
            console.log('MyPetsScreen: User details:', {
                id: user.id,
                email: user.email,
                token: user.token ? 'Present' : 'Missing',
                tokenLength: user.token?.length || 0
            });
            // Load pets from storage first, then from backend
            loadPetsFromStorage().then((storedPets) => {
                if (storedPets.length > 0) {
                    setPets(storedPets);
                    setPetsLoaded(true);
                    console.log('💾 Loaded pets from storage first');
                }
                // Always refresh from backend to get latest data
                loadPetsFromBackend();
            });
        } else {
            console.log('MyPetsScreen: No user found');
            setPets([]);
            setPetsLoaded(false);
        }
    }, [user]);

    // Reload pets when screen comes into focus to ensure persistence
    useFocusEffect(
        useCallback(() => {
            console.log('MyPetsScreen: Screen focused, pets loaded:', petsLoaded, 'current pets:', pets.length);
            if (user && user.token) {
                // Always load from storage first for instant display
                loadPetsFromStorage().then((storedPets) => {
                    if (storedPets.length > 0 && pets.length === 0) {
                        setPets(storedPets);
                        setPetsLoaded(true);
                        console.log('💾 Restored pets from storage on focus:', storedPets.length, 'pets');
                    } else if (pets.length > 0) {
                        console.log('💾 Pets already loaded, skipping storage restore');
                    }
                });
                // Only refresh from backend if we don't have pets or if it's been a while
                if (pets.length === 0) {
                    console.log('🔄 No pets in state, loading from backend...');
                    loadPetsFromBackend();
                } else {
                    console.log('🔄 Pets already in state, skipping backend reload');
                }
            }
        }, [user, petsLoaded, pets.length])
    );

    // Test image URLs when pets are loaded
    useEffect(() => {
        if (pets.length > 0) {
            console.log('🔍 Testing image URLs for', pets.length, 'pets...');
            pets.forEach(async (pet) => {
                if (pet.image) {
                    const imageUrl = getImageUrl(pet.image);
                    console.log(`🚀 FORCING image load attempt for pet: ${pet.name}`);
                    console.log(`🚀 Image URL: ${imageUrl}`);
                    // Always attempt to load server images - no validation blocking
                    setValidImages(prev => new Set(prev).add(pet.id));
                    console.log(`✅ Image marked as valid for pet: ${pet.name} - will attempt to load`);
                }
            });
        }
    }, [pets]);

    const loadPetsFromBackend = async () => {
        try {
            // Check if user and token exist
            if (!user) {
                console.log('User not found, skipping pets load');
                setPets([]);
                return;
            }
            
            if (!user.token) {
                console.log('Authentication token not found, skipping pets load');
                setPets([]);
                return;
            }

            console.log('🔄 Loading pets from backend for user:', user.id);
            console.log('🔄 Using token:', user.token ? 'Present' : 'Missing');
            
            const { makeApiCall } = await import('../../services/networkService');
            const response = await makeApiCall('/api/pets', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${user.token}`,
                    'Content-Type': 'application/json',
                },
            });

            console.log('🔄 Pets API response status:', response.status);

            if (response.ok) {
                const result = await response.json();
                console.log('🔄 Pets API response:', result);
                if (result.success) {
                    console.log('✅ Pets loaded from backend:', result.pets?.length || 0, 'pets');
                    const petsData = result.pets || [];
                    
                    // Verify each pet has required fields
                    const validPets = petsData.filter(pet => pet.id && pet.name && pet.age && pet.breed);
                    console.log('✅ Valid pets from backend:', validPets.length, 'out of', petsData.length);
                    
                    // Only update state if we got pets from backend, otherwise keep local state
                    if (validPets.length > 0) {
                        setPets(validPets);
                        setPetsLoaded(true);
                        await savePetsToStorage(validPets);
                        console.log('✅ Updated state with backend pets');
                    } else {
                        console.log('⚠️ Backend returned no pets, keeping local state');
                        // Don't override local state if backend is empty
                    }
                } else {
                    console.log('❌ Pets API returned success: false');
                    // Don't clear local state on API failure
                    console.log('⚠️ API failed, keeping local state');
                }
            } else {
                const errorText = await response.text();
                console.log('❌ Pets API request failed with status:', response.status);
                console.log('❌ Error response:', errorText);
                // Don't clear local state on API failure
                console.log('⚠️ API request failed, keeping local state');
            }
        } catch (error) {
            console.error('❌ Error loading pets from backend:', error);
            // Don't clear local state on error
            console.log('⚠️ Backend error, keeping local state');
        }
    };

    const refreshPets = async () => {
        setRefreshing(true);
        await loadPetsFromBackend();
        setRefreshing(false);
    };

    const handleAddPet = () => {
        setAddPetModalVisible(true);
    };

    const handlePetCardPress = (pet: Pet) => {
        setSelectedPet(pet);
        setPetDetailsModalVisible(true);
    };

    const handlePetCardLongPress = (pet: Pet) => {
        if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options: ['Cancel', 'Delete Pet'],
                    destructiveButtonIndex: 1,
                    cancelButtonIndex: 0,
                    title: `Options for ${pet.name}`,
                },
                (buttonIndex) => {
                    if (buttonIndex === 1) {
                        handleDeletePet(pet);
                    }
                }
            );
        } else {
            // For Android, show a simple alert with options
            Alert.alert(
                `Options for ${pet.name}`,
                'What would you like to do?',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete Pet', onPress: () => handleDeletePet(pet), style: 'destructive' }
                ]
            );
        }
    };

    const handleDeletePet = (pet: Pet) => {
        if (!pet) {
            console.error('❌ No pet provided for deletion');
            return;
        }
        
        Alert.alert(
            'Delete Pet',
            `Are you sure you want to delete ${pet.name}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'Delete', 
                    style: 'destructive',
                    onPress: () => deletePet(pet)
                }
            ]
        );
    };

    const deletePet = async (pet: Pet) => {
        try {
            if (!pet || !pet.id) {
                console.error('❌ Invalid pet data for deletion');
                Alert.alert('Error', 'Invalid pet data. Please try again.');
                return;
            }

            console.log('🗑️ Deleting pet from backend:', pet.name, 'ID:', pet.id);

            // Call backend API to delete pet
            if (user?.token) {
                const { makeApiCall } = await import('../../services/networkService');
                const response = await makeApiCall(`/api/pets/${pet.id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${user.token}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('❌ Backend delete failed:', response.status, errorText);
                    throw new Error(`Failed to delete pet from server: ${response.status}`);
                }

                const result = await response.json();
                console.log('✅ Pet deleted from backend:', result);
            } else {
                console.warn('⚠️ No auth token available, deleting locally only');
            }

            // Remove from local state
            const updatedPets = pets.filter(p => p.id !== pet.id);
            setPets(updatedPets);
            await savePetsToStorage(updatedPets);
            
            // Refresh pets from backend to ensure consistency
            try {
                await loadPetsFromBackend();
                console.log('🔄 Pets refreshed from backend after deletion');
            } catch (error) {
                console.warn('⚠️ Failed to refresh pets from backend:', error);
            }
            
            console.log('🗑️ Pet deleted successfully:', pet.name);
            
            Alert.alert('Success', 'Pet deleted successfully');
        } catch (error) {
            console.error('❌ Error deleting pet:', error);
            Alert.alert('Error', 'Failed to delete pet. Please try again.');
        }
    };


    const handleSavePet = async () => {
        if (!newPet.name.trim() || !newPet.age.trim() || !newPet.breed.trim()) {
            Alert.alert('Error', 'Please fill in all required fields (Name, Age, Breed)');
            return;
        }

        try {
            // Create pet object without image first
            const petData = {
                name: newPet.name.trim(),
                age: newPet.age.trim(),
                breed: newPet.breed.trim(),
                type: newPet.type,
            };

            // Save to backend first
            console.log('🚀 About to save pet to backend with data:', petData);
            const savedPet = await savePetToBackend(petData);
            console.log('✅ Pet saved to backend, response:', savedPet);
            
            // Upload image separately if it exists
            if (newPet.image && savedPet.pet) {
                try {
                    console.log('🖼️ Uploading image for pet:', savedPet.pet.id);
                    console.log('🖼️ Image URI to upload:', newPet.image);
                    await uploadPetImage(savedPet.pet.id, newPet.image);
                    console.log('✅ Image upload completed for pet:', savedPet.pet.id);
                } catch (error) {
                    console.error('❌ Error uploading image:', error);
                    // Don't fail the entire operation if image upload fails
                }
            }

            // Add to local state with the saved pet data (only if not already exists)
            const existingPet = pets.find(p => p.id === savedPet.pet.id);
            if (!existingPet) {
                const updatedPets = [...pets, savedPet.pet];
                setPets(updatedPets);
                setPetsLoaded(true);
                
                // Save to local storage immediately
                await savePetsToStorage(updatedPets);
                
                console.log('✅ Pet added to local state:', savedPet.pet.name);
                console.log('✅ Total pets now:', updatedPets.length);
            } else {
                console.log('⚠️ Pet already exists in local state, skipping duplicate add:', savedPet.pet.name);
                console.log('✅ Total pets now:', pets.length);
            }

            // Reset form and close modal
            setNewPet({ name: '', age: '', breed: '', type: 'Dog', image: null });
            setAddPetModalVisible(false);
            
            Alert.alert('Success', 'Pet added successfully and saved to backend!');
            
            // Verify backend persistence by reloading from backend (but don't wait for it)
            console.log('🔄 Verifying backend persistence in background...');
            setTimeout(async () => {
                try {
                    await loadPetsFromBackend();
                    console.log('✅ Backend persistence verified');
                } catch (error) {
                    console.log('⚠️ Backend verification failed, but pet is saved locally:', error);
                }
            }, 2000);
        } catch (error) {
            console.error('Error saving pet:', error);
            
            let errorMessage = 'Failed to save pet. Please try again.';
            
            if (error instanceof Error) {
                if (error.message.includes('User not found')) {
                    errorMessage = 'Please log in again to add pets.';
                } else if (error.message.includes('Authentication token not found')) {
                    errorMessage = 'Authentication expired. Please log in again.';
                } else if (error.message.includes('HTTP 401')) {
                    errorMessage = 'Authentication failed. Please log in again.';
                } else if (error.message.includes('HTTP 500')) {
                    errorMessage = 'Server error. Please try again later.';
                } else if (error.message.includes('Network')) {
                    errorMessage = 'Network error. Please check your connection.';
                }
            }
            
            Alert.alert('Error', errorMessage);
        }
    };

    const savePetToBackend = async (petData: any) => {
        try {
            // Check if user and token exist
            if (!user) {
                throw new Error('User not found. Please log in again.');
            }
            
            if (!user.token) {
                throw new Error('Authentication token not found. Please log in again.');
            }

            console.log('💾 Saving pet to backend with token:', user.token ? 'Present' : 'Missing');
            console.log('💾 Pet data being saved:', petData);

            const { makeApiCall } = await import('../../services/networkService');
            const response = await makeApiCall('/api/pets', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${user.token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(petData),
            });

            console.log('💾 Backend response status:', response.status);
            console.log('💾 Backend response headers:', response.headers);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Backend error response:', errorText);
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const result = await response.json();
            console.log('✅ Pet successfully saved to backend:', result);
            console.log('🔍 Response status:', response.status);
            console.log('🔍 Response headers:', response.headers);
            
            // Verify the pet was actually saved by checking the response
            if (result.success && result.pet && result.pet.id) {
                console.log('✅ Backend verification: Pet ID assigned:', result.pet.id);
                console.log('✅ Backend verification: Pet created at:', result.pet.created_at);
                console.log('✅ Backend verification: Pet image:', result.pet.image);
                return result;
            } else {
                console.error('❌ Backend did not return valid pet data:', result);
                throw new Error('Backend did not return valid pet data');
            }
        } catch (error) {
            console.error('❌ Error saving pet to backend:', error);
            throw error;
        }
    };

    const uploadPetImage = async (petId: string, imageUri: string) => {
        try {
            if (!user?.token) {
                throw new Error('Authentication token not found');
            }

            console.log('🖼️ Uploading image for pet:', petId);
            console.log('🖼️ Image URI:', imageUri);

            const formData = new FormData();
            formData.append('image', {
                uri: imageUri,
                type: 'image/jpeg',
                name: 'pet_image.jpg',
            } as any);
            formData.append('pet_id', petId);

            const { makeApiCall } = await import('../../services/networkService');
            const response = await makeApiCall('/api/pets/upload-image', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${user.token}`,
                    'Content-Type': 'multipart/form-data',
                },
                body: formData,
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const result = await response.json();
            console.log('✅ Image uploaded successfully:', result);
            
            // Update the pet in local state with the new image path
            if (result.success && result.image_path) {
                console.log('🔄 Updating pet image in local state for pet ID:', petId);
                console.log('🔄 New image path:', result.image_path);
                setPets(prevPets => {
                    const updatedPets = prevPets.map(pet => {
                        if (pet.id === petId) {
                            console.log('🔄 Found pet to update:', pet.name, 'Old image:', pet.image, 'New image:', result.image_path);
                            return { ...pet, image: result.image_path };
                        }
                        return pet;
                    });
                    console.log('🔄 Updated pets array:', updatedPets);
                    
                    // Save to local storage using the updated pets
                    savePetsToStorage(updatedPets);
                    console.log('✅ Updated pets saved to local storage');
                    
                    return updatedPets;
                });
                console.log('✅ Pet image updated in local state');
            }
            
            return result;
        } catch (error) {
            console.error('❌ Error uploading pet image:', error);
            throw error;
        }
    };

    const pickPetImage = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Required', 'Please grant camera roll permissions to upload a pet image.');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                setNewPet({ ...newPet, image: result.assets[0].uri });
            }
        } catch (error) {
            console.error('Error picking pet image:', error);
            Alert.alert('Error', 'Failed to pick image. Please try again.');
        }
    };

    const takePetPhoto = async () => {
        try {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Required', 'Please grant camera permissions to take a pet photo.');
                return;
            }

            const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                setNewPet({ ...newPet, image: result.assets[0].uri });
            }
        } catch (error) {
            console.error('Error taking pet photo:', error);
            Alert.alert('Camera Error', 'Failed to open camera. Please try again.');
        }
    };

    const pickPetImageModal = async () => {
        Alert.alert(
            'Select Pet Image',
            'Choose how you want to add a pet image',
            [
                { text: 'Camera', onPress: takePetPhoto },
                { text: 'Photo Library', onPress: pickPetImage },
                { text: 'Cancel', style: 'cancel' },
            ]
        );
    };


    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Pets</Text>
                <TouchableOpacity style={styles.addButton} onPress={handleAddPet}>
                    <Ionicons name="add" size={24} color="#F59E0B" />
                </TouchableOpacity>
            </View>

            <ScrollView 
                style={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={refreshPets} />
                }
            >
                {pets.length === 0 ? (
                    <View style={styles.noPetsContainer}>
                        <Ionicons name="paw" size={80} color="#E0E0E0" />
                        <Text style={styles.noPetsText}>No pets added yet</Text>
                        <Text style={styles.noPetsSubtext}>Tap the + button to add your first pet</Text>
                    </View>
                ) : (
                    <View style={styles.petsGrid}>
                        {pets.map((pet, index) => (
                            <TouchableOpacity 
                                key={pet.id || index} 
                                style={styles.petCard}
                                onPress={() => handlePetCardPress(pet)}
                                onLongPress={() => handlePetCardLongPress(pet)}
                                delayLongPress={500}
                            >
                                {(() => {
                                    console.log('🔍 Pet image check for:', pet.name);
                                    console.log('🔍 Pet image value:', pet.image);
                                    console.log('🔍 Starts with file://:', pet.image?.startsWith('file://'));
                                    console.log('🔍 Includes placeholder:', pet.image?.includes('placeholder'));
                                    console.log('🔍 Should show server image:', pet.image && !pet.image.startsWith('file://') && !pet.image.includes('placeholder'));
                                    return pet.image && !pet.image.startsWith('file://') && !pet.image.includes('placeholder');
                                })() ? (
                                    <Image 
                                        source={{ 
                                            uri: getImageUrl(pet.image),
                                            cache: 'force-cache'
                                        }} 
                                        style={styles.petImage}
                                        onLoadStart={() => {
                                            console.log('🚀 ATTEMPTING to load image for pet:', pet.name);
                                            console.log('🚀 Image URL:', getImageUrl(pet.image));
                                        }}
                                        onLoadEnd={() => {
                                            console.log('🏁 Image load ended for pet:', pet.name);
                                        }}
                                        onError={(error) => {
                                            console.log('❌ Pet image failed to load:', error.nativeEvent.error);
                                            console.log('❌ Failed image URI:', getImageUrl(pet.image));
                                            console.log('❌ Original image path:', pet.image);
                                            console.log('❌ Pet ID:', pet.id);
                                            console.log('🔄 Image failed but continuing to try...');
                                        }}
                                        onLoad={() => {
                                            console.log('🎉 SUCCESS: Pet image loaded successfully:', pet.name);
                                            console.log('🎉 SUCCESS: Image URL used:', getImageUrl(pet.image));
                                            console.log('🎉 SUCCESS: Showing actual uploaded image!');
                                            setValidImages(prev => new Set(prev).add(pet.id));
                                        }}
                                        resizeMode="cover"
                                        defaultSource={pet.type === 'Dog' ? require('../../assets/images/dog.png') : require('../../assets/images/cat.png')}
                                    />
                                ) : (
                                    <>
                                        {console.log('🖼️ USING DEFAULT IMAGE for pet:', pet.name, 'Type:', pet.type)}
                                        <Image 
                                            source={pet.type === 'Dog' ? require('../../assets/images/dog.png') : require('../../assets/images/cat.png')} 
                                            style={styles.petImage}
                                            onError={(error) => {
                                                console.log('❌ Default pet image failed to load:', error.nativeEvent.error);
                                            }}
                                            onLoad={() => {
                                                console.log('✅ Default pet image loaded successfully:', pet.name);
                                            }}
                                        />
                                    </>
                                )}
                                <View style={styles.petInfo}>
                                    <Text style={styles.petName}>{pet.name}</Text>
                                    <Text style={styles.petBreed}>{pet.breed}</Text>
                                    <Text style={styles.petAge}>{pet.age} years old</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </ScrollView>

            {/* Add Pet Modal */}
            <Modal
                visible={addPetModalVisible}
                animationType="slide"
                presentationStyle="fullScreen"
                onRequestClose={() => setAddPetModalVisible(false)}
            >
                <SafeAreaView style={styles.modalContainer}>
                    {/* Fixed Header */}
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setAddPetModalVisible(false)}>
                            <Ionicons name="close" size={24} color="#333" />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>Add New Pet</Text>
                        <TouchableOpacity onPress={handleSavePet}>
                            <Text style={styles.saveButtonText}>Save</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Content Area with proper spacing */}
                    <View style={styles.modalContentWrapper}>
                        <KeyboardAvoidingView 
                            style={styles.keyboardAvoidingView}
                            behavior="height"
                            keyboardVerticalOffset={0}
                        >
                            <ScrollView 
                                ref={scrollViewRef}
                                style={styles.modalContent}
                                contentContainerStyle={styles.modalContentContainer}
                                showsVerticalScrollIndicator={true}
                                keyboardShouldPersistTaps="handled"
                                automaticallyAdjustKeyboardInsets={false}
                                nestedScrollEnabled={true}
                            >
                        {/* Pet Image */}
                        <View style={styles.petImageSection}>
                            <TouchableOpacity onPress={pickPetImageModal} style={styles.petImageContainer}>
                                {newPet.image ? (
                                    <Image source={{ uri: newPet.image }} style={styles.petImagePreview} />
                                ) : (
                                    <View style={styles.petImagePlaceholder}>
                                        <Ionicons name="camera" size={32} color="#E0E0E0" />
                                        <Text style={styles.petImagePlaceholderText}>Add Photo</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        </View>

                        {/* Pet Type */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Pet Type *</Text>
                            <View style={styles.petTypeContainer}>
                                <TouchableOpacity
                                    style={[styles.petTypeButton, newPet.type === 'Dog' && styles.petTypeButtonActive]}
                                    onPress={() => setNewPet({ ...newPet, type: 'Dog' })}
                                >
                                    <Ionicons name="paw" size={20} color={newPet.type === 'Dog' ? '#FFF' : '#666'} />
                                    <Text style={[styles.petTypeButtonText, newPet.type === 'Dog' && styles.petTypeButtonTextActive]}>Dog</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.petTypeButton, newPet.type === 'Cat' && styles.petTypeButtonActive]}
                                    onPress={() => setNewPet({ ...newPet, type: 'Cat' })}
                                >
                                    <Ionicons name="paw" size={20} color={newPet.type === 'Cat' ? '#FFF' : '#666'} />
                                    <Text style={[styles.petTypeButtonText, newPet.type === 'Cat' && styles.petTypeButtonTextActive]}>Cat</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Pet Name */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Pet Name *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter pet name"
                                value={newPet.name}
                                onChangeText={(text) => setNewPet({ ...newPet, name: text })}
                            />
                        </View>

                        {/* Pet Age */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Age *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g., 2, 1.5, 6 months"
                                value={newPet.age}
                                onChangeText={(text) => setNewPet({ ...newPet, age: text })}
                                keyboardType="numeric"
                                returnKeyType="next"
                            />
                        </View>

                        {/* Pet Breed */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Breed *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter breed"
                                value={newPet.breed}
                                onChangeText={(text) => setNewPet({ ...newPet, breed: text })}
                                returnKeyType="done"
                            />
                        </View>
                            </ScrollView>
                        </KeyboardAvoidingView>
                    </View>
                </SafeAreaView>
            </Modal>

            {/* Pet Details Modal */}
            <Modal
                visible={petDetailsModalVisible}
                animationType="slide"
                presentationStyle="fullScreen"
                onRequestClose={() => setPetDetailsModalVisible(false)}
            >
                <SafeAreaView style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setPetDetailsModalVisible(false)}>
                            <Ionicons name="close" size={24} color="#333" />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>Pet Details</Text>
                        <View style={{ width: 24 }} />
                    </View>

                    <ScrollView style={styles.modalContent} contentContainerStyle={styles.petDetailsContainer}>
                        {selectedPet && (
                            <>
                                {/* Pet Image */}
                                <View style={styles.petDetailsImageSection}>
                                    {selectedPet.image && !selectedPet.image.startsWith('file://') && !selectedPet.image.includes('placeholder') ? (
                                        <Image 
                                            source={{ 
                                                uri: getImageUrl(selectedPet.image),
                                                cache: 'reload'
                                            }} 
                                            style={styles.petDetailsImage}
                                            onError={(error) => {
                                                console.log('❌ Pet details image failed to load:', error.nativeEvent.error);
                                                console.log('❌ Failed image URI:', getImageUrl(selectedPet.image));
                                                console.log('❌ Pet details image path:', selectedPet.image);
                                                console.log('🔄 Switching to default image for pet details');
                                                setImageLoadErrors(prev => new Set(prev).add(selectedPet.id));
                                            }}
                                            onLoad={() => {
                                                console.log('✅ Pet details image loaded successfully');
                                                console.log('✅ Pet details image URL:', getImageUrl(selectedPet.image));
                                                setValidImages(prev => new Set(prev).add(selectedPet.id));
                                            }}
                                            resizeMode="cover"
                                            defaultSource={selectedPet.type === 'Dog' ? require('../../assets/images/dog.png') : require('../../assets/images/cat.png')}
                                        />
                                    ) : (
                                        <View style={styles.petDetailsImagePlaceholder}>
                                            <Ionicons name="paw" size={60} color="#E0E0E0" />
                                        </View>
                                    )}
                                </View>

                                {/* Pet Information */}
                                <View style={styles.petDetailsInfo}>
                                    <View style={styles.petDetailsField}>
                                        <Text style={styles.petDetailsLabel}>Name</Text>
                                        <Text style={styles.petDetailsValue}>{selectedPet.name}</Text>
                                    </View>

                                    <View style={styles.petDetailsField}>
                                        <Text style={styles.petDetailsLabel}>Type</Text>
                                        <Text style={styles.petDetailsValue}>{selectedPet.type}</Text>
                                    </View>

                                    <View style={styles.petDetailsField}>
                                        <Text style={styles.petDetailsLabel}>Breed</Text>
                                        <Text style={styles.petDetailsValue}>{selectedPet.breed}</Text>
                                    </View>

                                    <View style={styles.petDetailsField}>
                                        <Text style={styles.petDetailsLabel}>Age</Text>
                                        <Text style={styles.petDetailsValue}>{selectedPet.age} years old</Text>
                                    </View>

                                    {selectedPet.notes && (
                                        <View style={styles.petDetailsField}>
                                            <Text style={styles.petDetailsLabel}>Notes</Text>
                                            <Text style={styles.petDetailsValue}>{selectedPet.notes}</Text>
                                        </View>
                                    )}
                                </View>
                            </>
                        )}
                    </ScrollView>
                </SafeAreaView>
            </Modal>

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
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    addButton: {
        padding: 8,
        backgroundColor: '#FEF3C7',
        borderRadius: 20,
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    noPetsContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    noPetsText: {
        fontSize: 18,
        color: '#666',
        marginTop: 16,
        fontWeight: '500',
    },
    noPetsSubtext: {
        fontSize: 14,
        color: '#999',
        marginTop: 8,
        textAlign: 'center',
    },
    petsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 16,
    },
    petCard: {
        width: '48%',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        marginBottom: 16,
    },
    petImage: {
        width: 80,
        height: 80,
        borderRadius: 40,
        marginBottom: 12,
        backgroundColor: '#F0F0F0',
    },
    petInfo: {
        alignItems: 'center',
    },
    petName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    petBreed: {
        fontSize: 14,
        color: '#666',
        marginBottom: 2,
    },
    petAge: {
        fontSize: 12,
        color: '#999',
    },
    // Modal styles
    modalContainer: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
        height: 70,
        position: 'absolute',
        top: 40,
        left: 0,
        right: 0,
        zIndex: 1000,
        elevation: 5,
    },
    modalContentWrapper: {
        flex: 1,
        marginTop: 110,
        backgroundColor: '#F8F9FA',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#F59E0B',
    },
    keyboardAvoidingView: {
        flex: 1,
    },
    modalContent: {
        flex: 1,
    },
    modalContentContainer: {
        padding: 20,
        paddingTop: 30,
        paddingBottom: 150,
        flexGrow: 1,
        minHeight: 600,
    },
    petImageSection: {
        alignItems: 'center',
        marginBottom: 30,
    },
    petImageContainer: {
        alignItems: 'center',
    },
    petImagePreview: {
        width: 120,
        height: 120,
        borderRadius: 60,
    },
    petImagePlaceholder: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#F0F0F0',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#E0E0E0',
        borderStyle: 'dashed',
    },
    petImagePlaceholderText: {
        fontSize: 14,
        color: '#999',
        marginTop: 8,
    },
    inputGroup: {
        marginBottom: 30,
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
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 12,
        fontSize: 16,
        backgroundColor: '#fff',
    },
    petTypeContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    petTypeButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        backgroundColor: '#FFF',
        gap: 8,
    },
    petTypeButtonActive: {
        backgroundColor: '#F59E0B',
        borderColor: '#F59E0B',
    },
    petTypeButtonText: {
        fontSize: 16,
        color: '#666',
        fontWeight: '500',
    },
    petTypeButtonTextActive: {
        color: '#FFF',
    },
    // Pet Details Modal styles
    petDetailsContainer: {
        padding: 20,
        paddingBottom: 50,
    },
    petDetailsImageSection: {
        alignItems: 'center',
        marginTop: 60,
        marginBottom: 30,
    },
    petDetailsImage: {
        width: 160,
        height: 160,
        borderRadius: 80,
    },
    petDetailsImagePlaceholder: {
        width: 160,
        height: 160,
        borderRadius: 80,
        backgroundColor: '#F0F0F0',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#E0E0E0',
        borderStyle: 'dashed',
    },
    petDetailsInfo: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    petDetailsField: {
        marginBottom: 20,
    },
    petDetailsLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
        marginBottom: 5,
    },
    petDetailsValue: {
        fontSize: 18,
        color: '#333',
        fontWeight: '500',
    },
});

export default MyPetsScreen;