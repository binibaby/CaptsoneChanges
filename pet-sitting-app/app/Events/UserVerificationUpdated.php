<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class UserVerificationUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $user;
    public $verificationType;
    public $status;

    /**
     * Create a new event instance.
     */
    public function __construct($user, $verificationType, $status)
    {
        $this->user = $user;
        $this->verificationType = $verificationType;
        $this->status = $status;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new Channel('admin-updates'),
            new PrivateChannel('admin.users'),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'user.verification.updated';
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'user_id' => $this->user->id,
            'user_name' => $this->user->name,
            'user_email' => $this->user->email,
            'user_role' => $this->user->role,
            'verification_type' => $this->verificationType,
            'status' => $this->status,
            'phone_verified_at' => $this->user->phone_verified_at,
            'verification_status' => $this->user->verification_status,
            'user_status' => $this->user->status,
            'timestamp' => now()->toISOString(),
        ];
    }
}
