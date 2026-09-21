<?php

namespace App\Actions\PickupPoints;

use App\Models\ActivityLog;
use App\Models\Business;
use App\Models\BusinessMembership;
use App\Models\PickupPoint;
use App\Models\SyncChange;
use App\Models\User;
use DomainException;
use Illuminate\Support\Facades\DB;

class ReactivatePickupPointAction
{
    /**
     * Reactivate a previously inactive pickup point within an authorized business.
     * Allowed for 'owner' and 'manager' roles.
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

            if ($locked->status === 'active') {
                return $locked; // already active, idempotent
            }

            // Check if another active pickup point already uses this name
            $duplicate = PickupPoint::where('business_id', $business->id)
                ->where('id', '!=', $locked->id)
                ->where('status', 'active')
                ->whereRaw('LOWER(name) = ?', [mb_strtolower($locked->name)])
                ->lockForUpdate()
                ->first();

            if ($duplicate) {
                throw new DomainException('DUPLICATE_NAME');
            }

            $locked->update([
                'status' => 'active',
            ]);

            ActivityLog::create([
                'business_id' => $business->id,
                'package_id' => null,
                'user_id' => $actor->id,
                'type' => 'PICKUP_POINT_REACTIVATED',
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
