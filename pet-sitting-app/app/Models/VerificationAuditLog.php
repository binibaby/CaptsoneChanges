<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class VerificationAuditLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'verification_id',
        'admin_id',
        'action',
        'reason',
        'ip_address',
        'user_agent',
        'confidence_level',
        'rejection_category',
        'metadata'
    ];

    protected $casts = [
        'metadata' => 'array'
    ];

    public function verification()
    {
        return $this->belongsTo(Verification::class);
    }

    public function admin()
    {
        return $this->belongsTo(User::class, 'admin_id');
    }
}
