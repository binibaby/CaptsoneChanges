#!/bin/bash

echo "🚀 STARTING PET SITTING APP - ALL SERVICES"
echo "============================================"
echo ""

# Kill any existing services
echo "🧹 Cleaning up existing services..."
pkill -f "php artisan serve" 2>/dev/null
pkill -f "npm run dev" 2>/dev/null
pkill -f "expo start" 2>/dev/null
pkill -f "monitor_phone_codes" 2>/dev/null
sleep 2

echo "✅ Cleanup complete"
echo ""

# Prepare logging directory and files
LOG_DIR="logs"
mkdir -p "$LOG_DIR"
APP_LOG="$LOG_DIR/app.log"
WEB_LOG="$LOG_DIR/web.log"
PHONE_LOG="$LOG_DIR/phone-codes.log"

# Initialize/rotate logs lightly
echo "==== $(date) - Starting Expo (App) ====" >> "$APP_LOG"
echo "==== $(date) - Starting Vite (Web) ====" >> "$WEB_LOG"
echo "==== $(date) - Starting Phone Code Monitor ====" >> "$PHONE_LOG"

# Function to start service and show status
start_service() {
    local service_name=$1
    local command=$2
    local description=$3
    
    echo "🌐 Starting $service_name..."
    echo "   📝 $description"
    
    eval "$command" &
    local pid=$!
    echo "   ✅ $service_name started (PID: $pid)"
    echo ""
}

# Start Laravel Backend
start_service "Laravel Backend" \
    "cd pet-sitting-app && php artisan serve --host=0.0.0.0 --port=8000" \
    "Admin panel and API endpoints"

# Start Vite Dev Server (log to logs/web.log)
start_service "Vite Dev Server" \
    "cd pet-sitting-app && npm run dev >> ../$WEB_LOG 2>&1" \
    "Frontend asset compilation"

# Start React Native App (log to logs/app.log)
start_service "React Native App" \
    "npm start >> $APP_LOG 2>&1" \
    "Expo development server with QR code"

# Wait for services to start
echo "⏳ Waiting for services to initialize..."
sleep 5

# Start Phone Verification Code Monitor
echo "📱 Starting Phone Verification Code Monitor..."
echo "🔍 This will show all verification codes prominently!"
echo ""

# Create a dedicated terminal for phone code monitoring and persist logs
osascript -e "tell application \"Terminal\" to do script \"cd \\\"$(pwd)\\\" && ./monitor_phone_codes.sh | tee -a \\\"$(pwd)/$PHONE_LOG\\\"\"" &

# Open dedicated terminals to tail app and web logs
osascript -e "tell application \"Terminal\" to do script \"cd \\\"$(pwd)\\\" && echo 📱 Tailing app log: logs/app.log && tail -f logs/app.log\"" &
osascript -e "tell application \"Terminal\" to do script \"cd \\\"$(pwd)\\\" && echo 🌐 Tailing web log: logs/web.log && tail -f logs/web.log\"" &

echo ""
echo "🎯 ALL SERVICES ARE NOW RUNNING!"
echo "================================"
echo "🌐 Admin Panel: http://localhost:8000/admin/login"
echo "📱 Expo App: Check terminal for QR code"
echo "📊 Phone Codes: New terminal opened for monitoring"
echo ""
echo "📋 Service Status:"
echo "   ✅ Laravel Backend: http://localhost:8000"
echo "   ✅ Vite Dev Server: Asset compilation"
echo "   ✅ Expo Dev Server: React Native app"
echo "   ✅ Phone Code Monitor: Dedicated terminal"
echo ""
echo "💡 To stop all services, run: ./stop_all_services.sh"
echo "💡 To view phone codes only, run: ./monitor_phone_codes.sh"
echo ""
echo "🚀 Your pet sitting app is ready!" 