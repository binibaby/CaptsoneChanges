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

class UserSuspended implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $user;
    public $reason;
    public $suspensionEnd;
    public $suspendedBy;

    /**
     * Create a new event instance.
     */
    public function __construct(User $user, string $reason, $suspensionEnd, $suspendedBy)
    {
        $this->user = $user;
        $this->reason = $reason;
        $this->suspensionEnd = $suspensionEnd;
        $this->suspendedBy = $suspendedBy;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('user.' . $this->user->id),
            new Channel('admin-dashboard'),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'user.suspended';
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
            'status' => 'suspended',
            'reason' => $this->reason,
            'suspension_ends_at' => $this->suspensionEnd ? $this->suspensionEnd->toIso8601String() : null,
            'suspended_by' => $this->suspendedBy,
            'timestamp' => now()->toIso8601String(),
            'message' => 'You have been suspended for 72 hours by the admin. Please email the admin at petsitconnectph@gmail.com for assistance.',
        ];
    }
}

