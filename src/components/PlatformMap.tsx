import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

// Web map component using Google Maps
const WebMapComponent = ({ initialRegion, showsUserLocation, children, style, ...props }: any) => {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);

  useEffect(() => {
    // Load Google Maps script
    const loadGoogleMaps = () => {
      if (window.google && window.google.maps) {
        setMapLoaded(true);
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY'}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => setMapLoaded(true);
      script.onerror = () => setMapError(true);
      document.head.appendChild(script);
    };

    loadGoogleMaps();
  }, []);

  if (mapError) {
    return (
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ fontSize: 18, color: '#666' }}>🗺️ Map Error</Text>
        <Text style={{ fontSize: 14, color: '#999', marginTop: 8 }}>Unable to load map</Text>
        <Text style={{ fontSize: 12, color: '#ccc', marginTop: 4 }}>Check your internet connection</Text>
      </View>
    );
  }

  if (!mapLoaded) {
    return (
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ fontSize: 18, color: '#666' }}>🗺️ Loading Map...</Text>
        <Text style={{ fontSize: 14, color: '#999', marginTop: 8 }}>Please wait</Text>
      </View>
    );
  }

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' }]}>
      <Text style={{ fontSize: 18, color: '#666' }}>🗺️ Interactive Map</Text>
      <Text style={{ fontSize: 14, color: '#999', marginTop: 8 }}>Map will be displayed here</Text>
      <Text style={{ fontSize: 12, color: '#ccc', marginTop: 4 }}>Tap on sitters below to view profiles</Text>
    </View>
  );
};

// Native map component using react-native-maps
const NativeMapComponent = ({ children, style, ...props }: any) => {
  try {
    const Maps = require('react-native-maps');
    const MapView = Maps.default || Maps.MapView;

    return (
      <MapView style={style} {...props}>
        {children}
      </MapView>
    );
  } catch (error) {
    console.warn('react-native-maps not available:', error);
    return (
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' }]}>
        <Ionicons name="map-outline" size={48} color="#D1D5DB" />
        <Text style={{ fontSize: 18, color: '#666', marginTop: 16 }}>🗺️ Map Unavailable</Text>
        <Text style={{ fontSize: 14, color: '#999', marginTop: 8, textAlign: 'center' }}>react-native-maps not properly installed</Text>
        <Text style={{ fontSize: 12, color: '#ccc', marginTop: 4, textAlign: 'center' }}>Tap on sitters below to view profiles</Text>
      </View>
    );
  }
};

// Platform-specific map component
const PlatformMap = ({ children, style, ...props }: any) => {
  if (Platform.OS === 'web') {
    return <WebMapComponent style={style} {...props}>{children}</WebMapComponent>;
  }

  return <NativeMapComponent style={style} {...props}>{children}</NativeMapComponent>;
};

export const PlatformMarker = ({ children, ...props }: any) => {
  if (Platform.OS === 'web') {
    // For web, we'll handle markers differently
    return null;
  }

  try {
    const Maps = require('react-native-maps');
    const Marker = Maps.Marker;
    return <Marker {...props}>{children}</Marker>;
  } catch (error) {
    console.warn('react-native-maps Marker not available:', error);
    return null;
  }
};

export default PlatformMap;
