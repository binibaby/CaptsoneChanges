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
            $table->timestamp('last_approved_at')->nullable()->after('reviewed_at');
            $table->integer('cooldown_days')->default(14)->after('last_approved_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('profile_change_requests', function (Blueprint $table) {
            $table->dropColumn(['last_approved_at', 'cooldown_days']);
        });
    }
};