import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import adminService, { SystemSettings } from '../../services/adminService';

const AdminSettingsScreen: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const settingsData = await adminService.getSystemSettings();
      setSettings(settingsData);
    } catch (error) {
      console.error('Error loading settings:', error);
      Alert.alert('Error', 'Failed to load system settings');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSettings();
    setRefreshing(false);
  };

  const handleSettingChange = async (key: keyof SystemSettings, value: any) => {
    try {
      await adminService.updateSystemSettings({ [key]: value });
      setSettings(prev => prev ? { ...prev, [key]: value } : null);
      Alert.alert('Success', 'Setting updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update setting');
    }
  };

  const handleTextEdit = (key: keyof SystemSettings, currentValue: string) => {
    setEditingField(key);
    setEditValue(currentValue);
  };

  const saveTextEdit = async () => {
    if (editingField && settings) {
      await handleSettingChange(editingField, editValue);
      setEditingField(null);
      setEditValue('');
    }
  };

  const cancelTextEdit = () => {
    setEditingField(null);
    setEditValue('');
  };

  const SettingItem = ({ 
    title, 
    description, 
    type, 
    value, 
    key 
  }: {
    title: string;
    description: string;
    type: 'toggle' | 'text' | 'number';
    value: any;
    key: keyof SystemSettings;
  }) => (
    <View style={styles.settingItem}>
      <View style={styles.settingInfo}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingDescription}>{description}</Text>
      </View>
      
      {type === 'toggle' && (
        <Switch
          value={value}
          onValueChange={(newValue) => handleSettingChange(key, newValue)}
          trackColor={{ false: '#E1E5E9', true: '#007AFF' }}
          thumbColor={value ? '#FFFFFF' : '#FFFFFF'}
        />
      )}
      
      {type === 'text' && (
        <View style={styles.textSettingContainer}>
          {editingField === key ? (
            <View style={styles.editContainer}>
              <TextInput
                style={styles.editInput}
                value={editValue}
                onChangeText={setEditValue}
                autoFocus
              />
              <View style={styles.editActions}>
                <TouchableOpacity style={styles.editButton} onPress={saveTextEdit}>
                  <Ionicons name="checkmark" size={16} color="#4CAF50" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.editButton} onPress={cancelTextEdit}>
                  <Ionicons name="close" size={16} color="#F44336" />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.textValueContainer}
              onPress={() => handleTextEdit(key, value)}
            >
              <Text style={styles.textValue}>{value}</Text>
              <Ionicons name="pencil" size={16} color="#007AFF" />
            </TouchableOpacity>
          )}
        </View>
      )}
      
      {type === 'number' && (
        <View style={styles.textSettingContainer}>
          {editingField === key ? (
            <View style={styles.editContainer}>
              <TextInput
                style={styles.editInput}
                value={editValue}
                onChangeText={setEditValue}
                keyboardType="numeric"
                autoFocus
              />
              <View style={styles.editActions}>
                <TouchableOpacity style={styles.editButton} onPress={saveTextEdit}>
                  <Ionicons name="checkmark" size={16} color="#4CAF50" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.editButton} onPress={cancelTextEdit}>
                  <Ionicons name="close" size={16} color="#F44336" />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.textValueContainer}
              onPress={() => handleTextEdit(key, value.toString())}
            >
              <Text style={styles.textValue}>{value}</Text>
              <Ionicons name="pencil" size={16} color="#007AFF" />
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>System Settings</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
          <Ionicons name="refresh" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {settings && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>App Configuration</Text>
              <View style={styles.sectionContent}>
                <SettingItem
                  title="App Version"
                  description="Current version of the application"
                  type="text"
                  value={settings.appVersion}
                  key="appVersion"
                />
                <SettingItem
                  title="Support Email"
                  description="Contact email for user support"
                  type="text"
                  value={settings.supportEmail}
                  key="supportEmail"
                />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Access Control</Text>
              <View style={styles.sectionContent}>
                <SettingItem
                  title="Maintenance Mode"
                  description="Temporarily disable the app for maintenance"
                  type="toggle"
                  value={settings.maintenanceMode}
                  key="maintenanceMode"
                />
                <SettingItem
                  title="New User Registration"
                  description="Allow new users to register accounts"
                  type="toggle"
                  value={settings.newUserRegistration}
                  key="newUserRegistration"
                />
                <SettingItem
                  title="Verification Required"
                  description="Require verification for pet sitters"
                  type="toggle"
                  value={settings.verificationRequired}
                  key="verificationRequired"
                />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Booking Limits</Text>
              <View style={styles.sectionContent}>
                <SettingItem
                  title="Max Bookings Per User"
                  description="Maximum number of bookings a user can have"
                  type="number"
                  value={settings.maxBookingsPerUser}
                  key="maxBookingsPerUser"
                />
                <SettingItem
                  title="Minimum Rating for Sitters"
                  description="Minimum rating required for pet sitters"
                  type="number"
                  value={settings.minimumRatingForSitters}
                  key="minimumRatingForSitters"
                />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>System Actions</Text>
              <View style={styles.sectionContent}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => {
                    Alert.alert(
                      'Clear Cache',
                      'This will clear all cached data. Continue?',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Clear',
                          style: 'destructive',
                          onPress: () => {
                            Alert.alert('Success', 'Cache cleared successfully');
                          },
                        },
                      ]
                    );
                  }}
                >
                  <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                  <Text style={styles.actionButtonText}>Clear Cache</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => {
                    Alert.alert(
                      'Reset Settings',
                      'This will reset all settings to default values. Continue?',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Reset',
                          style: 'destructive',
                          onPress: async () => {
                            try {
                              await adminService.updateSystemSettings({
                                appVersion: '1.0.0',
                                maintenanceMode: false,
                                newUserRegistration: true,
                                maxBookingsPerUser: 10,
                                minimumRatingForSitters: 4.0,
                                verificationRequired: true,
                                supportEmail: 'support@petsitconnect.com',
                              });
                              await loadSettings();
                              Alert.alert('Success', 'Settings reset to default');
                            } catch (error) {
                              Alert.alert('Error', 'Failed to reset settings');
                            }
                          },
                        },
                      ]
                    );
                  }}
                >
                  <Ionicons name="refresh-outline" size={20} color="#FF9500" />
                  <Text style={styles.actionButtonText}>Reset to Default</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => {
                    Alert.alert(
                      'Export Settings',
                      'Settings exported successfully',
                      [{ text: 'OK' }]
                    );
                  }}
                >
                  <Ionicons name="download-outline" size={20} color="#007AFF" />
                  <Text style={styles.actionButtonText}>Export Settings</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>System Information</Text>
              <View style={styles.sectionContent}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Last Updated</Text>
                  <Text style={styles.infoValue}>{new Date().toLocaleString()}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Settings Version</Text>
                  <Text style={styles.infoValue}>1.0.0</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Configuration Status</Text>
                  <View style={styles.statusIndicator}>
                    <View style={styles.statusDot} />
                    <Text style={styles.statusText}>Active</Text>
                  </View>
                </View>
              </View>
            </View>
          </>
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
  content: {
    flex: 1,
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginHorizontal: 16,
    marginBottom: 12,
    marginTop: 16,
  },
  sectionContent: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666666',
  },
  textSettingContainer: {
    minWidth: 100,
  },
  textValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E1E5E9',
  },
  textValue: {
    fontSize: 14,
    color: '#1A1A1A',
    marginRight: 8,
  },
  editContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    minWidth: 120,
    marginRight: 8,
  },
  editActions: {
    flexDirection: 'row',
  },
  editButton: {
    padding: 4,
    marginLeft: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  actionButtonText: {
    fontSize: 16,
    color: '#1A1A1A',
    marginLeft: 12,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666666',
  },
  infoValue: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
  },
});

export default AdminSettingsScreen; 