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

class AcceptBusinessInvitationAction
{
    /**
     * Accept a pending invitation authoritatively.
     * Verified user email must match the invitation normalized email.
     *
     * @throws DomainException
     */
    public function execute(
        BusinessInvitation $invitation,
        User $user,
        ?string $rawToken = null
    ): BusinessMembership {
        // Enforce email match
        if ($user->email_normalized !== $invitation->email_normalized && strtolower($user->email) !== $invitation->email_normalized) {
            throw new DomainException('EMAIL_MISMATCH');
        }

        return DB::transaction(function () use ($invitation, $user, $rawToken) {
            $lockedInvitation = BusinessInvitation::where('id', $invitation->id)
                ->lockForUpdate()
                ->first();

            if (! $lockedInvitation) {
                throw new DomainException('INVITATION_NOT_FOUND');
            }

            if ($lockedInvitation->status === 'revoked') {
                throw new DomainException('INVITATION_REVOKED');
            }

            if ($lockedInvitation->status === 'expired' || $lockedInvitation->expires_at->isPast()) {
                if ($lockedInvitation->status !== 'expired') {
                    $lockedInvitation->update(['status' => 'expired']);
                }
                throw new DomainException('INVITATION_EXPIRED');
            }

            // Optional token verification if invitation has token_hash
            if ($lockedInvitation->token_hash && $rawToken) {
                $hash = hash('sha256', $rawToken);
                if (! hash_equals($lockedInvitation->token_hash, $hash)) {
                    throw new DomainException('INVALID_TOKEN');
                }
            }

            $business = Business::find($lockedInvitation->business_id);
            if (! $business) {
                throw new DomainException('BUSINESS_NOT_FOUND');
            }

            // Lock or create membership
            $membership = BusinessMembership::where('business_id', $business->id)
                ->where('user_id', $user->id)
                ->lockForUpdate()
                ->first();

            if ($membership) {
                // If membership was previously removed, reactivate it with the invited role
                $membership->update([
                    'role' => $lockedInvitation->role,
                    'status' => 'active',
                    'joined_at' => $membership->joined_at ?? Carbon::now(),
                ]);
            } else {
                $membership = BusinessMembership::create([
                    'business_id' => $business->id,
                    'user_id' => $user->id,
                    'role' => $lockedInvitation->role,
                    'status' => 'active',
                    'joined_at' => Carbon::now(),
                ]);
            }

            $lockedInvitation->update([
                'status' => 'accepted',
                'accepted_at' => Carbon::now(),
            ]);

            ActivityLog::create([
                'business_id' => $business->id,
                'package_id' => null,
                'user_id' => $user->id,
                'type' => 'STAFF_JOINED',
                'payload' => [
                    'invitation_id' => $lockedInvitation->id,
                    'role' => $membership->role,
                ],
            ]);

            return $membership;
        });
    }
}
