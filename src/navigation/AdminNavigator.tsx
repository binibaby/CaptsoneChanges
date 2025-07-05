import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import AdminDashboardScreen from '../screens/app/AdminDashboardScreen';
import AdminSettingsScreen from '../screens/app/AdminSettingsScreen';
import AdminSupportScreen from '../screens/app/AdminSupportScreen';
import AdminUsersScreen from '../screens/app/AdminUsersScreen';
import AdminVerificationScreen from '../screens/app/AdminVerificationScreen';

export type AdminTabParamList = {
  AdminDashboard: undefined;
  AdminUsers: undefined;
  AdminSupport: undefined;
  AdminVerification: undefined;
  AdminSettings: undefined;
};

const Tab = createBottomTabNavigator<AdminTabParamList>();

const AdminNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'AdminDashboard') {
            iconName = focused ? 'stats-chart' : 'stats-chart-outline';
          } else if (route.name === 'AdminUsers') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'AdminSupport') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          } else if (route.name === 'AdminVerification') {
            iconName = focused ? 'shield-checkmark' : 'shield-checkmark-outline';
          } else if (route.name === 'AdminSettings') {
            iconName = focused ? 'settings' : 'settings-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E1E5E9',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="AdminDashboard" 
        component={AdminDashboardScreen}
        options={{ tabBarLabel: 'Dashboard' }}
      />
      <Tab.Screen 
        name="AdminUsers" 
        component={AdminUsersScreen}
        options={{ tabBarLabel: 'Users' }}
      />
      <Tab.Screen 
        name="AdminSupport" 
        component={AdminSupportScreen}
        options={{ tabBarLabel: 'Support' }}
      />
      <Tab.Screen 
        name="AdminVerification" 
        component={AdminVerificationScreen}
        options={{ tabBarLabel: 'Verification' }}
      />
      <Tab.Screen 
        name="AdminSettings" 
        component={AdminSettingsScreen}
        options={{ tabBarLabel: 'Settings' }}
      />
    </Tab.Navigator>
  );
};

export default AdminNavigator; 