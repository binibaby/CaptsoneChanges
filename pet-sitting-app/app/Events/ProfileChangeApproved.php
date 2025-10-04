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

class ProfileChangeApproved implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $profileChangeRequest;

    /**
     * Create a new event instance.
     */
    public function __construct(ProfileChangeRequest $profileChangeRequest)
    {
        $this->profileChangeRequest = $profileChangeRequest->load(['user:id,name,email', 'reviewer:id,name']);
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('user.' . $this->profileChangeRequest->user_id),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'profile-change-approved';
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'id' => $this->profileChangeRequest->id,
            'field_name' => $this->profileChangeRequest->field_name,
            'field_display_name' => $this->profileChangeRequest->getFieldDisplayName(),
            'old_value' => $this->profileChangeRequest->old_value,
            'new_value' => $this->profileChangeRequest->new_value,
            'admin_notes' => $this->profileChangeRequest->admin_notes,
            'reviewed_by' => $this->profileChangeRequest->reviewer->name ?? 'Admin',
            'status' => $this->profileChangeRequest->status,
            'reviewed_at' => $this->profileChangeRequest->reviewed_at->toISOString(),
            'message' => "Your profile change request for {$this->profileChangeRequest->getFieldDisplayName()} has been approved!"
        ];
    }
}