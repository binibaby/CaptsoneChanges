<?php
/**
 * Test Verification Authentication
 * 
 * This script tests if the enhanced verification endpoint is working
 * with proper authentication.
 */

require_once 'pet-sitting-app/vendor/autoload.php';

// Set up Laravel environment
$app = require_once 'pet-sitting-app/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "🔐 VERIFICATION AUTHENTICATION TEST\n";
echo "====================================\n\n";

// Test the route exists
$routes = app('router')->getRoutes();
$enhancedRoute = null;

foreach ($routes as $route) {
    if ($route->uri() === 'api/verification/submit-enhanced') {
        $enhancedRoute = $route;
        break;
    }
}

if ($enhancedRoute) {
    echo "✅ Enhanced verification route found\n";
    echo "   Method: " . implode('|', $enhancedRoute->methods()) . "\n";
    echo "   URI: " . $enhancedRoute->uri() . "\n";
    echo "   Middleware: " . implode(', ', $enhancedRoute->gatherMiddleware()) . "\n";
} else {
    echo "❌ Enhanced verification route not found\n";
}

echo "\n🔍 Testing authentication requirements...\n";

// Check if auth:sanctum middleware is applied
if ($enhancedRoute && in_array('auth:sanctum', $enhancedRoute->gatherMiddleware())) {
    echo "✅ Route is protected by auth:sanctum middleware\n";
} else {
    echo "❌ Route is NOT protected by auth:sanctum middleware\n";
}

echo "\n📝 Authentication Test Results:\n";
echo "==============================\n";
echo "1. Route exists: " . ($enhancedRoute ? "YES" : "NO") . "\n";
echo "2. Protected by auth:sanctum: " . ($enhancedRoute && in_array('auth:sanctum', $enhancedRoute->gatherMiddleware()) ? "YES" : "NO") . "\n";
echo "3. Frontend should send Bearer token in Authorization header\n";
echo "4. Token should be obtained from authService.getCurrentUser().token\n";

echo "\n🔧 Troubleshooting:\n";
echo "==================\n";
echo "1. Make sure user is logged in and has a valid token\n";
echo "2. Check that the token is being sent in the Authorization header\n";
echo "3. Verify the token format: 'Bearer <token>'\n";
echo "4. Check Laravel logs for authentication errors\n";
echo "5. Verify the user has the correct permissions\n";
?>
