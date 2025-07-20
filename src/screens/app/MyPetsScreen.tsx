import React, { useState } from 'react';
import { Image, Modal, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const pets = [
  { name: 'Max', type: 'Dog', breed: 'Golden Retriever', age: '3 years' },
  { name: 'Luna', type: 'Cat', breed: 'Siamese', age: '2 years' }
];

const MyPetsScreen = () => {
  const [selectedPet, setSelectedPet] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8F9FA' }}>
      <ScrollView style={{ flex: 1 }}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Pets</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
            {pets.map((pet, index) => (
              <TouchableOpacity
                key={index}
                style={styles.petCard}
                onPress={() => {
                  setSelectedPet(pet);
                  setModalVisible(true);
                }}
                activeOpacity={0.8}
              >
                <Image
                  source={pet.type === 'Dog' ? require('../../assets/images/dog.png') : require('../../assets/images/cat.png')}
                  style={styles.petImage}
                />
                <View style={styles.petInfo}>
                  <Text style={styles.petName}>{pet.name}</Text>
                  <Text style={styles.petDetails}>{pet.breed}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 32, alignItems: 'center', minWidth: 220 }}>
            {selectedPet && (
              <>
                <Image
                  source={selectedPet.type === 'Dog' ? require('../../assets/images/dog.png') : require('../../assets/images/cat.png')}
                  style={{ width: 80, height: 80, borderRadius: 16, marginBottom: 16 }}
                />
                <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 8 }}>{selectedPet.name}</Text>
                <Text style={{ fontSize: 16, color: '#888', marginBottom: 16 }}>{selectedPet.breed}</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)} style={{ marginTop: 8 }}>
                  <Text style={{ color: '#F59E0B', fontWeight: 'bold', fontSize: 16 }}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  section: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  petCard: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    width: 120,
    height: 120,
    margin: 8,
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
    marginBottom: 8,
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
});

export default MyPetsScreen; 