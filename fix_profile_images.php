<?php

require_once 'pet-sitting-app/vendor/autoload.php';

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Config;

// Load Laravel configuration
$app = require_once 'pet-sitting-app/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "Starting profile image cleanup...\n";

try {
    // Get all users with profile images
    $users = DB::table('users')
        ->whereNotNull('profile_image')
        ->where('profile_image', '!=', '')
        ->get();

    echo "Found " . $users->count() . " users with profile images\n";

    $fixedCount = 0;
    $alreadyFixedCount = 0;

    foreach ($users as $user) {
        $originalImage = $user->profile_image;
        $fixedImage = $originalImage;

        // Check if the profile_image contains a double URL
        if (strpos($originalImage, 'http://192.168.100.192:8000/storage/http://192.168.100.192:8000/storage/') === 0) {
            // Extract the actual storage path
            $fixedImage = str_replace('http://192.168.100.192:8000/storage/', '', $originalImage);
            echo "Fixing user {$user->id}: {$originalImage} -> {$fixedImage}\n";
            
            // Update the database
            DB::table('users')
                ->where('id', $user->id)
                ->update(['profile_image' => $fixedImage]);
            
            $fixedCount++;
        } elseif (strpos($originalImage, 'http://192.168.100.192:8000/storage/') === 0) {
            // This is a single full URL, convert to storage path
            $fixedImage = str_replace('http://192.168.100.192:8000/storage/', '', $originalImage);
            echo "Converting full URL for user {$user->id}: {$originalImage} -> {$fixedImage}\n";
            
            // Update the database
            DB::table('users')
                ->where('id', $user->id)
                ->update(['profile_image' => $fixedImage]);
            
            $fixedCount++;
        } else {
            // Already a storage path, no need to fix
            $alreadyFixedCount++;
        }
    }

    echo "\nCleanup completed!\n";
    echo "Fixed: {$fixedCount} records\n";
    echo "Already correct: {$alreadyFixedCount} records\n";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}

echo "Profile image cleanup finished successfully!\n";
