import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    Image,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const pets = [
  { name: 'Mochi', breed: 'Abyssinian', age: '2 years', image: require('../../assets/images/cat.png') },
  { name: 'Luna', breed: 'Chihuahua', age: '3 years', image: require('../../assets/images/dog.png') },
];

const quickActions = [
  { title: 'Find Sitter', icon: 'search', color: '#F59E0B', route: '/find-sitter-map' },
  { title: 'Book Service', icon: 'calendar', color: '#10B981', route: '/pet-owner-jobs' },
  { title: 'My Pets', icon: 'heart', color: '#EF4444', route: '/pet-owner-profile' },
  { title: 'Messages', icon: 'message-circle', color: '#3B82F6', route: '/pet-owner-messages' },
];

const PetOwnerDashboard = () => {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Header */}
        <View style={styles.headerCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Image source={require('../../assets/images/pawprint.png')} style={{ width: 28, height: 28, marginRight: 8 }} />
            <Text style={styles.headerTitle}>Pet Owner Dashboard</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => router.push('/pet-owner-notifications')} style={{ marginRight: 16 }}>
              <Ionicons name="notifications-outline" size={24} color="#222" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/pet-owner-profile')}>
              <Ionicons name="person-circle" size={28} color="#222" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Welcome Card */}
        <View style={styles.welcomeCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.welcomeTitle}>Welcome back!</Text>
            <Text style={styles.welcomeSubtitle}>Ready to find care for your pets?</Text>
          </View>
          <TouchableOpacity style={styles.welcomeButton} onPress={() => router.push('/find-sitter-map')}>
            <Text style={styles.welcomeButtonText}>Find Sitter</Text>
            <Ionicons name="arrow-forward" size={16} color="#fff" style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <Text style={[styles.sectionTitle, { marginTop: 28, marginBottom: 12 }]}>Quick Actions</Text>
        <View style={styles.quickActionsRow}>
          {quickActions.map((action) => (
            <TouchableOpacity key={action.title} style={styles.quickAction} onPress={() => router.push(action.route as any)}>
              <View style={[styles.quickActionIcon, { backgroundColor: action.color }]}> 
                <Feather name={action.icon as any} size={24} color="#fff" />
              </View>
              <Text style={styles.quickActionLabel}>{action.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* My Pets */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>My Pets</Text>
          <TouchableOpacity>
            <Text style={styles.sectionAction}>View All</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.petsRow}>
          {pets.map((pet) => (
            <View key={pet.name} style={styles.petCard}>
              <Image source={pet.image} style={styles.petImage} />
              <Text style={styles.petName}>{pet.name}</Text>
              <Text style={styles.petBreed}>{pet.breed}</Text>
              <Text style={styles.petAge}>{pet.age}</Text>
            </View>
          ))}
        </View>

        {/* Upcoming Bookings */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Upcoming Bookings</Text>
          <TouchableOpacity>
            <Text style={styles.sectionAction}>View All</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.bookingCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="person-circle" size={36} color="#888" style={{ marginRight: 10 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.bookingName}>Sarah Johnson</Text>
              <Text style={styles.bookingPet}>Mochi</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <View style={styles.bookingStatusBadge}><Text style={styles.bookingStatusText}>Confirmed</Text></View>
            </View>
          </View>
          <View style={styles.bookingMetaRow}>
            <Ionicons name="calendar-outline" size={16} color="#888" style={{ marginRight: 4 }} />
            <Text style={styles.bookingMetaText}>Dec 15, 2024</Text>
            <Ionicons name="time-outline" size={16} color="#888" style={{ marginLeft: 16, marginRight: 4 }} />
            <Text style={styles.bookingMetaText}>2:00 PM - 6:00 PM</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222',
  },
  welcomeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F59E0B',
    borderRadius: 18,
    marginHorizontal: 16,
    marginTop: 18,
    marginBottom: 18,
    padding: 18,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  welcomeTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  welcomeSubtitle: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.9,
  },
  welcomeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FBBF24',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginLeft: 12,
  },
  welcomeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
    marginRight: 2,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
  },
  sectionAction: {
    color: '#F59E0B',
    fontWeight: '600',
    fontSize: 15,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 12,
    marginBottom: 18,
  },
  quickAction: {
    alignItems: 'center',
    flex: 1,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  quickActionLabel: {
    fontSize: 13,
    color: '#222',
    fontWeight: '500',
    textAlign: 'center',
  },
  petsRow: {
    flexDirection: 'row',
    marginHorizontal: 12,
    marginBottom: 18,
  },
  petCard: {
    alignItems: 'center',
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 6,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  petImage: {
    width: 54,
    height: 54,
    marginBottom: 6,
  },
  petName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#222',
  },
  petBreed: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  petAge: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  bookingCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    marginHorizontal: 16,
    marginTop: 10,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  bookingName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
  },
  bookingPet: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  bookingStatusBadge: {
    backgroundColor: '#10B981',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 2,
    marginBottom: 4,
  },
  bookingStatusText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  bookingMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  bookingMetaText: {
    color: '#888',
    fontSize: 13,
    marginRight: 8,
  },
});

export default PetOwnerDashboard; 