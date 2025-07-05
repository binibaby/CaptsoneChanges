import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
    RootStackParamList,
} from './types';

// Import all your screens
import AdminLoginScreen from '../screens/app/AdminLoginScreen';
import FindSitterMapScreen from '../screens/app/FindSitterMapScreen';
import PetOwnerDashboard from '../screens/app/PetOwnerDashboard';
import PetSitterDashboard from '../screens/app/PetSitterDashboard';
import VerificationScreen from '../screens/app/VerificationScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import SignUpScreen1_UserRole from '../screens/auth/SignUpScreen1_UserRole';
import SignUpScreen2_PetType from '../screens/auth/SignUpScreen2_PetType';
import SignUpScreen3_BreedPreferences from '../screens/auth/SignUpScreen3_BreedPreferences';
import SignUpScreen4_FinalSteps from '../screens/auth/SignUpScreen4_FinalSteps';
import SplashScreen from '../screens/onboarding/SplashScreen';
import WalkthroughScreen1 from '../screens/onboarding/WalkthroughScreen1';
import WalkthroughScreen2 from '../screens/onboarding/WalkthroughScreen2';
import WalkthroughScreen3 from '../screens/onboarding/WalkthroughScreen3';
import WelcomeScreen from '../screens/onboarding/WelcomeScreen';
import AdminNavigator from './AdminNavigator';
import AppNavigator from './AppNavigator';

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootNavigator: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <Stack.Navigator 
      initialRouteName={isAuthenticated ? (user?.userRole === 'Pet Owner' ? 'PetOwnerDashboard' : 'PetSitterDashboard') : 'SplashScreen'}
      screenOptions={{ headerShown: false }}
    >
      {!isAuthenticated ? (
        // Auth flow
        <>
          <Stack.Screen name="SplashScreen" component={SplashScreen} />
          <Stack.Screen name="WalkthroughScreen1" component={WalkthroughScreen1} />
          <Stack.Screen name="WalkthroughScreen2" component={WalkthroughScreen2} />
          <Stack.Screen name="WalkthroughScreen3" component={WalkthroughScreen3} />
          <Stack.Screen name="WelcomeScreen" component={WelcomeScreen} />
          <Stack.Screen name="LoginScreen" component={LoginScreen} />
          <Stack.Screen name="RegisterScreen" component={RegisterScreen} />
          <Stack.Screen name="SignUpScreen1_UserRole" component={SignUpScreen1_UserRole} />
          <Stack.Screen name="SignUpScreen2_PetType" component={SignUpScreen2_PetType} />
          <Stack.Screen name="SignUpScreen3_BreedPreferences" component={SignUpScreen3_BreedPreferences} />
          <Stack.Screen name="SignUpScreen4_FinalSteps" component={SignUpScreen4_FinalSteps} />
          <Stack.Screen name="AdminLogin" component={AdminLoginScreen} />
        </>
      ) : (
        // App flow
        <>
          {user?.userRole === 'Pet Owner' ? (
            <Stack.Screen name="PetOwnerDashboard" component={PetOwnerDashboard} />
          ) : (
            <Stack.Screen name="PetSitterDashboard" component={PetSitterDashboard} />
          )}
          <Stack.Screen name="FindSitterMapScreen" component={FindSitterMapScreen} />
          <Stack.Screen name="VerificationScreen" component={VerificationScreen} />
          <Stack.Screen name="AppTabs" component={AppNavigator} />
          <Stack.Screen name="AdminLogin" component={AdminLoginScreen} />
          <Stack.Screen name="AdminTabs" component={AdminNavigator} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default RootNavigator; 