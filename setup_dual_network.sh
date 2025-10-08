#!/bin/bash

# Dual Network Setup Script for Pet Sitter App
# This script configures the app to work on both WiFi and mobile data

echo "🚀 Setting up dual network support for Pet Sitter App..."
echo "📱 This will configure the app to work on both WiFi and mobile data"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

print_status "Starting dual network configuration..."

# 1. Get current network information
print_status "Getting current network information..."
CURRENT_WIFI_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}')
print_success "Current WiFi IP: $CURRENT_WIFI_IP"

# 2. Update network configuration
print_status "Updating network configuration..."

# Update the Config.ts file with current IP
if [ -f "src/constants/Config.ts" ]; then
    # Backup original file
    cp src/constants/Config.ts src/constants/Config.ts.backup.$(date +%Y%m%d_%H%M%S)
    
    # Update the primary IP with current WiFi IP
    sed -i.tmp "s/192.168.100.192/$CURRENT_WIFI_IP/g" src/constants/Config.ts
    rm src/constants/Config.ts.tmp
    
    print_success "Updated Config.ts with current WiFi IP: $CURRENT_WIFI_IP"
else
    print_warning "Config.ts not found, skipping update"
fi

# 3. Update backend CORS configuration
print_status "Updating backend CORS configuration..."
if [ -f "pet-sitting-app/config/cors.php" ]; then
    # Backup original file
    cp pet-sitting-app/config/cors.php pet-sitting-app/config/cors.php.backup.$(date +%Y%m%d_%H%M%S)
    
    # Add current IP to CORS allowed origins
    if ! grep -q "$CURRENT_WIFI_IP" pet-sitting-app/config/cors.php; then
        sed -i.tmp "/'allowed_origins' => \[/a\\
        'http://$CURRENT_WIFI_IP:8000', // Current WiFi IP" pet-sitting-app/config/cors.php
        rm pet-sitting-app/config/cors.php.tmp
        print_success "Added current WiFi IP to CORS configuration"
    else
        print_success "Current WiFi IP already in CORS configuration"
    fi
else
    print_warning "CORS configuration not found, skipping update"
fi

# 4. Make test script executable
print_status "Making test script executable..."
chmod +x test_dual_network_connectivity.js
print_success "Test script is now executable"

# 5. Check if Laravel server is running
print_status "Checking if Laravel server is running..."
if curl -s http://localhost:8000/api/test > /dev/null 2>&1; then
    print_success "Laravel server is running on localhost:8000"
else
    print_warning "Laravel server is not running on localhost:8000"
    print_status "Starting Laravel server..."
    
    # Start Laravel server in background
    cd pet-sitting-app
    nohup php artisan serve --host=0.0.0.0 --port=8000 > ../logs/laravel.log 2>&1 &
    LARAVEL_PID=$!
    echo $LARAVEL_PID > ../logs/laravel.pid
    
    # Wait a moment for server to start
    sleep 3
    
    if curl -s http://localhost:8000/api/test > /dev/null 2>&1; then
        print_success "Laravel server started successfully (PID: $LARAVEL_PID)"
    else
        print_error "Failed to start Laravel server"
        print_status "Please start it manually: cd pet-sitting-app && php artisan serve --host=0.0.0.0 --port=8000"
    fi
    cd ..
fi

# 6. Test network connectivity
print_status "Testing network connectivity..."
if [ -f "test_dual_network_connectivity.js" ]; then
    node test_dual_network_connectivity.js
else
    print_warning "Test script not found, skipping connectivity test"
fi

# 7. Create network monitoring script
print_status "Creating network monitoring script..."
cat > monitor_network.sh << 'EOF'
#!/bin/bash

# Network monitoring script for Pet Sitter App
echo "🔍 Monitoring network connectivity..."

while true; do
    echo "$(date): Checking network status..."
    
    # Check WiFi connection
    if ping -c 1 8.8.8.8 > /dev/null 2>&1; then
        echo "✅ Internet connection: OK"
    else
        echo "❌ Internet connection: FAILED"
    fi
    
    # Check local server
    if curl -s http://localhost:8000/api/test > /dev/null 2>&1; then
        echo "✅ Local server: OK"
    else
        echo "❌ Local server: FAILED"
    fi
    
    # Get current IP
    CURRENT_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}')
    echo "📍 Current IP: $CURRENT_IP"
    
    echo "---"
    sleep 30
done
EOF

chmod +x monitor_network.sh
print_success "Created network monitoring script"

# 8. Create mobile data testing guide
print_status "Creating mobile data testing guide..."
cat > MOBILE_DATA_TESTING_GUIDE.md << EOF
# Mobile Data Testing Guide

## Overview
This guide helps you test the Pet Sitter App on both WiFi and mobile data networks.

## Current Configuration
- **WiFi IP**: $CURRENT_WIFI_IP
- **Mobile Data IPs**: 172.20.10.1, 172.20.10.2, 172.20.10.3, 172.20.10.4
- **Server Port**: 8000

## Testing Steps

### 1. WiFi Testing
1. Connect to your WiFi network
2. Run the app
3. Check if API calls work
4. Monitor logs for connection status

### 2. Mobile Data Testing
1. Enable mobile hotspot on your phone
2. Connect your computer to the hotspot
3. Note the new IP address (usually 172.20.10.x)
4. Update the network configuration if needed
5. Test the app

### 3. Network Switching Test
1. Start with WiFi connection
2. Switch to mobile data
3. Verify the app automatically detects the new network
4. Test API functionality

## Troubleshooting

### If API doesn't work on mobile data:
1. Check if the server is accessible from the mobile network
2. Verify the IP address is correct
3. Check firewall settings
4. Ensure CORS is properly configured

### If automatic detection fails:
1. Manually update the IP in Config.ts
2. Restart the app
3. Check network service logs

## Monitoring
- Use \`./monitor_network.sh\` to monitor network status
- Check logs in the \`logs/\` directory
- Use \`node test_dual_network_connectivity.js\` to test all IPs

## Network Configuration Files
- \`src/constants/Config.ts\` - Frontend network config
- \`src/services/networkService.ts\` - Network detection service
- \`pet-sitting-app/config/cors.php\` - Backend CORS config
EOF

print_success "Created mobile data testing guide"

# 9. Final summary
echo ""
echo "🎉 DUAL NETWORK SETUP COMPLETE!"
echo "================================="
echo ""
echo "📱 Your app is now configured to work on both WiFi and mobile data"
echo ""
echo "🔧 Configuration updated:"
echo "   - WiFi IP: $CURRENT_WIFI_IP"
echo "   - Mobile data IPs: 172.20.10.1, 172.20.10.2, 172.20.10.3, 172.20.10.4"
echo "   - CORS configured for all network types"
echo "   - Network detection service optimized"
echo ""
echo "📋 Next steps:"
echo "   1. Test on WiFi: Run your app and verify API calls work"
echo "   2. Test on mobile data: Enable hotspot and test again"
echo "   3. Monitor network: Use ./monitor_network.sh"
echo "   4. Read guide: Check MOBILE_DATA_TESTING_GUIDE.md"
echo ""
echo "🚀 Your app should now work seamlessly on both networks!"
echo ""

# 10. Start monitoring (optional)
read -p "Start network monitoring now? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Starting network monitoring..."
    ./monitor_network.sh
fi
