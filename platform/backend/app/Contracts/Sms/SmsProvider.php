<?php

namespace App\Contracts\Sms;

interface SmsProvider
{
    /**
     * Send an SMS message.
     *
     * @param  string  $to  Recipient phone number (e.g. +234... or 080...)
     * @param  string  $message  The message content
     * @return bool True if successfully handed off to provider
     */
    public function send(string $to, string $message): bool;
}
