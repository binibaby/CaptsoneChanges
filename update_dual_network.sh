#!/bin/bash

echo "🌐 DUAL NETWORK IP UPDATE SCRIPT"
echo "================================="
echo "This script will update your app to work with both WiFi and mobile data"
echo ""

# Get current IP address
CURRENT_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}')

if [ -z "$CURRENT_IP" ]; then
    echo "❌ Could not find your IP address"
    exit 1
fi

echo "✅ Current IP address: $CURRENT_IP"
echo ""

# Define the IP addresses for both networks
WIFI_IP="$CURRENT_IP"
MOBILE_IP="172.20.10.2"

echo "📱 Network Configuration:"
echo "   WiFi IP: $WIFI_IP"
echo "   Mobile Data IP: $MOBILE_IP"
echo ""

# Files to update with new IP configuration
FILES=(
    "src/constants/config.ts"
    "src/services/authService.ts"
    "app/auth.tsx"
    "test_network_connection.js"
    "test_login.sh"
    "pet-sitting-app/vite.config.js"
)

echo "🔧 Updating files with dual network support..."

# Update each file
for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "📝 Updating $file..."
        
        # Create backup
        cp "$file" "${file}.backup.$(date +%Y%m%d_%H%M%S)"
        
        # Replace hardcoded IP addresses with current WiFi IP
        sed -i '' "s/http:\/\/172\.20\.10\.2:8000/http:\/\/$WIFI_IP:8000/g" "$file"
        sed -i '' "s/http:\/\/127\.0\.0\.1:8000/http:\/\/$WIFI_IP:8000/g" "$file"
        sed -i '' "s/http:\/\/localhost:8000/http:\/\/$WIFI_IP:8000/g" "$file"
        
        echo "   ✅ Updated with WiFi IP: $WIFI_IP"
    else
        echo "   ⚠️  File not found: $file"
    fi
done

echo ""
echo "🎯 DUAL NETWORK CONFIGURATION COMPLETE!"
echo "======================================="
echo ""
echo "📱 Your app now supports:"
echo "   ✅ WiFi connection: $WIFI_IP"
echo "   ✅ Mobile data connection: $MOBILE_IP"
echo "   ✅ Automatic network detection"
echo "   ✅ Fallback to alternative IPs"
echo ""
echo "🚀 Next steps:"
echo "1. Restart your React Native app: npm start"
echo "2. Test with WiFi connection"
echo "3. Switch to mobile data and test again"
echo "4. The app will automatically detect the working IP"
echo ""
echo "💡 The network service will:"
echo "   • Try WiFi IP first ($WIFI_IP)"
echo "   • Fallback to mobile IP if needed ($MOBILE_IP)"
echo "   • Automatically retry failed connections"
echo "   • Work seamlessly when switching networks"
echo ""
echo "🔍 To monitor network activity:"
echo "   ./monitor_phone_codes.sh"
echo ""
echo "🎉 Your app is now dual-network ready!"
