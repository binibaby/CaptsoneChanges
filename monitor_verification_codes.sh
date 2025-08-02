#!/bin/bash

echo "🔢 VERIFICATION CODE MONITOR"
echo "============================"
echo "Monitoring Laravel logs for verification codes..."
echo "Press Ctrl+C to stop monitoring"
echo ""

# Function to show latest codes
show_latest_codes() {
    echo "📋 LATEST VERIFICATION CODES:"
    echo "============================="
    grep -E "(🔢 PHONE VERIFICATION CODE|📱 PHONE VERIFICATION CODE|🎭 SMS SIMULATION.*verification code is:)" pet-sitting-app/storage/logs/laravel.log | tail -5
    echo ""
}

# Show initial codes
show_latest_codes

# Monitor in real-time
echo "🔍 MONITORING FOR NEW CODES..."
echo "==============================="
tail -f pet-sitting-app/storage/logs/laravel.log | grep --line-buffered -E "(🔢 PHONE VERIFICATION CODE|📱 PHONE VERIFICATION CODE|🎭 SMS SIMULATION.*verification code is:)" 