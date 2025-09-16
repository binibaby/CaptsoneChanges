#!/bin/bash

# Script to update all IP addresses to mobile data IP
# Run this script when switching to mobile data

echo "🔄 Updating all IP addresses to mobile data IP..."

# Get current mobile data IP
MOBILE_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}')

if [ -z "$MOBILE_IP" ]; then
    echo "❌ Could not detect mobile data IP. Please check your connection."
    exit 1
fi

echo "📱 Detected mobile data IP: $MOBILE_IP"

# Update all files with the new IP
echo "🔧 Updating configuration files..."

# Update config.ts
sed -i '' "s/192\.168\.100\.184/$MOBILE_IP/g" src/constants/config.ts
sed -i '' "s/192\.168\.100\.179/$MOBILE_IP/g" src/constants/config.ts

# Update all TypeScript/JavaScript files
find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | grep -v node_modules | xargs sed -i '' "s/192\.168\.100\.184/$MOBILE_IP/g"
find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | grep -v node_modules | xargs sed -i '' "s/192\.168\.100\.179/$MOBILE_IP/g"

# Update PHP test files
find . -name "*.php" | grep -v vendor | xargs sed -i '' "s/192\.168\.100\.184/$MOBILE_IP/g"
find . -name "*.php" | grep -v vendor | xargs sed -i '' "s/192\.168\.100\.179/$MOBILE_IP/g"

# Update shell scripts
find . -name "*.sh" | xargs sed -i '' "s/192\.168\.100\.184/$MOBILE_IP/g"
find . -name "*.sh" | xargs sed -i '' "s/192\.168\.100\.179/$MOBILE_IP/g"

# Update backend config
sed -i '' "s/192\.168\.100\.184/$MOBILE_IP/g" pet-sitting-app/vite.config.js

echo "✅ All IP addresses updated to $MOBILE_IP"
echo "🚀 You can now use the app with mobile data!"
echo ""
echo "💡 To switch back to WiFi, run: ./update_wifi_ip.sh"
