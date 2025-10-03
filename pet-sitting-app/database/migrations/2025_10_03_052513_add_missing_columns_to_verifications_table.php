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
        Schema::table('verifications', function (Blueprint $table) {
            $table->string('confidence_level')->nullable()->after('address_match_verified');
            $table->integer('minutes_ago')->nullable()->after('confidence_level');
            $table->string('time_ago')->nullable()->after('minutes_ago');
            $table->boolean('is_urgent')->default(false)->after('time_ago');
            $table->boolean('is_critical')->default(false)->after('is_urgent');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('verifications', function (Blueprint $table) {
            $table->dropColumn(['confidence_level', 'minutes_ago', 'time_ago', 'is_urgent', 'is_critical']);
        });
    }
};
