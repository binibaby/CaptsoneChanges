import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { RootStackParamList } from '../../navigation/types';
import verificationService, { Badge, VerificationDocument } from '../../services/verificationService';

type VerificationScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'VerificationScreen'>;

const VerificationScreen = () => {
  const navigation = useNavigation<VerificationScreenNavigationProp>();
  const { user } = useAuth();
  const [verificationStatus, setVerificationStatus] = useState<any>(null);
  const [documents, setDocuments] = useState<VerificationDocument[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadVerificationData();
  }, []);

  const loadVerificationData = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const [status, verification] = await Promise.all([
        verificationService.getVerificationStatus(user.id),
        verificationService.getSitterVerification(user.id),
      ]);

      setVerificationStatus(status);
      setDocuments(verification?.documents || []);
      setBadges(verification?.badges || []);
    } catch (error) {
      console.error('Error loading verification data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitDocument = (documentType: VerificationDocument['type']) => {
    Alert.alert(
      'Submit Document',
      `Submit your ${documentType.replace('_', ' ')} document?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: async () => {
            try {
              await verificationService.submitVerificationDocument(user!.id, documentType);
              Alert.alert('Success', 'Document submitted successfully!');
              loadVerificationData();
            } catch (error) {
              Alert.alert('Error', 'Failed to submit document. Please try again.');
            }
          },
        },
      ]
    );
  };

  const getDocumentStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return { name: 'checkmark-circle', color: '#10B981' };
      case 'rejected':
        return { name: 'close-circle', color: '#EF4444' };
      case 'pending':
        return { name: 'time', color: '#F59E0B' };
      default:
        return { name: 'ellipse-outline', color: '#6B7280' };
    }
  };

  const getDocumentStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      case 'pending':
        return 'Under Review';
      default:
        return 'Not Submitted';
    }
  };

  const renderDocumentItem = ({ item }: { item: VerificationDocument }) => (
    <View style={styles.documentItem}>
      <View style={styles.documentHeader}>
        <View style={styles.documentInfo}>
          <Text style={styles.documentName}>
            {item.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </Text>
          <Text style={styles.documentDate}>
            {item.status === 'pending' ? 'Submitted' : 'Updated'}: {new Date(item.submittedAt).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.statusContainer}>
          <Ionicons
            name={getDocumentStatusIcon(item.status).name as any}
            size={24}
            color={getDocumentStatusIcon(item.status).color}
          />
          <Text style={[styles.statusText, { color: getDocumentStatusIcon(item.status).color }]}>
            {getDocumentStatusText(item.status)}
          </Text>
        </View>
      </View>
      {item.notes && (
        <Text style={styles.documentNotes}>Notes: {item.notes}</Text>
      )}
    </View>
  );

  const renderBadgeItem = ({ item }: { item: Badge }) => (
    <View style={[styles.badgeItem, { borderColor: item.color }]}>
      <View style={[styles.badgeIcon, { backgroundColor: item.color }]}>
        <Ionicons name={item.icon as any} size={24} color="#fff" />
      </View>
      <View style={styles.badgeInfo}>
        <Text style={styles.badgeName}>{item.name}</Text>
        <Text style={styles.badgeDescription}>{item.description}</Text>
        {item.earnedAt && (
          <Text style={styles.badgeEarnedDate}>
            Earned: {new Date(item.earnedAt).toLocaleDateString()}
          </Text>
        )}
      </View>
    </View>
  );

  const requiredDocuments = [
    { type: 'identity' as const, name: 'Identity Verification', description: 'Government-issued ID' },
    { type: 'background_check' as const, name: 'Background Check', description: 'Criminal background check' },
    { type: 'certification' as const, name: 'Certification', description: 'Pet care certifications' },
    { type: 'insurance' as const, name: 'Insurance', description: 'Pet sitting insurance' },
    { type: 'references' as const, name: 'References', description: 'Professional references' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Verification & Badges</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Verification Status */}
        {verificationStatus && (
          <View style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <Ionicons
                name={verificationStatus.isVerified ? 'shield-checkmark' : 'shield-outline'}
                size={32}
                color={verificationStatus.isVerified ? '#10B981' : '#6B7280'}
              />
              <View style={styles.statusInfo}>
                <Text style={styles.statusTitle}>
                  {verificationStatus.isVerified ? 'Verified Sitter' : 'Verification Required'}
                </Text>
                <Text style={styles.statusScore}>
                  Verification Score: {verificationStatus.score}%
                </Text>
              </View>
            </View>
            
            {!verificationStatus.isVerified && (
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { width: `${verificationStatus.score}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.progressText}>
                  {verificationStatus.score}/100 - {verificationStatus.nextSteps.length} steps remaining
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Required Documents */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Required Documents</Text>
          {requiredDocuments.map((doc) => {
            const submittedDoc = documents.find(d => d.type === doc.type);
            return (
              <TouchableOpacity
                key={doc.type}
                style={styles.documentCard}
                onPress={() => !submittedDoc && handleSubmitDocument(doc.type)}
                disabled={!!submittedDoc}
              >
                <View style={styles.documentCardHeader}>
                  <View style={styles.documentCardInfo}>
                    <Text style={styles.documentCardName}>{doc.name}</Text>
                    <Text style={styles.documentCardDescription}>{doc.description}</Text>
                  </View>
                  {submittedDoc ? (
                    <Ionicons
                      name={getDocumentStatusIcon(submittedDoc.status).name as any}
                      size={24}
                      color={getDocumentStatusIcon(submittedDoc.status).color}
                    />
                  ) : (
                    <Ionicons name="add-circle-outline" size={24} color="#F59E0B" />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Submitted Documents */}
        {documents.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Submitted Documents</Text>
            <FlatList
              data={documents}
              renderItem={renderDocumentItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          </View>
        )}

        {/* Badges */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Badges & Achievements</Text>
          {badges.length > 0 ? (
            <FlatList
              data={badges}
              renderItem={renderBadgeItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          ) : (
            <View style={styles.emptyBadges}>
              <Ionicons name="trophy-outline" size={48} color="#6B7280" />
              <Text style={styles.emptyBadgesText}>No badges earned yet</Text>
              <Text style={styles.emptyBadgesSubtext}>
                Complete verification and start booking to earn badges!
              </Text>
            </View>
          )}
        </View>

        {/* Next Steps */}
        {verificationStatus && verificationStatus.nextSteps.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Next Steps</Text>
            {verificationStatus.nextSteps.map((step: string, index: number) => (
              <View key={index} style={styles.stepItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.stepText}>{step}</Text>
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
  scrollContent: {
    padding: 20,
  },
  statusCard: {
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
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  statusInfo: {
    marginLeft: 15,
    flex: 1,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  statusScore: {
    fontSize: 14,
    color: '#666',
  },
  progressContainer: {
    marginTop: 10,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  documentCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  documentCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  documentCardInfo: {
    flex: 1,
  },
  documentCardName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  documentCardDescription: {
    fontSize: 14,
    color: '#666',
  },
  documentItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  documentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  documentDate: {
    fontSize: 12,
    color: '#666',
  },
  statusContainer: {
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  documentNotes: {
    fontSize: 12,
    color: '#666',
    marginTop: 10,
    fontStyle: 'italic',
  },
  badgeItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    borderWidth: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  badgeInfo: {
    flex: 1,
  },
  badgeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  badgeDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  badgeEarnedDate: {
    fontSize: 12,
    color: '#999',
  },
  emptyBadges: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  emptyBadgesText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginTop: 15,
  },
  emptyBadgesSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 5,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
  },
  stepNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  stepNumberText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
});

export default VerificationScreen; 