<?php
/**
 * Script to check existing pet sitters and their current pet types/breeds
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
    
    // Get all pet sitters with their details
    $stmt = $pdo->prepare("
        SELECT 
            id, 
            name, 
            email, 
            selected_pet_types, 
            pet_breeds, 
            specialties,
            experience,
            hourly_rate,
            created_at
        FROM users 
        WHERE role = 'pet_sitter' 
        ORDER BY created_at DESC
    ");
    $stmt->execute();
    $sitters = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "📊 Found " . count($sitters) . " pet sitters in database\n\n";
    
    foreach ($sitters as $sitter) {
        echo "👤 Sitter: {$sitter['name']} (ID: {$sitter['id']})\n";
        echo "   📧 Email: {$sitter['email']}\n";
        echo "   🐾 Pet Types: " . ($sitter['selected_pet_types'] ?: 'NOT SET') . "\n";
        echo "   🐕 Pet Breeds: " . ($sitter['pet_breeds'] ?: 'NOT SET') . "\n";
        echo "   ⭐ Specialties: " . ($sitter['specialties'] ?: 'NOT SET') . "\n";
        echo "   💰 Hourly Rate: " . ($sitter['hourly_rate'] ?: 'NOT SET') . "\n";
        echo "   📅 Created: {$sitter['created_at']}\n";
        echo "\n";
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
