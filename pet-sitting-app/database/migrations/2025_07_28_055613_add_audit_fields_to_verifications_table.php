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
            if (!Schema::hasColumn('verifications', 'rejection_category')) {
                $table->enum('rejection_category', [
                    'document_unclear', 
                    'document_expired', 
                    'document_invalid', 
                    'information_mismatch', 
                    'suspicious_activity', 
                    'other'
                ])->nullable()->after('rejection_reason');
            }
            
            if (!Schema::hasColumn('verifications', 'allow_resubmission')) {
                $table->boolean('allow_resubmission')->default(true)->after('rejection_category');
            }
            
            if (!Schema::hasColumn('verifications', 'admin_notes')) {
                $table->text('admin_notes')->nullable()->after('allow_resubmission');
            }
            
            if (!Schema::hasColumn('verifications', 'confidence_level')) {
                $table->enum('confidence_level', ['high', 'medium', 'low'])->nullable()->after('admin_notes');
            }
            
            if (!Schema::hasColumn('verifications', 'verification_method')) {
                $table->enum('verification_method', ['manual', 'automated', 'hybrid'])->nullable()->after('confidence_level');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('verifications', function (Blueprint $table) {
            $table->dropColumn([
                'rejection_category',
                'allow_resubmission', 
                'admin_notes',
                'confidence_level',
                'verification_method'
            ]);
        });
    }
};
