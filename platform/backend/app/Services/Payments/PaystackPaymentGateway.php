<?php

namespace App\Services\Payments;

use App\Contracts\Payments\PaymentGateway;
use App\Contracts\Payments\PaymentInitializationResult;
use App\Contracts\Payments\PaymentVerificationResult;
use App\Contracts\Payments\WebhookEventResult;
use App\Models\SmsCreditPurchase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PaystackPaymentGateway implements PaymentGateway
{
    protected string $secretKey;

    protected string $publicKey;

    protected string $baseUrl;

    public function __construct()
    {
        $this->secretKey = (string) config('payments.providers.paystack.secret_key');
        $this->publicKey = (string) config('payments.providers.paystack.public_key');
        $this->baseUrl = rtrim((string) config('payments.providers.paystack.base_url', 'https://api.paystack.co'), '/');
    }

    public function getName(): string
    {
        return 'paystack';
    }

    public function initializePayment(SmsCreditPurchase $purchase, string $callbackUrl, string $payerEmail): PaymentInitializationResult
    {
        $payload = [
            'email' => $payerEmail,
            'amount' => $purchase->amount_minor,
            'reference' => $purchase->reference,
            'callback_url' => $callbackUrl,
            'currency' => $purchase->currency,
            'metadata' => [
                'purchase_id' => $purchase->id,
                'business_id' => $purchase->business_id,
                'bundle_key' => $purchase->bundle_key,
                'credits' => $purchase->credits,
            ],
            'channels' => ['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer'],
        ];

        $response = Http::withToken($this->secretKey)
            ->baseUrl($this->baseUrl)
            ->post('/transaction/initialize', $payload);

        if (! $response->successful() || ! ($response->json('status') === true)) {
            Log::error('Paystack payment initialization failed', [
                'purchase_id' => $purchase->id,
                'status' => $response->status(),
                'response' => $response->json(),
            ]);

            throw new \RuntimeException('Failed to initialize payment with Paystack: '.($response->json('message') ?? 'Unknown error'));
        }

        $data = $response->json('data') ?? [];
        $authorizationUrl = $data['authorization_url'] ?? '';
        $reference = $data['reference'] ?? $purchase->reference;

        return new PaymentInitializationResult(
            checkoutUrl: $authorizationUrl,
            providerReference: $reference,
            rawMetadata: $data
        );
    }

    public function verifyPayment(string $reference): PaymentVerificationResult
    {
        $response = Http::withToken($this->secretKey)
            ->baseUrl($this->baseUrl)
            ->get('/transaction/verify/'.urlencode($reference));

        if (! $response->successful() || ! ($response->json('status') === true)) {
            Log::warning('Paystack payment verification request failed', [
                'reference' => $reference,
                'status' => $response->status(),
            ]);

            return new PaymentVerificationResult(
                status: 'PENDING',
                reference: $reference,
                providerTransactionId: null,
                amountMinor: 0,
                currency: 'NGN',
                rawPayload: $response->json() ?? []
            );
        }

        $data = $response->json('data') ?? [];
        $providerStatus = $data['status'] ?? 'unknown';

        $normalizedStatus = match ($providerStatus) {
            'success' => 'PAID',
            'failed' => 'FAILED',
            'abandoned' => 'FAILED',
            default => 'PENDING',
        };

        return new PaymentVerificationResult(
            status: $normalizedStatus,
            reference: $data['reference'] ?? $reference,
            providerTransactionId: isset($data['id']) ? (string) $data['id'] : null,
            amountMinor: (int) ($data['amount'] ?? 0),
            currency: (string) ($data['currency'] ?? 'NGN'),
            rawPayload: $data
        );
    }

    public function verifyWebhookSignature(string $rawPayload, string $signatureHeader): bool
    {
        if (empty($this->secretKey) || empty($signatureHeader)) {
            return false;
        }

        $computedSignature = hash_hmac('sha512', $rawPayload, $this->secretKey);

        return hash_equals($computedSignature, $signatureHeader);
    }

    public function parseWebhookEvent(array $payload): WebhookEventResult
    {
        $event = $payload['event'] ?? '';
        $data = $payload['data'] ?? [];

        $status = match ($event) {
            'charge.success' => 'PAID',
            'charge.failed' => 'FAILED',
            default => 'UNKNOWN',
        };

        return new WebhookEventResult(
            eventType: $event,
            reference: $data['reference'] ?? null,
            providerTransactionId: isset($data['id']) ? (string) $data['id'] : null,
            amountMinor: (int) ($data['amount'] ?? 0),
            currency: (string) ($data['currency'] ?? 'NGN'),
            status: $status,
            rawPayload: $payload
        );
    }
}
