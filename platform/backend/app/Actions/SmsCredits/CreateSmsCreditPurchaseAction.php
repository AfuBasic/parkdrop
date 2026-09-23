<?php

namespace App\Actions\SmsCredits;

use App\Contracts\Payments\PaymentGateway;
use App\Models\Business;
use App\Models\BusinessMembership;
use App\Models\SmsCreditPurchase;
use App\Models\User;
use Illuminate\Support\Str;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;

class CreateSmsCreditPurchaseAction
{
    public function __construct(
        protected PaymentGateway $paymentGateway,
        protected \App\Services\Payments\PaymentFeeCalculator $feeCalculator
    ) {}

    /**
     * Authorizes and initiates an SMS credit purchase for a business.
     */
    public function execute(Business $business, User $user, int $credits, ?string $callbackUrl = null, ?string $providerName = null): SmsCreditPurchase
    {
        // 1. Authorize: Only Owner and Manager can buy SMS credits.
        $membership = BusinessMembership::where('business_id', $business->id)
            ->where('user_id', $user->id)
            ->first();

        if (! $membership || ! in_array(strtoupper($membership->role), ['OWNER', 'MANAGER'], true)) {
            throw new AccessDeniedHttpException('Only business owners and managers are authorized to purchase SMS credits.');
        }

        // 2. Validate the requested quantity and price it authoritatively —
        // the server always computes amount_minor itself, from its own
        // per-credit price, never from anything the client sends.
        $minCredits = (int) config('payments.min_credits_per_purchase', 50);
        $maxCredits = (int) config('payments.max_credits_per_purchase', 5000);

        if ($credits < $minCredits || $credits > $maxCredits) {
            throw new UnprocessableEntityHttpException(
                "Credits must be between {$minCredits} and {$maxCredits}."
            );
        }

        $pricePerCreditMinor = (int) config('payments.price_per_credit_minor', 700);
        $netAmountMinor = $credits * $pricePerCreditMinor;
        $currency = (string) config('payments.currency', 'NGN');

        // 3. Generate unique, random ParkDrop reference (PDR-XXXXXXXX)
        $reference = 'PDR-'.strtoupper(Str::random(8));

        // 4. Default callback URL if not provided by caller (always constrained to configured frontend origin)
        if (! $callbackUrl) {
            $frontendBase = rtrim((string) config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:5174')), '/');
            $callbackUrl = "{$frontendBase}/sms-credits/purchase/return";
        }

        // Resolve gateway based on requested provider or default
        $gateway = match ($providerName) {
            'paystack' => app(\App\Services\Payments\PaystackPaymentGateway::class),
            'flutterwave' => app(\App\Services\Payments\FlutterwavePaymentGateway::class),
            'fake' => app(\App\Services\Payments\FakePaymentGateway::class),
            default => $this->paymentGateway,
        };

        // Credits carry no margin, so the customer's card is charged the
        // provider's own transaction fee on top of the credit cost — the
        // business always nets exactly $netAmountMinor either way, rather
        // than losing the fee out of a zero-margin sale.
        $amountMinor = $this->feeCalculator->grossUpForNetAmount($netAmountMinor, $gateway->getName());
        $feeMinor = $amountMinor - $netAmountMinor;

        // 5. Create immutable commercial purchase record in PENDING status
        $purchase = SmsCreditPurchase::create([
            'business_id' => $business->id,
            'initiated_by_user_id' => $user->id,
            // No fixed bundles anymore — this column just keeps a readable
            // label for the provider metadata and admin/audit views.
            'bundle_key' => "custom_{$credits}",
            'credits' => $credits,
            'amount_minor' => $amountMinor,
            'fee_minor' => $feeMinor,
            'currency' => $currency,
            'status' => 'PENDING',
            'reference' => $reference,
            'provider' => $gateway->getName(),
        ]);

        // 6. Initialize payment session with provider
        $initResult = $gateway->initializePayment(
            purchase: $purchase,
            callbackUrl: $callbackUrl,
            payerEmail: $user->email ?? 'billing@parkdrop.com.ng'
        );

        $purchase->update([
            'provider_reference' => $initResult->providerReference,
            'checkout_url' => $initResult->checkoutUrl,
        ]);

        return $purchase->fresh();
    }
}
