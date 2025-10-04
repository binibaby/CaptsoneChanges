<?php

namespace App\Events;

use App\Models\User;
use App\Models\Verification;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class IdVerificationStatusUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $verification;
    public $user;
    public $status;
    public $message;

    /**
     * Create a new event instance.
     */
    public function __construct(Verification $verification, User $user, string $status, string $message = '')
    {
        $this->verification = $verification;
        $this->user = $user;
        $this->status = $status;
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
            new PrivateChannel('user.' . $this->user->id),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'id.verification.updated';
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'verification' => [
                'id' => $this->verification->id,
                'status' => $this->verification->status,
                'verification_status' => $this->verification->verification_status,
                'admin_decision' => $this->verification->admin_decision,
                'admin_reviewed_at' => $this->verification->admin_reviewed_at,
                'rejection_reason' => $this->verification->rejection_reason,
                'verified_at' => $this->verification->verified_at,
            ],
            'user' => [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'email' => $this->user->email,
            ],
            'status' => $this->status,
            'message' => $this->message,
            'timestamp' => now()->toISOString(),
        ];
    }
}
