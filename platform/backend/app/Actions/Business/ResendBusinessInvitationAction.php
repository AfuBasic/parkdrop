<?php

namespace App\Actions\Business;

use App\Mail\StaffInvitationMail;
use App\Models\Business;
use App\Models\BusinessInvitation;
use App\Models\BusinessMembership;
use App\Models\User;
use Carbon\Carbon;
use DomainException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class ResendBusinessInvitationAction
{
    /**
     * Resend an active pending invitation.
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

        return DB::transaction(function () use ($invitation) {
            $locked = BusinessInvitation::where('id', $invitation->id)
                ->lockForUpdate()
                ->first();

            if (! $locked || $locked->status !== 'pending') {
                throw new DomainException('INVITATION_NOT_PENDING');
            }

            $rawToken = Str::random(40);
            $tokenHash = hash('sha256', $rawToken);
            $ttlDays = config('app.invitation_ttl_days', 7);
            $expiresAt = Carbon::now()->addDays($ttlDays);

            $locked->update([
                'token_hash' => $tokenHash,
                'expires_at' => $expiresAt,
            ]);

            Mail::to($locked->email_normalized)->queue(new StaffInvitationMail($locked, $rawToken));

            return $locked;
        });
    }
}
