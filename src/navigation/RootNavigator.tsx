import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import { useAuth } from '../contexts/AuthContext';

// Onboarding screens
import SplashScreen from '../screens/onboarding/SplashScreen';
import WalkthroughScreen1 from '../screens/onboarding/WalkthroughScreen1';
import WalkthroughScreen2 from '../screens/onboarding/WalkthroughScreen2';
import WalkthroughScreen3 from '../screens/onboarding/WalkthroughScreen3';
import WelcomeScreen from '../screens/onboarding/WelcomeScreen';

// Auth screens
import BackIDScreen from '../screens/auth/BackIDScreen';
import FrontIDScreen from '../screens/auth/FrontIDScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import PhoneVerificationScreen from '../screens/auth/PhoneVerificationScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import SelfieScreen from '../screens/auth/SelfieScreen';
import SignUpScreen1_UserRole from '../screens/auth/SignUpScreen1_UserRole';
import SignUpScreen2_PetType from '../screens/auth/SignUpScreen2_PetType';
import SignUpScreen3_BreedPreferences from '../screens/auth/SignUpScreen3_BreedPreferences';
import SignUpScreen4_FinalSteps from '../screens/auth/SignUpScreen4_FinalSteps';
import UserRoleSelectionScreen from '../screens/auth/UserRoleSelectionScreen';

// App screens
import VerificationScreen from '../screens/app/VerificationScreen';
import AppNavigator from './AppNavigator';

const Stack = createStackNavigator();

const RootNavigator = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          // Auth flow
          <>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Walkthrough1" component={WalkthroughScreen1} />
            <Stack.Screen name="Walkthrough2" component={WalkthroughScreen2} />
            <Stack.Screen name="Walkthrough3" component={WalkthroughScreen3} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="UserRoleSelection" component={UserRoleSelectionScreen} />
            <Stack.Screen name="SignUp1_UserRole" component={SignUpScreen1_UserRole} />
            <Stack.Screen name="SignUp2_PetType" component={SignUpScreen2_PetType} />
            <Stack.Screen name="SignUp3_BreedPreferences" component={SignUpScreen3_BreedPreferences} />
            <Stack.Screen name="SignUp4_FinalSteps" component={SignUpScreen4_FinalSteps} />
            <Stack.Screen name="PhoneVerification" component={PhoneVerificationScreen} />
            <Stack.Screen name="FrontID" component={FrontIDScreen} />
            <Stack.Screen name="BackID" component={BackIDScreen} />
            <Stack.Screen name="Selfie" component={SelfieScreen} />
          </>
        ) : (
          // Main app
          <>
            <Stack.Screen name="App" component={AppNavigator} />
            <Stack.Screen name="Verification" component={VerificationScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigator; 