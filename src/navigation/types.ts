export type RootStackParamList = {
  // Auth screens
  'Login': undefined;
  'Register': undefined;
  'UserRoleSelection': undefined;
  'SignUp1_UserRole': undefined;
  'SignUp2_PetType': undefined;
  'SignUp3_BreedPreferences': undefined;
  'SignUp4_FinalSteps': undefined;
  'PhoneVerification': { userData: any };
  'FrontID': { userData: any; phoneVerified: boolean };
  'BackID': { userData: any; phoneVerified: boolean; frontImage: string };
  'Selfie': { userData: any; phoneVerified: boolean; frontImage: string; backImage: string };
  
  // Main app screens
  'Home': undefined;
  'Profile': undefined;
  'PetOwnerDashboard': undefined;
  'PetSitterDashboard': undefined;
  'PetOwnerJobs': undefined;
  'PetSitterRequests': undefined;
  'PetSitterSchedule': undefined;
  'PetSitterAvailability': undefined;
  'PetOwnerMessages': undefined;
  'PetSitterMessages': undefined;
  'PetOwnerNotifications': undefined;
  'PetSitterNotifications': undefined;
  'PetOwnerProfile': undefined;
  'PetSitterProfile': undefined;
  'Jobs': undefined;
  'Requests': undefined;
  'Moments': undefined;
  'EWallet': undefined;
  'Payment': undefined;
  'MyPets': undefined;
  'FindSitterMap': undefined;
  'Verification': undefined;
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
  AdminNameUpdateProfile: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
} 