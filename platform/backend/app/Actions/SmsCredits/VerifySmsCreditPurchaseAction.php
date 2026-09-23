<?php

namespace App\Actions\SmsCredits;

use App\Contracts\Payments\PaymentGateway;
use App\Models\Business;
use App\Models\BusinessMembership;
use App\Models\SmsCreditPurchase;
use App\Models\User;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

class VerifySmsCreditPurchaseAction
{
    public function __construct(
        protected PaymentGateway $paymentGateway,
        protected CreditSmsWalletForPurchaseAction $creditAction
    ) {}

    /**
     * Queries payment provider and authoritatively verifies purchase status.
     * Enforces tenant boundary and updates purchase & wallet state atomically.
     */
    public function execute(SmsCreditPurchase $purchase, Business $business, User $user): SmsCreditPurchase
    {
        // 1. Cross-tenant check: Purchase must belong to the active business
        if ($purchase->business_id !== $business->id) {
            throw new AccessDeniedHttpException('Purchase does not belong to the active business.');
        }

        // 2. Authorization check: User must be an authorized business member
        $membership = BusinessMembership::where('business_id', $business->id)
            ->where('user_id', $user->id)
            ->first();

        if (! $membership || ! in_array(strtoupper($membership->role), ['OWNER', 'MANAGER'], true)) {
            throw new AccessDeniedHttpException('Only business owners and managers can verify purchases.');
        }

        // 3. Short-circuit if already verified as PAID
        if ($purchase->status === 'PAID') {
            return $purchase;
        }

        // 4. Query provider authoritatively
        $result = $this->paymentGateway->verifyPayment($purchase->reference);

        if ($result->isPaid()) {
            return $this->creditAction->execute(
                purchase: $purchase,
                verifiedAmountMinor: $result->amountMinor,
                verifiedCurrency: $result->currency,
                providerTransactionId: $result->providerTransactionId,
                providerMetadata: $result->rawPayload
            );
        }

        if ($result->isFailed()) {
            $purchase->update([
                'status' => 'FAILED',
                'failed_at' => now(),
            ]);
        }

        return $purchase->fresh();
    }
}
