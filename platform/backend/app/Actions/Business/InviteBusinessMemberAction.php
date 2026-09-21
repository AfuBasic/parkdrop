<?php

namespace App\Actions\Business;

use App\Mail\StaffInvitationMail;
use App\Models\ActivityLog;
use App\Models\Business;
use App\Models\BusinessInvitation;
use App\Models\BusinessMembership;
use App\Models\User;
use Carbon\Carbon;
use DomainException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use InvalidArgumentException;

class InviteBusinessMemberAction
{
    /**
     * Invite a staff member to the business.
     *
     * @throws DomainException
     * @throws InvalidArgumentException
     */
    public function execute(
        Business $business,
        User $inviter,
        string $email,
        string $role
    ): BusinessInvitation {
        $normalizedEmail = strtolower(trim($email));
        $role = strtolower(trim($role));

        if (! filter_var($normalizedEmail, FILTER_VALIDATE_EMAIL)) {
            throw new InvalidArgumentException('INVALID_EMAIL_FORMAT');
        }

        // Validate inviter membership in business
        $inviterMembership = BusinessMembership::where('business_id', $business->id)
            ->where('user_id', $inviter->id)
            ->where('status', 'active')
            ->first();

        if (! $inviterMembership) {
            throw new DomainException('INVITER_NOT_ACTIVE_MEMBER');
        }

        // Validate assignable role according to matrix:
        // OWNER can assign: owner, manager, attendant
        // MANAGER can assign: attendant only
        // ATTENDANT cannot assign any role
        if ($inviterMembership->role === 'attendant') {
            throw new DomainException('FORBIDDEN_ROLE_ASSIGNMENT');
        }

        if ($inviterMembership->role === 'manager' && $role !== 'attendant') {
            throw new DomainException('FORBIDDEN_ROLE_ASSIGNMENT');
        }

        if (! in_array($role, ['owner', 'manager', 'attendant'], true)) {
            throw new InvalidArgumentException('INVALID_ROLE');
        }

        $rawToken = Str::random(40);
        $tokenHash = hash('sha256', $rawToken);
        $ttlDays = config('app.invitation_ttl_days', 7);
        $expiresAt = Carbon::now()->addDays($ttlDays);

        return DB::transaction(function () use (
            $business,
            $inviter,
            $email,
            $normalizedEmail,
            $role,
            $rawToken,
            $tokenHash,
            $expiresAt
        ) {
            // Check if user already exists and is an active member
            $existingUser = User::where('email_normalized', $normalizedEmail)
                ->orWhere('email', $normalizedEmail)
                ->first();

            if ($existingUser) {
                $existingActiveMembership = BusinessMembership::where('business_id', $business->id)
                    ->where('user_id', $existingUser->id)
                    ->where('status', 'active')
                    ->first();

                if ($existingActiveMembership) {
                    throw new DomainException('ALREADY_ACTIVE_MEMBER');
                }
            }

            // Check if there is already an active pending invitation for this email in this business
            $existingInvitation = BusinessInvitation::where('business_id', $business->id)
                ->where('email_normalized', $normalizedEmail)
                ->where('status', 'pending')
                ->where('expires_at', '>', Carbon::now())
                ->lockForUpdate()
                ->first();

            if ($existingInvitation) {
                // If it exists, update token, role and expiry safely (idempotent invite resend/refresh)
                $existingInvitation->update([
                    'role' => $role,
                    'token_hash' => $tokenHash,
                    'expires_at' => $expiresAt,
                    'invited_by_user_id' => $inviter->id,
                ]);

                Mail::to($normalizedEmail)->queue(new StaffInvitationMail($existingInvitation, $rawToken));

                return $existingInvitation;
            }

            $invitation = BusinessInvitation::create([
                'business_id' => $business->id,
                'email' => $email,
                'email_normalized' => $normalizedEmail,
                'role' => $role,
                'status' => 'pending',
                'invited_by_user_id' => $inviter->id,
                'token_hash' => $tokenHash,
                'expires_at' => $expiresAt,
            ]);

            ActivityLog::create([
                'business_id' => $business->id,
                'package_id' => null,
                'user_id' => $inviter->id,
                'type' => 'STAFF_INVITED',
                'payload' => [
                    'invitation_id' => $invitation->id,
                    'email_normalized' => $normalizedEmail,
                    'role' => $role,
                ],
            ]);

            Mail::to($normalizedEmail)->queue(new StaffInvitationMail($invitation, $rawToken));

            return $invitation;
        });
    }
}
