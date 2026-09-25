<?php

use App\Services\Demurrage\DemurrageCalculator;
use Carbon\Carbon;
use Tests\TestCase;

class DemurrageCalculatorTest extends TestCase
{
    private Carbon $frozenNow;

    protected function setUp(): void
    {
        parent::setUp();
        // Day 0: 1pm drop-off, Sep 20 2026
        $this->frozenNow = Carbon::create(2026, 9, 20, 13, 0, 0);
    }

    // --- extraStorageDays ---

    public function test_counts_same_day_as_zero_extra_days(): void
    {
        $pkg = $this->makePackage('2026-09-20T13:00:00.000Z');
        $now = Carbon::create(2026, 9, 20, 15, 0, 0);

        expect(DemurrageCalculator::extraStorageDays($pkg['created'], null, $now))
            ->toBe(0);
    }

    public function test_counts_next_day_collection_as_zero_extra_days(): void
    {
        // Dropped Sep 20 1pm, collected Sep 21 2pm: one night passed, still day 1
        $pkg = $this->makePackage('2026-09-20T13:00:00.000Z');
        $now = Carbon::create(2026, 9, 21, 14, 0, 0);

        expect(DemurrageCalculator::extraStorageDays($pkg['created'], null, $now))
            ->toBe(0);
    }

    public function test_counts_two_day_wait_as_one_extra_day_even_under_48_hours(): void
    {
        // Dropped Sep 20 1pm, collected Sep 22 8am: ~43 actual hours but two calendar days
        $pkg = $this->makePackage('2026-09-20T13:00:00.000Z');
        $now = Carbon::create(2026, 9, 22, 8, 0, 0);

        expect(DemurrageCalculator::extraStorageDays($pkg['created'], null, $now))
            ->toBe(1);
    }

    public function test_freezes_accrual_at_collection_moment(): void
    {
        $pkg = $this->makePackage('2026-09-20T13:00:00.000Z');
        // Collected Sep 21 — 0 extra days
        $collectedAt = '2026-09-21T14:00:00.000Z';

        // "Now" is a full week later — must not grow
        $now = Carbon::create(2026, 9, 28, 9, 0, 0);

        expect(DemurrageCalculator::extraStorageDays($pkg['created'], $collectedAt, $now))
            ->toBe(0);
    }

    public function test_freezes_accrual_at_return_time(): void
    {
        $pkg = $this->makePackage('2026-09-20T13:00:00.000Z');
        // Returned Sep 23 8am — 3 calendar days = 2 extra nights
        $returnedAt = '2026-09-23T08:00:00.000Z';
        $now = Carbon::create(2026, 9, 30, 9, 0, 0);

        expect(DemurrageCalculator::extraStorageDays($pkg['created'], $returnedAt, $now))
            ->toBe(2);
    }

    public function test_never_goes_negative(): void
    {
        // Created in the future relative to "now"
        $pkg = $this->makePackage('2026-12-01T13:00:00.000Z');
        $now = Carbon::create(2026, 9, 20, 13, 0, 0);

        expect(DemurrageCalculator::extraStorageDays($pkg['created'], null, $now))
            ->toBe(0);
    }

    // --- accruedAmountDueMinor ---

    public function test_accrued_amount_matches_frontend_for_same_day(): void
    {
        $pkg = $this->makePackage('2026-09-20T13:00:00.000Z');
        $now = Carbon::create(2026, 9, 20, 15, 0, 0);
        // Base ₦1,000 (100,000 minor), no extra days
        expect(DemurrageCalculator::accruedAmountDueMinor(
            100_000, 50_000, $pkg['created'], null, $now
        ))->toBe(100_000);
    }

    public function test_accrued_amount_includes_one_extra_day(): void
    {
        $pkg = $this->makePackage('2026-09-20T13:00:00.000Z');
        $now = Carbon::create(2026, 9, 22, 8, 0, 0);
        // Base ₦1,000 + 1 × ₦500 = ₦1,500 (150,000 minor)
        expect(DemurrageCalculator::accruedAmountDueMinor(
            100_000, 50_000, $pkg['created'], null, $now
        ))->toBe(150_000);
    }

    public function test_accrued_amount_never_negative_with_bad_inputs(): void
    {
        $pkg = $this->makePackage('2026-09-20T13:00:00.000Z');
        $now = Carbon::create(2026, 9, 25, 9, 0, 0);

        expect(DemurrageCalculator::accruedAmountDueMinor(
            -5, -100, $pkg['created'], null, $now
        ))->toBe(0);
    }

    public function test_default_fee_matches_backend_column_default(): void
    {
        // Default is ₦500/day = 50,000 minor
        $pkg = $this->makePackage('2026-09-20T13:00:00.000Z');
        $now = Carbon::create(2026, 9, 23, 8, 0, 0);
        // 2 extra days × 50,000 = 100,000 + base 100,000 = 200,000
        expect(DemurrageCalculator::accruedAmountDueMinor(
            100_000, 50_000, $pkg['created'], null, $now
        ))->toBe(200_000);
    }

    public function test_frozen_at_terminal_uses_terminal_timestamp_not_live_clock(): void
    {
        $pkg = $this->makePackage('2026-09-20T13:00:00.000Z');
        $terminalAt = '2026-09-21T14:00:00.000Z'; // collected day 1 — 0 extra days
        $now = Carbon::create(2026, 10, 1, 0, 0, 0); // 10 days later

        expect(DemurrageCalculator::accruedAmountDueMinor(
            100_000, 50_000, $pkg['created'], $terminalAt, $now
        ))->toBe(100_000); // still just the base
    }

    // --- Helpers ---

    private function makePackage(string $createdAt): array
    {
        return ['created' => $createdAt];
    }
}
