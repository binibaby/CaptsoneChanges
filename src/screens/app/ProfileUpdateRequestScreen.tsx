import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';

interface ProfileUpdateRequest {
  id: number;
  first_name: string;
  last_name: string;
  phone: string;
  hourly_rate: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes?: string;
  created_at: string;
  reviewed_at?: string;
}

const ProfileUpdateRequestScreen = () => {
  const { user } = useAuth();
  const router = useRouter();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [pendingRequest, setPendingRequest] = useState<ProfileUpdateRequest | null>(null);
  const [userRequests, setUserRequests] = useState<ProfileUpdateRequest[]>([]);
  
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
    hourlyRate: user?.hourlyRate?.toString() || '',
    reason: '',
  });

  useEffect(() => {
    checkPendingRequest();
    loadUserRequests();
  }, []);

  const checkPendingRequest = async () => {
    try {
      const { makeApiCall } = await import('../../services/networkService');
      
      const response = await makeApiCall('/api/profile/update-request/check-pending', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${user?.token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (data.success) {
        setHasPendingRequest(data.has_pending_request);
        setPendingRequest(data.request);
      }
    } catch (error) {
      console.error('Error checking pending request:', error);
    }
  };

  const loadUserRequests = async () => {
    try {
      const { makeApiCall } = await import('../../services/networkService');
      
      const response = await makeApiCall('/api/profile/update-requests', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${user?.token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (data.success) {
        setUserRequests(data.requests);
      }
    } catch (error) {
      console.error('Error loading user requests:', error);
    }
  };

  const handleSubmitRequest = async () => {
    // Validate form
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      Alert.alert('Error', 'First name and last name are required.');
      return;
    }

    if (!formData.reason.trim()) {
      Alert.alert('Error', 'Please provide a reason for the update.');
      return;
    }

    // Check if there are any changes
    const hasChanges = 
      formData.firstName !== user?.firstName ||
      formData.lastName !== user?.lastName ||
      formData.phone !== user?.phone ||
      formData.hourlyRate !== user?.hourlyRate?.toString();

    if (!hasChanges) {
      Alert.alert('Info', 'No changes detected. Please modify at least one field.');
      return;
    }

    setIsSubmitting(true);

    try {
      const { makeApiCall } = await import('../../services/networkService');
      
      const response = await makeApiCall('/api/profile/update-request', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user?.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          first_name: formData.firstName.trim(),
          last_name: formData.lastName.trim(),
          phone: formData.phone.trim(),
          hourly_rate: formData.hourlyRate ? parseFloat(formData.hourlyRate) : null,
          reason: formData.reason.trim(),
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        Alert.alert(
          'Success', 
          'Your update request has been submitted. Please wait for the admin to examine and approve your changes.',
          [
            {
              text: 'OK',
              onPress: () => {
                setFormData(prev => ({ ...prev, reason: '' }));
                checkPendingRequest();
                loadUserRequests();
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', data.message || 'Failed to submit request.');
      }
    } catch (error) {
      console.error('Error submitting request:', error);
      Alert.alert('Error', 'Failed to submit request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#F59E0B';
      case 'approved':
        return '#10B981';
      case 'rejected':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending Review';
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      default:
        return status;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile Update Request</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Pending Request Notice */}
        {hasPendingRequest && pendingRequest && (
          <View style={styles.pendingNotice}>
            <Ionicons name="time-outline" size={20} color="#F59E0B" />
            <Text style={styles.pendingText}>
              Your profile update is under review
            </Text>
          </View>
        )}

        {/* Current Profile Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Profile</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Name:</Text>
              <Text style={styles.infoValue}>{user?.name || 'Not set'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Phone:</Text>
              <Text style={styles.infoValue}>{user?.phone || 'Not set'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Hourly Rate:</Text>
              <Text style={styles.infoValue}>
                {user?.hourlyRate ? `₱${user.hourlyRate}/hour` : 'Not set'}
              </Text>
            </View>
          </View>
        </View>

        {/* Update Form */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Requested Changes</Text>
          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>First Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.firstName}
                onChangeText={(text) => setFormData(prev => ({ ...prev, firstName: text }))}
                placeholder="Enter first name"
                placeholderTextColor="#6B7280"
                editable={!hasPendingRequest}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Last Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.lastName}
                onChangeText={(text) => setFormData(prev => ({ ...prev, lastName: text }))}
                placeholder="Enter last name"
                placeholderTextColor="#6B7280"
                editable={!hasPendingRequest}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                value={formData.phone}
                onChangeText={(text) => setFormData(prev => ({ ...prev, phone: text }))}
                placeholder="Enter phone number"
                placeholderTextColor="#6B7280"
                keyboardType="phone-pad"
                editable={!hasPendingRequest}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Hourly Rate (₱)</Text>
              <TextInput
                style={styles.input}
                value={formData.hourlyRate}
                onChangeText={(text) => setFormData(prev => ({ ...prev, hourlyRate: text }))}
                placeholder="Enter hourly rate"
                placeholderTextColor="#6B7280"
                keyboardType="numeric"
                editable={!hasPendingRequest}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Reason for Update *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.reason}
                onChangeText={(text) => setFormData(prev => ({ ...prev, reason: text }))}
                placeholder="Explain why you need to update your profile"
                placeholderTextColor="#6B7280"
                multiline
                numberOfLines={3}
                editable={!hasPendingRequest}
              />
            </View>

            {!hasPendingRequest && (
              <TouchableOpacity
                style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                onPress={handleSubmitRequest}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitButtonText}>Submit Request</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Request History */}
        {userRequests.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Request History</Text>
            {userRequests.map((request) => (
              <View key={request.id} style={styles.requestCard}>
                <View style={styles.requestHeader}>
                  <Text style={styles.requestDate}>{formatDate(request.created_at)}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) }]}>
                    <Text style={styles.statusText}>{getStatusText(request.status)}</Text>
                  </View>
                </View>
                
                <View style={styles.requestDetails}>
                  <Text style={styles.requestField}>
                    <Text style={styles.requestFieldLabel}>Name: </Text>
                    {request.first_name} {request.last_name}
                  </Text>
                  <Text style={styles.requestField}>
                    <Text style={styles.requestFieldLabel}>Phone: </Text>
                    {request.phone || 'Not changed'}
                  </Text>
                  <Text style={styles.requestField}>
                    <Text style={styles.requestFieldLabel}>Hourly Rate: </Text>
                    {request.hourly_rate ? `₱${request.hourly_rate}/hour` : 'Not changed'}
                  </Text>
                  <Text style={styles.requestField}>
                    <Text style={styles.requestFieldLabel}>Reason: </Text>
                    {request.reason}
                  </Text>
                  
                  {request.admin_notes && (
                    <Text style={styles.requestField}>
                      <Text style={styles.requestFieldLabel}>Admin Notes: </Text>
                      {request.admin_notes}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  scrollContent: {
    padding: 20,
  },
  pendingNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  pendingText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#92400E',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 14,
    color: '#111827',
    flex: 1,
    textAlign: 'right',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#F59E0B',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  requestCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  requestDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  requestDetails: {
    gap: 8,
  },
  requestField: {
    fontSize: 14,
    color: '#111827',
  },
  requestFieldLabel: {
    fontWeight: '500',
    color: '#6B7280',
  },
});

export default ProfileUpdateRequestScreen;
