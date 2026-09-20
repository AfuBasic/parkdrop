<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class SyncHint implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public int $businessId,
        public int $cursorHint
    ) {}

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('business.'.$this->businessId),
        ];
    }
    
    public function broadcastAs(): string
    {
        return 'sync.hint';
    }
}
