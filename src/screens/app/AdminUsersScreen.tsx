import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import adminService, { UserManagementData } from '../../services/adminService';

const AdminUsersScreen: React.FC = () => {
  const [users, setUsers] = useState<UserManagementData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'suspended' | 'banned'>('all');
  const [selectedUser, setSelectedUser] = useState<UserManagementData | null>(null);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [actionReason, setActionReason] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const usersData = await adminService.getAllUsers();
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading users:', error);
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUsers();
    setRefreshing(false);
  };

  const handleUserAction = async (userId: string, action: 'suspend' | 'ban' | 'delete', reason?: string) => {
    const actionText = action === 'suspend' ? 'suspend' : action === 'ban' ? 'ban' : 'delete';
    
    try {
      if (action === 'delete') {
        await adminService.deleteUser(userId);
      } else {
        await adminService.updateUserStatus(userId, action === 'suspend' ? 'suspended' : 'banned', reason);
      }
      await loadUsers();
      setActionModalVisible(false);
      setActionReason('');
      setSelectedUser(null);
      Alert.alert('Success', `User ${actionText}ed successfully`);
    } catch (error) {
      Alert.alert('Error', `Failed to ${actionText} user`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#4CAF50';
      case 'suspended': return '#FF9800';
      case 'banned': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || user.status === filter;
    return matchesSearch && matchesFilter;
  });

  const UserCard = ({ user }: { user: UserManagementData }) => (
    <TouchableOpacity
      style={styles.userCard}
      onPress={() => setSelectedUser(user)}
    >
      <View style={styles.userHeader}>
        <View style={styles.userAvatar}>
          <Ionicons name="person" size={24} color="#FFFFFF" />
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          <View style={styles.userMeta}>
            <Text style={styles.userRole}>{user.userRole}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(user.status) }]}>
              <Text style={styles.statusText}>{user.status}</Text>
            </View>
            {user.isVerified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            )}
          </View>
        </View>
        <TouchableOpacity
          style={styles.moreButton}
          onPress={() => setSelectedUser(user)}
        >
          <Ionicons name="ellipsis-vertical" size={20} color="#666666" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.userStats}>
        <View style={styles.statItem}>
          <Ionicons name="calendar" size={16} color="#666666" />
          <Text style={styles.statText}>{user.totalBookings} bookings</Text>
        </View>
        {user.rating && (
          <View style={styles.statItem}>
            <Ionicons name="star" size={16} color="#FFC107" />
            <Text style={styles.statText}>{user.rating}★</Text>
          </View>
        )}
        <View style={styles.statItem}>
          <Ionicons name="time" size={16} color="#666666" />
          <Text style={styles.statText}>Joined {new Date(user.joinDate).toLocaleDateString()}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading users...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>User Management</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
          <Ionicons name="refresh" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#666666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search users..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#666666" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {(['all', 'active', 'suspended', 'banned'] as const).map((filterOption) => (
            <TouchableOpacity
              key={filterOption}
              style={[styles.filterButton, filter === filterOption && styles.activeFilterButton]}
              onPress={() => setFilter(filterOption)}
            >
              <Text style={[styles.filterButtonText, filter === filterOption && styles.activeFilterButtonText]}>
                {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{users.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{users.filter(u => u.status === 'active').length}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{users.filter(u => u.status === 'suspended').length}</Text>
          <Text style={styles.statLabel}>Suspended</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{users.filter(u => u.status === 'banned').length}</Text>
          <Text style={styles.statLabel}>Banned</Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text style={styles.sectionTitle}>Users ({filteredUsers.length})</Text>
        
        {filteredUsers.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color="#CCCCCC" />
            <Text style={styles.emptyStateText}>No users found</Text>
          </View>
        ) : (
          filteredUsers.map(user => (
            <UserCard key={user.id} user={user} />
          ))
        )}
      </ScrollView>

      {/* User Detail Modal */}
      <Modal
        visible={selectedUser !== null}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSelectedUser(null)}
            >
              <Ionicons name="close" size={24} color="#666666" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>User Details</Text>
            <View style={{ width: 40 }} />
          </View>

          {selectedUser && (
            <ScrollView style={styles.modalContent}>
              <View style={styles.userDetail}>
                <View style={styles.userDetailHeader}>
                  <View style={styles.userDetailAvatar}>
                    <Ionicons name="person" size={32} color="#FFFFFF" />
                  </View>
                  <View style={styles.userDetailInfo}>
                    <Text style={styles.userDetailName}>{selectedUser.name}</Text>
                    <Text style={styles.userDetailEmail}>{selectedUser.email}</Text>
                    <View style={styles.userDetailMeta}>
                      <Text style={styles.userDetailRole}>{selectedUser.userRole}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedUser.status) }]}>
                        <Text style={styles.statusText}>{selectedUser.status}</Text>
                      </View>
                      {selectedUser.isVerified && (
                        <View style={styles.verifiedBadge}>
                          <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                          <Text style={styles.verifiedText}>Verified</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>

                <View style={styles.userDetailStats}>
                  <View style={styles.detailStatItem}>
                    <Ionicons name="calendar" size={20} color="#007AFF" />
                    <Text style={styles.detailStatLabel}>Total Bookings</Text>
                    <Text style={styles.detailStatValue}>{selectedUser.totalBookings}</Text>
                  </View>
                  {selectedUser.rating && (
                    <View style={styles.detailStatItem}>
                      <Ionicons name="star" size={20} color="#FFC107" />
                      <Text style={styles.detailStatLabel}>Rating</Text>
                      <Text style={styles.detailStatValue}>{selectedUser.rating}★</Text>
                    </View>
                  )}
                  <View style={styles.detailStatItem}>
                    <Ionicons name="time" size={20} color="#666666" />
                    <Text style={styles.detailStatLabel}>Joined</Text>
                    <Text style={styles.detailStatValue}>
                      {new Date(selectedUser.joinDate).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.detailStatItem}>
                    <Ionicons name="time-outline" size={20} color="#666666" />
                    <Text style={styles.detailStatLabel}>Last Active</Text>
                    <Text style={styles.detailStatValue}>
                      {new Date(selectedUser.lastActive).toLocaleDateString()}
                    </Text>
                  </View>
                </View>

                <View style={styles.userDetailActions}>
                  {selectedUser.status === 'active' && (
                    <>
                      <TouchableOpacity
                        style={[styles.detailActionButton, styles.suspendButton]}
                        onPress={() => {
                          setActionModalVisible(true);
                          setActionReason('');
                        }}
                      >
                        <Ionicons name="pause-circle" size={20} color="#FF9800" />
                        <Text style={styles.suspendButtonText}>Suspend User</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.detailActionButton, styles.banButton]}
                        onPress={() => {
                          setActionModalVisible(true);
                          setActionReason('');
                        }}
                      >
                        <Ionicons name="ban" size={20} color="#F44336" />
                        <Text style={styles.banButtonText}>Ban User</Text>
                      </TouchableOpacity>
                    </>
                  )}
                  <TouchableOpacity
                    style={[styles.detailActionButton, styles.deleteButton]}
                    onPress={() => {
                      Alert.alert(
                        'Delete User',
                        'Are you sure you want to permanently delete this user? This action cannot be undone.',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Delete',
                            style: 'destructive',
                            onPress: () => handleUserAction(selectedUser.id, 'delete'),
                          },
                        ]
                      );
                    }}
                  >
                    <Ionicons name="trash" size={20} color="#FFFFFF" />
                    <Text style={styles.deleteButtonText}>Delete User</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>

      {/* Action Modal */}
      <Modal
        visible={actionModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setActionModalVisible(false)}
            >
              <Ionicons name="close" size={24} color="#666666" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Take Action</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.actionLabel}>Reason (Optional):</Text>
            <TextInput
              style={styles.actionInput}
              placeholder="Enter reason for this action..."
              value={actionReason}
              onChangeText={setActionReason}
              multiline
              numberOfLines={3}
            />
            
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.suspendActionButton]}
                onPress={() => selectedUser && handleUserAction(selectedUser.id, 'suspend', actionReason)}
              >
                <Ionicons name="pause-circle" size={20} color="#FF9800" />
                <Text style={styles.suspendActionButtonText}>Suspend User</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.banActionButton]}
                onPress={() => selectedUser && handleUserAction(selectedUser.id, 'ban', actionReason)}
              >
                <Ionicons name="ban" size={20} color="#F44336" />
                <Text style={styles.banActionButtonText}>Ban User</Text>
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
  searchContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E5E9',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
    paddingVertical: 12,
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
    margin: 16,
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
    fontSize: 20,
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
  userCard: {
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
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  userMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  userRole: {
    fontSize: 12,
    color: '#007AFF',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  statusText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verifiedText: {
    fontSize: 10,
    color: '#4CAF50',
    marginLeft: 4,
    fontWeight: '600',
  },
  moreButton: {
    padding: 8,
  },
  userStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 12,
    color: '#666666',
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
  userDetail: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  userDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  userDetailAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  userDetailInfo: {
    flex: 1,
  },
  userDetailName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  userDetailEmail: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 8,
  },
  userDetailMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  userDetailRole: {
    fontSize: 14,
    color: '#007AFF',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  userDetailStats: {
    marginBottom: 24,
  },
  detailStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailStatLabel: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 8,
    flex: 1,
  },
  detailStatValue: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '600',
  },
  userDetailActions: {
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
  suspendButton: {
    borderColor: '#FF9800',
    backgroundColor: 'transparent',
  },
  suspendButtonText: {
    color: '#FF9800',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  banButton: {
    borderColor: '#F44336',
    backgroundColor: 'transparent',
  },
  banButtonText: {
    color: '#F44336',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  deleteButton: {
    borderColor: '#9E9E9E',
    backgroundColor: '#9E9E9E',
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  actionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  actionInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E1E5E9',
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 24,
  },
  actionButtons: {
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  suspendActionButton: {
    backgroundColor: '#FFF3E0',
    borderWidth: 1,
    borderColor: '#FF9800',
  },
  suspendActionButtonText: {
    color: '#FF9800',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  banActionButton: {
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#F44336',
  },
  banActionButtonText: {
    color: '#F44336',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
});

export default AdminUsersScreen; 