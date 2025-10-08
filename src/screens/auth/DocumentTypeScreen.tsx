import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface DocumentTypeScreenProps {
  userData?: any;
  phoneVerified?: boolean;
  onDocumentTypeSelected?: (phoneVerified: boolean, documentType: string, userData: any) => void;
}

const DocumentTypeScreen: React.FC<DocumentTypeScreenProps> = ({ 
  userData: propUserData, 
  phoneVerified: propPhoneVerified, 
  onDocumentTypeSelected 
}) => {
  const navigation = useNavigation();
  
  const userData = propUserData;
  const phoneVerified = propPhoneVerified ?? false;
  const [selectedDocumentType, setSelectedDocumentType] = useState<string>('');

  const philippineIdTypes = [
    {
      type: 'ph_national_id',
      name: 'National ID (PhilID)',
      description: 'Philippine National ID',
      icon: 'card',
      color: '#3B82F6'
    },
    {
      type: 'ph_drivers_license',
      name: 'Driver\'s License',
      description: 'Professional Driver\'s License',
      icon: 'car',
      color: '#10B981'
    },
    {
      type: 'sss_id',
      name: 'SSS ID',
      description: 'Social Security System ID',
      icon: 'shield',
      color: '#F59E0B'
    },
    {
      type: 'philhealth_id',
      name: 'PhilHealth ID',
      description: 'Philippine Health Insurance Corporation ID',
      icon: 'medical',
      color: '#EF4444'
    },
    {
      type: 'tin_id',
      name: 'TIN ID',
      description: 'Tax Identification Number ID',
      icon: 'document',
      color: '#8B5CF6'
    },
    {
      type: 'postal_id',
      name: 'Postal ID',
      description: 'Philippine Postal Corporation ID',
      icon: 'mail',
      color: '#06B6D4'
    },
    {
      type: 'voters_id',
      name: 'Voter\'s ID',
      description: 'Commission on Elections Voter\'s ID',
      icon: 'checkmark-circle',
      color: '#84CC16'
    },
    {
      type: 'prc_id',
      name: 'PRC ID',
      description: 'Professional Regulation Commission ID',
      icon: 'school',
      color: '#F97316'
    },
    {
      type: 'umid',
      name: 'UMID',
      description: 'Unified Multi-Purpose ID',
      icon: 'library',
      color: '#EC4899'
    },
    {
      type: 'owwa_id',
      name: 'OWWA ID',
      description: 'Overseas Workers Welfare Administration ID',
      icon: 'airplane',
      color: '#14B8A6'
    }
  ];

  const handleContinue = () => {
    if (!selectedDocumentType) {
      Alert.alert('Selection Required', 'Please select your ID type to continue.');
      return;
    }

    if (onDocumentTypeSelected) {
      onDocumentTypeSelected(phoneVerified, selectedDocumentType, userData);
    }
  };

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ID Verification</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Select Your ID Type</Text>
          <Text style={styles.subtitle}>
            Choose the type of government-issued ID you will use for verification
          </Text>
        </View>

        <View style={styles.idTypesContainer}>
          {philippineIdTypes.map((idType) => (
            <TouchableOpacity
              key={idType.type}
              style={[
                styles.idTypeCard,
                selectedDocumentType === idType.type && styles.selectedIdTypeCard
              ]}
              onPress={() => setSelectedDocumentType(idType.type)}
            >
              <View style={styles.idTypeHeader}>
                <View style={[styles.iconContainer, { backgroundColor: idType.color + '20' }]}>
                  <Ionicons name={idType.icon as any} size={24} color={idType.color} />
                </View>
                <View style={styles.idTypeInfo}>
                  <Text style={[
                    styles.idTypeName,
                    selectedDocumentType === idType.type && styles.selectedIdTypeName
                  ]}>
                    {idType.name}
                  </Text>
                  <Text style={[
                    styles.idTypeDescription,
                    selectedDocumentType === idType.type && styles.selectedIdTypeDescription
                  ]}>
                    {idType.description}
                  </Text>
                </View>
                {selectedDocumentType === idType.type && (
                  <View style={styles.checkmarkContainer}>
                    <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.noteContainer}>
          <Ionicons name="information-circle" size={20} color="#6B7280" />
          <Text style={styles.noteText}>
            Make sure your ID is valid, clear, and not expired. You'll need to capture both front and back of your ID.
          </Text>
        </View>
      </ScrollView>

      {/* Continue Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            !selectedDocumentType && styles.disabledButton
          ]}
          onPress={handleContinue}
          disabled={!selectedDocumentType}
        >
          <Text style={[
            styles.continueButtonText,
            !selectedDocumentType && styles.disabledButtonText
          ]}>
            Continue with {selectedDocumentType ? philippineIdTypes.find(id => id.type === selectedDocumentType)?.name : 'ID Type'}
          </Text>
          <Ionicons name="arrow-forward" size={20} color={selectedDocumentType ? "#fff" : "#9CA3AF"} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  titleContainer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  idTypesContainer: {
    marginBottom: 24,
  },
  idTypeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  selectedIdTypeCard: {
    borderColor: '#10B981',
    backgroundColor: '#f0fdf4',
  },
  idTypeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  idTypeInfo: {
    flex: 1,
  },
  idTypeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  selectedIdTypeName: {
    color: '#10B981',
  },
  idTypeDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  selectedIdTypeDescription: {
    color: '#059669',
  },
  checkmarkContainer: {
    marginLeft: 12,
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f3f4f6',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  noteText: {
    flex: 1,
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginLeft: 8,
  },
  buttonContainer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  continueButton: {
    backgroundColor: '#F59E0B',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    backgroundColor: '#f3f4f6',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  disabledButtonText: {
    color: '#9CA3AF',
  },
});

export default DocumentTypeScreen;
