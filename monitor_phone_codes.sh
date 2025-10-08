#!/bin/bash

# Script to monitor phone verification codes in real-time
# This will show new verification codes as they are generated

echo "📱 MONITORING PHONE VERIFICATION CODES"
echo "======================================"
echo "Press Ctrl+C to stop monitoring"
echo ""

# Monitor the main Laravel log for verification codes
tail -f pet-sitting-app/storage/logs/laravel.log | grep --line-buffered -E "(PHONE VERIFICATION CODE|SMS SIMULATION|COPY THIS CODE|VERIFICATION CODE FOR)"