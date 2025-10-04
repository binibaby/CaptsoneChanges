#!/bin/bash

echo "🚀 Semaphore SMS Integration Setup"
echo "=================================="
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from .env.example..."
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "✅ .env file created"
    else
        echo "❌ .env.example not found. Please create .env file manually."
        exit 1
    fi
else
    echo "✅ .env file already exists"
fi

echo ""
echo "🔧 Semaphore Configuration Setup"
echo "================================"
echo ""

# Check if SEMAPHORE_API_KEY is already set
if grep -q "SEMAPHORE_API_KEY=" .env && ! grep -q "SEMAPHORE_API_KEY=your_semaphore_api_key_here" .env; then
    echo "✅ SEMAPHORE_API_KEY is already configured"
else
    echo "⚠️  SEMAPHORE_API_KEY needs to be configured"
    echo ""
    echo "Please add your Semaphore API key to the .env file:"
    echo "SEMAPHORE_API_KEY=your_actual_api_key_here"
    echo ""
    read -p "Enter your Semaphore API key (or press Enter to skip): " api_key
    
    if [ ! -z "$api_key" ]; then
        # Update the .env file
        if grep -q "SEMAPHORE_API_KEY=" .env; then
            sed -i.bak "s/SEMAPHORE_API_KEY=.*/SEMAPHORE_API_KEY=$api_key/" .env
        else
            echo "SEMAPHORE_API_KEY=$api_key" >> .env
        fi
        echo "✅ API key added to .env file"
    else
        echo "⚠️  Skipping API key configuration"
    fi
fi

echo ""
echo "🧪 Testing Semaphore Integration"
echo "================================"
echo ""

# Check if test file exists
if [ -f test_semaphore_integration.php ]; then
    echo "Running Semaphore integration test..."
    php test_semaphore_integration.php
else
    echo "❌ Test file not found: test_semaphore_integration.php"
fi

echo ""
echo "📋 Next Steps"
echo "============="
echo ""
echo "1. Add your Semaphore API key to .env file if not done already"
echo "2. Restart your Laravel server: php artisan serve"
echo "3. Test SMS sending with a real phone number"
echo "4. Monitor logs: tail -f storage/logs/laravel.log | grep SEMAPHORE"
echo ""
echo "📚 Documentation: SEMAPHORE_INTEGRATION_GUIDE.md"
echo "🧪 Test Script: test_semaphore_integration.php"
echo ""
echo "✅ Setup complete!"
