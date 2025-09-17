<?php
/**
 * Script to update existing pet sitters with default pet types and breeds
 * This will add default values for sitters who don't have pet types/breeds set
 */

// Database configuration
$host = 'localhost';
$database = 'pet_sitting_app'; // Change this to your actual database name
$username = 'root'; // Change this to your actual username
$password = ''; // Change this to your actual password

try {
    // Create PDO connection
    $pdo = new PDO("mysql:host=$host;dbname=$database;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "✅ Connected to database successfully!\n\n";
    
    // Get all pet sitters
    $stmt = $pdo->prepare("SELECT id, name, email, selected_pet_types, pet_breeds FROM users WHERE role = 'pet_sitter'");
    $stmt->execute();
    $sitters = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "📊 Found " . count($sitters) . " pet sitters in database\n\n";
    
    $updatedCount = 0;
    
    foreach ($sitters as $sitter) {
        echo "👤 Processing sitter: {$sitter['name']} (ID: {$sitter['id']})\n";
        
        $needsUpdate = false;
        $updateData = [];
        
        // Check selected_pet_types
        $currentPetTypes = json_decode($sitter['selected_pet_types'], true);
        if (empty($currentPetTypes) || !is_array($currentPetTypes)) {
            $updateData['selected_pet_types'] = json_encode(['dogs', 'cats']);
            $needsUpdate = true;
            echo "   🐾 Adding default pet types: dogs, cats\n";
        } else {
            echo "   ✅ Pet types already set: " . implode(', ', $currentPetTypes) . "\n";
        }
        
        // Check pet_breeds
        $currentBreeds = json_decode($sitter['pet_breeds'], true);
        if (empty($currentBreeds) || !is_array($currentBreeds)) {
            $updateData['pet_breeds'] = json_encode(['All breeds welcome']);
            $needsUpdate = true;
            echo "   🐕 Adding default breeds: All breeds welcome\n";
        } else {
            echo "   ✅ Breeds already set: " . implode(', ', $currentBreeds) . "\n";
        }
        
        // Update if needed
        if ($needsUpdate) {
            $setClause = [];
            $values = [];
            
            foreach ($updateData as $field => $value) {
                $setClause[] = "$field = ?";
                $values[] = $value;
            }
            
            $values[] = $sitter['id']; // For WHERE clause
            
            $updateSql = "UPDATE users SET " . implode(', ', $setClause) . " WHERE id = ?";
            $updateStmt = $pdo->prepare($updateSql);
            $updateStmt->execute($values);
            
            echo "   ✅ Updated successfully!\n";
            $updatedCount++;
        } else {
            echo "   ⏭️  No update needed\n";
        }
        
        echo "\n";
    }
    
    echo "🎉 Update complete!\n";
    echo "📊 Total sitters processed: " . count($sitters) . "\n";
    echo "✅ Sitters updated: $updatedCount\n";
    echo "⏭️  Sitters already had data: " . (count($sitters) - $updatedCount) . "\n";
    
} catch (PDOException $e) {
    echo "❌ Database error: " . $e->getMessage() . "\n";
    echo "\nPlease check your database configuration:\n";
    echo "- Host: $host\n";
    echo "- Database: $database\n";
    echo "- Username: $username\n";
    echo "- Password: " . (empty($password) ? '(empty)' : '(set)') . "\n";
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
?>
