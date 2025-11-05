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
                $table->string('gender')->nullable()->after('last_name');
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

