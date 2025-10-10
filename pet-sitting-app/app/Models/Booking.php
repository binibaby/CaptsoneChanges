<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Booking extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'sitter_id',
        'date',
        'time',
        'payment_id',
        'status',
        'is_weekly',
        'start_date',
        'end_date',
        'start_time',
        'end_time',
        'hourly_rate',
        'total_amount',
        'pet_name',
        'pet_type',
        'service_type',
        'duration',
        'description',
    ];

    protected $casts = [
        'date' => 'date',
        'time' => 'datetime',
        'start_time' => 'string',
        'end_time' => 'string',
    ];
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
    public function sitter()
    {
        return $this->belongsTo(User::class, 'sitter_id');
    }
    public function payment()
    {
        return $this->hasOne(Payment::class, 'booking_id');
    }

    public function review()
    {
        return $this->hasOne(Review::class);
    }

    /**
     * Check if the booking has been reviewed.
     */
    public function hasReview(): bool
    {
        return $this->review()->exists();
    }
}
