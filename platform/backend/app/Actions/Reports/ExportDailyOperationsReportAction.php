<?php

namespace App\Actions\Reports;

use App\Models\Business;
use App\Models\PickupPoint;
use App\Models\User;
use App\Policies\ReportPolicy;
use App\Support\BusinessDayBounds;
use Carbon\Carbon;
use DomainException;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ExportDailyOperationsReportAction
{
    public function __construct(
        private ReportPolicy $policy,
        private ListDailyOperationsEventsAction $listEventsAction
    ) {}

    /**
     * Stream a canonical CSV export of daily operations for the selected date and scope.
     * Enforces formula injection defense, PII minimization, UTF-8 BOM, and integer minor-unit decimal conversion.
     *
     * @throws DomainException
     */
    public function execute(
        Business $business,
        User $actor,
        string $localDate,
        ?string $pickupPointScope = null
    ): StreamedResponse {
        if (! $this->policy->export($actor, $business)) {
            throw new DomainException('UNAUTHORIZED');
        }

        // Validate date
        BusinessDayBounds::forDate($localDate);

        $pickupPointName = 'All';
        if ($pickupPointScope && $pickupPointScope !== 'all') {
            $point = PickupPoint::where('business_id', $business->id)
                ->where('id', $pickupPointScope)
                ->first();

            if (! $point) {
                throw new DomainException('PICKUP_POINT_NOT_FOUND');
            }
            $pickupPointName = preg_replace('/[^a-zA-Z0-9_\-]/', '_', $point->name);
        }

        $filename = "parkdrop-daily-operations-{$localDate}";
        if ($pickupPointScope && $pickupPointScope !== 'all') {
            $filename .= "-{$pickupPointName}";
        }
        $filename .= '.csv';

        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        $callback = function () use ($business, $actor, $localDate, $pickupPointScope) {
            $handle = fopen('php://output', 'w');

            // Write UTF-8 BOM for Microsoft Excel / spreadsheet compatibility
            fwrite($handle, "\xEF\xBB\xBF");

            // CSV Column Headers
            fputcsv($handle, [
                'Date',
                'Time (WAT)',
                'Event',
                'Package ID',
                'Customer',
                'Pickup Point',
                'Amount (NGN)',
                'Payment Method',
                'Staff',
                'Details / Reason',
            ]);

            // Fetch all events for the day
            $result = $this->listEventsAction->execute(
                $business,
                $actor,
                $localDate,
                $pickupPointScope,
                10000,
                0
            );

            foreach ($result['events'] as $event) {
                $carbonTime = Carbon::parse($event['event_time'])->setTimezone(BusinessDayBounds::CANONICAL_TIMEZONE);
                $timeStr = $carbonTime->format('H:i:s');
                $dateStr = $carbonTime->format('Y-m-d');

                // Human-readable event label
                $eventLabel = match ($event['type']) {
                    'PACKAGE_RECEIVED' => 'Package received',
                    'PAYMENT_RECORDED' => 'Payment recorded',
                    'PAYMENT_REVERSED' => 'Payment reversed',
                    'PACKAGE_COLLECTED' => 'Package collected',
                    'PACKAGE_RETURNED' => 'Package returned',
                    'PACKAGE_CANCELLED' => 'Package cancelled',
                    default => $event['type'],
                };

                // Exact decimal string conversion for Naira (minor units / 100)
                $amountFormatted = '';
                if ($event['amount_minor'] !== null) {
                    $amountFormatted = number_format($event['amount_minor'] / 100, 2, '.', '');
                }

                $paymentMethod = $event['payment_method'] ? ucfirst(strtolower($event['payment_method'])) : '';

                $row = [
                    self::sanitizeCsvCell($dateStr),
                    self::sanitizeCsvCell($timeStr),
                    self::sanitizeCsvCell($eventLabel),
                    self::sanitizeCsvCell($event['public_package_id'] ?? ''),
                    self::sanitizeCsvCell($event['customer_name'] ?? ''),
                    self::sanitizeCsvCell($event['pickup_point_name'] ?? ''),
                    self::sanitizeCsvCell($amountFormatted),
                    self::sanitizeCsvCell($paymentMethod),
                    self::sanitizeCsvCell($event['actor_name'] ?? 'Staff'),
                    self::sanitizeCsvCell($event['details'] ?? ''),
                ];

                fputcsv($handle, $row);
            }

            fclose($handle);
        };

        return new StreamedResponse($callback, 200, $headers);
    }

    /**
     * Sanitize cell to prevent CSV Formula Injection (DDE attack).
     * If cell begins with =, +, -, @, \t, or \r, prefix with single quote.
     */
    public static function sanitizeCsvCell(?string $value): string
    {
        if ($value === null || $value === '') {
            return '';
        }

        $firstChar = substr($value, 0, 1);
        if (in_array($firstChar, ['=', '+', '-', '@', "\t", "\r"], true)) {
            return "'".$value;
        }

        return $value;
    }
}
