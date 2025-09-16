#!/bin/bash

# Script to update all IP addresses to WiFi IP
# Run this script when switching back to WiFi

echo "🔄 Updating all IP addresses to WiFi IP..."

# Get current WiFi IP
WIFI_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}')

if [ -z "$WIFI_IP" ]; then
    echo "❌ Could not detect WiFi IP. Please check your connection."
    exit 1
fi

echo "📶 Detected WiFi IP: $WIFI_IP"

# Update all files with the new IP
echo "🔧 Updating configuration files..."

# Update config.ts
sed -i '' "s/172\.20\.10\.2/$WIFI_IP/g" src/constants/config.ts

# Update all TypeScript/JavaScript files
find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | grep -v node_modules | xargs sed -i '' "s/172\.20\.10\.2/$WIFI_IP/g"

# Update PHP test files
find . -name "*.php" | grep -v vendor | xargs sed -i '' "s/172\.20\.10\.2/$WIFI_IP/g"

# Update shell scripts
find . -name "*.sh" | xargs sed -i '' "s/172\.20\.10\.2/$WIFI_IP/g"

# Update backend config
sed -i '' "s/172\.20\.10\.2/$WIFI_IP/g" pet-sitting-app/vite.config.js

echo "✅ All IP addresses updated to $WIFI_IP"
echo "🚀 You can now use the app with WiFi!"
echo ""
echo "💡 To switch back to mobile data, run: ./update_mobile_ip.sh"
