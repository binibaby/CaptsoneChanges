<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Review extends Model
{
    use HasFactory;

    protected $fillable = [
        'booking_id',
        'owner_id',
        'sitter_id',
        'rating',
        'review',
    ];

    protected $casts = [
        'rating' => 'integer',
    ];

    /**
     * Get the booking that owns the review.
     */
    public function booking()
    {
        return $this->belongsTo(Booking::class);
    }

    /**
     * Get the owner who wrote the review.
     */
    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    /**
     * Get the sitter who was reviewed.
     */
    public function sitter()
    {
        return $this->belongsTo(User::class, 'sitter_id');
    }

    /**
     * Scope to get reviews for a specific sitter.
     */
    public function scopeForSitter($query, $sitterId)
    {
        return $query->where('sitter_id', $sitterId);
    }

    /**
     * Scope to get reviews by a specific owner.
     */
    public function scopeByOwner($query, $ownerId)
    {
        return $query->where('owner_id', $ownerId);
    }
}
