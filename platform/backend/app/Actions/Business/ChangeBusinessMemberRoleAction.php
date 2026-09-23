<?php

namespace App\Actions\Business;

use App\Models\ActivityLog;
use App\Models\Business;
use App\Models\BusinessMembership;
use App\Models\User;
use DomainException;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class ChangeBusinessMemberRoleAction
{
    /**
     * Change a business member's role authoritatively with last-owner safety checks.
     *
     * @throws DomainException
     * @throws InvalidArgumentException
     */
    public function execute(
        Business $business,
        BusinessMembership $targetMembership,
        string $newRole,
        User $actor
    ): BusinessMembership {
        $newRole = strtolower(trim($newRole));

        if (! in_array($newRole, ['owner', 'manager', 'attendant'], true)) {
            throw new InvalidArgumentException('INVALID_ROLE');
        }

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

        // ATTENDANT cannot change any roles
        if ($actorMembership->role === 'attendant') {
            throw new DomainException('FORBIDDEN');
        }

        // MANAGER cannot promote to OWNER or demote/modify an OWNER or MANAGER
        if ($actorMembership->role === 'manager') {
            if ($targetMembership->role === 'owner' || $targetMembership->role === 'manager') {
                throw new DomainException('FORBIDDEN');
            }
            if ($newRole === 'owner' || $newRole === 'manager') {
                throw new DomainException('FORBIDDEN');
            }
        }

        return DB::transaction(function () use ($business, $targetMembership, $newRole, $actor) {
            // Lock all active memberships for this business to prevent concurrent last-owner demotion race
            $lockedTarget = BusinessMembership::where('id', $targetMembership->id)
                ->lockForUpdate()
                ->first();

            if (! $lockedTarget || $lockedTarget->status !== 'active') {
                throw new DomainException('MEMBERSHIP_NOT_ACTIVE');
            }

            // Idempotent: already has this role
            if ($lockedTarget->role === $newRole) {
                return $lockedTarget;
            }

            // If demoting an OWNER to something else, check last-owner invariant!
            if ($lockedTarget->role === 'owner' && $newRole !== 'owner') {
                $activeOwnerCount = BusinessMembership::where('business_id', $business->id)
                    ->where('role', 'owner')
                    ->where('status', 'active')
                    ->lockForUpdate()
                    ->count();

                if ($activeOwnerCount <= 1) {
                    throw new DomainException('CANNOT_DEMOTE_LAST_OWNER');
                }
            }

            $previousRole = $lockedTarget->role;
            $lockedTarget->update([
                'role' => $newRole,
            ]);

            ActivityLog::create([
                'business_id' => $business->id,
                'package_id' => null,
                'user_id' => $actor->id,
                'type' => 'STAFF_ROLE_CHANGED',
                'payload' => [
                    'target_user_id' => $lockedTarget->user_id,
                    'from_role' => $previousRole,
                    'to_role' => $newRole,
                ],
            ]);

            return $lockedTarget;
        });
    }
}
