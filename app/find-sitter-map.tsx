import React from 'react';
import ProtectedScreen from '../src/components/ProtectedScreen';
import FindSitterMapScreen from '../src/screens/app/FindSitterMapScreen';

export default function FindSitterMap() {
  return (
    <ProtectedScreen screenName="FindSitterMap">
      <FindSitterMapScreen />
    </ProtectedScreen>
  );
} 