#!/bin/bash

echo "🔢 LATEST VERIFICATION CODE"
echo "==========================="

# Get the most recent verification code from logs
latest_code=$(grep -E "(🔢 PHONE VERIFICATION CODE|🎭 SMS SIMULATION.*verification code is:)" pet-sitting-app/storage/logs/laravel.log | tail -1 | grep -o '[0-9]\{6\}' | tail -1)

if [ -n "$latest_code" ]; then
    echo "📱 Phone: +639123456789"
    echo "🔢 Code: $latest_code"
    echo "⏰ Generated: $(date)"
    echo ""
    echo "💡 Use this code in the mobile app for testing!"
else
    echo "❌ No verification codes found in logs"
    echo "💡 Try sending a new verification code first"
fi 