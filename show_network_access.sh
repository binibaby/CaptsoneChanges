#!/bin/bash

echo "🌐 NETWORK ACCESS FOR MOBILE DEVICE"
echo "==================================="
echo ""

# Get the IP address
IP_ADDRESS=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}')

echo "✅ Your computer's IP address: $IP_ADDRESS"
echo "📱 Make sure your phone is on the same WiFi network!"
echo ""

echo "🔗 ACCESS URLs:"
echo "==============="
echo "🌐 Laravel Backend: http://$IP_ADDRESS:8000"
echo "🔐 Admin Panel: http://$IP_ADDRESS:8000/admin/login"
echo "📱 Expo Dev Server: http://$IP_ADDRESS:8081"
echo "🔌 API Endpoints: http://$IP_ADDRESS:8000/api/*"
echo ""

echo "📋 PHONE VERIFICATION LOGS:"
echo "============================"
echo "📁 Main Log: logs/phone-codes.log"
echo "📁 Laravel Log: pet-sitting-app/storage/logs/laravel.log"
echo "📁 Verification Log: pet-sitting-app/storage/logs/verification.log"
echo ""

echo "🎯 TO GET TO ONBOARDING SCREEN:"
echo "================================"
echo "1. 📱 Open Expo Go app on your phone"
echo "2. 🔍 Scan the QR code from Expo terminal"
echo "3. 🚀 App will automatically navigate to onboarding"
echo "4. 📱 Complete the walkthrough screens"
echo ""

echo "💡 TROUBLESHOOTING:"
echo "==================="
echo "• 🔥 Check firewall settings on your Mac"
echo "• 📶 Ensure both devices are on same WiFi"
echo "• 🔄 Restart Expo if connection fails"
echo "• 📱 Use Expo Go app (not web browser)"
echo ""

echo "🚀 Your app is ready for mobile access!"
echo "📱 Scan the QR code and start onboarding!"
