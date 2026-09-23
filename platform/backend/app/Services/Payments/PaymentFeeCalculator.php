<?php

namespace App\Services\Payments;

/**
 * Grosses up a purchase's charge so that after the payment provider's own
 * transaction fee is deducted, ParkDrop still nets exactly what it intended
 * to charge (credits × the flat per-credit price). SMS credits currently
 * carry no margin, so absorbing the provider's fee ourselves would mean
 * losing money on every sale — the customer's card is charged the fee on
 * top instead, same as most Nigerian merchants do by default.
 *
 * Rates are Paystack's and Flutterwave's own published Nigeria pricing as
 * of Sept 2026 (paystack.com/pricing, flutterwave.com/ng/pricing) for local
 * transactions. Neither page states whether the quoted rate already
 * includes VAT-on-fee or not — this uses the headline rate as-is, matching
 * each provider's own fee calculator tool. If actual settlement reports
 * ever show a different real deduction, adjust FEE_RATE/FEE_FIXED_MINOR
 * here rather than anywhere else — this file is the single place amount is
 * computed.
 */
class PaymentFeeCalculator
{
    private const PAYSTACK_RATE = 0.015;

    private const PAYSTACK_FIXED_MINOR = 10000; // ₦100

    private const PAYSTACK_FIXED_WAIVER_THRESHOLD_MINOR = 250000; // ₦2,500

    private const PAYSTACK_FEE_CAP_MINOR = 200000; // ₦2,000

    private const FLUTTERWAVE_RATE = 0.02; // 1.4% transaction fee + 0.6% platform fee

    /**
     * How much to actually charge the customer so that, after the
     * provider's fee is deducted, ParkDrop receives exactly $netMinor.
     */
    public function grossUpForNetAmount(int $netMinor, string $provider): int
    {
        return match ($provider) {
            'paystack' => $this->paystackGrossUp($netMinor),
            'flutterwave' => (int) ceil($netMinor / (1 - self::FLUTTERWAVE_RATE)),
            default => $netMinor,
        };
    }

    private function paystackGrossUp(int $netMinor): int
    {
        // Try assuming the gross stays under the waiver threshold (no fixed
        // fee). If that guess is self-consistent (the resulting gross really
        // is under the threshold), it's correct.
        $grossWithoutFixed = (int) ceil($netMinor / (1 - self::PAYSTACK_RATE));
        if ($grossWithoutFixed < self::PAYSTACK_FIXED_WAIVER_THRESHOLD_MINOR) {
            return $grossWithoutFixed;
        }

        // Otherwise the ₦100 fixed fee applies.
        $grossWithFixed = (int) ceil(($netMinor + self::PAYSTACK_FIXED_MINOR) / (1 - self::PAYSTACK_RATE));
        $impliedFee = $grossWithFixed - $netMinor;

        if ($impliedFee > self::PAYSTACK_FEE_CAP_MINOR) {
            // Fee is capped at a flat amount, so grossing up is just addition.
            return $netMinor + self::PAYSTACK_FEE_CAP_MINOR;
        }

        return $grossWithFixed;
    }
}
