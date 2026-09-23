<?php

namespace App\Contracts\Payments;

class PaymentInitializationResult
{
    public function __construct(
        public readonly string $checkoutUrl,
        public readonly string $providerReference,
        public readonly array $rawMetadata = []
    ) {}
}
