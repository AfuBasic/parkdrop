<?php

namespace App\Services\Sms;

use App\Contracts\Sms\SmsProvider;
use App\Services\PhoneNormalizer;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TermiiSmsProvider implements SmsProvider
{
    protected string $apiKey;

    protected string $senderId;

    protected string $baseUrl;

    public function __construct()
    {
        $this->apiKey = (string) config('services.termii.api_key');
        $this->senderId = (string) config('services.termii.sender_id', 'Kontrol');
        $this->baseUrl = rtrim((string) config('services.termii.base_url', 'https://api.ng.termii.com/api'), '/');
    }

    /**
     * Send an SMS message using Termii.
     */
    public function send(string $to, string $message): bool
    {
        if (empty($this->apiKey)) {
            Log::error('Termii API Key is missing. SMS not sent.');

            return false;
        }

        // Normalize phone number to international format without leading plus (e.g. 2348012345678)
        $normalizedPhone = PhoneNormalizer::normalize($to);
        $cleanRecipient = ltrim($normalizedPhone, '+');

        Log::info('Dispatching Termii SMS', [
            'to' => $cleanRecipient,
            'sender' => $this->senderId,
        ]);

        try {
            $response = Http::post("{$this->baseUrl}/sms/send", [
                'to' => $cleanRecipient,
                'from' => $this->senderId,
                'sms' => $message,
                'type' => 'plain',
                'channel' => 'generic',
                'api_key' => $this->apiKey,
            ]);

            if ($response->successful()) {
                Log::info('Termii SMS sent successfully', [
                    'to' => $cleanRecipient,
                    'message_id' => $response->json('message_id'),
                ]);

                return true;
            }

            Log::error('Termii SMS failed', [
                'status' => $response->status(),
                'response' => $response->json(),
                'to' => $cleanRecipient,
            ]);

            return false;
        } catch (\Throwable $e) {
            Log::error('Termii SMS Exception: '.$e->getMessage(), [
                'to' => $cleanRecipient,
            ]);

            return false;
        }
    }
}
