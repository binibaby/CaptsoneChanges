import React from 'react';
import ProtectedScreen from '../src/components/ProtectedScreen';
import PetSitterDashboard from '../src/screens/app/PetSitterDashboard';

export default function PetSitterDashboardRoute() {
  return (
    <ProtectedScreen screenName="PetSitterDashboard">
      <PetSitterDashboard />
    </ProtectedScreen>
  );
} 