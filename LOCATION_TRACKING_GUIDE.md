# Real-Time Location Tracking System

## Overview

This app now includes a comprehensive real-time location tracking system that automatically detects and monitors user locations when they log in. The system provides continuous location updates, address resolution, and radius-based monitoring.

## Features

### 🔍 **Automatic Location Detection**
- **On Login**: Location tracking automatically starts when a user logs in
- **Real-time Updates**: Continuous location monitoring with configurable intervals
- **Address Resolution**: Converts coordinates to human-readable addresses
- **Radius Monitoring**: Tracks when users enter/exit defined areas

### 📱 **Location Services**
- **Foreground Tracking**: Works when app is active
- **Background Support**: Continues tracking when app is minimized
- **Permission Management**: Handles location permissions gracefully
- **Battery Optimization**: Smart updates based on movement

### 🎯 **Use Cases**
- **Pet Sitter Discovery**: Find nearby pet sitters based on user location
- **Service Radius**: Monitor when users are within service areas
- **Location History**: Track user movements for service delivery
- **Emergency Services**: Provide accurate location for urgent situations

## How It Works

### 1. **Authentication Integration**
```typescript
// Location tracking automatically starts when user logs in
useEffect(() => {
  if (user && isAuthenticated && !isLocationTracking) {
    startLocationTracking(1000); // 1km radius
  }
}, [user, isAuthenticated]);
```

### 2. **Permission Request**
- Requests foreground location permissions
- Requests background location permissions (iOS)
- Gracefully handles permission denials

### 3. **Location Monitoring**
- Uses `expo-location` for accurate GPS tracking
- Configurable update intervals (default: 30 seconds)
- Distance-based updates (every 10 meters of movement)
- High accuracy positioning

### 4. **Address Resolution**
- Reverse geocoding using coordinates
- Provides human-readable addresses
- Caches address information for performance

## Components

### **LocationService** (`src/services/locationService.ts`)
Core service that handles:
- Location permission requests
- Continuous location tracking
- Radius calculations
- Address resolution
- Error handling

### **AuthContext Integration** (`src/contexts/AuthContext.tsx`)
Provides location data to the entire app:
- `currentLocation`: Current GPS coordinates
- `userAddress`: Human-readable address
- `isLocationTracking`: Tracking status
- `startLocationTracking()`: Start tracking
- `stopLocationTracking()`: Stop tracking

### **LocationDisplay Component** (`src/components/LocationDisplay.tsx`)
Reusable component showing:
- Location status indicators
- Address information
- Coordinate display
- Error states

## Usage Examples

### **Basic Location Display**
```typescript
import LocationDisplay from '../components/LocationDisplay';

// Show address only
<LocationDisplay showAddress={true} showCoordinates={false} />

// Show coordinates only
<LocationDisplay showAddress={false} showCoordinates={true} />

// Compact version
<LocationDisplay compact={true} />
```

### **Custom Location Tracking**
```typescript
import { useAuth } from '../contexts/AuthContext';

const { startLocationTracking, currentLocation, userAddress } = useAuth();

// Start tracking with custom radius
await startLocationTracking(2000); // 2km radius

// Use location data
if (currentLocation) {
  console.log('Lat:', currentLocation.coords.latitude);
  console.log('Lng:', currentLocation.coords.longitude);
  console.log('Address:', userAddress);
}
```

### **Radius Monitoring**
```typescript
const config: LocationConfig = {
  radius: 1000, // 1km
  updateInterval: 30000, // 30 seconds
  onLocationUpdate: (location) => {
    console.log('Location updated:', location);
  },
  onRadiusEnter: (location) => {
    console.log('User entered 1km radius');
  },
  onRadiusExit: (location) => {
    console.log('User exited 1km radius');
  }
};
```

## Configuration

### **App Permissions** (`app.json`)
```json
{
  "ios": {
    "infoPlist": {
      "NSLocationWhenInUseUsageDescription": "We use your location to show nearby pet sitters on the map and provide real-time location-based services.",
      "NSLocationAlwaysAndWhenInUseUsageDescription": "We use your location to provide real-time pet sitting services, notify you when you're near available sitters, and track your location for service delivery.",
      "UIBackgroundModes": ["location", "background-processing"]
    }
  },
  "android": {
    "permissions": [
      "ACCESS_COARSE_LOCATION",
      "ACCESS_FINE_LOCATION",
      "ACCESS_BACKGROUND_LOCATION"
    ]
  }
}
```

### **Location Service Settings**
- **Default Radius**: 1km (1000 meters)
- **Update Interval**: 30 seconds
- **Distance Threshold**: 10 meters
- **Accuracy**: Balanced (good accuracy, reasonable battery usage)

## Privacy & Security

### **Data Handling**
- Location data is stored locally on the device
- No location data is sent to external servers without user consent
- Address resolution uses device's built-in geocoding services

### **Permission Management**
- Users must explicitly grant location permissions
- Background location requires additional permission on iOS
- Graceful fallback when permissions are denied

### **Battery Optimization**
- Smart update intervals based on movement
- Distance-based updates reduce unnecessary GPS calls
- Background location indicators show when tracking is active

## Troubleshooting

### **Common Issues**

1. **Location Not Updating**
   - Check if location permissions are granted
   - Verify GPS is enabled on device
   - Check if location services are enabled

2. **Address Not Resolving**
   - Ensure internet connection is available
   - Check if geocoding services are working
   - Verify coordinates are valid

3. **Battery Drain**
   - Reduce update frequency
   - Increase distance threshold
   - Use lower accuracy settings

### **Debug Information**
```typescript
// Check location tracking status
console.log('Tracking active:', isLocationTracking);
console.log('Current location:', currentLocation);
console.log('User address:', userAddress);

// Check location service status
console.log('Service tracking:', locationService.isLocationTracking());
console.log('Last known location:', locationService.getLastKnownLocation());
```

## Performance Considerations

### **Optimization Tips**
- Use appropriate update intervals for your use case
- Implement location caching for frequently accessed data
- Consider using lower accuracy for non-critical features
- Monitor battery usage and adjust settings accordingly

### **Best Practices**
- Always handle permission denials gracefully
- Provide clear feedback about location status
- Use location data responsibly and transparently
- Test on various devices and network conditions

## Future Enhancements

### **Planned Features**
- **Geofencing**: Create custom geographic boundaries
- **Location History**: Store and analyze location patterns
- **Offline Support**: Cache location data for offline use
- **Multi-user Tracking**: Track multiple users simultaneously
- **Location Analytics**: Insights into user movement patterns

### **Integration Opportunities**
- **Push Notifications**: Location-based alerts
- **Emergency Services**: Quick location sharing
- **Social Features**: Find nearby users
- **Analytics**: User behavior insights

---

This location tracking system provides a solid foundation for location-based features while maintaining user privacy and optimizing performance. The modular design makes it easy to extend and customize for specific use cases.
