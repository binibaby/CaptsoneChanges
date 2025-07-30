<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    use HasFactory;

    protected $fillable = [
        'booking_id',
        'amount',
        'method',
        'app_share',
        'sitter_share',
        'status',
        'transaction_id',
        'processed_at',
    ];

    protected $casts = [
        'processed_at' => 'datetime',
        'amount' => 'decimal:2',
        'app_share' => 'decimal:2',
        'sitter_share' => 'decimal:2',
    ];

    public function booking()
    {
        return $this->belongsTo(Booking::class);
    }

    public function user()
    {
        return $this->hasOneThrough(User::class, Booking::class, 'id', 'id', 'booking_id', 'user_id');
    }

    // Alternative simpler relationship through booking
    public function customer()
    {
        return $this->booking->user();
    }
}