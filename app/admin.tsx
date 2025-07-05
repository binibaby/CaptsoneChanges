import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import AdminLoginScreen from '../src/screens/app/AdminLoginScreen';
import AdminNavigator from '../src/navigation/AdminNavigator';

export default function Admin() {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const router = useRouter();

  const onAdminLoginSuccess = () => {
    setIsAdminLoggedIn(true);
  };

  const onAdminLogout = () => {
    setIsAdminLoggedIn(false);
    router.back();
  };

  if (!isAdminLoggedIn) {
    return <AdminLoginScreen onLoginSuccess={onAdminLoginSuccess} />;
  }

  return <AdminNavigator onLogout={onAdminLogout} />;
} 