<?php

namespace App\Actions\Reports;

use App\Models\Business;
use App\Models\Package;
use App\Models\PackageLifecycleEvent;
use App\Models\Payment;
use App\Models\PickupPoint;
use App\Models\User;
use App\Policies\ReportPolicy;
use App\Support\BusinessDayBounds;
use DomainException;
use Illuminate\Support\Facades\DB;

class BuildDailyOperationsReportAction
{
    public function __construct(
        private ReportPolicy $policy
    ) {}

    /**
     * Build aggregated daily operational report for a business, date, and optional pickup point scope.
     *
     * @throws DomainException
     */
    public function execute(
        Business $business,
        User $actor,
        string $localDate,
        ?string $pickupPointScope = null // null or 'all' for business-wide, or pickup_point_id (numeric string / integer)
    ): array {
        if (! $this->policy->view($actor, $business)) {
            throw new DomainException('UNAUTHORIZED');
        }

        // Validate and obtain UTC [start, end) day bounds
        $bounds = BusinessDayBounds::forDate($localDate);
        $start = $bounds['start'];
        $end = $bounds['end'];

        $isBusinessWide = empty($pickupPointScope) || $pickupPointScope === 'all';
        $pickupPoint = null;

        if (! $isBusinessWide) {
            $pickupPoint = PickupPoint::where('business_id', $business->id)
                ->where('id', $pickupPointScope)
                ->first();

            if (! $pickupPoint) {
                throw new DomainException('PICKUP_POINT_NOT_FOUND');
            }
        }

        // 1. Package Metrics (Indexed database aggregation)
        // Received: package intake occurred during the day (client_created_at or created_at within bounds)
        $receivedQuery = Package::where('business_id', $business->id)
            ->where(function ($q) use ($start, $end) {
                $q->whereBetween('client_created_at', [$start, $end])
                    ->orWhere(function ($fallback) use ($start, $end) {
                        $fallback->whereNull('client_created_at')
                            ->whereBetween('created_at', [$start, $end]);
                    });
            });

        if ($pickupPoint) {
            $receivedQuery->where('pickup_point_id', $pickupPoint->id);
        }
        $receivedCount = (int) $receivedQuery->count();

        // Collected: Package transitioned to COLLECTED status during this day
        // For packages marked COLLECTED whose client_created_at or updated_at fell on this day
        $collectedQuery = Package::where('business_id', $business->id)
            ->where('status', 'COLLECTED')
            ->whereBetween('updated_at', [$start, $end]);

        if ($pickupPoint) {
            $collectedQuery->where('pickup_point_id', $pickupPoint->id);
        }
        $collectedCount = (int) $collectedQuery->count();

        // Returned: PackageLifecycleEvent of type RETURN within bounds
        $returnedQuery = PackageLifecycleEvent::where('package_lifecycle_events.business_id', $business->id)
            ->where('package_lifecycle_events.type', 'RETURN')
            ->where(function ($q) use ($start, $end) {
                $q->whereBetween('package_lifecycle_events.client_event_at', [$start, $end])
                    ->orWhere(function ($fallback) use ($start, $end) {
                        $fallback->whereNull('package_lifecycle_events.client_event_at')
                            ->whereBetween('package_lifecycle_events.created_at', [$start, $end]);
                    });
            });

        if ($pickupPoint) {
            $returnedQuery->join('packages', 'packages.id', '=', 'package_lifecycle_events.package_id')
                ->where('packages.pickup_point_id', $pickupPoint->id);
        }
        $returnedCount = (int) $returnedQuery->count();

        // Cancelled: PackageLifecycleEvent of type CANCEL within bounds
        $cancelledQuery = PackageLifecycleEvent::where('package_lifecycle_events.business_id', $business->id)
            ->where('package_lifecycle_events.type', 'CANCEL')
            ->where(function ($q) use ($start, $end) {
                $q->whereBetween('package_lifecycle_events.client_event_at', [$start, $end])
                    ->orWhere(function ($fallback) use ($start, $end) {
                        $fallback->whereNull('package_lifecycle_events.client_event_at')
                            ->whereBetween('package_lifecycle_events.created_at', [$start, $end]);
                    });
            });

        if ($pickupPoint) {
            $cancelledQuery->join('packages', 'packages.id', '=', 'package_lifecycle_events.package_id')
                ->where('packages.pickup_point_id', $pickupPoint->id);
        }
        $cancelledCount = (int) $cancelledQuery->count();

        // Waiting Now: Only relevant and provided for Today in business-local time
        $todayLocal = BusinessDayBounds::todayLocal();
        $isToday = ($localDate === $todayLocal);
        $waitingNowCount = null;

        if ($isToday) {
            $waitingNowQuery = Package::where('business_id', $business->id)
                ->where('status', 'WAITING');
            if ($pickupPoint) {
                $waitingNowQuery->where('pickup_point_id', $pickupPoint->id);
            }
            $waitingNowCount = (int) $waitingNowQuery->count();
        }

        // 2. Payment Metrics (Positive payments recorded on this date + Reversals occurring on this date)
        $paymentBaseQuery = Payment::where('payments.business_id', $business->id)
            ->where(function ($q) use ($start, $end) {
                $q->whereBetween('payments.recorded_at', [$start, $end])
                    ->orWhere(function ($fallback) use ($start, $end) {
                        $fallback->whereNull('payments.recorded_at')
                            ->whereBetween('payments.created_at', [$start, $end]);
                    });
            });

        if ($pickupPoint) {
            $paymentBaseQuery->join('packages', 'packages.id', '=', 'payments.package_id')
                ->where('packages.pickup_point_id', $pickupPoint->id);
        }

        // Positive recorded payments (positive amounts)
        $positivePaymentsQuery = (clone $paymentBaseQuery)->where('payments.amount_minor', '>', 0);
        $recordedPaymentCount = (int) $positivePaymentsQuery->count();
        $recordedPaymentMinor = (int) $positivePaymentsQuery->sum('payments.amount_minor');

        // Breakdown by method for positive recorded payments
        $methodBreakdownRaw = (clone $positivePaymentsQuery)
            ->select('payments.method', DB::raw('SUM(payments.amount_minor) as total_minor'))
            ->groupBy('payments.method')
            ->pluck('total_minor', 'payments.method');

        $byMethod = [
            'cash_minor' => (int) ($methodBreakdownRaw['CASH'] ?? 0),
            'transfer_minor' => (int) ($methodBreakdownRaw['TRANSFER'] ?? 0),
            'pos_minor' => (int) ($methodBreakdownRaw['POS'] ?? 0),
            'other_minor' => (int) ($methodBreakdownRaw['OTHER'] ?? 0),
        ];

        // Reversal payments (negative amounts or status REVERSED reversing a payment)
        $reversalQuery = (clone $paymentBaseQuery)
            ->where(function ($q) {
                $q->where('payments.amount_minor', '<', 0)
                    ->orWhereNotNull('payments.reverses_payment_id');
            });

        $reversedCount = (int) $reversalQuery->count();
        $reversedMinorRaw = (int) $reversalQuery->sum(DB::raw('ABS(payments.amount_minor)'));

        $netPaymentMinor = $recordedPaymentMinor - $reversedMinorRaw;

        return [
            'date' => $localDate,
            'timezone' => BusinessDayBounds::CANONICAL_TIMEZONE,
            'scope' => [
                'type' => $isBusinessWide ? 'all' : 'pickup_point',
                'pickup_point_id' => $pickupPoint?->id,
                'pickup_point_name' => $pickupPoint?->name,
            ],
            'packages' => [
                'received_count' => $receivedCount,
                'collected_count' => $collectedCount,
                'returned_count' => $returnedCount,
                'cancelled_count' => $cancelledCount,
                'waiting_now_count' => $waitingNowCount,
            ],
            'payments' => [
                'recorded_count' => $recordedPaymentCount,
                'recorded_minor' => $recordedPaymentMinor,
                'reversed_count' => $reversedCount,
                'reversed_minor' => $reversedMinorRaw,
                'net_minor' => $netPaymentMinor,
                'by_method' => $byMethod,
            ],
            'generated_at' => now()->toIso8601String(),
        ];
    }
}
