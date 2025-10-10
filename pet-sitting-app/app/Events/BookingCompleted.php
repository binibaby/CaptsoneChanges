<?php

namespace App\Events;

use App\Models\Booking;
use App\Models\User;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class BookingCompleted implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $booking;
    public $sitter;
    public $owner;

    /**
     * Create a new event instance.
     */
    public function __construct(Booking $booking, User $sitter, User $owner)
    {
        $this->booking = $booking;
        $this->sitter = $sitter;
        $this->owner = $owner;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('user.' . $this->owner->id),
            new PrivateChannel('user.' . $this->sitter->id),
        ];
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'type' => 'booking_completed',
            'message' => "Your booking with {$this->sitter->first_name} {$this->sitter->last_name} is now completed. You can go to the Book Service page, open the Past tab, and rate and review your sitter.",
            'booking_id' => $this->booking->id,
            'sitter_name' => "{$this->sitter->first_name} {$this->sitter->last_name}",
            'sitter_id' => $this->sitter->id,
            'owner_name' => "{$this->owner->first_name} {$this->owner->last_name}",
            'owner_id' => $this->owner->id,
            'pet_name' => $this->booking->pet_name,
            'date' => $this->booking->date->format('Y-m-d'),
            'start_time' => $this->booking->start_time,
            'end_time' => $this->booking->end_time,
            'total_amount' => $this->booking->total_amount,
            'created_at' => now()->toISOString(),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'booking.completed';
    }
}
