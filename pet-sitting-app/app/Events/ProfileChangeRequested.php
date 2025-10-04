<?php

namespace App\Events;

use App\Models\ProfileChangeRequest;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ProfileChangeRequested implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $profileChangeRequest;

    /**
     * Create a new event instance.
     */
    public function __construct(ProfileChangeRequest $profileChangeRequest)
    {
        $this->profileChangeRequest = $profileChangeRequest->load(['user:id,name,email']);
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('admin.notifications'),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'profile-change-requested';
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'id' => $this->profileChangeRequest->id,
            'user_name' => $this->profileChangeRequest->user->name,
            'user_email' => $this->profileChangeRequest->user->email,
            'field_name' => $this->profileChangeRequest->field_name,
            'field_display_name' => $this->profileChangeRequest->getFieldDisplayName(),
            'old_value' => $this->profileChangeRequest->old_value,
            'new_value' => $this->profileChangeRequest->new_value,
            'reason' => $this->profileChangeRequest->reason,
            'status' => $this->profileChangeRequest->status,
            'created_at' => $this->profileChangeRequest->created_at->toISOString(),
            'message' => "New profile change request from {$this->profileChangeRequest->user->name} for {$this->profileChangeRequest->getFieldDisplayName()}"
        ];
    }
}