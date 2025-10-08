import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    RefreshControl,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';

interface User {
  id: number;
  name: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: 'pet_owner' | 'pet_sitter';
  created_at: string;
  profile_image?: string;
}

interface NameUpdateRequest {
  id: number;
  user_id: number;
  old_name: string;
  new_name: string;
  old_first_name: string;
  new_first_name: string;
  old_last_name: string;
  new_last_name: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes?: string;
  reviewed_by?: number;
  reviewed_at?: string;
  created_at: string;
  user: User;
  reviewer?: {
    id: number;
    name: string;
  };
}

const AdminNameUpdateProfileScreen = () => {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'pet_owner' | 'pet_sitter'>('all');
  
  // Name update form states
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [updateReason, setUpdateReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  // Name update requests
  const [nameUpdateRequests, setNameUpdateRequests] = useState<NameUpdateRequest[]>([]);
  const [showRequestsModal, setShowRequestsModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<NameUpdateRequest | null>(null);
  const [showRequestDetailsModal, setShowRequestDetailsModal] = useState(false);

  useEffect(() => {
    if (currentUser?.id) {
      loadUsers();
      loadNameUpdateRequests();
    }
  }, [currentUser?.id]);

  useEffect(() => {
    filterUsers();
  }, [users, searchQuery, roleFilter]);

  const loadUsers = async () => {
    if (!currentUser?.id) return;

    try {
      const { makeApiCall } = await import('../../services/networkService');
      
      const response = await makeApiCall('/api/admin/users', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${currentUser.token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setUsers(data.users || []);
      } else {
        Alert.alert('Error', data.message || 'Failed to load users.');
      }
    } catch (error) {
      console.error('Error loading users:', error);
      Alert.alert('Error', 'Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadNameUpdateRequests = async () => {
    if (!currentUser?.id) return;

    try {
      const { makeApiCall } = await import('../../services/networkService');
      
      const response = await makeApiCall('/api/admin/name-update-requests', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${currentUser.token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setNameUpdateRequests(data.requests || []);
      } else {
        console.error('Failed to load name update requests:', data.message);
      }
    } catch (error) {
      console.error('Error loading name update requests:', error);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.phone?.toLowerCase().includes(query) ||
        user.first_name.toLowerCase().includes(query) ||
        user.last_name.toLowerCase().includes(query)
      );
    }

    // Filter by role
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    setFilteredUsers(filtered);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadUsers(), loadNameUpdateRequests()]);
    setRefreshing(false);
  };

  const handleBack = () => {
    router.back();
  };

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    setNewFirstName(user.first_name || '');
    setNewLastName(user.last_name || '');
    setUpdateReason('');
    setAdminNotes('');
    setShowUpdateModal(true);
  };

  const handleUpdateName = async () => {
    if (!selectedUser) return;

    // Validate inputs
    if (!newFirstName.trim() || !newLastName.trim()) {
      Alert.alert('Error', 'Both first name and last name are required.');
      return;
    }

    if (!updateReason.trim()) {
      Alert.alert('Error', 'Please provide a reason for the name update.');
      return;
    }

    const newFullName = `${newFirstName.trim()} ${newLastName.trim()}`.trim();

    // Check if name actually changed
    if (newFullName === selectedUser.name) {
      Alert.alert('Info', 'The new name is the same as the current name.');
      return;
    }

    setUpdating(true);

    try {
      const { makeApiCall } = await import('../../services/networkService');
      
      const response = await makeApiCall('/api/admin/update-user-name', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentUser.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: selectedUser.id,
          new_first_name: newFirstName.trim(),
          new_last_name: newLastName.trim(),
          reason: updateReason.trim(),
          admin_notes: adminNotes.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        Alert.alert('Success', 'User name updated successfully!', [
          {
            text: 'OK',
            onPress: () => {
              setShowUpdateModal(false);
              setSelectedUser(null);
              loadUsers();
              loadNameUpdateRequests();
            }
          }
        ]);
      } else {
        Alert.alert('Error', data.message || 'Failed to update user name.');
      }
    } catch (error) {
      console.error('Error updating user name:', error);
      Alert.alert('Error', 'Failed to update user name. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const handleRequestAction = async (requestId: number, action: 'approve' | 'reject') => {
    try {
      const { makeApiCall } = await import('../../services/networkService');
      
      const response = await makeApiCall(`/api/admin/name-update-requests/${requestId}/${action}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentUser.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          admin_notes: adminNotes,
        }),
      });

      const data = await response.json();

      if (data.success) {
        Alert.alert('Success', `Request ${action}d successfully!`);
        setShowRequestDetailsModal(false);
        setSelectedRequest(null);
        loadNameUpdateRequests();
        loadUsers();
      } else {
        Alert.alert('Error', data.message || `Failed to ${action} request.`);
      }
    } catch (error) {
      console.error(`Error ${action}ing request:`, error);
      Alert.alert('Error', `Failed to ${action} request. Please try again.`);
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
        return 'Pending';
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      default:
        return status;
    }
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

  const renderUserItem = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => handleUserSelect(item)}
    >
      <View style={styles.userInfo}>
        <View style={styles.userAvatar}>
          <Text style={styles.avatarText}>
            {item.first_name?.[0]?.toUpperCase() || item.name?.[0]?.toUpperCase() || 'U'}
          </Text>
        </View>
        <View style={styles.userDetails}>
          <Text style={styles.userName}>{item.name}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
          <Text style={styles.userPhone}>{item.phone || 'No phone'}</Text>
          <View style={styles.roleContainer}>
            <Text style={[
              styles.roleText,
              { color: item.role === 'pet_sitter' ? '#F59E0B' : '#4CAF50' }
            ]}>
              {item.role === 'pet_sitter' ? 'Pet Sitter' : 'Pet Owner'}
            </Text>
          </View>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#6B7280" />
    </TouchableOpacity>
  );

  const renderRequestItem = ({ item }: { item: NameUpdateRequest }) => (
    <TouchableOpacity
      style={styles.requestItem}
      onPress={() => {
        setSelectedRequest(item);
        setAdminNotes(item.admin_notes || '');
        setShowRequestDetailsModal(true);
      }}
    >
      <View style={styles.requestInfo}>
        <Text style={styles.requestUserName}>{item.user.name}</Text>
        <Text style={styles.requestChange}>
          "{item.old_name}" → "{item.new_name}"
        </Text>
        <Text style={styles.requestReason}>{item.reason}</Text>
        <Text style={styles.requestDate}>{formatDate(item.created_at)}</Text>
      </View>
      <View style={styles.requestStatus}>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F59E0B" />
          <Text style={styles.loadingText}>Loading users...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Name Update Management</Text>
        <TouchableOpacity 
          onPress={() => setShowRequestsModal(true)}
          style={styles.requestsButton}
        >
          <Ionicons name="list" size={24} color="#F59E0B" />
        </TouchableOpacity>
      </View>

      {/* Search and Filters */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, email, or phone..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#6B7280"
          />
        </View>
        
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterButton, roleFilter === 'all' && styles.activeFilter]}
            onPress={() => setRoleFilter('all')}
          >
            <Text style={[styles.filterText, roleFilter === 'all' && styles.activeFilterText]}>
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, roleFilter === 'pet_sitter' && styles.activeFilter]}
            onPress={() => setRoleFilter('pet_sitter')}
          >
            <Text style={[styles.filterText, roleFilter === 'pet_sitter' && styles.activeFilterText]}>
              Sitters
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, roleFilter === 'pet_owner' && styles.activeFilter]}
            onPress={() => setRoleFilter('pet_owner')}
          >
            <Text style={[styles.filterText, roleFilter === 'pet_owner' && styles.activeFilterText]}>
              Owners
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Users List */}
      <FlatList
        data={filteredUsers}
        renderItem={renderUserItem}
        keyExtractor={(item) => item.id.toString()}
        style={styles.usersList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color="#6B7280" />
            <Text style={styles.emptyText}>No users found</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery ? 'Try adjusting your search criteria' : 'No users available'}
            </Text>
          </View>
        }
      />

      {/* Name Update Modal */}
      <Modal
        visible={showUpdateModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowUpdateModal(false)}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Update Name</Text>
            <TouchableOpacity onPress={handleUpdateName} disabled={updating}>
              <Text style={[styles.saveButton, updating && styles.disabledButton]}>
                {updating ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.userInfoCard}>
              <Text style={styles.userInfoTitle}>User Information</Text>
              <Text style={styles.userInfoText}>Name: {selectedUser?.name}</Text>
              <Text style={styles.userInfoText}>Email: {selectedUser?.email}</Text>
              <Text style={styles.userInfoText}>Role: {selectedUser?.role === 'pet_sitter' ? 'Pet Sitter' : 'Pet Owner'}</Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>First Name *</Text>
              <TextInput
                style={styles.input}
                value={newFirstName}
                onChangeText={setNewFirstName}
                placeholder="Enter first name"
                placeholderTextColor="#6B7280"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Last Name *</Text>
              <TextInput
                style={styles.input}
                value={newLastName}
                onChangeText={setNewLastName}
                placeholder="Enter last name"
                placeholderTextColor="#6B7280"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Reason for Update *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={updateReason}
                onChangeText={setUpdateReason}
                placeholder="Explain why this name update is necessary"
                placeholderTextColor="#6B7280"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Admin Notes (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={adminNotes}
                onChangeText={setAdminNotes}
                placeholder="Add any additional notes"
                placeholderTextColor="#6B7280"
                multiline
                numberOfLines={2}
              />
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Name Update Requests Modal */}
      <Modal
        visible={showRequestsModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowRequestsModal(false)}>
              <Text style={styles.cancelButton}>Close</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Name Update Requests</Text>
            <View style={{ width: 60 }} />
          </View>

          <FlatList
            data={nameUpdateRequests}
            renderItem={renderRequestItem}
            keyExtractor={(item) => item.id.toString()}
            style={styles.requestsList}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="document-text-outline" size={64} color="#6B7280" />
                <Text style={styles.emptyText}>No name update requests</Text>
              </View>
            }
          />
        </SafeAreaView>
      </Modal>

      {/* Request Details Modal */}
      <Modal
        visible={showRequestDetailsModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowRequestDetailsModal(false)}>
              <Text style={styles.cancelButton}>Close</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Request Details</Text>
            <View style={{ width: 60 }} />
          </View>

          {selectedRequest && (
            <View style={styles.modalContent}>
              <View style={styles.requestDetailsCard}>
                <Text style={styles.requestDetailsTitle}>User Information</Text>
                <Text style={styles.requestDetailsText}>Name: {selectedRequest.user.name}</Text>
                <Text style={styles.requestDetailsText}>Email: {selectedRequest.user.email}</Text>
                <Text style={styles.requestDetailsText}>Phone: {selectedRequest.user.phone || 'N/A'}</Text>
              </View>

              <View style={styles.requestDetailsCard}>
                <Text style={styles.requestDetailsTitle}>Name Change</Text>
                <Text style={styles.requestDetailsText}>
                  From: "{selectedRequest.old_name}"
                </Text>
                <Text style={styles.requestDetailsText}>
                  To: "{selectedRequest.new_name}"
                </Text>
              </View>

              <View style={styles.requestDetailsCard}>
                <Text style={styles.requestDetailsTitle}>Reason</Text>
                <Text style={styles.requestDetailsText}>{selectedRequest.reason}</Text>
              </View>

              <View style={styles.requestDetailsCard}>
                <Text style={styles.requestDetailsTitle}>Status</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedRequest.status) }]}>
                  <Text style={styles.statusText}>{getStatusText(selectedRequest.status)}</Text>
                </View>
              </View>

              {selectedRequest.status === 'pending' && (
                <>
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Admin Notes</Text>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      value={adminNotes}
                      onChangeText={setAdminNotes}
                      placeholder="Add notes about this request"
                      placeholderTextColor="#6B7280"
                      multiline
                      numberOfLines={3}
                    />
                  </View>

                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.rejectButton]}
                      onPress={() => handleRequestAction(selectedRequest.id, 'reject')}
                    >
                      <Text style={styles.rejectButtonText}>Reject</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.approveButton]}
                      onPress={() => handleRequestAction(selectedRequest.id, 'approve')}
                    >
                      <Text style={styles.approveButtonText}>Approve</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
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
  requestsButton: {
    padding: 8,
  },
  searchContainer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  activeFilter: {
    backgroundColor: '#F59E0B',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeFilterText: {
    color: '#FFFFFF',
  },
  usersList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  userPhone: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  roleContainer: {
    alignSelf: 'flex-start',
  },
  roleText: {
    fontSize: 12,
    fontWeight: '500',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#F3F4F6',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  cancelButton: {
    fontSize: 16,
    color: '#6B7280',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F59E0B',
  },
  disabledButton: {
    color: '#9CA3AF',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  userInfoCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  userInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  userInfoText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
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
  requestsList: {
    flex: 1,
    padding: 20,
  },
  requestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  requestInfo: {
    flex: 1,
  },
  requestUserName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  requestChange: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  requestReason: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  requestDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  requestStatus: {
    marginLeft: 12,
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
  requestDetailsCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  requestDetailsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  requestDetailsText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  rejectButton: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  approveButton: {
    backgroundColor: '#D1FAE5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  rejectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
  },
  approveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
  },
});

export default AdminNameUpdateProfileScreen;
