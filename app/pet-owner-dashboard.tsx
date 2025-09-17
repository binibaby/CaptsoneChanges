import React from 'react';
import ProtectedScreen from '../src/components/ProtectedScreen';
import PetOwnerDashboard from '../src/screens/app/PetOwnerDashboard';

export default function PetOwnerDashboardRoute() {
  return (
    <ProtectedScreen screenName="PetOwnerDashboard">
      <PetOwnerDashboard />
    </ProtectedScreen>
  );
} 