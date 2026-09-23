<?php

namespace App\Http\Controllers\Api\V1\Account;

use App\Actions\Account\RevokeOtherDevicesAction;
use App\Actions\Account\RevokeUserDeviceAction;
use App\Actions\Account\UpdateAccountProfileAction;
use App\Http\Controllers\Controller;
use App\Models\UserDevice;
use DomainException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;

class AccountSecurityController extends Controller
{
    /**
     * Get the authenticated user's account profile and active memberships summary.
     */
    public function profile(Request $request): JsonResponse
    {
        $user = $request->user();

        $memberships = $user->businessMemberships()
            ->where('status', 'active')
            ->with('business')
            ->get()
            ->map(fn ($m) => [
                'business_id' => $m->business_id,
                'business_name' => $m->business?->name,
                'role' => $m->role,
            ]);

        return response()->json([
            'user' => [
                'id' => $user->id,
                'email' => $user->email,
                'first_name' => $user->first_name,
                'status' => $user->status,
                'email_verified_at' => $user->email_verified_at?->toIso8601String(),
            ],
            'businesses' => $memberships,
        ]);
    }

    /**
     * Update user's display name.
     */
    public function updateProfile(
        Request $request,
        UpdateAccountProfileAction $action
    ): JsonResponse {
        $user = $request->user();

        $validated = $request->validate([
            'first_name' => ['required', 'string', 'min:2', 'max:100'],
        ]);

        try {
            $updatedUser = $action->execute($user, $validated);

            return response()->json([
                'message' => 'Profile updated successfully.',
                'user' => [
                    'id' => $updatedUser->id,
                    'email' => $updatedUser->email,
                    'first_name' => $updatedUser->first_name,
                    'status' => $updatedUser->status,
                ],
            ]);
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => 'Invalid display name provided.'], 422);
        }
    }

    /**
     * List registered devices owned by the authenticated user.
     */
    public function devices(Request $request): JsonResponse
    {
        $user = $request->user();
        $currentDeviceUuid = $request->header('X-Device-UUID') ?: $request->input('device_uuid');

        // Touch current device last_seen_at if device UUID sent
        if (! empty($currentDeviceUuid)) {
            UserDevice::where('user_id', $user->id)
                ->where('device_uuid', $currentDeviceUuid)
                ->update(['last_seen_at' => now()]);
        }

        $devices = UserDevice::where('user_id', $user->id)
            ->orderByDesc('last_seen_at')
            ->orderByDesc('created_at')
            ->get()
            ->map(function ($d) use ($currentDeviceUuid) {
                return [
                    'id' => $d->id,
                    'device_name' => $d->device_name ?: 'This device',
                    'is_current' => ! empty($currentDeviceUuid) && $d->device_uuid === $currentDeviceUuid,
                    'authorized_at' => $d->authorized_at?->toIso8601String(),
                    'last_seen_at' => $d->last_seen_at?->toIso8601String(),
                    'revoked_at' => $d->revoked_at?->toIso8601String(),
                    'is_revoked' => ! is_null($d->revoked_at),
                ];
            });

        return response()->json([
            'devices' => $devices,
        ]);
    }

    /**
     * Revoke a registered device owned by the user.
     */
    public function revokeDevice(
        Request $request,
        int $id,
        RevokeUserDeviceAction $action
    ): JsonResponse {
        $user = $request->user();

        try {
            $device = $action->execute($user, $id);

            return response()->json([
                'message' => 'Device access revoked successfully.',
                'device' => [
                    'id' => $device->id,
                    'is_revoked' => true,
                    'revoked_at' => $device->revoked_at?->toIso8601String(),
                ],
            ]);
        } catch (DomainException $e) {
            if ($e->getMessage() === 'DEVICE_NOT_FOUND') {
                return response()->json(['message' => 'Device not found.'], 404);
            }

            return response()->json(['message' => 'Unable to revoke device.'], 422);
        }
    }

    /**
     * Revoke all other registered devices owned by the user.
     */
    public function revokeOtherDevices(
        Request $request,
        RevokeOtherDevicesAction $action
    ): JsonResponse {
        $user = $request->user();
        $currentDeviceUuid = $request->header('X-Device-UUID') ?: $request->input('device_uuid');

        $revokedCount = $action->execute($user, $currentDeviceUuid);

        return response()->json([
            'message' => 'All other devices revoked successfully.',
            'revoked_count' => $revokedCount,
        ]);
    }
}
