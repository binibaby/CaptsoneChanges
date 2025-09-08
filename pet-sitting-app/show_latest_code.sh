#!/bin/bash

echo "🔢 LATEST VERIFICATION CODE"
echo "=========================="
echo ""

if [ -f "storage/logs/verification.log" ]; then
    # Get the latest verification code
    latest_code=$(grep "🔢 VERIFICATION CODE FOR" storage/logs/verification.log | tail -1)
    
    if [ -n "$latest_code" ]; then
        echo "📱 $latest_code"
        echo ""
        echo "💡 This code expires in 10 minutes"
        echo "📋 Use this code in your app to verify the phone number"
    else
        echo "⚠️  No verification codes found"
        echo "💡 Send a verification code first to see it here"
    fi
else
    echo "⚠️  Verification log file not found"
    echo "💡 Send a verification code first to create the log file"
fi

echo ""
echo "🔄 To see all recent codes: ./show_latest_codes.sh"
echo "📺 To monitor in real-time: ./monitor_verification_codes_live.sh"

