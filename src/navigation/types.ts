export type RootStackParamList = {
  SplashScreen: undefined;
  Walkthrough: undefined; // Or specifically WalkthroughScreen1 for the first one
  WalkthroughScreen1: undefined;
  WalkthroughScreen2: undefined;
  WalkthroughScreen3: undefined;
  WelcomeScreen: undefined;
  LoginScreen: undefined;
  RegisterScreen: undefined;
  SignUpScreen1_UserRole: undefined;
  SignUpScreen2_PetType: { userRole: 'Pet Owner' | 'Pet Sitter' };
  SignUpScreen3_BreedPreferences: { userRole: 'Pet Owner' | 'Pet Sitter'; selectedPetTypes: ('dogs' | 'cats')[] };
  SignUpScreen4_FinalSteps: { userRole: 'Pet Owner' | 'Pet Sitter'; selectedPetTypes: ('dogs' | 'cats')[]; selectedBreeds: string[] };
  // Dashboard screens
  PetOwnerDashboard: undefined;
  PetSitterDashboard: undefined;
  // Map screen
  FindSitterMapScreen: undefined;
  // Verification screen
  VerificationScreen: undefined;
  // Admin screens
  AdminLogin: undefined;
  AdminTabs: undefined;
  // Add other app screens here as we create them
  AppTabs: undefined;
};

export type AppStackParamList = {
  Home: undefined;
  Profile: undefined;
  Jobs: undefined;
  Requests: undefined;
  Moments: undefined;
  FindSitterMap: undefined;
  Verification: undefined;
  AdminVerification: undefined;
  AdminDashboard: undefined;
  AdminLogin: undefined;
  AdminSupport: undefined;
};

export type AdminTabParamList = {
  AdminDashboard: undefined;
  AdminUsers: undefined;
  AdminSupport: undefined;
  AdminVerification: undefined;
  AdminSettings: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
} 