#!/bin/bash

echo "📱 PHONE VERIFICATION CODE MONITOR"
echo "==================================="
echo "🔍 Monitoring verification codes in real-time..."
echo "💡 This will show all SMS codes, verification requests, and phone-related logs"
echo ""

# Function to highlight verification codes
highlight_codes() {
    # Make verification codes stand out with colors and formatting
    sed -u 's/\([0-9]\{4,6\}\)/🔐 \1 🔐/g' | \
    sed -u 's/verification/🔄 VERIFICATION/g' | \
    sed -u 's/phone/📞 PHONE/g' | \
    sed -u 's/sms/💬 SMS/g' | \
    sed -u 's/code/🔑 CODE/g' | \
    sed -u 's/otp/🔢 OTP/g'
}

# Monitor Laravel logs for verification-related activities
echo "🔍 Starting real-time phone verification monitoring..."
echo "📊 Watching logs for: verification codes, SMS, OTP, phone numbers"
echo ""

cd pet-sitting-app

# Monitor multiple log sources for comprehensive coverage
echo "📋 Monitoring Laravel logs..."
tail -f storage/logs/laravel.log | highlight_codes &

echo "📋 Monitoring verification audit logs..."
if [ -f storage/logs/verification.log ]; then
    tail -f storage/logs/verification.log | highlight_codes &
fi

echo "📋 Monitoring general application logs..."
tail -f storage/logs/app.log 2>/dev/null | highlight_codes &

echo ""
echo "🎯 Phone verification codes will appear here in real-time!"
echo "💡 Keep this terminal open to see all verification activities"
echo "🛑 Press Ctrl+C to stop monitoring"
echo ""

# Wait for user input
wait 