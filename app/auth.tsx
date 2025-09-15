import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '../src/contexts/AuthContext';
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
  const { updateUserProfile, storeUserFromBackend } = useAuth();

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

  const onAuthSuccess = async (user: any) => {
    try {
      console.log('onAuthSuccess called with user:', user);
      
      // Validate user object
      if (!user) {
        console.error('onAuthSuccess: user is null or undefined');
        throw new Error('User data is missing');
      }
      
      // If the user object is already complete from backend, just update the profile
      if (user && user.id && user.email && user.id !== Date.now().toString()) {
        console.log('User data already saved to backend, updating profile');
        console.log('User object being passed to updateUserProfile:', user);
        console.log('User profileImage field:', user.profileImage);
        console.log('User profile_image field:', user.profile_image);
        console.log('User hourlyRate field:', user.hourlyRate);
        console.log('User hourly_rate field:', user.hourly_rate);
        
        // Map backend user object to frontend user structure
        const userForUpdate = {
          id: user.id,
          email: user.email,
          name: user.name,
          firstName: user.first_name || '',  // Backend uses first_name
          lastName: user.last_name || '',    // Backend uses last_name
          userRole: (user.role === 'pet_owner' ? 'Pet Owner' : 'Pet Sitter') as 'Pet Owner' | 'Pet Sitter',
          role: user.role,
          phone: user.phone || '',
          age: user.age,
          gender: user.gender || '',
          address: user.address || '',
          experience: user.experience || '',
          hourlyRate: user.hourlyRate || user.hourly_rate || '',  // Check both field names
          aboutMe: user.bio || '',             // Backend uses bio
          specialties: user.specialties || [],
          email_verified: user.email_verified || false,
          phone_verified: user.phone_verified || false,
          selectedPetTypes: user.selected_pet_types || [],
          selectedBreeds: user.pet_breeds || [],  // Backend uses pet_breeds
          profileImage: user.profileImage || user.profile_image || undefined,
          token: user.token, // Add the authentication token
        };
        
        console.log('User object structured for updateUserProfile:', userForUpdate);
        console.log('UserForUpdate hourlyRate:', userForUpdate.hourlyRate);
        await updateUserProfile(userForUpdate);
      } else {
        console.log('Saving user data to backend in onAuthSuccess');
        // Save the user data to the backend
        const response = await fetch('http://192.168.100.184:8000/api/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
            first_name: user.firstName || '',
            last_name: user.lastName || '',
            email: user.email,
            password: user.password,
            role: user.userRole === 'Pet Owner' ? 'pet_owner' : 'pet_sitter',
            phone: user.phone,
            address: user.address,
            gender: user.gender,
            age: user.age,
            experience: user.experience || '',
            hourly_rate: user.hourlyRate || '',
            specialties: user.specialties || [],
            selected_pet_types: user.selectedPetTypes || [],
            pet_breeds: user.selectedBreeds || [],
            bio: user.aboutMe || '',
          }),
        });

        const result = await response.json();
        
        if (result.success) {
          console.log('User data saved to backend successfully in onAuthSuccess:', result);
          
          // Create a complete user object from backend response
          const completeUser = {
            id: result.user.id,
            email: result.user.email,
            name: result.user.name,
            firstName: result.user.first_name || '',
            lastName: result.user.last_name || '',
            userRole: result.user.role === 'pet_owner' ? 'Pet Owner' : 'Pet Sitter',
            role: result.user.role,
            phone: result.user.phone || '',
            age: result.user.age,
            gender: result.user.gender || '',
            address: result.user.address || '',
            experience: result.user.experience || '',
            hourlyRate: result.user.hourly_rate || '',
            aboutMe: result.user.bio || '',
            specialties: result.user.specialties || [],
            email_verified: result.user.email_verified || false,
            phone_verified: result.user.phone_verified || false,
            selectedPetTypes: result.user.selected_pet_types || [],
            selectedBreeds: result.user.pet_breeds || [],
            profileImage: result.user.profile_image || undefined,
          };
          
          await storeUserFromBackend(result.user);
        } else {
          console.error('Failed to save user data to backend in onAuthSuccess:', result);
        }
      }
    } catch (error) {
      console.error('Error updating user profile:', error);
    }

    // Navigate based on user role
    try {
      const userRole = user.role === 'pet_owner' ? 'Pet Owner' : 'Pet Sitter';
      console.log('Navigating user to dashboard. Role:', userRole);
      
      if (user.role === 'pet_owner') {
        router.replace('/pet-owner-dashboard');
      } else if (user.role === 'pet_sitter') {
        router.replace('/pet-sitter-dashboard');
      } else {
        console.log('Unknown user role, redirecting to onboarding');
        router.replace('/onboarding');
      }
    } catch (error) {
      console.error('Navigation error in onAuthSuccess:', error);
      // Fallback to onboarding on error
      router.replace('/onboarding');
    }
  };

  // Modified completion handler for both pet sitters and pet owners
  const onRegistrationComplete = async (userData: any) => {
    try {
      console.log('Saving complete user data to backend:', userData);
      console.log('UserData hourlyRate:', userData.hourlyRate);
      console.log('UserData role:', userData.userRole);
      
      // Prepare the request body
      const requestBody = {
        name: `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
        first_name: userData.firstName || '',
        last_name: userData.lastName || '',
        email: userData.email,
        password: userData.password,
        password_confirmation: userData.password, // Add password confirmation
        role: userData.userRole === 'Pet Owner' ? 'pet_owner' : 'pet_sitter',
        phone: userData.phone || '',
        address: userData.address || '',
        gender: userData.gender || '',
        age: userData.age || null,
        experience: userData.experience || '',
        hourly_rate: userData.hourlyRate || null,
        pet_breeds: userData.selectedBreeds || [],
        specialties: userData.specialties || [],
        selected_pet_types: userData.selectedPetTypes || [],
        bio: userData.aboutMe || '',
      };

      console.log('🚀 Request body being sent to backend:', requestBody);
      console.log('🚀 hourly_rate in request body:', requestBody.hourly_rate);
      console.log('🚀 hourly_rate type:', typeof requestBody.hourly_rate);

      // Save the complete user data to the backend
      const response = await fetch('http://192.168.100.184:8000/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      // Check if response is ok before trying to parse JSON
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Backend response error:', response.status, errorText);
        throw new Error(`Backend error: ${response.status} - ${errorText}`);
      }

      // Try to parse JSON response
      let result;
      try {
        const responseText = await response.text();
        console.log('Raw backend response:', responseText);
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        throw new Error('Invalid response from backend - not valid JSON');
      }
      
      if (result.success) {
        console.log('User data saved to backend successfully:', result);
        console.log('Backend user object:', result.user);
        console.log('Backend hourly_rate:', result.user.hourly_rate);
        console.log('Backend hourly_rate type:', typeof result.user.hourly_rate);
        console.log('Backend hourly_rate value:', JSON.stringify(result.user.hourly_rate));
        console.log('Frontend userData.hourlyRate:', userData.hourlyRate);
        
        // Create a complete user object for the auth context
        const completeUser = {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          firstName: result.user.first_name,
          lastName: result.user.last_name,
          userRole: result.user.role === 'pet_owner' ? 'Pet Owner' : 'Pet Sitter',
          role: result.user.role,
          phone: result.user.phone,
          age: result.user.age,
          gender: result.user.gender,
          address: result.user.address,
          experience: result.user.experience || userData.experience || '',
          hourlyRate: result.user.hourly_rate !== null && result.user.hourly_rate !== undefined ? String(result.user.hourly_rate) : (userData.hourlyRate || ''),
          aboutMe: result.user.bio || '',
          specialties: result.user.specialties || userData.specialties || [],
          email_verified: result.user.email_verified,
          phone_verified: result.user.phone_verified,
          selectedPetTypes: userData.selectedPetTypes,
          selectedBreeds: result.user.pet_breeds,
          profileImage: undefined,
          token: result.token, // Add the authentication token
        };

        console.log('Complete user object before storing:', completeUser);
        console.log('Complete user hourlyRate:', completeUser.hourlyRate);
        console.log('Complete user hourlyRate type:', typeof completeUser.hourlyRate);
        console.log('Complete user hourlyRate value:', JSON.stringify(completeUser.hourlyRate));

        // Store the complete user data in the auth context
        // Convert completeUser to backend format for storeUserFromBackend
        const backendUser = {
          ...result.user,
          hourly_rate: completeUser.hourlyRate !== null && completeUser.hourlyRate !== undefined ? completeUser.hourlyRate : (result.user.hourly_rate || userData.hourlyRate || ''),
        };
        console.log('Backend user object for storage:', backendUser);
        console.log('Backend user hourly_rate:', backendUser.hourly_rate);
        console.log('Backend user hourly_rate type:', typeof backendUser.hourly_rate);
        console.log('Backend user hourly_rate value:', JSON.stringify(backendUser.hourly_rate));
        await storeUserFromBackend(backendUser);

        // After breed selection, go to phone verification for both pet sitters and pet owners
        setSignupData({ ...signupData, userData: completeUser });
        setAuthStep('phone-verification');
      } else {
        console.error('Failed to save user data to backend:', result);
        throw new Error(result.message || 'Failed to save user data');
      }
    } catch (error) {
      console.error('Error saving user data to backend:', error);
      Alert.alert('Error', `Failed to save user data: ${error instanceof Error ? error.message : 'Unknown error'}`);
      // Continue with the flow even if backend save fails
      // Both pet sitters and pet owners need phone verification
      setSignupData({ ...signupData, userData });
      setAuthStep('phone-verification');
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
      return <SignUpScreen4_FinalSteps userRole={signupData.userRole} selectedPetTypes={signupData.selectedPetTypes} selectedBreeds={signupData.selectedBreeds} onComplete={onRegistrationComplete} onBack={() => setAuthStep('signup3')} />;
    // Multi-step registration flow (phone verification for both, ID verification for pet sitters only)
    case 'phone-verification':
      return <PhoneVerificationScreen 
        userData={signupData.userData} 
        onPhoneVerified={signupData.userRole === 'Pet Sitter' ? goToFrontID : () => onAuthSuccess(signupData.userData)} 
      />;
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