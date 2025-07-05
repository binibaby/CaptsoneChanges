import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import adminService from '../../services/adminService';

interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  subject: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  description?: string;
}

const AdminSupportScreen: React.FC = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [responseModalVisible, setResponseModalVisible] = useState(false);
  const [response, setResponse] = useState('');
  const [filter, setFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved'>('all');

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const ticketsData = await adminService.getSupportTickets();
      setTickets(ticketsData);
    } catch (error) {
      console.error('Error loading support tickets:', error);
      Alert.alert('Error', 'Failed to load support tickets');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTickets();
    setRefreshing(false);
  };

  const handleUpdateStatus = async (ticketId: string, status: SupportTicket['status']) => {
    try {
      await adminService.updateSupportTicket(ticketId, status, response);
      await loadTickets();
      setResponseModalVisible(false);
      setResponse('');
      setSelectedTicket(null);
      Alert.alert('Success', 'Ticket status updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update ticket status');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#F44336';
      case 'high': return '#FF5722';
      case 'medium': return '#FF9800';
      case 'low': return '#4CAF50';
      default: return '#9E9E9E';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return '#2196F3';
      case 'in_progress': return '#FF9800';
      case 'resolved': return '#4CAF50';
      case 'closed': return '#9E9E9E';
      default: return '#9E9E9E';
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    if (filter === 'all') return true;
    return ticket.status === filter;
  });

  const TicketCard = ({ ticket }: { ticket: SupportTicket }) => (
    <TouchableOpacity
      style={styles.ticketCard}
      onPress={() => setSelectedTicket(ticket)}
    >
      <View style={styles.ticketHeader}>
        <Text style={styles.ticketSubject}>{ticket.subject}</Text>
        <View style={styles.ticketMeta}>
          <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(ticket.priority) }]}>
            <Text style={styles.priorityText}>{ticket.priority}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ticket.status) }]}>
            <Text style={styles.statusText}>{ticket.status.replace('_', ' ')}</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.ticketInfo}>
        <Text style={styles.ticketUser}>By: {ticket.userName}</Text>
        <Text style={styles.ticketDate}>
          {new Date(ticket.createdAt).toLocaleDateString()}
        </Text>
      </View>

      <View style={styles.ticketActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.viewButton]}
          onPress={() => setSelectedTicket(ticket)}
        >
          <Ionicons name="eye" size={16} color="#007AFF" />
          <Text style={styles.actionButtonText}>View</Text>
        </TouchableOpacity>
        
        {ticket.status === 'open' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.progressButton]}
            onPress={() => handleUpdateStatus(ticket.id, 'in_progress')}
          >
            <Ionicons name="play" size={16} color="#FF9800" />
            <Text style={styles.actionButtonText}>Start</Text>
          </TouchableOpacity>
        )}
        
        {ticket.status === 'in_progress' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.resolveButton]}
            onPress={() => {
              setSelectedTicket(ticket);
              setResponseModalVisible(true);
            }}
          >
            <Ionicons name="checkmark" size={16} color="#4CAF50" />
            <Text style={styles.actionButtonText}>Resolve</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading support tickets...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Support Management</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
          <Ionicons name="refresh" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {(['all', 'open', 'in_progress', 'resolved'] as const).map((filterOption) => (
            <TouchableOpacity
              key={filterOption}
              style={[styles.filterButton, filter === filterOption && styles.activeFilterButton]}
              onPress={() => setFilter(filterOption)}
            >
              <Text style={[styles.filterButtonText, filter === filterOption && styles.activeFilterButtonText]}>
                {filterOption.charAt(0).toUpperCase() + filterOption.slice(1).replace('_', ' ')}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{tickets.filter(t => t.status === 'open').length}</Text>
            <Text style={styles.statLabel}>Open</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{tickets.filter(t => t.status === 'in_progress').length}</Text>
            <Text style={styles.statLabel}>In Progress</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{tickets.filter(t => t.status === 'resolved').length}</Text>
            <Text style={styles.statLabel}>Resolved</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{tickets.filter(t => t.priority === 'urgent').length}</Text>
            <Text style={styles.statLabel}>Urgent</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Support Tickets ({filteredTickets.length})</Text>
        
        {filteredTickets.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="chatbubble-outline" size={64} color="#CCCCCC" />
            <Text style={styles.emptyStateText}>No tickets found</Text>
          </View>
        ) : (
          filteredTickets.map(ticket => (
            <TicketCard key={ticket.id} ticket={ticket} />
          ))
        )}
      </ScrollView>

      {/* Ticket Detail Modal */}
      <Modal
        visible={selectedTicket !== null}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSelectedTicket(null)}
            >
              <Ionicons name="close" size={24} color="#666666" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Ticket Details</Text>
            <View style={{ width: 40 }} />
          </View>

          {selectedTicket && (
            <ScrollView style={styles.modalContent}>
              <View style={styles.ticketDetail}>
                <Text style={styles.detailSubject}>{selectedTicket.subject}</Text>
                
                <View style={styles.detailMeta}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>User:</Text>
                    <Text style={styles.detailValue}>{selectedTicket.userName}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Status:</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedTicket.status) }]}>
                      <Text style={styles.statusText}>{selectedTicket.status.replace('_', ' ')}</Text>
                    </View>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Priority:</Text>
                    <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(selectedTicket.priority) }]}>
                      <Text style={styles.priorityText}>{selectedTicket.priority}</Text>
                    </View>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Created:</Text>
                    <Text style={styles.detailValue}>
                      {new Date(selectedTicket.createdAt).toLocaleString()}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailActions}>
                  {selectedTicket.status === 'open' && (
                    <TouchableOpacity
                      style={[styles.detailActionButton, styles.progressButton]}
                      onPress={() => handleUpdateStatus(selectedTicket.id, 'in_progress')}
                    >
                      <Ionicons name="play" size={16} color="#FF9800" />
                      <Text style={styles.detailActionButtonText}>Start Working</Text>
                    </TouchableOpacity>
                  )}
                  
                  {selectedTicket.status === 'in_progress' && (
                    <TouchableOpacity
                      style={[styles.detailActionButton, styles.resolveButton]}
                      onPress={() => setResponseModalVisible(true)}
                    >
                      <Ionicons name="checkmark" size={16} color="#4CAF50" />
                      <Text style={styles.detailActionButtonText}>Mark Resolved</Text>
                    </TouchableOpacity>
                  )}
                  
                  <TouchableOpacity
                    style={[styles.detailActionButton, styles.closeButton]}
                    onPress={() => handleUpdateStatus(selectedTicket.id, 'closed')}
                  >
                    <Ionicons name="close-circle" size={16} color="#9E9E9E" />
                    <Text style={styles.detailActionButtonText}>Close Ticket</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>

      {/* Response Modal */}
      <Modal
        visible={responseModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setResponseModalVisible(false)}
            >
              <Ionicons name="close" size={24} color="#666666" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Resolve Ticket</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.responseLabel}>Resolution Notes (Optional):</Text>
            <TextInput
              style={styles.responseInput}
              placeholder="Add notes about how the issue was resolved..."
              value={response}
              onChangeText={setResponse}
              multiline
              numberOfLines={4}
            />
            
            <View style={styles.responseActions}>
              <TouchableOpacity
                style={[styles.responseButton, styles.cancelButton]}
                onPress={() => setResponseModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.responseButton, styles.resolveButton]}
                onPress={() => selectedTicket && handleUpdateStatus(selectedTicket.id, 'resolved')}
              >
                <Text style={styles.resolveButtonText}>Mark Resolved</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E1E5E9',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  refreshButton: {
    padding: 8,
  },
  filterContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E5E9',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
  },
  activeFilterButton: {
    backgroundColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  activeFilterButtonText: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#CCCCCC',
    marginTop: 16,
  },
  ticketCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  ticketSubject: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    flex: 1,
    marginRight: 12,
  },
  ticketMeta: {
    alignItems: 'flex-end',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  priorityText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  ticketInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  ticketUser: {
    fontSize: 14,
    color: '#666666',
  },
  ticketDate: {
    fontSize: 14,
    color: '#666666',
  },
  ticketActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  viewButton: {
    borderColor: '#007AFF',
    backgroundColor: 'transparent',
  },
  progressButton: {
    borderColor: '#FF9800',
    backgroundColor: 'transparent',
  },
  resolveButton: {
    borderColor: '#4CAF50',
    backgroundColor: 'transparent',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E1E5E9',
  },
  closeButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  ticketDetail: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  detailSubject: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  detailMeta: {
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#1A1A1A',
  },
  detailActions: {
    gap: 12,
  },
  detailActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  detailActionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  responseLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  responseInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E1E5E9',
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 24,
  },
  responseActions: {
    flexDirection: 'row',
    gap: 12,
  },
  responseButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F0F0F0',
  },
  cancelButtonText: {
    color: '#666666',
    fontSize: 16,
    fontWeight: '500',
  },
  resolveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default AdminSupportScreen; 