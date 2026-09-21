<?php

namespace App\Actions\Account;

use App\Models\Device;
use App\Models\User;
use App\Models\UserDevice;
use Illuminate\Support\Facades\DB;

class RevokeOtherDevicesAction
{
    /**
     * Revoke all registered devices owned by the user except the specified current device.
     */
    public function execute(User $user, ?string $currentDeviceUuid = null): int
    {
        return DB::transaction(function () use ($user, $currentDeviceUuid) {
            $query = UserDevice::where('user_id', $user->id)
                ->whereNull('revoked_at');

            if (! empty($currentDeviceUuid)) {
                $query->where('device_uuid', '!=', $currentDeviceUuid);
            }

            $devicesToRevoke = $query->lockForUpdate()->get();
            $count = $devicesToRevoke->count();

            if ($count === 0) {
                return 0;
            }

            $uuids = $devicesToRevoke->pluck('device_uuid')->all();

            UserDevice::whereIn('id', $devicesToRevoke->pluck('id'))->update([
                'revoked_at' => now(),
            ]);

            Device::whereIn('uuid', $uuids)->update([
                'is_revoked' => true,
            ]);

            return $count;
        });
    }
}
