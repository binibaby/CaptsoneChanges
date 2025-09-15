import React from 'react';
import { Platform, View, Text, StyleSheet } from 'react-native';

// Web fallback component
const WebMapFallback = () => (
  <View style={[StyleSheet.absoluteFill, { backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' }]}>
    <Text style={{ fontSize: 18, color: '#666' }}>🗺️ Interactive Map</Text>
    <Text style={{ fontSize: 14, color: '#999', marginTop: 8 }}>Available on mobile devices</Text>
    <Text style={{ fontSize: 12, color: '#ccc', marginTop: 4 }}>Tap on sitters below to view profiles</Text>
  </View>
);

// Platform-specific map component
const PlatformMap = ({ children, style, ...props }: any) => {
  if (Platform.OS === 'web') {
    return <WebMapFallback />;
  }

  // For native platforms, we'll use a different approach
  // This will be handled by the parent component
  return <WebMapFallback />;
};

export const PlatformMarker = ({ children, ...props }: any) => {
  // Always return null for web compatibility
  return null;
};

export default PlatformMap;
