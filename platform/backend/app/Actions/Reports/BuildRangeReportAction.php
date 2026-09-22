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
use Carbon\Carbon;
use Carbon\CarbonImmutable;

class BuildRangeReportAction
{
    public function __construct(
        private ReportPolicy $policy
    ) {}

    /**
     * Build aggregated range report for a business, preset, and optional pickup point scope.
     *
     * @throws DomainException
     */
    public function execute(
        Business $business,
        User $actor,
        string $preset, // 'today', 'this_week', 'last_7_days', 'last_30_days'
        ?string $pickupPointScope = null
    ): array {
        if (! $this->policy->view($actor, $business)) {
            throw new DomainException('UNAUTHORIZED');
        }

        $nowLocal = CarbonImmutable::now(BusinessDayBounds::CANONICAL_TIMEZONE);
        
        // Determine start and end based on preset (local timezone boundaries converted to UTC)
        $startLocal = match ($preset) {
            'today' => $nowLocal->startOfDay(),
            'this_week' => $nowLocal->startOfWeek(), // Monday start
            'last_7_days' => $nowLocal->subDays(6)->startOfDay(),
            'last_30_days' => $nowLocal->subDays(29)->startOfDay(),
            default => throw new \InvalidArgumentException('INVALID_PRESET'),
        };
        $endLocal = $nowLocal->endOfDay();

        $startUtc = $startLocal->setTimezone('UTC')->toIso8601String();
        $endUtc = $endLocal->setTimezone('UTC')->toIso8601String();

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

        // 1. Packages Received
        $receivedQuery = Package::where('business_id', $business->id)
            ->where(function ($q) use ($startUtc, $endUtc) {
                $q->whereBetween('client_created_at', [$startUtc, $endUtc])
                    ->orWhere(function ($fallback) use ($startUtc, $endUtc) {
                        $fallback->whereNull('client_created_at')
                            ->whereBetween('created_at', [$startUtc, $endUtc]);
                    });
            });

        if ($pickupPoint) {
            $receivedQuery->where('pickup_point_id', $pickupPoint->id);
        }

        $receivedPackages = $receivedQuery->get(['id', 'client_created_at', 'created_at', 'terminal_actor_name', 'creator_name', 'created_by_user_id']);
        $receivedCount = $receivedPackages->count();

        // 2. Packages Collected (status = COLLECTED within range)
        $collectedQuery = Package::where('business_id', $business->id)
            ->where('status', 'COLLECTED')
            ->whereBetween('updated_at', [$startUtc, $endUtc]);

        if ($pickupPoint) {
            $collectedQuery->where('pickup_point_id', $pickupPoint->id);
        }

        $collectedPackages = $collectedQuery->get(['id', 'client_created_at', 'created_at', 'collected_at', 'updated_at', 'terminal_actor_name', 'created_by_user_id']);
        $collectedCount = $collectedPackages->count();

        // 3. Average time to pickup
        $totalPickupTimeSeconds = 0;
        $validPickupTimes = 0;
        
        foreach ($collectedPackages as $pkg) {
            $created = $pkg->client_created_at ?: $pkg->created_at;
            $collected = $pkg->collected_at ?: $pkg->updated_at;
            if ($created && $collected && $collected->gt($created)) {
                $totalPickupTimeSeconds += $collected->diffInSeconds($created);
                $validPickupTimes++;
            }
        }
        $avgPickupTimeSeconds = $validPickupTimes > 0 ? (int)round($totalPickupTimeSeconds / $validPickupTimes) : null;

        // 4. Returned / Cancelled (Terminal events)
        $terminalQuery = PackageLifecycleEvent::where('package_lifecycle_events.business_id', $business->id)
            ->whereIn('package_lifecycle_events.type', ['RETURN', 'CANCEL'])
            ->where(function ($q) use ($startUtc, $endUtc) {
                $q->whereBetween('package_lifecycle_events.client_event_at', [$startUtc, $endUtc])
                    ->orWhere(function ($fallback) use ($startUtc, $endUtc) {
                        $fallback->whereNull('package_lifecycle_events.client_event_at')
                            ->whereBetween('package_lifecycle_events.created_at', [$startUtc, $endUtc]);
                    });
            });

        if ($pickupPoint) {
            $terminalQuery->join('packages', 'packages.id', '=', 'package_lifecycle_events.package_id')
                ->where('packages.pickup_point_id', $pickupPoint->id);
        }
        $returnedCancelledCount = (int) $terminalQuery->count();

        // 5. Waiting Now (point in time, unbounded by range)
        $waitingNowQuery = Package::where('business_id', $business->id)
            ->where('status', 'WAITING');
        if ($pickupPoint) {
            $waitingNowQuery->where('pickup_point_id', $pickupPoint->id);
        }
        $waitingNowCount = (int) $waitingNowQuery->count();

        // 6. Revenue Collected (Net Minor, excluding reversals)
        $paymentBaseQuery = Payment::where('payments.business_id', $business->id)
            ->where(function ($q) use ($startUtc, $endUtc) {
                $q->whereBetween('payments.recorded_at', [$startUtc, $endUtc])
                    ->orWhere(function ($fallback) use ($startUtc, $endUtc) {
                        $fallback->whereNull('payments.recorded_at')
                            ->whereBetween('payments.created_at', [$startUtc, $endUtc]);
                    });
            });

        if ($pickupPoint) {
            $paymentBaseQuery->join('packages', 'packages.id', '=', 'payments.package_id')
                ->where('packages.pickup_point_id', $pickupPoint->id);
        }

        $positivePaymentsQuery = (clone $paymentBaseQuery)->where('payments.amount_minor', '>', 0);
        $recordedPaymentMinor = (int) $positivePaymentsQuery->sum('payments.amount_minor');

        $reversalQuery = (clone $paymentBaseQuery)
            ->where(function ($q) {
                $q->where('payments.amount_minor', '<', 0)
                    ->orWhereNotNull('payments.reverses_payment_id');
            });
        $reversedMinorRaw = (int) $reversalQuery->sum(DB::raw('ABS(payments.amount_minor)'));
        
        $revenueCollectedMinor = max(0, $recordedPaymentMinor - $reversedMinorRaw);

        // 7. Daily Breakdown (only if preset > 1 day)
        $dailyChart = [];
        $busiestDay = null;
        if (in_array($preset, ['this_week', 'last_7_days', 'last_30_days'])) {
            // Initialize chart with zeroes for every day in the range
            $currentDate = $startLocal->copy();
            $maxReceived = -1;
            
            while ($currentDate->lte($endLocal)) {
                $dateStr = $currentDate->format('Y-m-d');
                $shortLabel = $currentDate->format('D'); // Mon, Tue
                $dailyChart[$dateStr] = [
                    'date' => $dateStr,
                    'short_label' => $shortLabel,
                    'received_count' => 0
                ];
                $currentDate = $currentDate->addDay();
            }

            foreach ($receivedPackages as $pkg) {
                $pkgDate = ($pkg->client_created_at ?: $pkg->created_at)->setTimezone(BusinessDayBounds::CANONICAL_TIMEZONE);
                $dateStr = $pkgDate->format('Y-m-d');
                if (isset($dailyChart[$dateStr])) {
                    $dailyChart[$dateStr]['received_count']++;
                }
            }

            // Find busiest day (only meaningful for 7 and 30 days per prompt, but we calculate it here)
            foreach ($dailyChart as $dayData) {
                if ($dayData['received_count'] > $maxReceived) {
                    $maxReceived = $dayData['received_count'];
                    $busiestDay = $dayData;
                }
            }
        }

        // 8. Staff Breakdown (if multiple helpers exist)
        $staffBreakdown = [];
        $usersCount = $business->businessMemberships()->count();
        if ($usersCount > 1) {
            $staffMap = [];
            foreach ($receivedPackages as $pkg) {
                $name = $pkg->creator_name ?: 'Owner/Admin';
                if (!isset($staffMap[$name])) $staffMap[$name] = ['name' => $name, 'received' => 0, 'released' => 0];
                $staffMap[$name]['received']++;
            }
            foreach ($collectedPackages as $pkg) {
                $name = $pkg->terminal_actor_name ?: 'Owner/Admin';
                if (!isset($staffMap[$name])) $staffMap[$name] = ['name' => $name, 'received' => 0, 'released' => 0];
                $staffMap[$name]['released']++;
            }
            $staffBreakdown = array_values($staffMap);
            // Sort alphabetically
            usort($staffBreakdown, fn($a, $b) => strcmp($a['name'], $b['name']));
        }

        return [
            'preset' => $preset,
            'timezone' => BusinessDayBounds::CANONICAL_TIMEZONE,
            'scope' => [
                'type' => $isBusinessWide ? 'all' : 'pickup_point',
                'pickup_point_id' => $pickupPoint?->id,
            ],
            'metrics' => [
                'received_count' => $receivedCount,
                'collected_count' => $collectedCount,
                'revenue_collected_minor' => $revenueCollectedMinor,
                'waiting_now_count' => $waitingNowCount,
                'returned_cancelled_count' => $returnedCancelledCount,
                'avg_pickup_time_seconds' => $avgPickupTimeSeconds,
                'busiest_day' => in_array($preset, ['last_7_days', 'last_30_days']) && $busiestDay && $busiestDay['received_count'] > 0 ? $busiestDay : null,
            ],
            'daily_chart' => array_values($dailyChart),
            'staff_breakdown' => $staffBreakdown,
            'generated_at' => now()->toIso8601String(),
        ];
    }
}
