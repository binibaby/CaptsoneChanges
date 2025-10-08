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
        Schema::table('wallet_transactions', function (Blueprint $table) {
            // Drop the existing enum constraint and recreate with 'credit' added
            $table->dropColumn('type');
        });
        
        Schema::table('wallet_transactions', function (Blueprint $table) {
            $table->enum('type', ['cashout', 'refund', 'adjustment', 'credit'])->default('cashout')->after('user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('wallet_transactions', function (Blueprint $table) {
            // Revert back to original enum values
            $table->dropColumn('type');
        });
        
        Schema::table('wallet_transactions', function (Blueprint $table) {
            $table->enum('type', ['cashout', 'refund', 'adjustment'])->default('cashout')->after('user_id');
        });
    }
};
