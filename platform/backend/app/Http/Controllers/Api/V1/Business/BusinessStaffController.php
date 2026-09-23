<?php

namespace App\Http\Controllers\Api\V1\Business;

use App\Actions\Business\ChangeBusinessMemberRoleAction;
use App\Actions\Business\InviteBusinessMemberAction;
use App\Actions\Business\RemoveBusinessMemberAction;
use App\Actions\Business\ResendBusinessInvitationAction;
use App\Actions\Business\RevokeBusinessInvitationAction;
use App\Http\Controllers\Controller;
use App\Models\BusinessInvitation;
use App\Models\BusinessMembership;
use Carbon\Carbon;
use DomainException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;

class BusinessStaffController extends Controller
{
    /**
     * Look up an invitation by id + token, without requiring membership in
     * its business — this is how a just-invited visitor (who is not a
     * member of anything yet) can be shown who the invite is for.
     *
     * Only exposes what's needed to render an invite landing screen: the
     * business name, role, and the email the invite was sent to. Never the
     * token itself. A wrong or missing token gets the same 404 as a
     * nonexistent invitation, so this can't be used to enumerate invitations.
     */
    public function showInvitation(Request $request, string $invitationId): JsonResponse
    {
        $invitation = BusinessInvitation::with('business')->find($invitationId);

        $token = (string) $request->query('token', '');
        if (! $invitation || ! $invitation->token_hash || ! $token || ! hash_equals($invitation->token_hash, hash('sha256', $token))) {
            return response()->json(['message' => 'Invitation not found.'], 404);
        }

        return response()->json([
            'email' => $invitation->email,
            'email_normalized' => $invitation->email_normalized,
            'business_name' => $invitation->business?->name,
            'role' => $invitation->role,
            'status' => $invitation->status,
            'expires_at' => $invitation->expires_at?->toIso8601String(),
        ]);
    }

    /**
     * Get staff list (active members and pending invitations) for the current active business.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $membership = $user->businessMemberships()
            ->where('status', 'active')
            ->first();

        if (! $membership) {
            return response()->json(['message' => 'No active business membership found.'], 403);
        }

        // Attendants do not have access to staff administration
        if ($membership->role === 'attendant') {
            return response()->json(['message' => 'Unauthorized to view staff.'], 403);
        }

        $business = $membership->business;

        // Active members sorted Owners first, Managers, then Attendants, then name
        $activeMembers = BusinessMembership::where('business_id', $business->id)
            ->where('status', 'active')
            ->with(['user' => function ($query) {
                $query->select('id', 'first_name', 'email', 'email_normalized');
            }])
            ->get()
            ->sortBy(function ($m) {
                $rolePriority = ['owner' => 1, 'manager' => 2, 'attendant' => 3];

                return sprintf(
                    '%d-%s',
                    $rolePriority[$m->role] ?? 9,
                    strtolower($m->user?->first_name ?? $m->user?->email ?? '')
                );
            })
            ->values()
            ->map(function ($m) {
                return [
                    'id' => $m->id,
                    'user_id' => $m->user_id,
                    'name' => $m->user?->first_name,
                    'email' => $m->user?->email,
                    'role' => $m->role,
                    'status' => $m->status,
                    'joined_at' => $m->joined_at?->toIso8601String(),
                ];
            });

        // Pending invitations that are not expired
        $pendingInvitations = BusinessInvitation::where('business_id', $business->id)
            ->where('status', 'pending')
            ->where('expires_at', '>', Carbon::now())
            ->with(['inviter' => function ($query) {
                $query->select('id', 'first_name', 'email');
            }])
            ->latest()
            ->get()
            ->map(function ($inv) {
                return [
                    'id' => $inv->id,
                    'email' => $inv->email,
                    'role' => $inv->role,
                    'status' => 'pending',
                    'invited_by_name' => $inv->inviter?->first_name,
                    'expires_at' => $inv->expires_at->toIso8601String(),
                    'created_at' => $inv->created_at->toIso8601String(),
                ];
            });

        return response()->json([
            'current_user_role' => $membership->role,
            'members' => $activeMembers,
            'invitations' => $pendingInvitations,
        ]);
    }

    /**
     * Invite a new staff member.
     */
    public function invite(Request $request, InviteBusinessMemberAction $action): JsonResponse
    {
        $user = $request->user();

        $membership = $user->businessMemberships()
            ->where('status', 'active')
            ->first();

        if (! $membership) {
            return response()->json(['message' => 'No active business membership found.'], 403);
        }

        $validated = $request->validate([
            'email' => ['required', 'email'],
            'role' => ['required', 'string', 'in:owner,manager,attendant'],
        ]);

        try {
            $invitation = $action->execute(
                $membership->business,
                $user,
                $validated['email'],
                $validated['role']
            );

            return response()->json([
                'message' => 'Invitation sent successfully.',
                'invitation' => [
                    'id' => $invitation->id,
                    'email' => $invitation->email,
                    'role' => $invitation->role,
                    'status' => $invitation->status,
                    'expires_at' => $invitation->expires_at->toIso8601String(),
                ],
            ], 201);
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => 'Invalid email address or role specified.'], 422);
        } catch (DomainException $e) {
            if ($e->getMessage() === 'ALREADY_ACTIVE_MEMBER') {
                return response()->json(['message' => 'This person already has access to this Business.'], 422);
            }
            if ($e->getMessage() === 'FORBIDDEN_ROLE_ASSIGNMENT') {
                return response()->json(['message' => 'You do not have permission to invite this role.'], 403);
            }

            return response()->json(['message' => 'Unable to send invitation.'], 422);
        }
    }

    /**
     * Resend an invitation.
     */
    public function resend(
        Request $request,
        string $invitationId,
        ResendBusinessInvitationAction $action
    ): JsonResponse {
        $user = $request->user();

        $membership = $user->businessMemberships()
            ->where('status', 'active')
            ->first();

        if (! $membership) {
            return response()->json(['message' => 'No active business membership found.'], 403);
        }

        $invitation = BusinessInvitation::where('id', $invitationId)
            ->where('business_id', $membership->business_id)
            ->first();

        if (! $invitation) {
            return response()->json(['message' => 'Invitation not found.'], 404);
        }

        try {
            $updated = $action->execute($membership->business, $invitation, $user);

            return response()->json([
                'message' => 'Invitation resent successfully.',
                'invitation' => [
                    'id' => $updated->id,
                    'email' => $updated->email,
                    'role' => $updated->role,
                    'status' => $updated->status,
                    'expires_at' => $updated->expires_at->toIso8601String(),
                ],
            ]);
        } catch (DomainException $e) {
            if ($e->getMessage() === 'FORBIDDEN') {
                return response()->json(['message' => 'You do not have permission to resend this invitation.'], 403);
            }

            return response()->json(['message' => 'Unable to resend invitation.'], 422);
        }
    }

    /**
     * Revoke / cancel an invitation.
     */
    public function revoke(
        Request $request,
        string $invitationId,
        RevokeBusinessInvitationAction $action
    ): JsonResponse {
        $user = $request->user();

        $membership = $user->businessMemberships()
            ->where('status', 'active')
            ->first();

        if (! $membership) {
            return response()->json(['message' => 'No active business membership found.'], 403);
        }

        $invitation = BusinessInvitation::where('id', $invitationId)
            ->where('business_id', $membership->business_id)
            ->first();

        if (! $invitation) {
            return response()->json(['message' => 'Invitation not found.'], 404);
        }

        try {
            $updated = $action->execute($membership->business, $invitation, $user);

            return response()->json([
                'message' => 'Invitation cancelled.',
                'invitation' => [
                    'id' => $updated->id,
                    'status' => $updated->status,
                ],
            ]);
        } catch (DomainException $e) {
            if ($e->getMessage() === 'FORBIDDEN') {
                return response()->json(['message' => 'You do not have permission to cancel this invitation.'], 403);
            }

            return response()->json(['message' => 'Unable to cancel invitation.'], 422);
        }
    }

    /**
     * Change a member's role.
     */
    public function changeRole(
        Request $request,
        int $membershipId,
        ChangeBusinessMemberRoleAction $action
    ): JsonResponse {
        $user = $request->user();

        $membership = $user->businessMemberships()
            ->where('status', 'active')
            ->first();

        if (! $membership) {
            return response()->json(['message' => 'No active business membership found.'], 403);
        }

        $targetMembership = BusinessMembership::where('id', $membershipId)
            ->where('business_id', $membership->business_id)
            ->first();

        if (! $targetMembership) {
            return response()->json(['message' => 'Member not found.'], 404);
        }

        $validated = $request->validate([
            'role' => ['required', 'string', 'in:owner,manager,attendant'],
        ]);

        try {
            $updated = $action->execute(
                $membership->business,
                $targetMembership,
                $validated['role'],
                $user
            );

            return response()->json([
                'message' => 'Role updated successfully.',
                'member' => [
                    'id' => $updated->id,
                    'user_id' => $updated->user_id,
                    'role' => $updated->role,
                    'status' => $updated->status,
                ],
            ]);
        } catch (DomainException $e) {
            if ($e->getMessage() === 'CANNOT_DEMOTE_LAST_OWNER') {
                return response()->json([
                    'message' => 'This is the only Owner. Add another Owner before removing or changing this role.',
                ], 422);
            }
            if ($e->getMessage() === 'FORBIDDEN') {
                return response()->json(['message' => "You don't have permission to change this role."], 403);
            }

            return response()->json(['message' => 'Could not change this role. Try again.'], 422);
        }
    }

    /**
     * Remove access for a member.
     */
    public function removeMember(
        Request $request,
        int $membershipId,
        RemoveBusinessMemberAction $action
    ): JsonResponse {
        $user = $request->user();

        $membership = $user->businessMemberships()
            ->where('status', 'active')
            ->first();

        if (! $membership) {
            return response()->json(['message' => 'No active business membership found.'], 403);
        }

        $targetMembership = BusinessMembership::where('id', $membershipId)
            ->where('business_id', $membership->business_id)
            ->first();

        if (! $targetMembership) {
            return response()->json(['message' => 'Member not found.'], 404);
        }

        try {
            $removed = $action->execute(
                $membership->business,
                $targetMembership,
                $user
            );

            return response()->json([
                'message' => 'Staff access removed successfully.',
                'member' => [
                    'id' => $removed->id,
                    'user_id' => $removed->user_id,
                    'status' => $removed->status,
                ],
            ]);
        } catch (DomainException $e) {
            if ($e->getMessage() === 'CANNOT_REMOVE_LAST_OWNER') {
                return response()->json([
                    'message' => 'This is the only Owner. Add another Owner before removing or changing this role.',
                ], 422);
            }
            if ($e->getMessage() === 'FORBIDDEN') {
                return response()->json(['message' => "You don't have permission to remove this staff member."], 403);
            }

            return response()->json(['message' => 'Could not remove access. Try again.'], 422);
        }
    }
}
