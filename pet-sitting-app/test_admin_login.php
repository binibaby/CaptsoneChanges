<?php
/**
 * Test script to log into admin panel and access verification page
 */

require_once 'vendor/autoload.php';

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;
use Illuminate\Support\Facades\Hash;

echo "=== Admin Login Test ===\n\n";

// Check admin user
$admin = User::where('email', 'admin@petsitconnect.com')->first();
if (!$admin) {
    echo "❌ Admin user not found\n";
    exit(1);
}

echo "✅ Admin user found: " . $admin->name . " (" . $admin->email . ")\n";

// Check if password is set
if (!$admin->password) {
    echo "⚠️  Admin user has no password set. Setting password to 'admin123'\n";
    $admin->password = Hash::make('admin123');
    $admin->save();
    echo "✅ Password set to 'admin123'\n";
} else {
    echo "✅ Admin user has password set\n";
}

// Check admin role
if ($admin->role !== 'admin') {
    echo "⚠️  Admin user role is '" . $admin->role . "'. Setting to 'admin'\n";
    $admin->role = 'admin';
    $admin->save();
    echo "✅ Role set to 'admin'\n";
} else {
    echo "✅ Admin user role is correct\n";
}

echo "\n=== Admin Panel URLs ===\n";
echo "Login: http://172.20.10.2:8000/admin/login\n";
echo "Email: admin@petsitconnect.com\n";
echo "Password: admin123\n";
echo "Verifications: http://172.20.10.2:8000/admin/verifications\n";
echo "Verification 105: http://172.20.10.2:8000/admin/verifications/105\n";
echo "Enhanced View: http://172.20.10.2:8000/admin/verifications/105/enhanced\n";

echo "\n=== Test Complete ===\n";
?>
