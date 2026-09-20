<?php

namespace App\Services\Sms;

use App\Contracts\Sms\SmsProvider;
use Illuminate\Support\Facades\Log;

class FakeSmsProvider implements SmsProvider
{
    public array $sentMessages = [];

    protected bool $shouldFail = false;

    public function send(string $to, string $message): bool
    {
        Log::info('Fake SMS Dispatch', ['to' => $to, 'message' => $message]);

        if ($this->shouldFail) {
            return false;
        }

        $this->sentMessages[] = [
            'to' => $to,
            'message' => $message,
            'sent_at' => now(),
        ];

        return true;
    }

    public function simulateFailure(bool $fail = true): self
    {
        $this->shouldFail = $fail;

        return $this;
    }

    public function count(): int
    {
        return count($this->sentMessages);
    }
}
