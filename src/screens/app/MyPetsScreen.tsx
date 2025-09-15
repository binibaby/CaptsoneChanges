import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Alert,
    Image,
    Modal,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';

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
    const [newPet, setNewPet] = useState({
        name: '',
        age: '',
        breed: '',
        type: 'Dog',
        image: null as string | null,
    });

    useEffect(() => {
        console.log('MyPetsScreen: User changed:', user);
        if (user) {
            console.log('MyPetsScreen: User details:', {
                id: user.id,
                email: user.email,
                token: user.token ? 'Present' : 'Missing',
                tokenLength: user.token?.length || 0
            });
            loadPetsFromBackend();
        } else {
            console.log('MyPetsScreen: No user found');
        }
    }, [user]);

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

            console.log('Loading pets from backend for user:', user.id);
            console.log('Using token:', user.token ? 'Present' : 'Missing');
            
            const response = await fetch('http://192.168.100.184:8000/api/pets', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${user.token}`,
                    'Accept': 'application/json',
                },
            });

            console.log('Pets API response status:', response.status);

            if (response.ok) {
                const result = await response.json();
                console.log('Pets API response:', result);
                if (result.success) {
                    console.log('Pets loaded from backend:', result.pets);
                    setPets(result.pets || []);
                } else {
                    console.log('Pets API returned success: false');
                    setPets([]);
                }
            } else {
                const errorText = await response.text();
                console.log('Pets API request failed with status:', response.status);
                console.log('Error response:', errorText);
                setPets([]);
            }
        } catch (error) {
            console.error('Error loading pets from backend:', error);
            setPets([]);
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

    const handleSavePet = async () => {
        if (!newPet.name.trim() || !newPet.age.trim() || !newPet.breed.trim()) {
            Alert.alert('Error', 'Please fill in all required fields (Name, Age, Breed)');
            return;
        }

        try {
            // Create pet object
            const petData = {
                name: newPet.name.trim(),
                age: newPet.age.trim(),
                breed: newPet.breed.trim(),
                type: newPet.type,
                image: newPet.image,
            };

            // Save to backend first
            const savedPet = await savePetToBackend(petData);

            // Add to local state with the saved pet data
            setPets(prev => [...prev, savedPet.pet]);

            // Reset form and close modal
            setNewPet({ name: '', age: '', breed: '', type: 'Dog', image: null });
            setAddPetModalVisible(false);
            
            Alert.alert('Success', 'Pet added successfully!');
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

            console.log('Saving pet with token:', user.token ? 'Present' : 'Missing');
            console.log('Pet data:', petData);

            const response = await fetch('http://192.168.100.184:8000/api/pets', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${user.token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(petData),
            });

            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Backend error response:', errorText);
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const result = await response.json();
            console.log('Pet saved to backend:', result);
            return result;
        } catch (error) {
            console.error('Error saving pet to backend:', error);
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
                            <View key={pet.id || index} style={styles.petCard}>
                                {pet.image ? (
                                    <Image source={{ uri: pet.image }} style={styles.petImage} />
                                ) : (
                                    <Image 
                                        source={pet.type === 'Dog' ? require('../../assets/images/dog.png') : require('../../assets/images/cat.png')} 
                                        style={styles.petImage} 
                                    />
                                )}
                                <View style={styles.petInfo}>
                                    <Text style={styles.petName}>{pet.name}</Text>
                                    <Text style={styles.petBreed}>{pet.breed}</Text>
                                    <Text style={styles.petAge}>{pet.age} years old</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>

            {/* Add Pet Modal */}
            <Modal
                visible={addPetModalVisible}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setAddPetModalVisible(false)}
            >
                <SafeAreaView style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setAddPetModalVisible(false)}>
                            <Ionicons name="close" size={24} color="#333" />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>Add New Pet</Text>
                        <TouchableOpacity onPress={handleSavePet}>
                            <Text style={styles.saveButtonText}>Save</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.modalContent}>
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
                            />
                        </View>
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
    modalContent: {
        flex: 1,
        padding: 20,
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
});

export default MyPetsScreen;