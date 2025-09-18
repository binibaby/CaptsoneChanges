<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WeeklyAvailability extends Model
{
    use HasFactory;

    protected $fillable = [
        'sitter_id',
        'week_id',
        'start_date',
        'end_date',
        'start_time',
        'end_time',
        'is_weekly'
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'start_time' => 'datetime:H:i:s',
        'end_time' => 'datetime:H:i:s',
        'is_weekly' => 'boolean'
    ];

    public function sitter()
    {
        return $this->belongsTo(User::class, 'sitter_id');
    }
}
