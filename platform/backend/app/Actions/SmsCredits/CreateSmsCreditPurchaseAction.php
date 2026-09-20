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
        protected PaymentGateway $paymentGateway
    ) {}

    /**
     * Authorizes and initiates an SMS credit purchase for a business.
     */
    public function execute(Business $business, User $user, string $bundleKey, ?string $callbackUrl = null): SmsCreditPurchase
    {
        // 1. Authorize: Only Owner and Manager can buy SMS credits.
        $membership = BusinessMembership::where('business_id', $business->id)
            ->where('user_id', $user->id)
            ->first();

        if (! $membership || ! in_array(strtoupper($membership->role), ['OWNER', 'MANAGER'], true)) {
            throw new AccessDeniedHttpException('Only business owners and managers are authorized to purchase SMS credits.');
        }

        // 2. Resolve server-controlled bundle authority
        $bundleConfig = config("payments.bundles.{$bundleKey}");
        if (! $bundleConfig) {
            throw new UnprocessableEntityHttpException("Invalid credit bundle selected: {$bundleKey}");
        }

        $credits = (int) $bundleConfig['credits'];
        $amountMinor = (int) $bundleConfig['amount_minor'];
        $currency = (string) ($bundleConfig['currency'] ?? config('payments.currency', 'NGN'));

        // 3. Generate unique, random ParkDrop reference (PDR-XXXXXXXX)
        $reference = 'PDR-'.strtoupper(Str::random(8));

        // 4. Default callback URL if not provided by caller (always constrained to configured frontend origin)
        if (! $callbackUrl) {
            $frontendBase = rtrim((string) config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:5173')), '/');
            $callbackUrl = "{$frontendBase}/sms-credits/purchase/return";
        }

        // 5. Create immutable commercial purchase record in PENDING status
        $purchase = SmsCreditPurchase::create([
            'business_id' => $business->id,
            'initiated_by_user_id' => $user->id,
            'bundle_key' => $bundleKey,
            'credits' => $credits,
            'amount_minor' => $amountMinor,
            'currency' => $currency,
            'status' => 'PENDING',
            'reference' => $reference,
            'provider' => $this->paymentGateway->getName(),
        ]);

        // 6. Initialize payment session with provider
        $initResult = $this->paymentGateway->initializePayment(
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
