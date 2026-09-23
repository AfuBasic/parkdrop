<?php

namespace Tests\Unit;

use App\Services\Payments\PaymentFeeCalculator;
use PHPUnit\Framework\TestCase;

class PaymentFeeCalculatorTest extends TestCase
{
    private PaymentFeeCalculator $calculator;

    protected function setUp(): void
    {
        parent::setUp();
        $this->calculator = new PaymentFeeCalculator;
    }

    /**
     * The whole point: however much the provider's fee turns out to be,
     * ParkDrop must never net less than it intended — a zero-margin sale
     * can't be allowed to lose money to a processing fee.
     */
    private function assertNeverNetsLessThanIntended(int $netMinor, string $provider, float $rate, int $fixedMinor = 0): void
    {
        $gross = $this->calculator->grossUpForNetAmount($netMinor, $provider);
        $actualFee = (int) round($gross * $rate) + $fixedMinor;
        $actualNet = $gross - $actualFee;

        $this->assertGreaterThanOrEqual($netMinor, $actualNet);
    }

    public function test_flutterwave_grosses_up_by_the_flat_two_percent(): void
    {
        // 50 credits at ₦7 = ₦350 = 35000 kobo net.
        $gross = $this->calculator->grossUpForNetAmount(35000, 'flutterwave');

        $this->assertNeverNetsLessThanIntended(35000, 'flutterwave', 0.02);
        // Sanity: gross should be roughly net / 0.98, not wildly off.
        $this->assertEqualsWithDelta(35714, $gross, 5);
    }

    public function test_paystack_below_the_waiver_threshold_has_no_fixed_fee(): void
    {
        // 50 credits at ₦7 = ₦350 net — gross stays well under ₦2,500, so
        // the ₦100 fixed fee should not apply, only the 1.5%.
        $gross = $this->calculator->grossUpForNetAmount(35000, 'paystack');

        $this->assertLessThan(250000, $gross);
        $this->assertNeverNetsLessThanIntended(35000, 'paystack', 0.015);
    }

    public function test_paystack_above_the_waiver_threshold_adds_the_fixed_fee(): void
    {
        // 5000 credits at ₦7 = ₦35,000 net — comfortably above ₦2,500, so
        // the ₦100 fixed fee applies on top of the 1.5%.
        $netMinor = 5000 * 700;
        $gross = $this->calculator->grossUpForNetAmount($netMinor, 'paystack');

        $this->assertGreaterThanOrEqual(250000, $gross);
        $this->assertNeverNetsLessThanIntended($netMinor, 'paystack', 0.015, 10000);
    }

    public function test_paystack_fee_is_capped_at_two_thousand_naira(): void
    {
        // A large enough net that 1.5% + ₦100 would exceed the ₦2,000 cap.
        $netMinor = 50_000_000; // ₦500,000
        $gross = $this->calculator->grossUpForNetAmount($netMinor, 'paystack');
        $impliedFee = $gross - $netMinor;

        $this->assertSame(200000, $impliedFee);
        $this->assertGreaterThanOrEqual($netMinor, $gross - 200000);
    }

    public function test_unknown_provider_charges_the_net_amount_with_no_fee(): void
    {
        // The 'fake' provider used in local dev/tests — no real fee to gross up for.
        $this->assertSame(35000, $this->calculator->grossUpForNetAmount(35000, 'fake'));
    }
}
