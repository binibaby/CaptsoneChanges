#!/bin/bash

echo "📱 Monitoring device connections..."
echo "Press Ctrl+C to stop monitoring"
echo ""

# Function to check connected devices
check_devices() {
    echo "$(date '+%H:%M:%S') - Device Status:"
    
    # Check Metro connections
    METRO_CONNECTIONS=$(lsof -i:8081 | grep ESTABLISHED | wc -l)
    echo "  📦 Metro connections: $METRO_CONNECTIONS"
    
    # Check backend connections  
    BACKEND_CONNECTIONS=$(lsof -i:8000 | grep ESTABLISHED | wc -l)
    echo "  🔧 Backend connections: $BACKEND_CONNECTIONS"
    
    # Show connected IPs
    echo "  🌐 Connected devices:"
    lsof -i:8081 | grep ESTABLISHED | awk '{print "     Metro: " $9}' | sort -u
    lsof -i:8000 | grep ESTABLISHED | awk '{print "     Backend: " $9}' | sort -u
    
    echo ""
}

# Monitor every 5 seconds
while true; do
    check_devices
    sleep 5
done
