<?php

namespace App\Events;

use App\Models\User;
use App\Models\Payment;
use App\Models\Booking;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PaymentSuccess implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $owner;
    public $payment;
    public $booking;

    /**
     * Create a new event instance.
     */
    public function __construct(User $owner, Payment $payment, Booking $booking)
    {
        $this->owner = $owner;
        $this->payment = $payment;
        $this->booking = $booking;
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
        ];
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'type' => 'payment_success',
            'message' => "Your payment of ₱{$this->payment->amount} for booking with {$this->booking->sitter->name} has been processed successfully!",
            'payment' => [
                'id' => $this->payment->id,
                'amount' => $this->payment->amount,
                'status' => $this->payment->status,
                'booking_id' => $this->payment->booking_id,
                'created_at' => $this->payment->created_at,
            ],
            'booking' => [
                'id' => $this->booking->id,
                'pet_name' => $this->booking->pet_name,
                'date' => $this->booking->date->format('Y-m-d'),
                'start_time' => $this->booking->start_time,
                'end_time' => $this->booking->end_time,
                'status' => $this->booking->status,
            ],
            'sitter' => [
                'id' => $this->booking->sitter->id,
                'name' => $this->booking->sitter->name,
            ],
            'timestamp' => now()->toISOString(),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'payment.success';
    }
}
