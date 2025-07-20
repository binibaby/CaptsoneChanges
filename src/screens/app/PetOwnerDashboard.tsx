import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
// @ts-ignore
import FindIcon from '../../assets/icons/find.png';
// @ts-ignore
import BookIcon from '../../assets/icons/book.png';
// @ts-ignore
import PetsHeartIcon from '../../assets/icons/petsheart.png';
// @ts-ignore
import MessageIcon from '../../assets/icons/message.png';

const pets = [
  { name: 'Mochi', breed: 'Abyssinian', age: '2 years', image: require('../../assets/images/cat.png') },
  { name: 'Luna', breed: 'Chihuahua', age: '3 years', image: require('../../assets/images/dog.png') },
];

const quickActions = [
  { title: 'Find Sitter', icon: FindIcon, color: '#5AC8C8', route: '/find-sitter-map' },
  { title: 'Book Service', icon: BookIcon, color: '#DEE2E6', route: '/pet-owner-jobs' },
  { title: 'My Pets', icon: PetsHeartIcon, color: '#5AC8C8', route: '/my-pets' },
  { title: 'Messages', icon: MessageIcon, color: '#DEE2E6', route: '/pet-owner-messages' },
];

const PetOwnerDashboard = () => {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FAFAFA' }}>
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 110, zIndex: 0 }}>
        <LinearGradient colors={['#1976D2', '#FFD600']} style={{ flex: 1 }} />
      </View>
        {/* Header */}
      <LinearGradient colors={['#1976D2', '#FFD600']} style={styles.headerGradient}>
        <View style={[styles.headerCard, { backgroundColor: 'transparent', shadowOpacity: 0 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Image source={require('../../assets/images/logo.png')} style={styles.logoImage} />
            <Text style={styles.headerTitle}>Pet Owner Dashboard</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => router.push('/pet-owner-notifications')} style={styles.iconButtonLeft}>
              <View style={[styles.iconCircle, styles.iconCircleBlue]}><Ionicons name="notifications-outline" size={22} color="#1976D2" /></View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/pet-owner-profile')} style={styles.iconButtonRight}>
              <View style={[styles.iconCircle, styles.iconCircleBlue]}><Ionicons name="person-circle" size={26} color="#1976D2" /></View>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
        {/* Welcome Card */}
      <LinearGradient colors={['#FFD600', '#FAFAFA']} style={styles.welcomeCardAlt}>
          <View style={{ flex: 1 }}>
          <Text style={styles.welcomeTitleAlt}>Hi there! 🐾</Text>
          <Text style={styles.welcomeSubtitleAlt}>Let’s make your pet’s day amazing.</Text>
        </View>
        <TouchableOpacity style={[styles.welcomeButtonAlt, { backgroundColor: '#1976D2' }]} onPress={() => router.push('/find-sitter-map')}>
          <Ionicons name="search" size={18} color="#fff" style={{ marginRight: 6 }} />
          <Text style={styles.welcomeButtonTextAlt}>Find Sitter</Text>
        </TouchableOpacity>
      </LinearGradient>
        {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickActionsRowAlt}>
          {quickActions.map((action) => (
          <TouchableOpacity key={action.title} style={styles.quickActionAlt} onPress={() => router.push(action.route as any)}>
            <View style={[styles.quickActionIconAlt, styles.quickActionIconYellow]}>
              <Image source={action.icon} style={{ width: 28, height: 26 }} resizeMode="contain" />
              </View>
            <Text style={styles.quickActionLabelAlt}>{action.title}</Text>
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
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.petsRow} contentContainerStyle={{ paddingRight: 12 }}>
          {pets.map((pet) => (
          <View key={pet.name} style={[styles.petCardAlt, styles.petCardYellow]}>
            <Image source={pet.image} style={[styles.petImageAlt, styles.petImageBorder]} />
            <Text style={styles.petNameAlt}>{pet.name}</Text>
            <Text style={styles.petBreedAlt}>{pet.breed}</Text>
            <Text style={styles.petAgeAlt}>{pet.age}</Text>
            </View>
          ))}
      </ScrollView>
        {/* Upcoming Bookings */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Upcoming Bookings</Text>
          <TouchableOpacity>
            <Text style={styles.sectionAction}>View All</Text>
          </TouchableOpacity>
        </View>
      <LinearGradient colors={['#FFD600', '#FAFAFA']} style={styles.bookingCardAlt}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={[styles.bookingStatusDot, { backgroundColor: '#1976D2' }]} />
          <Ionicons name="person-circle" size={36} color="#1976D2" style={{ marginRight: 10 }} />
            <View style={{ flex: 1 }}>
            <Text style={styles.bookingNameAlt}>Sarah Johnson</Text>
            <Text style={styles.bookingPetAlt}>Mochi</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <View style={[styles.bookingStatusBadgeAlt, { backgroundColor: '#1976D2' }]}><Text style={styles.bookingStatusTextAlt}>Confirmed</Text></View>
          </View>
        </View>
        <View style={styles.bookingMetaRow}>
          <Ionicons name="calendar-outline" size={16} color="#1976D2" style={{ marginRight: 4 }} />
          <Text style={styles.bookingMetaTextAlt}>Dec 15, 2024</Text>
          <Ionicons name="time-outline" size={16} color="#1976D2" style={{ marginLeft: 16, marginRight: 4 }} />
          <Text style={styles.bookingMetaTextAlt}>2:00 PM - 6:00 PM</Text>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  headerGradient: {
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    minHeight: 90, // ensure enough height for icons
    paddingBottom: 0,
  },
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    paddingHorizontal: 20,
    paddingTop: 18, // add top padding for status bar
    paddingBottom: 12,
    minHeight: 90, // match gradient
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  logoImage: {
    width: 30,
    height: 46,
    marginRight: 8,
  },
  iconButtonLeft: {
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
    height: 40,
    width: 40,
  },
  iconButtonRight: {
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
    height: 40,
    width: 40,
  },
  iconCircle: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 6,
    borderWidth: 1,
    borderColor: '#1976D2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 22,
    marginHorizontal: 16,
    marginTop: 18,
    marginBottom: 18,
    padding: 22,
    shadowColor: '#FBBF24',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 3,
    overflow: 'hidden',
    position: 'relative',
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
  welcomePaw: {
    position: 'absolute',
    right: 18,
    bottom: 10,
    width: 48,
    height: 48,
    opacity: 0.12,
    zIndex: 0,
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
    letterSpacing: 0.3,
  },
  sectionAction: {
    color: '#F59E0B',
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.2,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 12,
    marginBottom: 18,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 18,
    padding: 8,
    shadowColor: '#5AC8C8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  quickAction: {
    alignItems: 'center',
    flex: 1,
  },
  quickActionIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#FBBF24',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
  },
  quickActionLabel: {
    fontSize: 14,
    color: '#222',
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  petsRow: {
    flexDirection: 'row',
    marginHorizontal: 12,
    marginBottom: 18,
  },
  petCard: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 18,
    marginHorizontal: 8,
    padding: 16,
    width: 120,
    shadowColor: '#5AC8C8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 2,
    borderColor: '#FBBF24',
  },
  petImage: {
    width: 60,
    height: 60,
    borderRadius: 16,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#FBBF24',
  },
  petName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
    marginTop: 2,
  },
  petBreed: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  petAge: {
    fontSize: 13,
    color: '#F59E0B',
    marginTop: 2,
    fontWeight: '600',
  },
  bookingCard: {
    backgroundColor: '#fff',
    borderRadius: 22,
    marginHorizontal: 16,
    marginTop: 10,
    padding: 20,
    shadowColor: '#5AC8C8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 2,
    borderLeftWidth: 6,
    borderLeftColor: '#FBBF24',
  },
  bookingStatusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    marginRight: 10,
  },
  bookingName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#222',
  },
  bookingPet: {
    fontSize: 14,
    color: '#888',
    marginTop: 2,
  },
  bookingStatusBadge: {
    backgroundColor: '#10B981',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 4,
  },
  bookingStatusText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  bookingMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16, // more space for clarity
    justifyContent: 'flex-start',
    gap: 12, // add spacing between items if supported
  },
  bookingMetaText: {
    color: '#888',
    fontSize: 13,
    marginRight: 8,
  },
  welcomeCardAlt: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 24,
    marginHorizontal: 16,
    marginTop: 32, // increased margin to move it further down from the header
    marginBottom: 18,
    padding: 22,
    shadowColor: '#A7E3F4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 3,
  },
  welcomeTitleAlt: {
    color: '#1A374D',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  welcomeSubtitleAlt: {
    color: '#406882',
    fontSize: 15,
    opacity: 0.9,
  },
  welcomeButtonAlt: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#5AC8C8',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginLeft: 12,
    shadowColor: '#5AC8C8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 2,
  },
  welcomeButtonTextAlt: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 2,
  },
  quickActionsRowAlt: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 12,
    marginBottom: 18,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 18,
    padding: 8,
    shadowColor: '#A7E3F4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  quickActionAlt: {
    alignItems: 'center',
    flex: 1,
  },
  quickActionIconAlt: {
    width: 50,
    height: 50,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#A7E3F4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    backgroundColor: '#fff',
  },
  quickActionLabelAlt: {
    fontSize: 13,
    color: '#1A374D',
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  petCardAlt: {
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderRadius: 20,
    marginHorizontal: 8,
    padding: 12,
    width: 120,
    height: 150, // less tall
    shadowColor: '#FFD600',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 2,
    borderColor: '#FFD600',
  },
  petImageAlt: {
    width: 54,
    height: 54,
    borderRadius: 16,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#FFD600',
  },
  petNameAlt: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A374D',
    marginTop: 2,
  },
  petBreedAlt: {
    fontSize: 13,
    color: '#406882',
    marginTop: 2,
  },
  petAgeAlt: {
    fontSize: 13,
    color: '#5AC8C8',
    marginTop: 2,
    fontWeight: '600',
  },
  bookingCardAlt: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 22,
    marginHorizontal: 16,
    marginTop: 10,
    padding: 20,
    shadowColor: '#A7E3F4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 2,
    borderLeftWidth: 6,
    borderLeftColor: '#5AC8C8',
  },
  bookingNameAlt: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1A374D',
  },
  bookingPetAlt: {
    fontSize: 14,
    color: '#406882',
    marginTop: 2,
  },
  bookingStatusBadgeAlt: {
    backgroundColor: '#5AC8C8',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 4,
  },
  bookingStatusTextAlt: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },

  bookingMetaTextAlt: {
    color: '#00B8A9', // modern teal accent
    fontSize: 13,
    marginRight: 8,
    fontWeight: '600',
  },
  sectionTitleBlue: {
    color: '#1976D2',
  },
  quickActionLabelBlue: {
    color: '#1976D2',
  },
  petNameBlue: {
    color: '#1976D2',
  },
  petBreedDark: {
    color: '#333',
  },
  petAgeYellow: {
    color: '#FFD600',
  },
  iconCircleBlue: {
    backgroundColor: '#fff',
    borderColor: '#1976D2',
    borderWidth: 1,
  },
  petCardYellow: {
    backgroundColor: '#FAFAFA',
    borderColor: '#FFD600',
  },
  petImageBorder: {
    borderColor: '#FFD600',
  },
  quickActionIconSize: {
    width: 50,
    height: 50,
    borderRadius: 16,
  },
  marginRight4: {
    marginRight: 4,
  },
  marginLeft16Right4: {
    marginLeft: 16,
    marginRight: 4,
  },
  flex1: {
    flex: 1,
  },
  marginRight10: {
    marginRight: 10,
  },
  quickActionIconYellow: {
    borderColor: '#FFD600',
    borderWidth: 2,
    backgroundColor: '#fff',
  },
});

export default PetOwnerDashboard; 