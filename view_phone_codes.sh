#!/bin/bash

# Script to view phone verification codes from logs
# This makes it easy to find verification codes during testing

echo "📱 PHONE VERIFICATION CODES"
echo "============================"
echo ""

# Check if verification log file exists
if [ -f "pet-sitting-app/storage/logs/verification.log" ]; then
    echo "🔍 Latest verification codes from verification.log:"
    echo "---------------------------------------------------"
    tail -20 pet-sitting-app/storage/logs/verification.log | grep -E "(VERIFICATION CODE|SIMULATION SMS|Code:)"
    echo ""
fi

# Check main Laravel log for verification codes
if [ -f "pet-sitting-app/storage/logs/laravel.log" ]; then
    echo "🔍 Latest verification codes from laravel.log:"
    echo "----------------------------------------------"
    tail -50 pet-sitting-app/storage/logs/laravel.log | grep -E "(PHONE VERIFICATION CODE|SMS SIMULATION|COPY THIS CODE)" | tail -10
    echo ""
fi

# Show current time for reference
echo "⏰ Current time: $(date)"
echo "📝 Tip: Use 'tail -f pet-sitting-app/storage/logs/laravel.log' to watch logs in real-time"
