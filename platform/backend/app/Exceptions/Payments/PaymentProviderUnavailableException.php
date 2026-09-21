<?php

namespace App\Exceptions\Payments;

use RuntimeException;

/**
 * Thrown when a payment provider is definitively unreachable before any transaction was created.
 * This exception is safe to surface to the user as a "provider temporarily unavailable" message.
 * It does NOT indicate that a payment was attempted or that money was charged.
 *
 * Contrast with PaymentAmbiguousException (used when the provider may have accepted a charge
 * but the response was lost), which requires manual reconciliation rather than a simple retry.
 */
class PaymentProviderUnavailableException extends RuntimeException
{
    public function __construct(
        string $message = 'Payment provider is temporarily unavailable.',
        public readonly string $provider = 'unknown',
        ?\Throwable $previous = null,
    ) {
        parent::__construct($message, 0, $previous);
    }
}
