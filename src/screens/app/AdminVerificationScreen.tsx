import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { RootStackParamList } from '../../navigation/types';
import verificationService, { VerificationDocument } from '../../services/verificationService';

type AdminVerificationScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AdminVerificationScreen'>;

interface PendingDocument {
  id: string;
  sitterId: string;
  sitterName: string;
  documentType: VerificationDocument['type'];
  submittedAt: string;
  documentUrl?: string;
}

const AdminVerificationScreen = () => {
  const navigation = useNavigation<AdminVerificationScreenNavigationProp>();
  const [pendingDocuments, setPendingDocuments] = useState<PendingDocument[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<PendingDocument | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPendingDocuments();
  }, []);

  const loadPendingDocuments = async () => {
    setIsLoading(true);
    try {
      // Mock data for pending documents
      const mockPendingDocuments: PendingDocument[] = [
        {
          id: '1',
          sitterId: 'sitter1',
          sitterName: 'Sarah Johnson',
          documentType: 'identity',
          submittedAt: '2024-01-15T10:30:00Z',
        },
        {
          id: '2',
          sitterId: 'sitter1',
          sitterName: 'Sarah Johnson',
          documentType: 'background_check',
          submittedAt: '2024-01-16T14:20:00Z',
        },
        {
          id: '3',
          sitterId: 'sitter2',
          sitterName: 'Mike Chen',
          documentType: 'certification',
          submittedAt: '2024-01-17T09:15:00Z',
        },
      ];
      
      setPendingDocuments(mockPendingDocuments);
    } catch (error) {
      console.error('Error loading pending documents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReviewDocument = (document: PendingDocument, status: 'approved' | 'rejected') => {
    setSelectedDocument(document);
    setReviewNotes('');
  };

  const submitReview = async () => {
    if (!selectedDocument) return;

    try {
      await verificationService.reviewDocument(
        selectedDocument.sitterId,
        selectedDocument.id,
        selectedDocument.status as 'approved' | 'rejected',
        reviewNotes
      );

      Alert.alert(
        'Review Submitted',
        `Document ${selectedDocument.status === 'approved' ? 'approved' : 'rejected'} successfully.`,
        [
          {
            text: 'OK',
            onPress: () => {
              setSelectedDocument(null);
              setReviewNotes('');
              loadPendingDocuments();
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to submit review. Please try again.');
    }
  };

  const getDocumentTypeDisplayName = (type: VerificationDocument['type']) => {
    switch (type) {
      case 'identity': return 'Identity Verification';
      case 'background_check': return 'Background Check';
      case 'certification': return 'Certification';
      case 'insurance': return 'Insurance';
      case 'references': return 'References';
      default: return type;
    }
  };

  const renderPendingDocument = ({ item }: { item: PendingDocument }) => (
    <View style={styles.documentCard}>
      <View style={styles.documentHeader}>
        <View style={styles.documentInfo}>
          <Text style={styles.sitterName}>{item.sitterName}</Text>
          <Text style={styles.documentType}>
            {getDocumentTypeDisplayName(item.documentType)}
          </Text>
          <Text style={styles.submittedDate}>
            Submitted: {new Date(item.submittedAt).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>Pending Review</Text>
        </View>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.approveButton]}
          onPress={() => handleReviewDocument(item, 'approved')}
        >
          <Ionicons name="checkmark" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>Approve</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.rejectButton]}
          onPress={() => handleReviewDocument(item, 'rejected')}
        >
          <Ionicons name="close" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>Reject</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Verification Review</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{pendingDocuments.length}</Text>
            <Text style={styles.statLabel}>Pending Reviews</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {pendingDocuments.filter(doc => doc.documentType === 'identity').length}
            </Text>
            <Text style={styles.statLabel}>Identity Docs</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {pendingDocuments.filter(doc => doc.documentType === 'background_check').length}
            </Text>
            <Text style={styles.statLabel}>Background Checks</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Pending Documents</Text>
        
        {pendingDocuments.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle" size={48} color="#10B981" />
            <Text style={styles.emptyStateText}>No pending documents to review</Text>
            <Text style={styles.emptyStateSubtext}>All verification documents have been processed</Text>
          </View>
        ) : (
          <FlatList
            data={pendingDocuments}
            renderItem={renderPendingDocument}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* Review Modal */}
      {selectedDocument && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Review {getDocumentTypeDisplayName(selectedDocument.documentType)}
              </Text>
              <TouchableOpacity
                onPress={() => setSelectedDocument(null)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalSubtitle}>
                Sitter: {selectedDocument.sitterName}
              </Text>
              
              <Text style={styles.modalLabel}>Review Notes (Optional):</Text>
              <TextInput
                style={styles.notesInput}
                value={reviewNotes}
                onChangeText={setReviewNotes}
                placeholder="Add notes about your decision..."
                multiline
                numberOfLines={4}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setSelectedDocument(null)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.modalButton, styles.submitButton]}
                  onPress={submitReview}
                >
                  <Text style={styles.submitButtonText}>Submit Review</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSpacer: {
    width: 34,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statsContainer: {
    flexDirection: 'row',
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
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F59E0B',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  documentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  documentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  documentInfo: {
    flex: 1,
  },
  sitterName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  documentType: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  submittedDate: {
    fontSize: 12,
    color: '#999',
  },
  statusBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 5,
  },
  approveButton: {
    backgroundColor: '#10B981',
  },
  rejectButton: {
    backgroundColor: '#EF4444',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 15,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  modalBody: {
    padding: 20,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    marginBottom: 20,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  submitButton: {
    backgroundColor: '#F59E0B',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AdminVerificationScreen; 