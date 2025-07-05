import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import LoginScreen from '../src/screens/auth/LoginScreen';
import RegisterScreen from '../src/screens/auth/RegisterScreen';
import SignUpScreen1_UserRole from '../src/screens/auth/SignUpScreen1_UserRole';
import SignUpScreen2_PetType from '../src/screens/auth/SignUpScreen2_PetType';
import SignUpScreen3_BreedPreferences from '../src/screens/auth/SignUpScreen3_BreedPreferences';
import SignUpScreen4_FinalSteps from '../src/screens/auth/SignUpScreen4_FinalSteps';
import UserRoleSelectionScreen from '../src/screens/auth/UserRoleSelectionScreen';

export default function Auth() {
  const [authStep, setAuthStep] = useState<'role-selection' | 'login' | 'register' | 'signup1' | 'signup2' | 'signup3' | 'signup4'>('role-selection');
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
      return <SignUpScreen4_FinalSteps userRole={signupData.userRole} selectedPetTypes={signupData.selectedPetTypes} selectedBreeds={signupData.selectedBreeds} onComplete={onAuthSuccess} onBack={() => setAuthStep('signup3')} />;
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