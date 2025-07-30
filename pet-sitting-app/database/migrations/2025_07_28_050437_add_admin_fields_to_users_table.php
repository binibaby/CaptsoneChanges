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
            if (!Schema::hasColumn('users', 'role')) {
                $table->enum('role', ['admin', 'pet_owner', 'pet_sitter'])->default('pet_owner')->after('email');
            }
            if (!Schema::hasColumn('users', 'status')) {
                $table->enum('status', ['pending', 'active', 'suspended', 'banned', 'denied'])->default('pending')->after('role');
            }
            if (!Schema::hasColumn('users', 'phone')) {
                $table->string('phone')->nullable()->after('status');
            }
            if (!Schema::hasColumn('users', 'address')) {
                $table->text('address')->nullable()->after('phone');
            }
            if (!Schema::hasColumn('users', 'approved_at')) {
                $table->timestamp('approved_at')->nullable()->after('address');
            }
            if (!Schema::hasColumn('users', 'approved_by')) {
                $table->foreignId('approved_by')->nullable()->constrained('users')->after('approved_at');
            }
            if (!Schema::hasColumn('users', 'denied_at')) {
                $table->timestamp('denied_at')->nullable()->after('approved_by');
            }
            if (!Schema::hasColumn('users', 'denied_by')) {
                $table->foreignId('denied_by')->nullable()->constrained('users')->after('denied_at');
            }
            if (!Schema::hasColumn('users', 'denial_reason')) {
                $table->text('denial_reason')->nullable()->after('denied_by');
            }
            if (!Schema::hasColumn('users', 'suspended_at')) {
                $table->timestamp('suspended_at')->nullable()->after('denial_reason');
            }
            if (!Schema::hasColumn('users', 'suspended_by')) {
                $table->foreignId('suspended_by')->nullable()->constrained('users')->after('suspended_at');
            }
            if (!Schema::hasColumn('users', 'suspension_reason')) {
                $table->text('suspension_reason')->nullable()->after('suspended_by');
            }
            if (!Schema::hasColumn('users', 'suspension_ends_at')) {
                $table->timestamp('suspension_ends_at')->nullable()->after('suspension_reason');
            }
            if (!Schema::hasColumn('users', 'banned_at')) {
                $table->timestamp('banned_at')->nullable()->after('suspension_ends_at');
            }
            if (!Schema::hasColumn('users', 'banned_by')) {
                $table->foreignId('banned_by')->nullable()->constrained('users')->after('banned_at');
            }
            if (!Schema::hasColumn('users', 'ban_reason')) {
                $table->text('ban_reason')->nullable()->after('banned_by');
            }
            if (!Schema::hasColumn('users', 'rating')) {
                $table->decimal('rating', 3, 2)->nullable()->after('ban_reason');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['approved_by']);
            $table->dropForeign(['denied_by']);
            $table->dropForeign(['suspended_by']);
            $table->dropForeign(['banned_by']);
            
            $table->dropColumn([
                'role', 'status', 'phone', 'address',
                'approved_at', 'approved_by', 'denied_at', 'denied_by', 'denial_reason',
                'suspended_at', 'suspended_by', 'suspension_reason', 'suspension_ends_at',
                'banned_at', 'banned_by', 'ban_reason', 'rating'
            ]);
        });
    }
};
