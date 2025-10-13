<?php

namespace App\Events;

use App\Models\User;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AdminUserVerificationUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $user;
    public $verificationStatus;
    public $message;

    /**
     * Create a new event instance.
     */
    public function __construct(User $user, string $verificationStatus, string $message = '')
    {
        $this->user = $user;
        $this->verificationStatus = $verificationStatus;
        $this->message = $message;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new Channel('admin-dashboard'),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'admin.user.verification.updated';
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'user' => [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'email' => $this->user->email,
                'role' => $this->user->role,
                'status' => $this->user->status,
                'phone_verified_at' => $this->user->phone_verified_at,
                'id_verified' => $this->user->id_verified,
                'id_verified_at' => $this->user->id_verified_at,
                'verification_status' => $this->user->verification_status,
            ],
            'verification_status' => $this->verificationStatus,
            'message' => $this->message,
            'timestamp' => now()->toISOString(),
        ];
    }
}
