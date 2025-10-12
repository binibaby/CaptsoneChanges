import React, { useState } from 'react';
import {
    Image,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface PrivacyPolicyScreenProps {
  onAccept: () => void;
}

const PrivacyPolicyScreen: React.FC<PrivacyPolicyScreenProps> = ({ onAccept }) => {
  const [hasRead, setHasRead] = useState(false);

  const handleAccept = () => {
    if (hasRead) {
      onAccept();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Image
          source={require('../../assets/images/logo.png')}
          style={styles.logo}
        />
        <Text style={styles.title}>Privacy Policy</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.lastUpdated}>Last updated: January 2025</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Information We Collect</Text>
          <Text style={styles.sectionText}>
            PetSit Connect collects the following personal information to provide our pet sitting services:
          </Text>
          <Text style={styles.bulletPoint}>• <Text style={styles.bold}>Name:</Text> Your full name for identification and communication purposes</Text>
          <Text style={styles.bulletPoint}>• <Text style={styles.bold}>Phone Number:</Text> For booking confirmations, updates, and emergency contact</Text>
          <Text style={styles.bulletPoint}>• <Text style={styles.bold}>Email Address:</Text> For account management and service notifications</Text>
          <Text style={styles.bulletPoint}>• <Text style={styles.bold}>Address:</Text> Your location for service area matching and emergency purposes</Text>
          <Text style={styles.bulletPoint}>• <Text style={styles.bold}>Government ID:</Text> For identity verification and safety compliance</Text>
          <Text style={styles.bulletPoint}>• <Text style={styles.bold}>Profile Information:</Text> Bio, experience, and preferences to match you with suitable users</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. How We Use Your Information</Text>
          <Text style={styles.sectionText}>
            We use your personal information to:
          </Text>
          <Text style={styles.bulletPoint}>• Create and manage your account</Text>
          <Text style={styles.bulletPoint}>• Connect pet owners with pet sitters in your area</Text>
          <Text style={styles.bulletPoint}>• Process bookings and payments</Text>
          <Text style={styles.bulletPoint}>• Send important service updates and notifications</Text>
          <Text style={styles.bulletPoint}>• Verify identity for safety and security</Text>
          <Text style={styles.bulletPoint}>• Provide customer support</Text>
          <Text style={styles.bulletPoint}>• Improve our services and user experience</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Information Sharing</Text>
          <Text style={styles.sectionText}>
            We share your information only in these limited circumstances:
          </Text>
          <Text style={styles.bulletPoint}>• <Text style={styles.bold}>With other users:</Text> Basic profile information (name, photo, bio) to facilitate connections</Text>
          <Text style={styles.bulletPoint}>• <Text style={styles.bold}>Service providers:</Text> Trusted partners who help us operate our platform</Text>
          <Text style={styles.bulletPoint}>• <Text style={styles.bold}>Legal requirements:</Text> When required by law or to protect rights and safety</Text>
          <Text style={styles.bulletPoint}>• <Text style={styles.bold}>Emergency situations:</Text> To ensure safety during pet sitting services</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Data Security</Text>
          <Text style={styles.sectionText}>
            We implement industry-standard security measures to protect your personal information:
          </Text>
          <Text style={styles.bulletPoint}>• Encrypted data transmission and storage</Text>
          <Text style={styles.bulletPoint}>• Secure servers and databases</Text>
          <Text style={styles.bulletPoint}>• Regular security audits and updates</Text>
          <Text style={styles.bulletPoint}>• Limited access to authorized personnel only</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Your Rights</Text>
          <Text style={styles.sectionText}>
            You have the right to:
          </Text>
          <Text style={styles.bulletPoint}>• Access and update your personal information</Text>
          <Text style={styles.bulletPoint}>• Delete your account and data</Text>
          <Text style={styles.bulletPoint}>• Opt out of marketing communications</Text>
          <Text style={styles.bulletPoint}>• Request a copy of your data</Text>
          <Text style={styles.bulletPoint}>• Contact us with privacy concerns</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Contact Us</Text>
          <Text style={styles.sectionText}>
            If you have any questions about this Privacy Policy or our data practices, please contact us at:
          </Text>
          <Text style={styles.contactInfo}>Email: petsitconnectph@gmail.com</Text>
        </View>

        <View style={styles.checkboxContainer}>
          <TouchableOpacity 
            style={styles.checkbox} 
            onPress={() => setHasRead(!hasRead)}
          >
            <View style={[styles.checkboxBox, hasRead && styles.checkboxChecked]}>
              {hasRead && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.checkboxText}>
              I have read and agree to the Privacy Policy
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.acceptButton, !hasRead && styles.disabledButton]} 
          onPress={handleAccept}
          disabled={!hasRead}
        >
          <Text style={styles.acceptButtonText}>Done</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  logo: {
    width: 60,
    height: 60,
    marginBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  lastUpdated: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 10,
  },
  sectionText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 10,
  },
  bulletPoint: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 8,
    paddingLeft: 10,
  },
  bold: {
    fontWeight: 'bold',
  },
  contactInfo: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
    marginTop: 5,
  },
  checkboxContainer: {
    marginVertical: 20,
    paddingVertical: 15,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 4,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  checkmark: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  checkboxText: {
    fontSize: 14,
    color: '#4B5563',
    flex: 1,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  acceptButton: {
    backgroundColor: '#10B981',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#D1D5DB',
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PrivacyPolicyScreen;
