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
    ];

    protected $casts = [
        'date' => 'date',
        'time' => 'datetime',
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
}
