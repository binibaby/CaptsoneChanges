<?php

namespace App\Events;

use App\Models\Review;
use App\Models\User;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class NewReview implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $review;
    public $sitter;
    public $owner;

    /**
     * Create a new event instance.
     */
    public function __construct(Review $review, User $sitter, User $owner)
    {
        $this->review = $review;
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
            new PrivateChannel('user.' . $this->sitter->id),
        ];
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'type' => 'new_review',
            'message' => "You received a new {$this->review->rating}-star review from {$this->owner->first_name} {$this->owner->last_name}.",
            'review_id' => $this->review->id,
            'booking_id' => $this->review->booking_id,
            'rating' => $this->review->rating,
            'review_text' => $this->review->review,
            'owner_name' => "{$this->owner->first_name} {$this->owner->last_name}",
            'owner_id' => $this->owner->id,
            'sitter_id' => $this->sitter->id,
            'pet_name' => $this->review->booking->pet_name,
            'date' => $this->review->booking->date->format('Y-m-d'),
            'created_at' => now()->toISOString(),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'review.created';
    }
}
