import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import BackIDScreen from '../src/screens/auth/BackIDScreen';
import FrontIDScreen from '../src/screens/auth/FrontIDScreen';
import LoginScreen from '../src/screens/auth/LoginScreen';
import PhoneVerificationScreen from '../src/screens/auth/PhoneVerificationScreen';
import RegisterScreen from '../src/screens/auth/RegisterScreen';
import SelfieScreen from '../src/screens/auth/SelfieScreen';
import SignUpScreen1_UserRole from '../src/screens/auth/SignUpScreen1_UserRole';
import SignUpScreen2_PetType from '../src/screens/auth/SignUpScreen2_PetType';
import SignUpScreen3_BreedPreferences from '../src/screens/auth/SignUpScreen3_BreedPreferences';
import SignUpScreen4_FinalSteps from '../src/screens/auth/SignUpScreen4_FinalSteps';
import UserRoleSelectionScreen from '../src/screens/auth/UserRoleSelectionScreen';

export default function Auth() {
  const [authStep, setAuthStep] = useState<'role-selection' | 'login' | 'register' | 'signup1' | 'signup2' | 'signup3' | 'signup4' | 'phone-verification' | 'front-id' | 'back-id' | 'selfie'>('role-selection');
  const [selectedUserRole, setSelectedUserRole] = useState<'Pet Owner' | 'Pet Sitter' | null>(null);
  const [signupData, setSignupData] = useState<any>({});
  const router = useRouter();

  const goToRoleSelection = () => setAuthStep('role-selection');
  const goToLogin = (role?: 'Pet Owner' | 'Pet Sitter') => {
    if (role) {
      setSelectedUserRole(role);
    }
    setAuthStep('login');
  };
  const goToRegister = (role?: 'Pet Owner' | 'Pet Sitter') => {
    if (role) {
      setSelectedUserRole(role);
      setSignupData({ ...signupData, userRole: role });
      setAuthStep('signup2');
    } else {
      setAuthStep('register');
    }
  };
  const goToSignup1 = () => setAuthStep('signup1');
  const goToSignup2 = (userRole: 'Pet Owner' | 'Pet Sitter') => {
    setSignupData({ ...signupData, userRole });
    setAuthStep('signup2');
  };
  const goToSignup3 = (selectedPetTypes: ('dogs' | 'cats')[]) => {
    setSignupData({ ...signupData, selectedPetTypes });
    setAuthStep('signup3');
  };
  const goToSignup4 = (selectedBreeds: string[]) => {
    setSignupData({ ...signupData, selectedBreeds });
    setAuthStep('signup4');
  };

  // New multi-step registration flow (for pet sitters after breed selection)
  const goToPhoneVerification = (userData: any) => {
    setSignupData({ ...signupData, userData });
    setAuthStep('phone-verification');
  };
  const goToFrontID = (phoneVerified: boolean) => {
    setSignupData({ ...signupData, phoneVerified });
    setAuthStep('front-id');
  };
  const goToBackID = (phoneVerified: boolean, frontImage: string) => {
    setSignupData({ ...signupData, phoneVerified, frontImage });
    setAuthStep('back-id');
  };
  const goToSelfie = (phoneVerified: boolean, frontImage: string, backImage: string) => {
    setSignupData({ ...signupData, phoneVerified, frontImage, backImage });
    setAuthStep('selfie');
  };

  const onRoleSelected = (role: 'Pet Owner' | 'Pet Sitter') => {
    setSelectedUserRole(role);
    setSignupData({ ...signupData, userRole: role });
  };

  const onAuthSuccess = (user: any) => {
    if (user.userRole === 'Pet Owner') {
      router.replace('/pet-owner-dashboard');
    } else {
      router.replace('/pet-sitter-dashboard');
    }
  };

  // Modified completion handler for pet sitters
  const onPetSitterComplete = (userData: any) => {
    // After breed selection, go to phone verification for pet sitters
    if (signupData.userRole === 'Pet Sitter') {
      setSignupData({ ...signupData, userData });
      setAuthStep('phone-verification');
    } else {
      onAuthSuccess(userData);
    }
  };

  switch (authStep) {
    case 'role-selection':
      return (
        <UserRoleSelectionScreen 
          onRoleSelected={onRoleSelected}
          onLogin={goToLogin}
          onRegister={goToRegister}
        />
      );
    case 'login':
      return <LoginScreen 
        onLoginSuccess={onAuthSuccess} 
        onRegister={goToRegister} 
        onBack={goToRoleSelection}
        selectedUserRole={selectedUserRole}
      />;
    case 'register':
      return <RegisterScreen 
        onRegisterSuccess={onAuthSuccess} 
        onLogin={goToLogin} 
        onSignup={goToSignup1} 
        onBack={goToRoleSelection}
        selectedUserRole={selectedUserRole}
      />;
    case 'signup1':
      return <SignUpScreen1_UserRole onNext={goToSignup2} />;
    case 'signup2':
      return <SignUpScreen2_PetType userRole={signupData.userRole} onNext={goToSignup3} onBack={goToRoleSelection} />;
    case 'signup3':
      return <SignUpScreen3_BreedPreferences userRole={signupData.userRole} selectedPetTypes={signupData.selectedPetTypes} onNext={goToSignup4} onBack={() => setAuthStep('signup2')} />;
    case 'signup4':
      return <SignUpScreen4_FinalSteps userRole={signupData.userRole} selectedPetTypes={signupData.selectedPetTypes} selectedBreeds={signupData.selectedBreeds} onComplete={onPetSitterComplete} onBack={() => setAuthStep('signup3')} />;
    // New multi-step registration flow (only for pet sitters)
    case 'phone-verification':
      return <PhoneVerificationScreen userData={signupData.userData} onPhoneVerified={goToFrontID} />;
    case 'front-id':
      return <FrontIDScreen userData={signupData.userData} phoneVerified={signupData.phoneVerified} onFrontIDComplete={goToBackID} />;
    case 'back-id':
      return <BackIDScreen userData={signupData.userData} phoneVerified={signupData.phoneVerified} frontImage={signupData.frontImage} onBackIDComplete={goToSelfie} />;
    case 'selfie':
      return <SelfieScreen userData={signupData.userData} phoneVerified={signupData.phoneVerified} frontImage={signupData.frontImage} backImage={signupData.backImage} onSelfieComplete={onAuthSuccess} />;
    default:
      return (
        <UserRoleSelectionScreen 
          onRoleSelected={onRoleSelected}
          onLogin={goToLogin}
          onRegister={goToRegister}
        />
      );
  }
} 