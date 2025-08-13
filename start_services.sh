#!/bin/bash

echo "🚀 Starting Pet Sitting App Services..."
echo "======================================"

# Function to show phone verification codes prominently
show_phone_codes() {
    echo ""
    echo "📱 PHONE VERIFICATION CODES MONITORING"
    echo "======================================"
    echo "🔍 Monitoring verification codes in real-time..."
    echo "💡 Codes will appear here when users request verification"
    echo ""
}

# Start Laravel backend
echo "🌐 Starting Laravel Backend..."
cd pet-sitting-app
php artisan serve --host=0.0.0.0 --port=8000 &
LARAVEL_PID=$!
echo "✅ Laravel running on http://localhost:8000 (PID: $LARAVEL_PID)"

# Start Vite dev server
echo "⚡ Starting Vite Dev Server..."
npm run dev &
VITE_PID=$!
echo "✅ Vite running (PID: $VITE_PID)"

# Go back to main directory
cd ..

# Start React Native app
echo "📱 Starting React Native App..."
npm start &
EXPO_PID=$!
echo "✅ Expo running (PID: $EXPO_PID)"

# Wait a moment for services to start
sleep 3

# Show phone codes monitoring
show_phone_codes

# Monitor verification codes in real-time
echo "🔍 Starting phone verification code monitor..."
cd pet-sitting-app
tail -f storage/logs/laravel.log | grep -i "verification\|code\|sms\|phone" --color=always &
MONITOR_PID=$!

echo ""
echo "🎯 All services are running!"
echo "============================"
echo "🌐 Admin Panel: http://localhost:8000/admin/login"
echo "📱 Expo App: Check terminal for QR code"
echo "📊 Phone Codes: Monitoring in real-time above"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for user to stop
wait

# Cleanup function
cleanup() {
    echo ""
    echo "🛑 Stopping all services..."
    kill $LARAVEL_PID $VITE_PID $EXPO_PID $MONITOR_PID 2>/dev/null
    echo "✅ All services stopped"
    exit 0
}

# Set trap for cleanup
trap cleanup SIGINT SIGTERM

# Keep script running
wait 