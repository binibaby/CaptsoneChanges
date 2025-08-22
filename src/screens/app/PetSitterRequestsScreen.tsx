import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    Image,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface Request {
  id: string;
  petOwnerName: string;
  petName: string;
  petBreed: string;
  date: string;
  time: string;
  duration: string;
  rate: string;
  status: 'pending' | 'accepted' | 'declined' | 'completed';
  message: string;
  avatar: any;
  petImage: any;
}

const PetSitterRequestsScreen = () => {
  const router = useRouter();
  const [requests, setRequests] = useState<Request[]>([
    // New users start with no requests
  ]);

  const handleBack = () => {
    router.back();
  };

  const handleAcceptRequest = (requestId: string) => {
    Alert.alert(
      'Accept Request',
      'Are you sure you want to accept this booking request?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Accept', 
          onPress: () => {
            setRequests(prev => 
              prev.map(req => 
                req.id === requestId ? { ...req, status: 'accepted' } : req
              )
            );
            Alert.alert('Success', 'Request accepted! The pet owner will be notified.');
          }
        }
      ]
    );
  };

  const handleDeclineRequest = (requestId: string) => {
    Alert.alert(
      'Decline Request',
      'Are you sure you want to decline this booking request?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Decline', 
          style: 'destructive',
          onPress: () => {
            setRequests(prev => 
              prev.map(req => 
                req.id === requestId ? { ...req, status: 'declined' } : req
              )
            );
            Alert.alert('Request Declined', 'The pet owner has been notified.');
          }
        }
      ]
    );
  };

  const handleViewDetails = (request: Request) => {
    // Navigate to request details or chat
    console.log('View details for request:', request.id);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#F59E0B';
      case 'accepted':
        return '#4CAF50';
      case 'declined':
        return '#FF4444';
      case 'completed':
        return '#3B82F6';
      default:
        return '#666';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'accepted':
        return 'Accepted';
      case 'declined':
        return 'Declined';
      case 'completed':
        return 'Completed';
      default:
        return status;
    }
  };

  const pendingRequests = requests.filter(req => req.status === 'pending');
  const otherRequests = requests.filter(req => req.status !== 'pending');

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booking Requests</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content}>
        {/* Pending Requests */}
        {pendingRequests.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pending Requests ({pendingRequests.length})</Text>
            {pendingRequests.map((request) => (
              <View key={request.id} style={styles.requestCard}>
                <View style={styles.requestHeader}>
                  <Image source={request.avatar} style={styles.ownerAvatar} />
                  <View style={styles.requestInfo}>
                    <Text style={styles.ownerName}>{request.petOwnerName}</Text>
                    <Text style={styles.requestDate}>{request.date}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) }]}>
                    <Text style={styles.statusText}>{getStatusText(request.status)}</Text>
                  </View>
                </View>

                <View style={styles.petInfo}>
                  <Image source={request.petImage} style={styles.petImage} />
                  <View style={styles.petDetails}>
                    <Text style={styles.petName}>{request.petName}</Text>
                    <Text style={styles.petBreed}>{request.petBreed}</Text>
                  </View>
                </View>

                <View style={styles.bookingDetails}>
                  <View style={styles.detailItem}>
                    <Ionicons name="time-outline" size={16} color="#666" />
                    <Text style={styles.detailText}>{request.time}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Ionicons name="calendar-outline" size={16} color="#666" />
                    <Text style={styles.detailText}>{request.duration}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Ionicons name="cash-outline" size={16} color="#666" />
                    <Text style={styles.detailText}>{request.rate}</Text>
                  </View>
                </View>

                <Text style={styles.messageText}>{request.message}</Text>

                <View style={styles.actionButtons}>
                  <TouchableOpacity 
                    style={styles.declineButton} 
                    onPress={() => handleDeclineRequest(request.id)}
                  >
                    <Text style={styles.declineButtonText}>Decline</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.acceptButton} 
                    onPress={() => handleAcceptRequest(request.id)}
                  >
                    <Text style={styles.acceptButtonText}>Accept</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Other Requests */}
        {otherRequests.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Other Requests</Text>
            {otherRequests.map((request) => (
              <TouchableOpacity 
                key={request.id} 
                style={styles.requestCard}
                onPress={() => handleViewDetails(request)}
              >
                <View style={styles.requestHeader}>
                  <Image source={request.avatar} style={styles.ownerAvatar} />
                  <View style={styles.requestInfo}>
                    <Text style={styles.ownerName}>{request.petOwnerName}</Text>
                    <Text style={styles.requestDate}>{request.date}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) }]}>
                    <Text style={styles.statusText}>{getStatusText(request.status)}</Text>
                  </View>
                </View>

                <View style={styles.petInfo}>
                  <Image source={request.petImage} style={styles.petImage} />
                  <View style={styles.petDetails}>
                    <Text style={styles.petName}>{request.petName}</Text>
                    <Text style={styles.petBreed}>{request.petBreed}</Text>
                  </View>
                </View>

                <View style={styles.bookingDetails}>
                  <View style={styles.detailItem}>
                    <Ionicons name="time-outline" size={16} color="#666" />
                    <Text style={styles.detailText}>{request.time}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Ionicons name="cash-outline" size={16} color="#666" />
                    <Text style={styles.detailText}>{request.rate}</Text>
                  </View>
                </View>

                <Text style={styles.messageText} numberOfLines={2}>{request.message}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Empty State */}
        {requests.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="mail-outline" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>No requests yet</Text>
            <Text style={styles.emptySubtitle}>When pet owners send you booking requests, they'll appear here.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
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
  headerRight: {
    width: 30,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  requestCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  ownerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  requestInfo: {
    flex: 1,
  },
  ownerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  requestDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  petInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  petImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  petDetails: {
    flex: 1,
  },
  petName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  petBreed: {
    fontSize: 12,
    color: '#666',
  },
  bookingDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    color: '#666',
  },
  messageText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  declineButton: {
    flex: 1,
    backgroundColor: '#FFE8E8',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  declineButtonText: {
    color: '#FF4444',
    fontSize: 14,
    fontWeight: '600',
  },
  acceptButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 20,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});

export default PetSitterRequestsScreen; 