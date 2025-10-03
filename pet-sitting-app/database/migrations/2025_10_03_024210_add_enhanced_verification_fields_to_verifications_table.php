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
            // Add new fields for enhanced verification
            $table->string('front_id_image')->nullable()->after('document_image');
            $table->string('back_id_image')->nullable()->after('front_id_image');
            $table->string('selfie_image')->nullable()->after('back_id_image');
            
            // Location verification fields
            $table->decimal('selfie_latitude', 10, 8)->nullable()->after('selfie_image');
            $table->decimal('selfie_longitude', 11, 8)->nullable()->after('selfie_latitude');
            $table->string('selfie_address')->nullable()->after('selfie_longitude');
            $table->string('id_address')->nullable()->after('selfie_address');
            $table->boolean('location_verified')->default(false)->after('id_address');
            $table->decimal('location_accuracy', 5, 2)->nullable()->after('location_verified');
            
            // Enhanced verification status
            $table->enum('verification_status', ['pending', 'under_review', 'approved', 'rejected', 'requires_resubmission'])->default('pending')->after('status');
            $table->timestamp('review_deadline')->nullable()->after('verification_status');
            $table->boolean('is_legit_sitter')->default(false)->after('review_deadline');
            $table->json('verification_badges')->nullable()->after('is_legit_sitter');
            
            // Admin review fields
            $table->text('admin_review_notes')->nullable()->after('verification_badges');
            $table->enum('admin_decision', ['pending', 'approved', 'rejected'])->default('pending')->after('admin_review_notes');
            $table->timestamp('admin_reviewed_at')->nullable()->after('admin_decision');
            $table->foreignId('admin_reviewed_by')->nullable()->constrained('users')->onDelete('set null')->after('admin_reviewed_at');
            
            // Document quality checks
            $table->json('document_quality_scores')->nullable()->after('admin_reviewed_by');
            $table->boolean('documents_clear')->default(false)->after('document_quality_scores');
            $table->boolean('face_match_verified')->default(false)->after('documents_clear');
            $table->boolean('address_match_verified')->default(false)->after('face_match_verified');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('verifications', function (Blueprint $table) {
            $table->dropColumn([
                'front_id_image',
                'back_id_image', 
                'selfie_image',
                'selfie_latitude',
                'selfie_longitude',
                'selfie_address',
                'id_address',
                'location_verified',
                'location_accuracy',
                'verification_status',
                'review_deadline',
                'is_legit_sitter',
                'verification_badges',
                'admin_review_notes',
                'admin_decision',
                'admin_reviewed_at',
                'admin_reviewed_by',
                'document_quality_scores',
                'documents_clear',
                'face_match_verified',
                'address_match_verified'
            ]);
        });
    }
};