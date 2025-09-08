#!/bin/bash

echo "🔢 LATEST PHONE VERIFICATION CODES"
echo "=================================="
echo ""

if [ -f "storage/logs/verification.log" ]; then
    echo "📱 Recent verification codes:"
    echo ""
    # Show the last 20 lines of verification codes
    tail -20 storage/logs/verification.log | grep "🔢 VERIFICATION CODE" || echo "No verification codes found in recent logs"
    echo ""
    echo "📊 Total verification codes generated:"
    grep -c "🔢 VERIFICATION CODE" storage/logs/verification.log 2>/dev/null || echo "0"
else
    echo "⚠️  Verification log file not found at storage/logs/verification.log"
    echo "💡 Run a phone verification to generate the log file"
fi

echo ""
echo "💡 To monitor codes in real-time, run: ./monitor_verification_codes_live.sh"
