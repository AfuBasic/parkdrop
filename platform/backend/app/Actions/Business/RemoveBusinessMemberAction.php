<?php

namespace App\Actions\Business;

use App\Models\ActivityLog;
use App\Models\Business;
use App\Models\BusinessMembership;
use App\Models\User;
use DomainException;
use Illuminate\Support\Facades\DB;

class RemoveBusinessMemberAction
{
    /**
     * Remove a member's access from the business authoritatively.
     * Soft-deactivates the membership (status = 'removed').
     * Preserves User account and all historical package, payment, and activity log references.
     *
     * @throws DomainException
     */
    public function execute(
        Business $business,
        BusinessMembership $targetMembership,
        User $actor
    ): BusinessMembership {
        if ($targetMembership->business_id !== $business->id) {
            throw new DomainException('MEMBERSHIP_NOT_FOUND');
        }

        // Validate actor permissions
        $actorMembership = BusinessMembership::where('business_id', $business->id)
            ->where('user_id', $actor->id)
            ->where('status', 'active')
            ->first();

        if (! $actorMembership) {
            throw new DomainException('UNAUTHORIZED');
        }

        // ATTENDANT cannot remove any staff
        if ($actorMembership->role === 'attendant') {
            throw new DomainException('FORBIDDEN');
        }

        // MANAGER cannot remove an OWNER or another MANAGER
        if ($actorMembership->role === 'manager') {
            if ($targetMembership->role === 'owner' || $targetMembership->role === 'manager') {
                throw new DomainException('FORBIDDEN');
            }
        }

        return DB::transaction(function () use ($business, $targetMembership, $actor) {
            $lockedTarget = BusinessMembership::where('id', $targetMembership->id)
                ->lockForUpdate()
                ->first();

            if (! $lockedTarget) {
                throw new DomainException('MEMBERSHIP_NOT_FOUND');
            }

            // If already removed, idempotent return
            if ($lockedTarget->status === 'removed') {
                return $lockedTarget;
            }

            // If target is an OWNER, check last-owner invariant!
            if ($lockedTarget->role === 'owner') {
                $activeOwnerCount = BusinessMembership::where('business_id', $business->id)
                    ->where('role', 'owner')
                    ->where('status', 'active')
                    ->lockForUpdate()
                    ->count();

                if ($activeOwnerCount <= 1) {
                    throw new DomainException('CANNOT_REMOVE_LAST_OWNER');
                }
            }

            $lockedTarget->update([
                'status' => 'removed',
            ]);

            ActivityLog::create([
                'business_id' => $business->id,
                'package_id' => null,
                'user_id' => $actor->id,
                'type' => 'STAFF_ACCESS_REMOVED',
                'payload' => [
                    'target_user_id' => $lockedTarget->user_id,
                    'role' => $lockedTarget->role,
                ],
            ]);

            return $lockedTarget;
        });
    }
}
