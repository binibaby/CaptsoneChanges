import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';

const ProfileChangeRequestScreen = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedField, setSelectedField] = useState<'name' | 'address' | 'phone' | null>(null);
  const [newValue, setNewValue] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fieldOptions = [
    { key: 'name', label: 'Full Name', currentValue: user?.name || 'Not set' },
    { key: 'address', label: 'Address', currentValue: user?.address || 'Not set' },
    { key: 'phone', label: 'Phone Number', currentValue: user?.phone || 'Not set' },
  ];

  const handleFieldSelect = (field: 'name' | 'address' | 'phone') => {
    setSelectedField(field);
    setNewValue('');
    setReason('');
  };

  const handleSubmit = async () => {
    if (!selectedField || !newValue.trim()) {
      Alert.alert('Error', 'Please select a field and enter a new value.');
      return;
    }

    if (newValue.trim() === fieldOptions.find(f => f.key === selectedField)?.currentValue) {
      Alert.alert('Error', 'The new value must be different from your current value.');
      return;
    }

    if (!reason.trim()) {
      Alert.alert('Error', 'Please provide a reason for this change.');
      return;
    }

    setIsSubmitting(true);

    try {
      const { makeApiCall } = await import('../../services/networkService');
      
      const response = await makeApiCall('/api/profile/change-request', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user?.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          field_name: selectedField,
          new_value: newValue.trim(),
          reason: reason.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        Alert.alert(
          'Request Submitted',
          'Your profile change request has been submitted successfully. You will be notified when it is reviewed.',
          [
            {
              text: 'OK',
              onPress: () => {
                setSelectedField(null);
                setNewValue('');
                setReason('');
                router.back();
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', data.message || 'Failed to submit request. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting profile change request:', error);
      Alert.alert('Error', 'Failed to submit request. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (selectedField || newValue || reason) {
      Alert.alert(
        'Cancel Request',
        'Are you sure you want to cancel? Your changes will be lost.',
        [
          { text: 'Keep Editing', style: 'cancel' },
          {
            text: 'Cancel',
            style: 'destructive',
            onPress: () => router.back(),
          },
        ]
      );
    } else {
      router.back();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleCancel}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Request Profile Change</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView 
          style={styles.content} 
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Instructions */}
          <View style={styles.instructionsCard}>
            <Ionicons name="information-circle" size={24} color="#3B82F6" />
            <View style={styles.instructionsText}>
              <Text style={styles.instructionsTitle}>Profile Change Request</Text>
              <Text style={styles.instructionsDescription}>
                You cannot directly change your name, address, or phone number. Submit a request and our admin will review it.
              </Text>
            </View>
          </View>

          {/* Field Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Field to Change</Text>
            {fieldOptions.map((field) => (
              <TouchableOpacity
                key={field.key}
                style={[
                  styles.fieldOption,
                  selectedField === field.key && styles.fieldOptionSelected,
                ]}
                onPress={() => handleFieldSelect(field.key as 'name' | 'address' | 'phone')}
              >
                <View style={styles.fieldOptionContent}>
                  <View style={styles.fieldOptionHeader}>
                    <Text style={styles.fieldOptionLabel}>{field.label}</Text>
                    {selectedField === field.key && (
                      <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                    )}
                  </View>
                  <Text style={styles.fieldOptionCurrent}>
                    Current: {field.currentValue}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* New Value Input */}
          {selectedField && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Enter New Value</Text>
              <TextInput
                style={styles.textInput}
                value={newValue}
                onChangeText={setNewValue}
                placeholder={`Enter new ${fieldOptions.find(f => f.key === selectedField)?.label.toLowerCase()}`}
                multiline={selectedField === 'address'}
                numberOfLines={selectedField === 'address' ? 3 : 1}
                textAlignVertical={selectedField === 'address' ? 'top' : 'center'}
              />
            </View>
          )}

          {/* Reason Input */}
          {selectedField && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Reason for Change *</Text>
              <TextInput
                style={[styles.textInput, styles.reasonInput]}
                value={reason}
                onChangeText={setReason}
                placeholder="Please explain why you need to change this information..."
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          )}

          {/* Submit Button */}
          {selectedField && (
            <View style={styles.submitSection}>
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (!newValue.trim() || !reason.trim() || isSubmitting) && styles.submitButtonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={!newValue.trim() || !reason.trim() || isSubmitting}
              >
                <Text style={styles.submitButtonText}>
                  {isSubmitting ? 'Submitting...' : 'Submit Request'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  keyboardAvoidingView: {
    flex: 1,
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
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 34,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  instructionsCard: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  instructionsText: {
    flex: 1,
    marginLeft: 12,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E40AF',
    marginBottom: 4,
  },
  instructionsDescription: {
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  fieldOption: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  fieldOptionSelected: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  fieldOptionContent: {
    flex: 1,
  },
  fieldOptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  fieldOptionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  fieldOptionCurrent: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  textInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    color: '#333',
  },
  reasonInput: {
    minHeight: 100,
  },
  submitSection: {
    marginTop: 20,
    marginBottom: 40,
  },
  submitButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProfileChangeRequestScreen;
