#!/bin/bash

echo "📱 PHONE VERIFICATION LIVE MONITORING"
echo "====================================="
echo ""
echo "🔍 Monitoring verification codes in real-time..."
echo "📋 Press Ctrl+C to stop monitoring"
echo ""

cd "/Users/jassy/Desktop/CAPSTONE APP /CapstoneApp/pet-sitting-app"

tail -f storage/logs/laravel.log | grep -E "(Debug Code|VERIFY SMS|🔔|📱|✅|❌|🎭|⏰|🌐|👤|📞|🔍|🧹|🎉|Send Code|Verify Code)"