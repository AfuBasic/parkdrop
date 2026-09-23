<?php

namespace App\Exceptions\Sms;

use Exception;

/**
 * Thrown by ChargeForSmsAction when a business has no credits left to charge.
 *
 * Deliberately never lets the wallet go negative. A caller sending a
 * transactional message (e.g. an arrival SMS already accepted by Termii)
 * should catch this and log it rather than treat it as a failure — the
 * message already went out; this only means we could not bill for it.
 */
class InsufficientSmsCreditsException extends Exception
{
    public function __construct(
        public readonly int $businessId,
        public readonly int $balance,
        public readonly int $amountRequested,
    ) {
        parent::__construct(
            sprintf(
                'Business %d has %d SMS credit(s), needs %d.',
                $businessId,
                $balance,
                $amountRequested
            )
        );
    }
}
