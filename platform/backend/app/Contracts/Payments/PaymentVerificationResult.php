<?php

namespace App\Contracts\Payments;

class PaymentVerificationResult
{
    /**
     * @param  string  $status  'PAID', 'PENDING', 'FAILED'
     */
    public function __construct(
        public readonly string $status,
        public readonly string $reference,
        public readonly ?string $providerTransactionId,
        public readonly int $amountMinor,
        public readonly string $currency,
        public readonly array $rawPayload = []
    ) {}

    public function isPaid(): bool
    {
        return $this->status === 'PAID';
    }

    public function isPending(): bool
    {
        return $this->status === 'PENDING';
    }

    public function isFailed(): bool
    {
        return $this->status === 'FAILED';
    }
}
