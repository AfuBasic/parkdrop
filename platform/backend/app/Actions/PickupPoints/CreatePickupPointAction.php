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

class CreatePickupPointAction
{
    /**
     * Create a new pickup point within an authorized business.
     * Allowed for 'owner' and 'manager' roles.
     *
     * @throws DomainException
     * @throws InvalidArgumentException
     */
    public function execute(
        Business $business,
        array $payload,
        User $actor
    ): PickupPoint {
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

        $parkName = isset($payload['park_name']) ? trim($payload['park_name']) : null;

        return DB::transaction(function () use ($business, $name, $parkName, $actor) {
            // Check for case-insensitive duplicate active name within the business
            $existing = PickupPoint::where('business_id', $business->id)
                ->where('status', 'active')
                ->whereRaw('LOWER(name) = ?', [mb_strtolower($name)])
                ->lockForUpdate()
                ->first();

            if ($existing) {
                throw new DomainException('DUPLICATE_NAME');
            }

            $rawPhone = isset($payload['contact_phone']) ? trim($payload['contact_phone']) : null;
            $normalizedContactPhone = null;
            if ($rawPhone) {
                $digits = preg_replace('/\D/', '', $rawPhone);
                if (str_starts_with($digits, '0') && strlen($digits) === 11) {
                    $normalizedContactPhone = '234'.substr($digits, 1);
                } elseif (str_starts_with($digits, '234') && strlen($digits) === 13) {
                    $normalizedContactPhone = $digits;
                } elseif (strlen($digits) === 10) {
                    $normalizedContactPhone = '234'.$digits;
                }
            }

            $pickupPoint = PickupPoint::create([
                'business_id' => $business->id,
                'name' => $name,
                'park_name' => $parkName,
                'contact_phone' => $normalizedContactPhone,
                'contact_phone_confirmed_at' => $normalizedContactPhone ? now() : null,
                'contact_phone_source' => $normalizedContactPhone ? 'entered' : null,
                'status' => 'active',
            ]);

            ActivityLog::create([
                'business_id' => $business->id,
                'package_id' => null,
                'user_id' => $actor->id,
                'type' => 'PICKUP_POINT_CREATED',
                'payload' => [
                    'pickup_point_id' => $pickupPoint->id,
                    'name' => $pickupPoint->name,
                ],
            ]);

            SyncChange::create([
                'business_id' => $business->id,
                'entity_type' => 'pickup_point',
                'entity_id' => $pickupPoint->id,
                'operation' => 'CREATED',
                'entity_version' => 1,
            ]);

            return $pickupPoint;
        });
    }
}
