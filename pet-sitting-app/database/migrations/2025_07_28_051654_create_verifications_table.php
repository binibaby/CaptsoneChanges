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
        Schema::create('verifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->enum('document_type', [
                'national_id', 'drivers_license', 'passport', 'other',
                // Philippine IDs
                'ph_national_id', 'ph_drivers_license', 'sss_id', 'philhealth_id', 
                'tin_id', 'postal_id', 'voters_id', 'prc_id', 'umid', 'owwa_id'
            ])->default('national_id');
            $table->string('document_number')->nullable();
            $table->string('document_image')->nullable();
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->timestamp('verified_at')->nullable();
            $table->foreignId('verified_by')->nullable()->constrained('users')->onDelete('set null');
            $table->text('rejection_reason')->nullable();
            $table->text('notes')->nullable();
            
            // Additional fields for enhanced verification
            $table->string('verification_score')->nullable(); // Confidence score
            $table->json('badges_earned')->nullable(); // Store earned badges
            $table->boolean('is_philippine_id')->default(false); // Flag for Philippine IDs
            $table->string('verification_method')->nullable(); // Manual, OCR, etc.
            $table->json('extracted_data')->nullable(); // Store extracted ID data
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('verifications');
    }
};
