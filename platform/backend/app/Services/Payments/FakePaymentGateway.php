<?php

namespace App\Services\Payments;

use App\Contracts\Payments\PaymentGateway;
use App\Contracts\Payments\PaymentInitializationResult;
use App\Contracts\Payments\PaymentVerificationResult;
use App\Contracts\Payments\WebhookEventResult;
use App\Models\SmsCreditPurchase;

class FakePaymentGateway implements PaymentGateway
{
    protected string $verificationStatus = 'PAID';

    protected ?int $simulatedAmount = null;

    protected ?string $simulatedCurrency = null;

    protected ?string $simulatedTxId = null;

    protected bool $shouldThrowNetworkError = false;

    public function getName(): string
    {
        return 'fake';
    }

    public function initializePayment(SmsCreditPurchase $purchase, string $callbackUrl, string $payerEmail): PaymentInitializationResult
    {
        if ($this->shouldThrowNetworkError) {
            throw new \RuntimeException('Simulated payment gateway initialization error');
        }

        $providerRef = 'FAKE-PRV-'.$purchase->reference;
        $checkoutUrl = 'https://fake-checkout.parkdrop.test/pay/'.$purchase->reference;

        return new PaymentInitializationResult(
            checkoutUrl: $checkoutUrl,
            providerReference: $providerRef,
            rawMetadata: [
                'simulated' => true,
                'email' => $payerEmail,
            ]
        );
    }

    public function verifyPayment(string $reference): PaymentVerificationResult
    {
        if ($this->shouldThrowNetworkError) {
            throw new \RuntimeException('Simulated payment gateway network error during verification');
        }

        $amount = $this->simulatedAmount ?? 150000;
        $currency = $this->simulatedCurrency ?? 'NGN';
        $txId = $this->simulatedTxId ?? ('TX-'.$reference);

        return new PaymentVerificationResult(
            status: $this->verificationStatus,
            reference: $reference,
            providerTransactionId: $txId,
            amountMinor: $amount,
            currency: $currency,
            rawPayload: ['simulated' => true]
        );
    }

    public function verifyWebhookSignature(string $rawPayload, string $signatureHeader): bool
    {
        return $signatureHeader === 'valid_fake_signature';
    }

    public function parseWebhookEvent(array $payload): WebhookEventResult
    {
        $event = $payload['event'] ?? 'charge.success';
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

    // Test simulation helpers
    public function simulateStatus(string $status): self
    {
        $this->verificationStatus = $status;

        return $this;
    }

    public function simulateAmount(int $amountMinor): self
    {
        $this->simulatedAmount = $amountMinor;

        return $this;
    }

    public function simulateCurrency(string $currency): self
    {
        $this->simulatedCurrency = $currency;

        return $this;
    }

    public function simulateTxId(string $txId): self
    {
        $this->simulatedTxId = $txId;

        return $this;
    }

    public function simulateNetworkError(bool $shouldThrow = true): self
    {
        $this->shouldThrowNetworkError = $shouldThrow;

        return $this;
    }
}
