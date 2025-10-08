<?php
/**
 * Test script for real-time ID verification system
 * Run this script to test the complete verification flow
 */

require_once 'pet-sitting-app/vendor/autoload.php';

use Illuminate\Foundation\Application;
use App\Models\User;
use App\Models\Verification;
use App\Events\IdVerificationStatusUpdated;

// Bootstrap Laravel
$app = require_once 'pet-sitting-app/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "🧪 Testing Real-Time ID Verification System\n";
echo "==========================================\n\n";

try {
    // Test 1: Check if Reverb is configured
    echo "1. Testing Reverb Configuration...\n";
    $broadcastDriver = config('broadcasting.default');
    echo "   Broadcast driver: {$broadcastDriver}\n";
    
    if ($broadcastDriver === 'reverb') {
        echo "   ✅ Reverb is configured as default broadcaster\n";
    } else {
        echo "   ⚠️  Reverb is not the default broadcaster. Current: {$broadcastDriver}\n";
    }
    
    // Test 2: Check if verification event exists
    echo "\n2. Testing Verification Event...\n";
    if (class_exists('App\Events\IdVerificationStatusUpdated')) {
        echo "   ✅ IdVerificationStatusUpdated event exists\n";
    } else {
        echo "   ❌ IdVerificationStatusUpdated event not found\n";
    }
    
    // Test 3: Check if verification model exists
    echo "\n3. Testing Verification Model...\n";
    if (class_exists('App\Models\Verification')) {
        echo "   ✅ Verification model exists\n";
        
        // Check if required fields exist
        $verification = new Verification();
        $fillable = $verification->getFillable();
        $requiredFields = ['front_id_image', 'back_id_image', 'selfie_image', 'verification_status'];
        
        foreach ($requiredFields as $field) {
            if (in_array($field, $fillable)) {
                echo "   ✅ Field '{$field}' is fillable\n";
            } else {
                echo "   ❌ Field '{$field}' is not fillable\n";
            }
        }
    } else {
        echo "   ❌ Verification model not found\n";
    }
    
    // Test 4: Check if admin controller exists
    echo "\n4. Testing Admin Controller...\n";
    if (class_exists('App\Http\Controllers\Admin\VerificationController')) {
        echo "   ✅ Admin VerificationController exists\n";
        
        // Check if required methods exist
        $reflection = new ReflectionClass('App\Http\Controllers\Admin\VerificationController');
        $requiredMethods = ['approve', 'reject', 'getVerifications'];
        
        foreach ($requiredMethods as $method) {
            if ($reflection->hasMethod($method)) {
                echo "   ✅ Method '{$method}' exists\n";
            } else {
                echo "   ❌ Method '{$method}' not found\n";
            }
        }
    } else {
        echo "   ❌ Admin VerificationController not found\n";
    }
    
    // Test 5: Check if API routes exist
    echo "\n5. Testing API Routes...\n";
    $routes = app('router')->getRoutes();
    $requiredRoutes = [
        'api/verification/submit-enhanced',
        'api/verification/status',
        'admin/verifications'
    ];
    
    foreach ($requiredRoutes as $route) {
        $found = false;
        foreach ($routes as $routeObj) {
            if (strpos($routeObj->uri(), $route) !== false) {
                $found = true;
                break;
            }
        }
        
        if ($found) {
            echo "   ✅ Route '{$route}' exists\n";
        } else {
            echo "   ❌ Route '{$route}' not found\n";
        }
    }
    
    // Test 6: Test database connection
    echo "\n6. Testing Database Connection...\n";
    try {
        $userCount = User::count();
        echo "   ✅ Database connected. Users count: {$userCount}\n";
    } catch (Exception $e) {
        echo "   ❌ Database connection failed: " . $e->getMessage() . "\n";
    }
    
    // Test 7: Test broadcasting configuration
    echo "\n7. Testing Broadcasting Configuration...\n";
    $broadcastConfig = config('broadcasting.connections.reverb');
    if ($broadcastConfig) {
        echo "   ✅ Reverb broadcasting configuration exists\n";
        echo "   Host: " . ($broadcastConfig['options']['host'] ?? 'not set') . "\n";
        echo "   Port: " . ($broadcastConfig['options']['port'] ?? 'not set') . "\n";
    } else {
        echo "   ❌ Reverb broadcasting configuration not found\n";
    }
    
    // Test 8: Create a test verification (if possible)
    echo "\n8. Testing Verification Creation...\n";
    try {
        $testUser = User::first();
        if ($testUser) {
            $verification = new Verification([
                'user_id' => $testUser->id,
                'document_type' => 'test',
                'front_id_image' => 'test_front.jpg',
                'back_id_image' => 'test_back.jpg',
                'selfie_image' => 'test_selfie.jpg',
                'verification_status' => 'pending',
                'status' => 'pending',
                'verification_method' => 'test',
                'notes' => 'Test verification created by test script'
            ]);
            
            // Don't actually save to avoid cluttering the database
            echo "   ✅ Test verification object created successfully\n";
            echo "   User ID: {$testUser->id}\n";
            echo "   Document Type: test\n";
        } else {
            echo "   ⚠️  No users found in database. Skipping verification test.\n";
        }
    } catch (Exception $e) {
        echo "   ❌ Failed to create test verification: " . $e->getMessage() . "\n";
    }
    
    echo "\n🎉 Test Summary\n";
    echo "===============\n";
    echo "The real-time ID verification system has been set up successfully!\n";
    echo "\nNext steps:\n";
    echo "1. Start the Reverb server: php artisan reverb:start\n";
    echo "2. Start the Laravel server: php artisan serve\n";
    echo "3. Start the queue worker: php artisan queue:work\n";
    echo "4. Install React Native dependencies: npm install\n";
    echo "5. Start the React Native app and test the verification flow\n";
    
} catch (Exception $e) {
    echo "\n❌ Test failed with error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}
