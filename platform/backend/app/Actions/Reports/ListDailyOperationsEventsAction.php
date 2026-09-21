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
use Carbon\Carbon;
use DomainException;
use Illuminate\Support\Collection;

class ListDailyOperationsEventsAction
{
    public function __construct(
        private ReportPolicy $policy
    ) {}

    /**
     * List chronological daily operational events (newest first) for the selected date and scope.
     *
     * @throws DomainException
     */
    public function execute(
        Business $business,
        User $actor,
        string $localDate,
        ?string $pickupPointScope = null,
        int $limit = 30,
        int $offset = 0
    ): array {
        if (! $this->policy->view($actor, $business)) {
            throw new DomainException('UNAUTHORIZED');
        }

        $bounds = BusinessDayBounds::forDate($localDate);
        $start = $bounds['start'];
        $end = $bounds['end'];

        $isBusinessWide = empty($pickupPointScope) || $pickupPointScope === 'all';
        $pickupPointId = null;

        if (! $isBusinessWide) {
            $point = PickupPoint::where('business_id', $business->id)
                ->where('id', $pickupPointScope)
                ->first();

            if (! $point) {
                throw new DomainException('PICKUP_POINT_NOT_FOUND');
            }
            $pickupPointId = $point->id;
        }

        $events = new Collection;

        // 1. Packages Received (intake)
        $pkgQuery = Package::where('business_id', $business->id)
            ->where(function ($q) use ($start, $end) {
                $q->whereBetween('client_created_at', [$start, $end])
                    ->orWhere(function ($fallback) use ($start, $end) {
                        $fallback->whereNull('client_created_at')
                            ->whereBetween('created_at', [$start, $end]);
                    });
            })
            ->with(['customer', 'pickupPoint', 'creator']);

        if ($pickupPointId) {
            $pkgQuery->where('pickup_point_id', $pickupPointId);
        }

        foreach ($pkgQuery->get() as $pkg) {
            $timestamp = $pkg->client_created_at ?? $pkg->created_at;
            $events->push([
                'id' => "pkg_rcv_{$pkg->id}",
                'type' => 'PACKAGE_RECEIVED',
                'event_time' => $timestamp->setTimezone(BusinessDayBounds::CANONICAL_TIMEZONE)->toIso8601String(),
                'timestamp_raw' => $timestamp->getTimestamp(),
                'package_id' => $pkg->id,
                'public_package_id' => $pkg->public_package_id,
                'customer_name' => $pkg->customer?->name,
                'pickup_point_id' => $pkg->pickup_point_id,
                'pickup_point_name' => $pkg->pickupPoint?->name,
                'amount_minor' => null,
                'payment_method' => null,
                'actor_name' => $pkg->creator?->first_name ?: ($pkg->creator?->email ? explode('@', $pkg->creator->email)[0] : 'Staff'),
                'details' => null,
            ]);
        }

        // 2. Packages Collected
        $collectedQuery = Package::where('business_id', $business->id)
            ->where('status', 'COLLECTED')
            ->whereBetween('updated_at', [$start, $end])
            ->with(['customer', 'pickupPoint']);

        if ($pickupPointId) {
            $collectedQuery->where('pickup_point_id', $pickupPointId);
        }

        foreach ($collectedQuery->get() as $pkg) {
            $timestamp = $pkg->updated_at;
            $events->push([
                'id' => "pkg_col_{$pkg->id}",
                'type' => 'PACKAGE_COLLECTED',
                'event_time' => $timestamp->setTimezone(BusinessDayBounds::CANONICAL_TIMEZONE)->toIso8601String(),
                'timestamp_raw' => $timestamp->getTimestamp(),
                'package_id' => $pkg->id,
                'public_package_id' => $pkg->public_package_id,
                'customer_name' => $pkg->customer?->name,
                'pickup_point_id' => $pkg->pickup_point_id,
                'pickup_point_name' => $pkg->pickupPoint?->name,
                'amount_minor' => null,
                'payment_method' => null,
                'actor_name' => 'Staff',
                'details' => null,
            ]);
        }

        // 3. Package Lifecycle Events (RETURN & CANCEL)
        $lifecycleQuery = PackageLifecycleEvent::where('package_lifecycle_events.business_id', $business->id)
            ->where(function ($q) use ($start, $end) {
                $q->whereBetween('package_lifecycle_events.client_event_at', [$start, $end])
                    ->orWhere(function ($fallback) use ($start, $end) {
                        $fallback->whereNull('package_lifecycle_events.client_event_at')
                            ->whereBetween('package_lifecycle_events.created_at', [$start, $end]);
                    });
            })
            ->with(['package.customer', 'package.pickupPoint', 'actor']);

        if ($pickupPointId) {
            $lifecycleQuery->join('packages', 'packages.id', '=', 'package_lifecycle_events.package_id')
                ->where('packages.pickup_point_id', $pickupPointId)
                ->select('package_lifecycle_events.*');
        }

        foreach ($lifecycleQuery->get() as $evt) {
            $timestamp = $evt->client_event_at ?? $evt->created_at;
            $type = $evt->type === 'RETURN' ? 'PACKAGE_RETURNED' : 'PACKAGE_CANCELLED';

            $actorName = $evt->actor?->first_name ?: ($evt->actor?->email ? explode('@', $evt->actor->email)[0] : 'Staff');

            $events->push([
                'id' => "lifecycle_{$evt->id}",
                'type' => $type,
                'event_time' => $timestamp->setTimezone(BusinessDayBounds::CANONICAL_TIMEZONE)->toIso8601String(),
                'timestamp_raw' => $timestamp->getTimestamp(),
                'package_id' => $evt->package_id,
                'public_package_id' => $evt->package?->public_package_id,
                'customer_name' => $evt->package?->customer?->name,
                'pickup_point_id' => $evt->package?->pickup_point_id,
                'pickup_point_name' => $evt->package?->pickupPoint?->name,
                'amount_minor' => null,
                'payment_method' => null,
                'actor_name' => $actorName,
                'details' => $evt->reason,
            ]);
        }

        // 4. Payments Recorded & Reversed
        $paymentQuery = Payment::where('payments.business_id', $business->id)
            ->where(function ($q) use ($start, $end) {
                $q->whereBetween('payments.recorded_at', [$start, $end])
                    ->orWhere(function ($fallback) use ($start, $end) {
                        $fallback->whereNull('payments.recorded_at')
                            ->whereBetween('payments.created_at', [$start, $end]);
                    });
            })
            ->with(['package.customer', 'package.pickupPoint', 'recordedBy']);

        if ($pickupPointId) {
            $paymentQuery->join('packages', 'packages.id', '=', 'payments.package_id')
                ->where('packages.pickup_point_id', $pickupPointId)
                ->select('payments.*');
        }

        foreach ($paymentQuery->get() as $payment) {
            $timestamp = $payment->recorded_at ?? $payment->created_at;
            $isReversal = $payment->amount_minor < 0 || ! empty($payment->reverses_payment_id);
            $type = $isReversal ? 'PAYMENT_REVERSED' : 'PAYMENT_RECORDED';

            $actorName = $payment->recordedBy?->first_name ?: ($payment->recordedBy?->email ? explode('@', $payment->recordedBy->email)[0] : 'Staff');

            $events->push([
                'id' => "pay_{$payment->id}",
                'type' => $type,
                'event_time' => $timestamp->setTimezone(BusinessDayBounds::CANONICAL_TIMEZONE)->toIso8601String(),
                'timestamp_raw' => $timestamp->getTimestamp(),
                'package_id' => $payment->package_id,
                'public_package_id' => $payment->package?->public_package_id,
                'customer_name' => $payment->package?->customer?->name,
                'pickup_point_id' => $payment->package?->pickup_point_id,
                'pickup_point_name' => $payment->package?->pickupPoint?->name,
                'amount_minor' => abs($payment->amount_minor),
                'payment_method' => $payment->method?->value ?? (string) $payment->method,
                'actor_name' => $actorName,
                'details' => $payment->reversal_reason,
            ]);
        }

        // Sort descending: newest event first, tie breaker by stable ID
        $sorted = $events->sortBy([
            ['timestamp_raw', 'desc'],
            ['id', 'desc'],
        ])->values();

        $totalCount = $sorted->count();
        $items = $sorted->slice($offset, $limit)->values()->all();

        return [
            'events' => $items,
            'total' => $totalCount,
            'limit' => $limit,
            'offset' => $offset,
            'has_more' => ($offset + $limit) < $totalCount,
        ];
    }
}
