#!/bin/bash

echo "🔍 Finding your computer's IP address..."
echo "========================================"

# Get the IP address
IP_ADDRESS=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}')

if [ -z "$IP_ADDRESS" ]; then
    echo "❌ Could not find your IP address"
    echo "💡 Try running: ifconfig | grep 'inet ' | grep -v 127.0.0.1"
    exit 1
fi

echo "✅ Found IP address: $IP_ADDRESS"
echo ""

# Update the config file
CONFIG_FILE="src/constants/config.ts"
if [ -f "$CONFIG_FILE" ]; then
    echo "📝 Updating configuration file..."
    
    # Create backup
    cp "$CONFIG_FILE" "${CONFIG_FILE}.backup"
    echo "💾 Backup created: ${CONFIG_FILE}.backup"
    
    # Update the IP address
    sed -i '' "s/http:\/\/[0-9]\{1,3\}\.[0-9]\{1,3\}\.[0-9]\{1,3\}\.[0-9]\{1,3\}:8000/http:\/\/$IP_ADDRESS:8000/g" "$CONFIG_FILE"
    
    echo "✅ Updated $CONFIG_FILE with IP: $IP_ADDRESS"
    echo ""
    echo "🌐 Your app will now connect to: http://$IP_ADDRESS:8000"
    echo ""
    echo "📱 Make sure your phone and computer are on the same WiFi network!"
    echo "💡 If you still have connection issues, check your firewall settings"
else
    echo "❌ Configuration file not found: $CONFIG_FILE"
    exit 1
fi

echo ""
echo "🎯 Next steps:"
echo "1. Restart your React Native app"
echo "2. Try the verification flow again"
echo "3. Check the phone verification monitor for codes"
echo ""
echo "🚀 Your app should now work properly on mobile devices!" 