import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';

// Import your screen components
import HomeScreen from '../screens/app/HomeScreen';
import JobsScreen from '../screens/app/JobsScreen';
import MomentsScreen from '../screens/app/MomentsScreen';
import ProfileScreen from '../screens/app/ProfileScreen';
import RequestsScreen from '../screens/app/RequestsScreen';

const Tab = createBottomTabNavigator();

const AppNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#F59E0B',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: { height: 70, paddingBottom: 10, paddingTop: 10 },
        tabBarIcon: ({ color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = 'home';
          } else if (route.name === 'Requests') {
            iconName = 'clipboard';
          } else if (route.name === 'Moments') {
            iconName = 'happy';
          } else if (route.name === 'Jobs') {
            iconName = 'briefcase';
          } else if (route.name === 'Profile') {
            iconName = 'person';
          }
          // You can return any component that you like here!
          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
        tabBarButton: (props) => {
          // Add a custom button for the map screen
          if (route.name === 'Home') {
            return (
              <TouchableOpacity
                {...props}
                onPress={() => {
                  // Navigate to map screen when home tab is pressed
                  // This will be handled by the navigation prop
                }}
              />
            );
          }
          return <TouchableOpacity {...props} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Requests" component={RequestsScreen} />
      <Tab.Screen name="Moments" component={MomentsScreen} />
      <Tab.Screen name="Jobs" component={JobsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

export default AppNavigator; 