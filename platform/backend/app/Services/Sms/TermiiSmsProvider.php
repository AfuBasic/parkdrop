<?php

namespace App\Services\Sms;

use App\Contracts\Sms\SmsProvider;
use App\Contracts\Sms\SmsResult;
use App\Services\PhoneNormalizer;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
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
     *
     * Returns SmsResult::ambiguous() if the request times out AFTER connection was
     * established, because the provider may have already accepted and dispatched the
     * message. Callers must NOT automatically re-send in this case.
     */
    public function send(string $to, string $message): SmsResult
    {
        if (empty($this->apiKey)) {
            Log::error('Termii API Key is missing. SMS not sent.');

            return SmsResult::failed('Termii API key is not configured.');
        }

        // Normalize phone number to international format without leading plus (e.g. 2348012345678)
        $normalizedPhone = PhoneNormalizer::normalize($to);
        $cleanRecipient = ltrim($normalizedPhone, '+');

        Log::info('Dispatching Termii SMS', [
            'to' => $cleanRecipient,
            'sender' => $this->senderId,
        ]);

        try {
            $response = Http::connectTimeout(5)
                ->timeout(15)
                ->post("{$this->baseUrl}/sms/send", [
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

                return SmsResult::sent($response->json('message_id'));
            }

            Log::error('Termii SMS failed', [
                'status' => $response->status(),
                'response' => $response->json(),
                'to' => $cleanRecipient,
            ]);

            return SmsResult::failed(
                sprintf('Termii returned HTTP %d: %s', $response->status(), $response->json('message') ?? 'Unknown error')
            );

        } catch (ConnectionException $e) {
            // Connection-level failure: request never reached the provider.
            // Safe to classify as FAILED (not AMBIGUOUS) because the provider
            // could not have accepted the message.
            Log::warning('Termii SMS connection failed (pre-send)', [
                'to' => $cleanRecipient,
                'error' => $e->getMessage(),
            ]);

            return SmsResult::failed('Could not connect to SMS provider: '.$e->getMessage());

        } catch (RequestException $e) {
            // Request timeout AFTER connection was established.
            // The provider MAY have accepted the message — classify as AMBIGUOUS.
            Log::error('Termii SMS request timed out after connection (ambiguous)', [
                'to' => $cleanRecipient,
                'error' => $e->getMessage(),
            ]);

            return SmsResult::ambiguous('SMS request timed out — provider may have accepted the message.');

        } catch (\Throwable $e) {
            Log::error('Termii SMS Exception: '.$e->getMessage(), [
                'to' => $cleanRecipient,
            ]);

            return SmsResult::failed($e->getMessage());
        }
    }
}
