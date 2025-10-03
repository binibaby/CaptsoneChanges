<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasApiTokens;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'first_name',
        'last_name',
        'email',
        'password',
        'role',
        'status',
        'phone',
        'address',
        'gender',
        'age',
        'experience',
        'hourly_rate',
        'pet_breeds',
        'specialties',
        'selected_pet_types',
        'bio',
        'profile_image',
        'certificates',
        'rating',
        'is_admin',
        'admin_role',
        'admin_permissions',
        'approved_at',
        'approved_by',
        'rejection_reason',
        'last_active_at',
        'email_verification_code',
        'phone_verification_code',
        'email_verified_at',
        'phone_verified_at',
        'id_verified',
        'id_verified_at',
        'verification_status',
        'can_accept_bookings',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
        'email_verification_code',
        'phone_verification_code',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'phone_verified_at' => 'datetime',
        'password' => 'hashed',
        'admin_permissions' => 'array',
        'pet_breeds' => 'array',
        'specialties' => 'array',
        'selected_pet_types' => 'array',
        'hourly_rate' => 'decimal:2',
        'approved_at' => 'datetime',
        'last_active_at' => 'datetime',
        'is_admin' => 'boolean',
        'id_verified' => 'boolean',
        'id_verified_at' => 'datetime',
        'can_accept_bookings' => 'boolean',
    ];

    // Relationships
    public function bookings()
    {
        return $this->hasMany(Booking::class);
    }

    public function payments()
    {
        return $this->hasManyThrough(Payment::class, Booking::class);
    }

    public function notifications()
    {
        return $this->hasMany(Notification::class);
    }

    // Count payments through bookings
    public function getPaymentsCountAttribute()
    {
        return $this->bookings()->whereHas('payment')->count();
    }

    public function supportTickets()
    {
        return $this->hasMany(SupportTicket::class);
    }

    public function verifications()
    {
        return $this->hasMany(Verification::class);
    }

    public function walletTransactions()
    {
        return $this->hasMany(WalletTransaction::class);
    }

    public function pets()
    {
        return $this->hasMany(Pet::class);
    }

    public function approvedBy()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    // Scopes
    public function scopePetSitters($query)
    {
        return $query->where('role', 'pet_sitter');
    }

    public function scopePetOwners($query)
    {
        return $query->where('role', 'pet_owner');
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeVerified($query)
    {
        return $query->whereNotNull('email_verified_at');
    }

    // Helper methods
    public function isAdmin()
    {
        return $this->is_admin;
    }

    public function isPetSitter()
    {
        return $this->role === 'pet_sitter';
    }

    public function isPetOwner()
    {
        return $this->role === 'pet_owner';
    }

    public function isVerified()
    {
        return $this->email_verified_at !== null && 
               ($this->phone_verified_at !== null || empty($this->phone));
    }

    public function hasVerifiedId()
    {
        return $this->verifications()->where('verification_status', 'approved')->exists();
    }

    public function canAcceptBookings()
    {
        return $this->isPetSitter() && 
               $this->status === 'active' && 
               $this->isVerified() && 
               $this->hasVerifiedId();
    }

    public function getVerificationBadges()
    {
        $verification = $this->verifications()->where('verification_status', 'approved')->first();
        
        if ($verification && $verification->badges_earned) {
            return json_decode($verification->badges_earned, true);
        }

        return [];
    }
}
