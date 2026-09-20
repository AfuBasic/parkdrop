<?php

namespace App\Contracts\Payments;

use App\Models\SmsCreditPurchase;

interface PaymentGateway
{
    /**
     * The name/identifier of this payment gateway provider.
     */
    public function getName(): string;

    /**
     * Initializes payment with the gateway and returns safe checkout URL / provider reference.
     */
    public function initializePayment(SmsCreditPurchase $purchase, string $callbackUrl, string $payerEmail): PaymentInitializationResult;

    /**
     * Queries provider to authoritatively verify payment status.
     */
    public function verifyPayment(string $reference): PaymentVerificationResult;

    /**
     * Validates cryptographic webhook signature.
     */
    public function verifyWebhookSignature(string $rawPayload, string $signatureHeader): bool;

    /**
     * Parses raw webhook event into structured verification data.
     */
    public function parseWebhookEvent(array $payload): WebhookEventResult;
}
