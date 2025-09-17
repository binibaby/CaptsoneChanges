#!/bin/bash

echo "🔧 Setting up dual phone development environment..."

# Get current IP address
IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
echo "📱 Your IP address: $IP"

# Check if Metro is running
METRO_PID=$(lsof -ti:8081)
if [ ! -z "$METRO_PID" ]; then
    echo "📦 Metro bundler is running (PID: $METRO_PID)"
else
    echo "⚠️  Metro bundler is not running"
fi

# Check if backend is running
BACKEND_PID=$(lsof -ti:8000)
if [ ! -z "$BACKEND_PID" ]; then
    echo "🔧 Backend server is running (PID: $BACKEND_PID)"
else
    echo "⚠️  Backend server is not running"
fi

echo ""
echo "📲 For your iOS devices, use these URLs:"
echo "   Metro bundler: exp://$IP:8081"
echo "   Backend API: http://$IP:8000"
echo ""

echo "🔥 To restart Metro with better dual device support:"
echo "   npx expo start --host tunnel"
echo "   OR"
echo "   npx expo start --host $IP"
echo ""

echo "📱 Device connection checklist:"
echo "   ✓ Both phones on same WiFi network"
echo "   ✓ Firewall allows connections on ports 8081 and 8000"
echo "   ✓ Expo Go app updated on both devices"
echo "   ✓ Same Expo account on both devices"
echo ""

# Test connectivity
echo "🧪 Testing connectivity..."
curl -s http://$IP:8081/status > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Metro bundler is accessible"
else
    echo "❌ Metro bundler is not accessible"
fi

curl -s http://$IP:8000/ > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Backend server is accessible"
else
    echo "❌ Backend server is not accessible"
fi

echo ""
echo "🚀 Ready for dual phone testing!"
