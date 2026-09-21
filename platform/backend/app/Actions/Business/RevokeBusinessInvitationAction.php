<?php

namespace App\Actions\Business;

use App\Models\ActivityLog;
use App\Models\Business;
use App\Models\BusinessInvitation;
use App\Models\BusinessMembership;
use App\Models\User;
use Carbon\Carbon;
use DomainException;
use Illuminate\Support\Facades\DB;

class RevokeBusinessInvitationAction
{
    /**
     * Revoke an active pending invitation.
     *
     * @throws DomainException
     */
    public function execute(
        Business $business,
        BusinessInvitation $invitation,
        User $actor
    ): BusinessInvitation {
        if ($invitation->business_id !== $business->id) {
            throw new DomainException('INVITATION_NOT_FOUND');
        }

        // Validate actor permissions
        $actorMembership = BusinessMembership::where('business_id', $business->id)
            ->where('user_id', $actor->id)
            ->where('status', 'active')
            ->first();

        if (! $actorMembership) {
            throw new DomainException('UNAUTHORIZED');
        }

        if ($actorMembership->role === 'attendant') {
            throw new DomainException('FORBIDDEN');
        }

        if ($actorMembership->role === 'manager' && $invitation->role !== 'attendant') {
            throw new DomainException('FORBIDDEN');
        }

        return DB::transaction(function () use ($business, $invitation, $actor) {
            $locked = BusinessInvitation::where('id', $invitation->id)
                ->lockForUpdate()
                ->first();

            if (! $locked) {
                throw new DomainException('INVITATION_NOT_FOUND');
            }

            if ($locked->status === 'accepted') {
                throw new DomainException('CANNOT_REVOKE_ACCEPTED_INVITATION');
            }

            if ($locked->status === 'revoked') {
                return $locked; // Idempotent
            }

            $locked->update([
                'status' => 'revoked',
                'revoked_at' => Carbon::now(),
            ]);

            ActivityLog::create([
                'business_id' => $business->id,
                'package_id' => null,
                'user_id' => $actor->id,
                'type' => 'INVITATION_REVOKED',
                'payload' => [
                    'invitation_id' => $locked->id,
                    'email_normalized' => $locked->email_normalized,
                ],
            ]);

            return $locked;
        });
    }
}
