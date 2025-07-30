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
        Schema::create('verification_audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('verification_id')->constrained()->onDelete('cascade');
            $table->foreignId('admin_id')->constrained('users')->onDelete('cascade');
            $table->enum('action', ['approved', 'rejected', 'under_review', 'requested_info', 'escalated']);
            $table->text('reason')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->enum('confidence_level', ['high', 'medium', 'low'])->nullable();
            $table->enum('rejection_category', [
                'document_unclear', 
                'document_expired', 
                'document_invalid', 
                'information_mismatch', 
                'suspicious_activity', 
                'other'
            ])->nullable();
            $table->json('metadata')->nullable(); // Additional data like verification method, etc.
            $table->timestamps();
            
            // Indexes for performance
            $table->index(['verification_id', 'created_at']);
            $table->index(['admin_id', 'created_at']);
            $table->index('action');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('verification_audit_logs');
    }
};
