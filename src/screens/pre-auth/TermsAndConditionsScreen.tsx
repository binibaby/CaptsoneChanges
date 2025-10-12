import { Ionicons } from '@expo/vector-icons';
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

interface TermsAndConditionsScreenProps {
  onAccept: () => void;
  onBack: () => void;
}

const TermsAndConditionsScreen: React.FC<TermsAndConditionsScreenProps> = ({
  onAccept,
  onBack,
}) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms & Conditions</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/images/logo.png')}
            style={styles.logo}
          />
        </View>

        <Text style={styles.title}>Terms and Conditions</Text>
        <Text style={styles.subtitle}>Please read and accept our terms</Text>

        <View style={styles.termsContainer}>
          <Text style={styles.termsText}>
            By using Petsit Connect, you agree to the following terms and conditions:
          </Text>
          
          <Text style={styles.sectionTitle}>1. Service Description</Text>
          <Text style={styles.termsText}>
            Petsit Connect is a platform that connects pet owners with pet sitters. 
            We facilitate the connection but are not responsible for the actual pet sitting services.
          </Text>

          <Text style={styles.sectionTitle}>2. User Responsibilities</Text>
          <Text style={styles.termsText}>
            Users are responsible for their own safety and the safety of their pets. 
            All interactions should be conducted in a safe and respectful manner.
          </Text>

          <Text style={styles.sectionTitle}>3. Payment Terms</Text>
          <Text style={styles.termsText}>
            Payment processing is handled securely through our platform. 
            Service fees and payment terms are clearly displayed before booking.
          </Text>

          <Text style={styles.sectionTitle}>4. Privacy and Data</Text>
          <Text style={styles.termsText}>
            We respect your privacy and handle your data according to our Privacy Policy. 
            Your personal information is protected and will not be shared without consent.
          </Text>

          <Text style={styles.sectionTitle}>5. Limitation of Liability</Text>
          <Text style={styles.termsText}>
            Petsit Connect is not liable for any damages, injuries, or losses that may occur 
            during pet sitting services. Users participate at their own risk.
          </Text>

          <Text style={styles.sectionTitle}>6. Account Termination</Text>
          <Text style={styles.termsText}>
            We reserve the right to terminate accounts that violate our terms of service 
            or engage in inappropriate behavior.
          </Text>

          <Text style={styles.termsText}>
            By continuing, you acknowledge that you have read, understood, and agree to 
            be bound by these terms and conditions.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.acceptButton} onPress={onAccept}>
          <Text style={styles.acceptButtonText}>I Accept</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 5,
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  logo: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  termsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  termsText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#555',
    marginBottom: 15,
  },
  footer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  acceptButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TermsAndConditionsScreen;
