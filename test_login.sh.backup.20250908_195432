#!/bin/bash

echo "🔐 LOGIN TEST SCRIPT"
echo "==================="
echo ""

# Test credentials
EMAIL="test@example.com"
PASSWORD="password123"

echo "📧 Testing login with: $EMAIL"
echo "🔑 Password: $PASSWORD"
echo ""

# Test the login API
echo "🌐 Testing backend login API..."
response=$(curl -s -X POST http://172.20.10.2:8000/api/login \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL\", \"password\": \"$PASSWORD\"}")

echo "📡 Backend response:"
echo "$response" | jq . 2>/dev/null || echo "$response"
echo ""

# Check if login was successful
success=$(echo "$response" | jq -r '.success' 2>/dev/null)
if [ "$success" = "true" ]; then
    echo "✅ Login successful!"
    user_id=$(echo "$response" | jq -r '.user.id' 2>/dev/null)
    user_name=$(echo "$response" | jq -r '.user.name' 2>/dev/null)
    echo "👤 User ID: $user_id"
    echo "👤 User Name: $user_name"
else
    echo "❌ Login failed!"
    message=$(echo "$response" | jq -r '.message' 2>/dev/null)
    echo "💬 Error: $message"
fi

echo ""
echo "💡 If login fails, check:"
echo "   1. Backend server is running on http://172.20.10.2:8000"
echo "   2. User exists in database"
echo "   3. Password is correct"
echo "   4. Network connectivity"
