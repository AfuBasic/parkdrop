<?php

namespace App\Http\Controllers\Api\V1\SmsCredits;

use App\Actions\SmsCredits\CreateSmsCreditPurchaseAction;
use App\Actions\SmsCredits\VerifySmsCreditPurchaseAction;
use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\SmsCreditPurchase;
use App\Models\SmsWallet;
use App\Services\Payments\PaymentFeeCalculator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SmsCreditPurchaseController extends Controller
{
    /**
     * The server-controlled flat price per credit and the allowed quantity
     * range — everything the frontend needs to build a quantity ↔ amount
     * input, without ever being trusted to send a price itself.
     */
    public function pricing(): JsonResponse
    {
        return response()->json([
            'price_per_credit_minor' => (int) config('payments.price_per_credit_minor', 700),
            'currency' => config('payments.currency', 'NGN'),
            'min_credits' => (int) config('payments.min_credits_per_purchase', 50),
            'max_credits' => (int) config('payments.max_credits_per_purchase', 5000),
        ]);
    }

    /**
     * What a purchase of this many credits will actually cost on checkout,
     * including the payment provider's own transaction fee — computed with
     * the exact same PaymentFeeCalculator that store() uses, so the total
     * shown here is never a guess the real charge could later disagree with.
     */
    public function preview(Request $request, PaymentFeeCalculator $feeCalculator): JsonResponse
    {
        $request->validate([
            'credits' => 'required|integer|min:1',
            'provider' => 'required|string|in:paystack,fake',
        ]);

        $credits = (int) $request->input('credits');
        $pricePerCreditMinor = (int) config('payments.price_per_credit_minor', 700);
        $netAmountMinor = $credits * $pricePerCreditMinor;
        $amountMinor = $feeCalculator->grossUpForNetAmount($netAmountMinor, (string) $request->input('provider'));

        return response()->json([
            'credits' => $credits,
            'net_amount_minor' => $netAmountMinor,
            'fee_minor' => $amountMinor - $netAmountMinor,
            'amount_minor' => $amountMinor,
            'currency' => config('payments.currency', 'NGN'),
        ]);
    }

    /**
     * Create and initialize a new SMS credit purchase.
     */
    public function store(Request $request, CreateSmsCreditPurchaseAction $createAction): JsonResponse
    {
        $request->validate([
            'credits' => 'required|integer|min:1',
            'callback_url' => 'nullable|url',
            'provider' => 'nullable|string|in:paystack,fake',
        ]);

        $user = $request->user();
        $businessId = $request->header('X-Business-Id') ?? $user->current_business_id ?? $user->businessMemberships()->first()?->business_id;

        if (! $businessId) {
            return response()->json(['message' => 'No active business context found.'], 400);
        }

        $business = Business::findOrFail($businessId);

        $purchase = $createAction->execute(
            business: $business,
            user: $user,
            credits: (int) $request->input('credits'),
            callbackUrl: $request->input('callback_url'),
            providerName: $request->input('provider')
        );

        return response()->json([
            'purchase' => [
                'id' => $purchase->id,
                'bundle_key' => $purchase->bundle_key,
                'credits' => $purchase->credits,
                'amount_minor' => $purchase->amount_minor,
                'fee_minor' => $purchase->fee_minor,
                'currency' => $purchase->currency,
                'status' => $purchase->status,
                'reference' => $purchase->reference,
                'checkout_url' => $purchase->checkout_url,
                'created_at' => $purchase->created_at->toISOString(),
            ],
        ], 201);
    }

    /**
     * Show safe details and status of a purchase.
     */
    public function show(Request $request, SmsCreditPurchase $purchase): JsonResponse
    {
        $user = $request->user();
        $businessId = $request->header('X-Business-Id') ?? $user->current_business_id ?? $user->businessMemberships()->first()?->business_id;

        if ($purchase->business_id !== (int) $businessId) {
            return response()->json(['message' => 'Unauthorized access to purchase.'], 403);
        }

        $wallet = SmsWallet::where('business_id', $purchase->business_id)->first();

        return response()->json([
            'purchase' => [
                'id' => $purchase->id,
                'bundle_key' => $purchase->bundle_key,
                'credits' => $purchase->credits,
                'amount_minor' => $purchase->amount_minor,
                'fee_minor' => $purchase->fee_minor,
                'currency' => $purchase->currency,
                'status' => $purchase->status,
                'reference' => $purchase->reference,
                'paid_at' => $purchase->paid_at?->toISOString(),
                'failed_at' => $purchase->failed_at?->toISOString(),
                'created_at' => $purchase->created_at->toISOString(),
            ],
            'wallet_balance' => $wallet?->balance ?? 0,
        ]);
    }

    /**
     * Trigger authoritative server-side verification of a purchase.
     */
    public function verify(Request $request, SmsCreditPurchase $purchase, VerifySmsCreditPurchaseAction $verifyAction): JsonResponse
    {
        $user = $request->user();
        $businessId = $request->header('X-Business-Id') ?? $user->current_business_id ?? $user->businessMemberships()->first()?->business_id;

        if (! $businessId) {
            return response()->json(['message' => 'No active business context found.'], 400);
        }

        $business = Business::findOrFail($businessId);

        $verifiedPurchase = $verifyAction->execute(
            purchase: $purchase,
            business: $business,
            user: $user
        );

        $wallet = SmsWallet::where('business_id', $business->id)->first();

        return response()->json([
            'purchase' => [
                'id' => $verifiedPurchase->id,
                'status' => $verifiedPurchase->status,
                'credits' => $verifiedPurchase->credits,
                'amount_minor' => $verifiedPurchase->amount_minor,
                'fee_minor' => $verifiedPurchase->fee_minor,
                'currency' => $verifiedPurchase->currency,
                'reference' => $verifiedPurchase->reference,
                'paid_at' => $verifiedPurchase->paid_at?->toISOString(),
                'failed_at' => $verifiedPurchase->failed_at?->toISOString(),
            ],
            'wallet_balance' => $wallet?->balance ?? 0,
        ]);
    }
}
