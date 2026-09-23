<?php

namespace App\Contracts\Sms;

/**
 * Immutable result DTO returned by every SmsProvider::send() call.
 *
 * Status meanings:
 *   SENT    — Provider confirmed the message was accepted and dispatched.
 *   FAILED  — Provider definitively rejected the message (4xx domain error).
 *             Safe to surface to Attention Center. Safe to retry with a new message
 *             if business rules permit a resend.
 *   AMBIGUOUS — Request timed out AFTER the HTTP connection was established, or the
 *               provider returned an unexpected response that could indicate acceptance
 *               or rejection. Do NOT automatically re-send. Mark as NEEDS_RECONCILIATION
 *               and surface to Attention Center for manual verification.
 */
readonly class SmsResult
{
    public function __construct(
        public string $status,
        public ?string $messageId = null,
        public ?string $errorMessage = null,
    ) {}

    public static function sent(?string $messageId = null): self
    {
        return new self(status: 'SENT', messageId: $messageId);
    }

    public static function failed(string $errorMessage): self
    {
        return new self(status: 'FAILED', errorMessage: $errorMessage);
    }

    /**
     * Used when the request timed out after potentially being accepted by the provider,
     * or when the response was ambiguous. The message may or may not have been sent.
     * Never automatically re-send — this risks duplicating customer messages.
     */
    public static function ambiguous(string $errorMessage = 'Provider response was ambiguous'): self
    {
        return new self(status: 'AMBIGUOUS', errorMessage: $errorMessage);
    }

    public function isSent(): bool
    {
        return $this->status === 'SENT';
    }

    public function isFailed(): bool
    {
        return $this->status === 'FAILED';
    }

    public function isAmbiguous(): bool
    {
        return $this->status === 'AMBIGUOUS';
    }
}
