<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Add first_name if it doesn't exist
            if (!Schema::hasColumn('users', 'first_name')) {
                $table->string('first_name')->nullable()->after('name');
            }
            
            // Add last_name if it doesn't exist
            if (!Schema::hasColumn('users', 'last_name')) {
                $table->string('last_name')->nullable()->after('first_name');
            }
            
            // Add gender if it doesn't exist
            if (!Schema::hasColumn('users', 'gender')) {
                // Check if we can use enum (MySQL) or use string (PostgreSQL)
                $driver = Schema::getConnection()->getDriverName();
                if ($driver === 'mysql') {
                    $table->enum('gender', ['male', 'female', 'other'])->nullable()->after('last_name');
                } else {
                    // PostgreSQL doesn't support enum easily, use string with check constraint
                    $table->string('gender')->nullable()->after('last_name');
                }
            }
            
            // Add age if it doesn't exist
            if (!Schema::hasColumn('users', 'age')) {
                $table->integer('age')->nullable()->after('gender');
            }
            
            // Add experience if it doesn't exist
            if (!Schema::hasColumn('users', 'experience')) {
                $table->text('experience')->nullable();
            }
            
            // Add hourly_rate if it doesn't exist
            if (!Schema::hasColumn('users', 'hourly_rate')) {
                $table->decimal('hourly_rate', 10, 2)->nullable();
            }
            
            // Add specialties if it doesn't exist
            if (!Schema::hasColumn('users', 'specialties')) {
                $table->json('specialties')->nullable();
            }
            
            // Add selected_pet_types if it doesn't exist
            if (!Schema::hasColumn('users', 'selected_pet_types')) {
                $table->json('selected_pet_types')->nullable();
            }
            
            // Add pet_breeds if it doesn't exist
            if (!Schema::hasColumn('users', 'pet_breeds')) {
                $table->json('pet_breeds')->nullable();
            }
            
            // Add bio if it doesn't exist
            if (!Schema::hasColumn('users', 'bio')) {
                $table->text('bio')->nullable();
            }
            
            // Add profile_image if it doesn't exist
            if (!Schema::hasColumn('users', 'profile_image')) {
                $table->string('profile_image')->nullable();
            }
            
            // Add is_admin if it doesn't exist
            if (!Schema::hasColumn('users', 'is_admin')) {
                $table->boolean('is_admin')->default(false);
            }
            
            // Add id_verified_at if it doesn't exist
            if (!Schema::hasColumn('users', 'id_verified_at')) {
                $table->timestamp('id_verified_at')->nullable();
            }
            
            // Add verification_status if it doesn't exist
            if (!Schema::hasColumn('users', 'verification_status')) {
                $table->string('verification_status')->nullable();
            }
            
            // Add can_accept_bookings if it doesn't exist
            if (!Schema::hasColumn('users', 'can_accept_bookings')) {
                $table->boolean('can_accept_bookings')->default(false);
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Don't drop columns in down() to be safe
        // These columns might be needed by other parts of the application
    }
};

