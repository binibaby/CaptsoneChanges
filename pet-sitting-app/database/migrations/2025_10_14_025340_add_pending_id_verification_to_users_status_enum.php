<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // For SQLite, we need to recreate the table to change the enum
        // This adds 'pending_id_verification' to the status enum
        
        // First, backup existing data
        $users = DB::table('users')->get();
        
        // Drop the current table
        Schema::dropIfExists('users');
        
        // Recreate the table with the updated status field
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->rememberToken();
            $table->timestamps();
            
            // Add the fields that were added in other migrations
            $table->enum('role', ['admin', 'pet_owner', 'pet_sitter'])->default('pet_owner')->after('email');
            $table->enum('status', ['pending', 'active', 'suspended', 'banned', 'denied', 'pending_verification', 'pending_id_verification'])->default('pending')->after('role');
            $table->string('phone')->nullable()->after('status');
            $table->text('address')->nullable()->after('phone');
            $table->timestamp('approved_at')->nullable()->after('address');
            $table->foreignId('approved_by')->nullable()->constrained('users')->after('approved_at');
            $table->timestamp('denied_at')->nullable()->after('approved_by');
            $table->foreignId('denied_by')->nullable()->constrained('users')->after('denied_at');
            $table->text('denial_reason')->nullable()->after('denied_by');
            $table->timestamp('suspended_at')->nullable()->after('denial_reason');
            $table->foreignId('suspended_by')->nullable()->constrained('users')->after('suspended_by');
            $table->text('suspension_reason')->nullable()->after('suspended_by');
            $table->timestamp('suspension_ends_at')->nullable()->after('suspension_reason');
            $table->timestamp('banned_at')->nullable()->after('suspension_ends_at');
            $table->foreignId('banned_by')->nullable()->constrained('users')->after('banned_at');
            $table->text('ban_reason')->nullable()->after('banned_by');
            $table->decimal('rating', 3, 2)->nullable()->after('ban_reason');
            $table->string('id_image')->nullable()->after('rating');
            $table->string('id_status')->nullable()->after('id_image');
            $table->string('phone_verification_code')->nullable()->after('id_status');
            $table->timestamp('phone_verified_at')->nullable()->after('phone_verification_code');
            $table->string('admin_role')->nullable()->after('phone_verified_at');
            $table->text('admin_permissions')->nullable()->after('admin_role');
            $table->text('rejection_reason')->nullable()->after('admin_permissions');
            $table->timestamp('last_active_at')->nullable()->after('rejection_reason');
            $table->string('first_name')->nullable()->after('last_active_at');
            $table->string('last_name')->nullable()->after('first_name');
            $table->string('gender')->nullable()->after('last_name');
            $table->integer('age')->nullable()->after('gender');
            $table->json('pet_breeds')->nullable()->after('age');
            $table->text('bio')->nullable()->after('pet_breeds');
            $table->string('profile_image')->nullable()->after('bio');
            $table->boolean('is_admin')->default(false)->after('profile_image');
            $table->timestamp('id_verified_at')->nullable()->after('is_admin');
            $table->string('verification_status')->nullable()->after('id_verified_at');
            $table->boolean('can_accept_bookings')->default(false)->after('verification_status');
            
            // Add the new fields we created
            $table->json('specialties')->nullable()->after('pet_breeds');
            $table->string('experience')->nullable()->after('age');
            $table->decimal('hourly_rate', 8, 2)->nullable()->after('experience');
            $table->json('selected_pet_types')->nullable()->after('specialties');
            
            // Add emergency contact fields
            $table->string('emergency_contact')->nullable()->after('selected_pet_types');
            $table->string('emergency_phone')->nullable()->after('emergency_contact');
            
            // Add certificates field
            $table->json('certificates')->nullable()->after('emergency_phone');
            
            // Add id_verified field
            $table->boolean('id_verified')->default(false)->after('certificates');
            
            // Add wallet_balance field
            $table->decimal('wallet_balance', 10, 2)->default(0)->after('id_verified');
        });
        
        // Restore all user data
        foreach ($users as $user) {
            $userData = (array) $user;
            unset($userData['id']); // Let the database auto-assign new IDs
            DB::table('users')->insert($userData);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // This migration recreates the entire table, so we can't easily rollback
        // The user would need to restore from backup
    }
};