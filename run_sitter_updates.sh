#!/bin/bash

echo "🐾 Pet Sitter Database Update Scripts"
echo "====================================="
echo ""

# Check if PHP is available
if ! command -v php &> /dev/null; then
    echo "❌ PHP is not installed or not in PATH"
    echo "Please install PHP and try again"
    exit 1
fi

echo "✅ PHP is available"
echo ""

# Function to run a script
run_script() {
    local script_name=$1
    local description=$2
    
    echo "🔄 Running: $description"
    echo "Script: $script_name"
    echo "----------------------------------------"
    
    if [ -f "$script_name" ]; then
        php "$script_name"
        echo ""
        echo "✅ $description completed"
    else
        echo "❌ Script $script_name not found"
    fi
    echo ""
}

# Menu
echo "Choose an option:"
echo "1. Check existing sitters (view current data)"
echo "2. Update sitters with default data (dogs, cats, all breeds)"
echo "3. Update sitters with custom data (edit script first)"
echo "4. Run all updates"
echo "5. Exit"
echo ""

read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        run_script "check_existing_sitters.php" "Check existing sitters"
        ;;
    2)
        run_script "update_existing_sitters.php" "Update with default data"
        ;;
    3)
        echo "⚠️  Please edit update_sitters_with_data.php first to customize the data"
        echo "Then run this script again and choose option 3"
        read -p "Press Enter to continue..."
        run_script "update_sitters_with_data.php" "Update with custom data"
        ;;
    4)
        run_script "check_existing_sitters.php" "Check existing sitters"
        run_script "update_existing_sitters.php" "Update with default data"
        run_script "check_existing_sitters.php" "Verify updates"
        ;;
    5)
        echo "👋 Goodbye!"
        exit 0
        ;;
    *)
        echo "❌ Invalid choice. Please run the script again."
        exit 1
        ;;
esac

echo "🎉 All done!"
