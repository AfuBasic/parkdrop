<?php

namespace App\Actions\PickupPoints;

use App\Models\ActivityLog;
use App\Models\Business;
use App\Models\BusinessMembership;
use App\Models\PickupPoint;
use App\Models\SyncChange;
use App\Models\User;
use DomainException;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class RenamePickupPointAction
{
    /**
     * Rename an existing pickup point within an authorized business.
     * Allowed for 'owner' and 'manager' roles.
     *
     * @throws DomainException
     * @throws InvalidArgumentException
     */
    public function execute(
        Business $business,
        PickupPoint $pickupPoint,
        array $payload,
        User $actor
    ): PickupPoint {
        if ($pickupPoint->business_id !== $business->id) {
            throw new DomainException('FORBIDDEN');
        }

        $actorMembership = BusinessMembership::where('business_id', $business->id)
            ->where('user_id', $actor->id)
            ->where('status', 'active')
            ->first();

        if (! $actorMembership) {
            throw new DomainException('UNAUTHORIZED');
        }

        if (! in_array($actorMembership->role, ['owner', 'manager'], true)) {
            throw new DomainException('FORBIDDEN');
        }

        $name = isset($payload['name']) ? trim($payload['name']) : '';
        if (empty($name)) {
            throw new InvalidArgumentException('PICKUP_POINT_NAME_REQUIRED');
        }

        if (mb_strlen($name) < 2 || mb_strlen($name) > 100) {
            throw new InvalidArgumentException('PICKUP_POINT_NAME_INVALID_LENGTH');
        }

        $parkName = isset($payload['park_name']) ? trim($payload['park_name']) : $pickupPoint->park_name;

        return DB::transaction(function () use ($business, $pickupPoint, $name, $parkName, $actor) {
            $locked = PickupPoint::where('id', $pickupPoint->id)
                ->where('business_id', $business->id)
                ->lockForUpdate()
                ->first();

            if (! $locked) {
                throw new DomainException('NOT_FOUND');
            }

            // Check duplicate name excluding this pickup point
            $duplicate = PickupPoint::where('business_id', $business->id)
                ->where('id', '!=', $locked->id)
                ->where('status', 'active')
                ->whereRaw('LOWER(name) = ?', [mb_strtolower($name)])
                ->lockForUpdate()
                ->first();

            if ($duplicate) {
                throw new DomainException('DUPLICATE_NAME');
            }

            $oldName = $locked->name;
            $oldPhone = $locked->contact_phone;
            $updates = [
                'name' => $name,
                'park_name' => $parkName,
            ];

            $phoneChanged = false;
            if (array_key_exists('contact_phone', $payload)) {
                $rawPhone = $payload['contact_phone'] !== null ? trim($payload['contact_phone']) : null;
                $newPhone = null;
                if ($rawPhone) {
                    $digits = preg_replace('/\D/', '', $rawPhone);
                    if (str_starts_with($digits, '0') && strlen($digits) === 11) {
                        $newPhone = '234'.substr($digits, 1);
                    } elseif (str_starts_with($digits, '234') && strlen($digits) === 13) {
                        $newPhone = $digits;
                    } elseif (strlen($digits) === 10) {
                        $newPhone = '234'.$digits;
                    }
                }

                if ($newPhone !== $oldPhone) {
                    $phoneChanged = true;
                    $updates['contact_phone'] = $newPhone;
                    $updates['contact_phone_confirmed_at'] = $newPhone ? now() : null;
                    $updates['contact_phone_source'] = $newPhone ? 'entered' : null;

                    // Audit the phone change with masked phones (last 4 digits)
                    $oldMasked = $oldPhone ? '...'.substr($oldPhone, -4) : null;
                    $newMasked = $newPhone ? '...'.substr($newPhone, -4) : null;

                    \App\Models\PickupPointPhoneAudit::create([
                        'business_id' => $business->id,
                        'pickup_point_id' => $locked->id,
                        'user_id' => $actor->id,
                        'old_phone_masked' => $oldMasked,
                        'new_phone_masked' => $newMasked ?? 'NONE',
                        'ip_address' => request()->ip(),
                    ]);
                }
            }

            $locked->update($updates);

            ActivityLog::create([
                'business_id' => $business->id,
                'package_id' => null,
                'user_id' => $actor->id,
                'type' => 'PICKUP_POINT_RENAMED',
                'payload' => [
                    'pickup_point_id' => $locked->id,
                    'old_name' => $oldName,
                    'new_name' => $name,
                ],
            ]);

            SyncChange::create([
                'business_id' => $business->id,
                'entity_type' => 'pickup_point',
                'entity_id' => $locked->id,
                'operation' => 'UPDATED',
                'entity_version' => 1,
            ]);

            return $locked;
        });
    }
}
