<?php

namespace App\Actions\PickupPoints;

use App\Models\ActivityLog;
use App\Models\Business;
use App\Models\BusinessMembership;
use App\Models\Package;
use App\Models\PickupPoint;
use App\Models\SyncChange;
use App\Models\User;
use DomainException;
use Illuminate\Support\Facades\DB;

class DeactivatePickupPointAction
{
    /**
     * Deactivate a pickup point safely.
     * Enforces two critical domain invariants:
     * 1. No WAITING packages may exist at this pickup point.
     * 2. The business must retain at least one remaining active pickup point.
     *
     * @throws DomainException
     */
    public function execute(
        Business $business,
        PickupPoint $pickupPoint,
        User $actor
    ): PickupPoint {
        if ($pickupPoint->business_id !== $business->id) {
            throw new DomainException('FORBIDDEN');
        }

        $actorMembership = BusinessMembership::where('business_id', $business->id)
            ->where('user_id', $actor->id)
            ->where('status', 'active')
            ->first();

        if (! $actorMembership) {
            throw new DomainException('UNAUTHORIZED');
        }

        if (! in_array($actorMembership->role, ['owner', 'manager'], true)) {
            throw new DomainException('FORBIDDEN');
        }

        return DB::transaction(function () use ($business, $pickupPoint, $actor) {
            $locked = PickupPoint::where('id', $pickupPoint->id)
                ->where('business_id', $business->id)
                ->lockForUpdate()
                ->first();

            if (! $locked) {
                throw new DomainException('NOT_FOUND');
            }

            if ($locked->status !== 'active') {
                return $locked; // already inactive, idempotent
            }

            // Invariant 1: Check for WAITING packages
            $waitingCount = Package::where('business_id', $business->id)
                ->where('pickup_point_id', $locked->id)
                ->where('status', 'WAITING')
                ->count();

            if ($waitingCount > 0) {
                throw new DomainException("HAS_WAITING_PACKAGES:{$waitingCount}");
            }

            // Invariant 2: Ensure at least one OTHER active pickup point exists
            $otherActiveCount = PickupPoint::where('business_id', $business->id)
                ->where('id', '!=', $locked->id)
                ->where('status', 'active')
                ->lockForUpdate()
                ->count();

            if ($otherActiveCount === 0) {
                throw new DomainException('LAST_ACTIVE_PICKUP_POINT');
            }

            $locked->update([
                'status' => 'inactive',
            ]);

            ActivityLog::create([
                'business_id' => $business->id,
                'package_id' => null,
                'user_id' => $actor->id,
                'type' => 'PICKUP_POINT_DEACTIVATED',
                'payload' => [
                    'pickup_point_id' => $locked->id,
                    'name' => $locked->name,
                ],
            ]);

            SyncChange::create([
                'business_id' => $business->id,
                'entity_type' => 'pickup_point',
                'entity_id' => $locked->id,
                'operation' => 'UPDATED',
                'entity_version' => 1,
            ]);

            return $locked;
        });
    }
}
