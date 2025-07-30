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
            // Phone verification fields (email_verification_code already exists)
            $table->string('phone_verification_code', 4)->nullable();
            $table->timestamp('phone_verified_at')->nullable();
            
            // Additional admin fields
            $table->string('admin_role')->nullable();
            $table->json('admin_permissions')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->timestamp('last_active_at')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'phone_verification_code',
                'phone_verified_at',
                'admin_role',
                'admin_permissions',
                'rejection_reason',
                'last_active_at',
            ]);
        });
    }
};
