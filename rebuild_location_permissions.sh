#!/bin/bash

echo "🔧 Rebuilding App with Location Permissions..."
echo "=============================================="

# Stop any running Expo processes
echo "🛑 Stopping any running Expo processes..."
pkill -f "expo" || true
pkill -f "metro" || true

# Clear Expo cache
echo "🧹 Clearing Expo cache..."
npx expo start --clear --no-dev --minify

echo ""
echo "✅ Rebuild process started!"
echo ""
echo "📱 Next steps:"
echo "1. Wait for the app to rebuild completely"
echo "2. Log in with your user account"
echo "3. Grant location permissions when prompted"
echo "4. Check console logs for location updates"
echo ""
echo "🔍 If you still see permission errors:"
echo "- Try: npx expo run:ios --clear (for iOS)"
echo "- Try: npx expo run:android --clear (for Android)"
echo ""
echo "📚 For more help, see: LOCATION_TRACKING_GUIDE.md"
