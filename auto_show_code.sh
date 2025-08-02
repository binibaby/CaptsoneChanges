#!/bin/bash

echo "🔢 AUTO-SHOW VERIFICATION CODE"
echo "=============================="
echo "Monitoring for new verification codes..."
echo "Press Ctrl+C to stop"
echo ""

# Function to show latest code
show_latest_code() {
    latest_code=$(grep -E "(🔢 PHONE VERIFICATION CODE|🎭 SMS SIMULATION.*verification code is:)" pet-sitting-app/storage/logs/laravel.log | tail -1 | grep -o '[0-9]\{6\}' | tail -1)
    if [ -n "$latest_code" ]; then
        echo ""
        echo "🔢 NEW VERIFICATION CODE DETECTED!"
        echo "================================"
        echo "📱 Phone: +639123456789"
        echo "🔢 Code: $latest_code"
        echo "⏰ Generated: $(date)"
        echo "💡 Use this code in the mobile app!"
        echo ""
    fi
}

# Show initial code
show_latest_code

# Monitor logs for new codes
tail -f pet-sitting-app/storage/logs/laravel.log | grep --line-buffered -E "(🔢 PHONE VERIFICATION CODE|🎭 SMS SIMULATION.*verification code is:)" | while read line; do
    show_latest_code
done 