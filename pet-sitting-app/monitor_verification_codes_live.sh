#!/bin/bash

echo "🔢 PHONE VERIFICATION CODES LIVE MONITOR"
echo "========================================"
echo "📱 Monitoring verification codes in real-time..."
echo "📋 Press Ctrl+C to stop monitoring"
echo ""

# Monitor the verification log file
tail -f storage/logs/verification.log 2>/dev/null || {
    echo "⚠️  Verification log file not found. Creating it..."
    touch storage/logs/verification.log
    echo "✅ Verification log file created. Starting monitoring..."
    echo ""
    tail -f storage/logs/verification.log
}
