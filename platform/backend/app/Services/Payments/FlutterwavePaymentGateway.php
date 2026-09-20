<?php

namespace App\Services\Payments;

use App\Contracts\Payments\PaymentGateway;
use App\Contracts\Payments\PaymentInitializationResult;
use App\Contracts\Payments\PaymentVerificationResult;
use App\Contracts\Payments\WebhookEventResult;
use App\Models\SmsCreditPurchase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FlutterwavePaymentGateway implements PaymentGateway
{
    protected string $secretKey;

    protected string $publicKey;

    protected string $secretHash;

    protected string $baseUrl;

    public function __construct()
    {
        $this->secretKey = (string) config('payments.providers.flutterwave.secret_key');
        $this->publicKey = (string) config('payments.providers.flutterwave.public_key');
        $this->secretHash = (string) config('payments.providers.flutterwave.secret_hash');
        $this->baseUrl = rtrim((string) config('payments.providers.flutterwave.base_url', 'https://api.flutterwave.com/v3'), '/');
    }

    public function getName(): string
    {
        return 'flutterwave';
    }

    public function initializePayment(SmsCreditPurchase $purchase, string $callbackUrl, string $payerEmail): PaymentInitializationResult
    {
        // Flutterwave amount is standard major units (e.g. 1500.00 for 150000 kobo)
        $amountMajor = $purchase->amount_minor / 100;

        $payload = [
            'tx_ref' => $purchase->reference,
            'amount' => $amountMajor,
            'currency' => $purchase->currency,
            'redirect_url' => $callbackUrl,
            'customer' => [
                'email' => $payerEmail,
            ],
            'customizations' => [
                'title' => 'ParkDrop SMS Credits',
                'description' => "{$purchase->credits} SMS credits",
                'logo' => 'https://app.parkdrop.com.ng/parkdrop-icon-only.png',
            ],
            'meta' => [
                'purchase_id' => $purchase->id,
                'business_id' => $purchase->business_id,
                'bundle_key' => $purchase->bundle_key,
                'credits' => $purchase->credits,
            ],
        ];

        $response = Http::withToken($this->secretKey)
            ->baseUrl($this->baseUrl)
            ->post('/payments', $payload);

        if (! $response->successful() || ! ($response->json('status') === 'success')) {
            Log::error('Flutterwave payment initialization failed', [
                'purchase_id' => $purchase->id,
                'status' => $response->status(),
                'response' => $response->json(),
            ]);

            throw new \RuntimeException('Failed to initialize payment with Flutterwave: '.($response->json('message') ?? 'Unknown error'));
        }

        $data = $response->json('data') ?? [];
        $link = $data['link'] ?? '';

        return new PaymentInitializationResult(
            checkoutUrl: $link,
            providerReference: $purchase->reference,
            rawMetadata: $data
        );
    }

    public function verifyPayment(string $reference): PaymentVerificationResult
    {
        // Flutterwave verifies by tx_ref via GET /transactions/verify_by_reference?tx_ref=...
        // Or if given a numeric transaction ID, via GET /transactions/{id}/verify.
        // We support both: if reference is numeric, verify directly by ID; otherwise verify by tx_ref.
        $endpoint = is_numeric($reference)
            ? "/transactions/{$reference}/verify"
            : '/transactions/verify_by_reference?tx_ref='.urlencode($reference);

        $response = Http::withToken($this->secretKey)
            ->baseUrl($this->baseUrl)
            ->get($endpoint);

        if (! $response->successful() || ! ($response->json('status') === 'success')) {
            Log::warning('Flutterwave payment verification request failed or pending', [
                'reference' => $reference,
                'status' => $response->status(),
                'response' => $response->json(),
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
        $flwStatus = strtolower((string) ($data['status'] ?? 'unknown'));

        $normalizedStatus = match ($flwStatus) {
            'successful' => 'PAID',
            'failed' => 'FAILED',
            default => 'PENDING',
        };

        // Flutterwave returns amount in major units (e.g. 1500) -> convert to minor integer units (150000)
        $amountMinor = isset($data['amount']) ? (int) round(((float) $data['amount']) * 100) : 0;

        return new PaymentVerificationResult(
            status: $normalizedStatus,
            reference: $data['tx_ref'] ?? $reference,
            providerTransactionId: isset($data['id']) ? (string) $data['id'] : null,
            amountMinor: $amountMinor,
            currency: (string) ($data['currency'] ?? 'NGN'),
            rawPayload: $data
        );
    }

    public function verifyWebhookSignature(string $rawPayload, string $signatureHeader): bool
    {
        if (empty($this->secretHash) || empty($signatureHeader)) {
            return false;
        }

        // Flutterwave webhooks send the configured secret hash in the "verif-hash" header
        return hash_equals($this->secretHash, $signatureHeader);
    }

    public function parseWebhookEvent(array $payload): WebhookEventResult
    {
        $event = $payload['event'] ?? $payload['event.type'] ?? 'charge.completed';
        $data = $payload['data'] ?? $payload;

        $status = 'UNKNOWN';
        $flwStatus = strtolower((string) ($data['status'] ?? ''));

        if ($flwStatus === 'successful') {
            $status = 'PAID';
        } elseif ($flwStatus === 'failed') {
            $status = 'FAILED';
        }

        $amountMinor = isset($data['amount']) ? (int) round(((float) $data['amount']) * 100) : 0;

        return new WebhookEventResult(
            eventType: $event,
            reference: $data['tx_ref'] ?? null,
            providerTransactionId: isset($data['id']) ? (string) $data['id'] : null,
            amountMinor: $amountMinor,
            currency: (string) ($data['currency'] ?? 'NGN'),
            status: $status,
            rawPayload: $payload
        );
    }
}
