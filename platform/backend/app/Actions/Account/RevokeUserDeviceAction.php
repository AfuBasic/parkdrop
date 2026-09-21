<?php

namespace App\Actions\Account;

use App\Models\Device;
use App\Models\User;
use App\Models\UserDevice;
use DomainException;
use Illuminate\Support\Facades\DB;

class RevokeUserDeviceAction
{
    /**
     * Revoke a registered device owned by the user.
     * Marks user_devices.revoked_at and devices.is_revoked to ensure sync push is blocked.
     *
     * @throws DomainException
     */
    public function execute(User $user, int $userDeviceId): UserDevice
    {
        return DB::transaction(function () use ($user, $userDeviceId) {
            $userDevice = UserDevice::where('id', $userDeviceId)
                ->where('user_id', $user->id)
                ->lockForUpdate()
                ->first();

            if (! $userDevice) {
                throw new DomainException('DEVICE_NOT_FOUND');
            }

            // Idempotent: if already revoked, return directly
            if (! is_null($userDevice->revoked_at)) {
                return $userDevice;
            }

            $userDevice->update([
                'revoked_at' => now(),
            ]);

            // Synchronize with devices table if present so sync push is rejected
            $device = Device::where('uuid', $userDevice->device_uuid)->first();
            if ($device) {
                $device->update([
                    'is_revoked' => true,
                ]);
            }

            return $userDevice;
        });
    }
}
