#!/bin/bash

echo "🛑 STOPPING ALL PET SITTING APP SERVICES"
echo "========================================="
echo ""

echo "🧹 Stopping Laravel Backend..."
pkill -f "php artisan serve" 2>/dev/null

echo "🧹 Stopping Vite Dev Server..."
pkill -f "npm run dev" 2>/dev/null

echo "🧹 Stopping Expo Dev Server..."
pkill -f "expo start" 2>/dev/null

echo "🧹 Stopping Phone Code Monitor..."
pkill -f "monitor_phone_codes" 2>/dev/null

# Optionally stop any tails spawned by us (Terminal windows will persist unless closed)
pkill -f "tail -f logs/app.log" 2>/dev/null
pkill -f "tail -f logs/web.log" 2>/dev/null
pkill -f "tee -a logs/phone-codes.log" 2>/dev/null

echo "🧹 Stopping any remaining Node processes..."
pkill -f "node.*expo" 2>/dev/null

echo ""
echo "✅ All services stopped successfully!"
echo "💡 Run ./start_all_services.sh to start them again" 