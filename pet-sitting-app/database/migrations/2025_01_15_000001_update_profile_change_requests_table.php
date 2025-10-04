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
        Schema::table('profile_change_requests', function (Blueprint $table) {
            // Add new fields for comprehensive profile updates
            $table->string('first_name')->nullable()->after('user_id');
            $table->string('last_name')->nullable()->after('first_name');
            $table->string('phone')->nullable()->after('last_name');
            $table->decimal('hourly_rate', 8, 2)->nullable()->after('phone');
            
            // Add old values for comparison
            $table->string('old_first_name')->nullable()->after('hourly_rate');
            $table->string('old_last_name')->nullable()->after('old_first_name');
            $table->string('old_phone')->nullable()->after('old_last_name');
            $table->decimal('old_hourly_rate', 8, 2)->nullable()->after('old_phone');
            
            // Update field_name enum to include new fields
            $table->dropColumn('field_name');
        });
        
        // Add the new field_name column with updated enum
        Schema::table('profile_change_requests', function (Blueprint $table) {
            $table->enum('field_name', ['name', 'first_name', 'last_name', 'address', 'phone', 'hourly_rate', 'multiple'])->after('user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('profile_change_requests', function (Blueprint $table) {
            $table->dropColumn([
                'first_name',
                'last_name', 
                'phone',
                'hourly_rate',
                'old_first_name',
                'old_last_name',
                'old_phone',
                'old_hourly_rate'
            ]);
            
            // Restore original field_name enum
            $table->dropColumn('field_name');
        });
        
        Schema::table('profile_change_requests', function (Blueprint $table) {
            $table->enum('field_name', ['name', 'address', 'phone'])->after('user_id');
        });
    }
};
