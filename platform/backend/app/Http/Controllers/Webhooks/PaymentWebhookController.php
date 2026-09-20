<?php

namespace App\Http\Controllers\Webhooks;

use App\Actions\SmsCredits\CreditSmsWalletForPurchaseAction;
use App\Contracts\Payments\PaymentGateway;
use App\Http\Controllers\Controller;
use App\Models\SmsCreditPurchase;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PaymentWebhookController extends Controller
{
    /**
     * Handle incoming payment webhooks from configured payment provider.
     */
    public function handle(
        Request $request,
        string $provider,
        PaymentGateway $paymentGateway,
        CreditSmsWalletForPurchaseAction $creditAction
    ): JsonResponse {
        $rawPayload = $request->getContent();
        $signatureHeader = (string) (
            $request->header('x-paystack-signature') ??
            $request->header('X-Paystack-Signature') ??
            $request->header('x-webhook-signature') ??
            ''
        );

        // 1. Verify cryptographic signature
        if (! $paymentGateway->verifyWebhookSignature($rawPayload, $signatureHeader)) {
            Log::warning('Payment webhook signature verification failed', [
                'provider' => $provider,
                'ip' => $request->ip(),
            ]);

            return response()->json(['message' => 'Invalid webhook signature.'], 400);
        }

        $payload = $request->all();
        $eventResult = $paymentGateway->parseWebhookEvent($payload);

        // 2. Process paid events
        if ($eventResult->isPaid() && $eventResult->reference) {
            $purchase = SmsCreditPurchase::where('reference', $eventResult->reference)->first();

            if (! $purchase) {
                Log::warning('Payment webhook received for unknown purchase reference', [
                    'reference' => $eventResult->reference,
                    'provider' => $provider,
                ]);

                // Return 200 so the provider does not spam retry unknown references
                return response()->json(['message' => 'Reference not found.'], 200);
            }

            // 3. Atomically credit wallet via canonical crediting action
            try {
                $creditAction->execute(
                    purchase: $purchase,
                    verifiedAmountMinor: $eventResult->amountMinor,
                    verifiedCurrency: $eventResult->currency,
                    providerTransactionId: $eventResult->providerTransactionId,
                    providerMetadata: $eventResult->rawPayload
                );
            } catch (\Throwable $e) {
                Log::error('Error processing payment webhook crediting', [
                    'purchase_id' => $purchase->id,
                    'error' => $e->getMessage(),
                ]);

                // Return 200 if it was already processed or mismatch handled
                return response()->json(['message' => 'Processed with notice', 'error' => $e->getMessage()], 200);
            }
        }

        return response()->json(['message' => 'Webhook received and processed.'], 200);
    }
}
