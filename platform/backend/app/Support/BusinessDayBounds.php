<?php

namespace App\Support;

use Carbon\Carbon;
use Carbon\CarbonImmutable;
use InvalidArgumentException;

class BusinessDayBounds
{
    /**
     * ParkDrop canonical business operational timezone (West Africa Time, UTC+1).
     */
    public const CANONICAL_TIMEZONE = 'Africa/Lagos';

    /**
     * Compute UTC [start, end) bounds for a given business-local date string (YYYY-MM-DD).
     *
     * @return array{start: CarbonImmutable, end: CarbonImmutable, localDate: string, timezone: string}
     *
     * @throws InvalidArgumentException
     */
    public static function forDate(
        string $dateString,
        string $timezone = self::CANONICAL_TIMEZONE
    ): array {
        if (! preg_match('/^\d{4}-\d{2}-\d{2}$/', $dateString)) {
            throw new InvalidArgumentException('INVALID_DATE_FORMAT');
        }

        try {
            $localStart = CarbonImmutable::createFromFormat('Y-m-d H:i:s', "{$dateString} 00:00:00", $timezone);
        } catch (\Throwable) {
            throw new InvalidArgumentException('INVALID_CALENDAR_DATE');
        }

        if (! $localStart) {
            throw new InvalidArgumentException('INVALID_CALENDAR_DATE');
        }

        $nowLocal = Carbon::now($timezone);
        $todayLocal = $nowLocal->format('Y-m-d');

        // Future dates are disallowed
        if ($dateString > $todayLocal) {
            throw new InvalidArgumentException('FUTURE_DATE_NOT_ALLOWED');
        }

        $localEnd = $localStart->addDay();

        return [
            'start' => $localStart->utc(),
            'end' => $localEnd->utc(),
            'localDate' => $dateString,
            'timezone' => $timezone,
        ];
    }

    /**
     * Get today's local date string (YYYY-MM-DD) in the canonical timezone.
     */
    public static function todayLocal(string $timezone = self::CANONICAL_TIMEZONE): string
    {
        return Carbon::now($timezone)->format('Y-m-d');
    }
}
