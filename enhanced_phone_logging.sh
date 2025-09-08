#!/bin/bash

echo "📱 ENHANCED PHONE VERIFICATION CODE LOGGER"
echo "==========================================="
echo "🔍 Capturing ALL verification codes to logs/phone-codes.log"
echo "💡 This will log every code, SMS, and verification activity"
echo ""

# Set up logging directory and file
LOG_DIR="logs"
PHONE_LOG="$LOG_DIR/phone-codes.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Create logs directory if it doesn't exist
mkdir -p "$LOG_DIR"

# Function to log verification codes with proper formatting
log_verification_code() {
    local code=$1
    local phone=$2
    local action=$3
    local details=$4
    
    echo "==== $(date) - $action ====" >> "$PHONE_LOG"
    echo "🔐 VERIFICATION CODE: $code" >> "$PHONE_LOG"
    echo "📞 Phone: $phone" >> "$PHONE_LOG"
    echo "⏰ Time: $(date)" >> "$PHONE_LOG"
    echo "📝 Details: $details" >> "$PHONE_LOG"
    echo "" >> "$PHONE_LOG"
    
    # Also display in terminal
    echo "🔐 NEW VERIFICATION CODE LOGGED: $code"
    echo "📞 Phone: $phone"
    echo "⏰ Time: $(date)"
    echo "📝 Action: $action"
    echo "---"
}

# Function to monitor and extract verification codes from Laravel logs
monitor_laravel_logs() {
    echo "🔍 Monitoring Laravel logs for verification codes..."
    
    cd pet-sitting-app
    
    # Monitor Laravel logs and extract verification codes
    tail -f storage/logs/laravel.log | while read line; do
        # Look for verification codes in various formats
        if echo "$line" | grep -q "verification.*code\|code.*verification\|SMS.*code\|OTP\|verification.*OTP"; then
            # Extract 4-6 digit codes
            codes=$(echo "$line" | grep -o '[0-9]\{4,6\}' | head -1)
            if [ ! -z "$codes" ]; then
                # Extract phone number if present
                phone=$(echo "$line" | grep -o '+[0-9]\{10,15\}' | head -1)
                if [ -z "$phone" ]; then
                    phone="Unknown"
                fi
                
                # Determine action type
                if echo "$line" | grep -q "sent\|generated"; then
                    action="CODE GENERATED"
                elif echo "$line" | grep -q "verified\|confirmed"; then
                    action="CODE VERIFIED"
                elif echo "$line" | grep -q "received\|submitted"; then
                    action="CODE RECEIVED"
                else
                    action="CODE ACTIVITY"
                fi
                
                # Log the verification code
                log_verification_code "$codes" "$phone" "$action" "$line"
            fi
        fi
        
        # Also look for specific patterns like "Your verification code is: 123456"
        if echo "$line" | grep -q "verification.*code.*is\|code.*is.*[0-9]"; then
            code=$(echo "$line" | grep -o '[0-9]\{4,6\}' | head -1)
            phone=$(echo "$line" | grep -o '+[0-9]\{10,15\}' | head -1)
            if [ ! -z "$code" ]; then
                if [ -z "$phone" ]; then
                    phone="Unknown"
                fi
                log_verification_code "$code" "$phone" "CODE SENT" "$line"
            fi
        fi
    done
}

# Function to monitor verification-specific logs
monitor_verification_logs() {
    echo "📋 Monitoring verification-specific logs..."
    
    cd pet-sitting-app
    
    # Check if verification.log exists, if not create it
    if [ ! -f storage/logs/verification.log ]; then
        echo "Creating verification.log for dedicated verification logging..."
        touch storage/logs/verification.log
    fi
    
    # Monitor verification logs
    tail -f storage/logs/verification.log | while read line; do
        echo "$line" >> "../$PHONE_LOG"
        echo "$line"
    done &
}

# Function to monitor general app logs
monitor_app_logs() {
    echo "📋 Monitoring general application logs..."
    
    cd pet-sitting-app
    
    # Monitor app logs for verification-related activities
    if [ -f storage/logs/app.log ]; then
        tail -f storage/logs/app.log 2>/dev/null | while read line; do
            if echo "$line" | grep -q "verification\|SMS\|OTP\|phone.*code\|code.*phone"; then
                echo "$line" >> "../$PHONE_LOG"
                echo "$line"
            fi
        done &
    else
        echo "⚠️  App log not found, creating it..."
        touch storage/logs/app.log
    fi
}

# Main monitoring function
main() {
    echo "🚀 Starting enhanced phone verification code logging..."
    echo "📁 Logging to: $PHONE_LOG"
    echo "⏰ Started at: $TIMESTAMP"
    echo ""
    
    # Log startup
    echo "==== $TIMESTAMP - ENHANCED PHONE LOGGING STARTED ====" >> "$PHONE_LOG"
    echo "🔍 Monitoring all verification activities..." >> "$PHONE_LOG"
    echo "" >> "$PHONE_LOG"
    
    # Start monitoring in background
    monitor_laravel_logs &
    monitor_verification_logs &
    monitor_app_logs &
    
    echo "✅ All monitoring processes started"
    echo "🎯 Verification codes will be logged to: $PHONE_LOG"
    echo "💡 Keep this terminal open for real-time monitoring"
    echo "🛑 Press Ctrl+C to stop all monitoring"
    echo ""
    
    # Wait for background processes
    wait
}

# Handle cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping enhanced phone verification logging..."
    echo "📁 Final logs saved to: $PHONE_LOG"
    pkill -f "tail -f" 2>/dev/null
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Start the enhanced logging
main
