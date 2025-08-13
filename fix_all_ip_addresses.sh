#!/bin/bash

echo "🔧 Fixing all hardcoded IP addresses in the codebase..."
echo "======================================================"

# Get the current IP address
IP_ADDRESS=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}')

if [ -z "$IP_ADDRESS" ]; then
    echo "❌ Could not find your IP address"
    exit 1
fi

echo "✅ Found IP address: $IP_ADDRESS"
echo ""

# Files to update
FILES=(
    "src/screens/auth/FrontIDScreen.tsx"
    "src/screens/auth/BackIDScreen.tsx"
    "src/screens/auth/SelfieScreen.tsx"
    "src/screens/auth/PhoneVerificationScreen.tsx"
    "src/screens/app/EWalletScreen.tsx"
    "src/screens/app/VerificationScreen.tsx"
    "src/screens/app/PaymentScreen.tsx"
)

# Update each file
for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "📝 Updating $file..."
        
        # Create backup
        cp "$file" "${file}.backup"
        
        # Replace hardcoded IP addresses
        sed -i '' "s/http:\/\/127\.0\.0\.1:8000/http:\/\/$IP_ADDRESS:8000/g" "$file"
        sed -i '' "s/http:\/\/localhost:8000/http:\/\/$IP_ADDRESS:8000/g" "$file"
        
        echo "   ✅ Updated with IP: $IP_ADDRESS"
    else
        echo "   ⚠️  File not found: $file"
    fi
done

echo ""
echo "🎯 All files updated successfully!"
echo "🌐 Your app will now connect to: http://$IP_ADDRESS:8000"
echo ""
echo "📱 Next steps:"
echo "1. Restart your React Native app"
echo "2. Test the verification flow"
echo "3. Check the phone verification monitor for codes"
echo ""
echo "🚀 Network issues should now be resolved!" 