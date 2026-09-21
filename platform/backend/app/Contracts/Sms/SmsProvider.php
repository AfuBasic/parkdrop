<?php

namespace App\Contracts\Sms;

interface SmsProvider
{
    /**
     * Attempt to send an SMS message.
     *
     * Returns an SmsResult with one of three statuses:
     *   SENT      — Provider confirmed acceptance.
     *   FAILED    — Provider definitively rejected the message. Safe to surface/retry.
     *   AMBIGUOUS — Request may have been accepted; response was lost or timed out.
     *               Callers MUST NOT automatically re-send to avoid duplicating
     *               customer messages. Mark as NEEDS_RECONCILIATION instead.
     *
     * @param  string  $to  Recipient phone number (e.g. +234... or 080...)
     * @param  string  $message  The message content
     */
    public function send(string $to, string $message): SmsResult;
}
