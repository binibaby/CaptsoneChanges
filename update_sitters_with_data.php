<?php
/**
 * Script to update existing pet sitters with specific pet types and breeds
 * You can customize the data for each sitter below
 */

// Database configuration
$host = 'localhost';
$database = 'pet_sitting_app'; // Change this to your actual database name
$username = 'root'; // Change this to your actual username
$password = ''; // Change this to your actual password

// SITTER DATA - Customize this for each sitter
$sitterData = [
    // Example: Update sitter by email
    'jasminepp@gmail.com' => [
        'selected_pet_types' => ['dogs', 'cats'],
        'pet_breeds' => ['Labrador Retriever', 'Golden Retriever', 'Persian', 'Maine Coon']
    ],
    'joji@gmail.com' => [
        'selected_pet_types' => ['dogs'],
        'pet_breeds' => ['Beagle', 'Yorkshire Terrier']
    ],
    // Add more sitters here as needed
    // 'another@email.com' => [
    //     'selected_pet_types' => ['cats'],
    //     'pet_breeds' => ['Siamese', 'British Shorthair']
    // ],
];

// Default values for sitters not in the list above
$defaultData = [
    'selected_pet_types' => ['dogs', 'cats'],
    'pet_breeds' => ['All breeds welcome']
];

try {
    // Create PDO connection
    $pdo = new PDO("mysql:host=$host;dbname=$database;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "✅ Connected to database successfully!\n\n";
    
    // Get all pet sitters
    $stmt = $pdo->prepare("SELECT id, name, email FROM users WHERE role = 'pet_sitter'");
    $stmt->execute();
    $sitters = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "📊 Found " . count($sitters) . " pet sitters in database\n\n";
    
    $updatedCount = 0;
    
    foreach ($sitters as $sitter) {
        echo "👤 Processing sitter: {$sitter['name']} (ID: {$sitter['id']})\n";
        echo "   📧 Email: {$sitter['email']}\n";
        
        // Get data for this sitter (custom or default)
        $data = isset($sitterData[$sitter['email']]) ? $sitterData[$sitter['email']] : $defaultData;
        
        echo "   🐾 Setting pet types: " . implode(', ', $data['selected_pet_types']) . "\n";
        echo "   🐕 Setting breeds: " . implode(', ', $data['pet_breeds']) . "\n";
        
        // Update the sitter
        $updateSql = "UPDATE users SET selected_pet_types = ?, pet_breeds = ? WHERE id = ?";
        $updateStmt = $pdo->prepare($updateSql);
        $updateStmt->execute([
            json_encode($data['selected_pet_types']),
            json_encode($data['pet_breeds']),
            $sitter['id']
        ]);
        
        echo "   ✅ Updated successfully!\n\n";
        $updatedCount++;
    }
    
    echo "🎉 Update complete!\n";
    echo "📊 Total sitters processed: " . count($sitters) . "\n";
    echo "✅ Sitters updated: $updatedCount\n";
    
    // Verify the updates
    echo "\n🔍 Verifying updates...\n";
    $verifyStmt = $pdo->prepare("
        SELECT name, email, selected_pet_types, pet_breeds 
        FROM users 
        WHERE role = 'pet_sitter' 
        ORDER BY name
    ");
    $verifyStmt->execute();
    $updatedSitters = $verifyStmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($updatedSitters as $sitter) {
        $petTypes = json_decode($sitter['selected_pet_types'], true);
        $breeds = json_decode($sitter['pet_breeds'], true);
        
        echo "👤 {$sitter['name']}:\n";
        echo "   🐾 Pet Types: " . implode(', ', $petTypes) . "\n";
        echo "   🐕 Breeds: " . implode(', ', $breeds) . "\n\n";
    }
    
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
