<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Verification extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'document_type',
        'document_number',
        'document_image',
        'front_id_image',
        'back_id_image',
        'selfie_image',
        'selfie_latitude',
        'selfie_longitude',
        'selfie_address',
        'id_address',
        'location_verified',
        'location_accuracy',
        'status',
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
        'address_match_verified',
        'verified_at',
        'verified_by',
        'rejection_reason',
        'rejection_category',
        'allow_resubmission',
        'admin_notes',
        'confidence_level',
        'verification_method',
        'notes',
        'verification_score',
        'badges_earned',
        'is_philippine_id',
        'extracted_data',
    ];

    protected $casts = [
        'verified_at' => 'datetime',
        'review_deadline' => 'datetime',
        'admin_reviewed_at' => 'datetime',
        'allow_resubmission' => 'boolean',
        'location_verified' => 'boolean',
        'is_legit_sitter' => 'boolean',
        'documents_clear' => 'boolean',
        'face_match_verified' => 'boolean',
        'address_match_verified' => 'boolean',
        'badges_earned' => 'array',
        'verification_badges' => 'array',
        'document_quality_scores' => 'array',
        'extracted_data' => 'array',
        'is_philippine_id' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function verifiedBy()
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    public function auditLogs()
    {
        return $this->hasMany(VerificationAuditLog::class);
    }
}
