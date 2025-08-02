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
        'status',
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
        'allow_resubmission' => 'boolean',
        'badges_earned' => 'array',
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
