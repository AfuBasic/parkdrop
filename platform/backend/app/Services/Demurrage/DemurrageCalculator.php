<?php

namespace App\Services\Demurrage;

use Carbon\Carbon;

/**
 * Mirrors the frontend's storage-fee.ts logic on the server so the backend
 * can enforce the same accrual rules the attendant already sees on screen.
 *
 * Day counting uses whole calendar days — not rolling 24-hour blocks —
 * matching the frontend's daysWaiting() implementation.
 */
class DemurrageCalculator
{
    /**
     * How many full calendar days have passed between the package arriving
     * and the terminal event (or now, if it is still WAITING).
     *
     * The first calendar day is free: a package dropped at 1pm and collected
     * at 2pm the next day has sat through one night, so extra days = 0.
     * A package dropped Monday and collected Wednesday morning has sat
     * through two nights, so extra days = 1.
     */
    public static function extraStorageDays(
        string $clientCreatedAt,
        ?string $terminalAt,
        Carbon $now
    ): int {
        $created = Carbon::parse($clientCreatedAt);
        $end = $terminalAt ? Carbon::parse($terminalAt) : $now;

        // Start-of-day boundaries for both timestamps
        $createdDayStart = $created->startOfDay()->timestamp;
        $endDayStart = $end->startOfDay()->timestamp;

        // Whole calendar days elapsed
        $daysElapsed = (int) floor(($endDayStart - $createdDayStart) / 86_400);

        // First day is free
        return max(0, $daysElapsed - 1);
    }

    /**
     * Total amount due including accrued storage fees, in kobo.
     *
     * baseAmountMinor: the original amount the customer owes for the package itself
     * dailyFeeMinor: the business's daily storage fee rate (from daily_storage_fee_minor)
     * clientCreatedAt: when the package was logged (ISO string)
     * terminalAt: when the package left WAITING, or null if still waiting
     * now: the reference time for live accrual (ignored when terminalAt is set)
     */
    public static function accruedAmountDueMinor(
        int $baseAmountMinor,
        int $dailyFeeMinor,
        string $clientCreatedAt,
        ?string $terminalAt,
        Carbon $now
    ): int {
        $base = max(0, (int) $baseAmountMinor);
        $rate = max(0, (int) $dailyFeeMinor);
        $extraDays = self::extraStorageDays($clientCreatedAt, $terminalAt, $now);

        return $base + $extraDays * $rate;
    }
}
