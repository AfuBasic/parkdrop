<?php

namespace App\Contracts\Payments;

class WebhookEventResult
{
    /**
     * @param  string  $status  'PAID', 'PENDING', 'FAILED', 'UNKNOWN'
     */
    public function __construct(
        public readonly string $eventType,
        public readonly ?string $reference,
        public readonly ?string $providerTransactionId,
        public readonly int $amountMinor,
        public readonly string $currency,
        public readonly string $status,
        public readonly array $rawPayload = []
    ) {}

    public function isPaid(): bool
    {
        return $this->status === 'PAID';
    }
}
