<?php

namespace App\Actions\Packages;

use App\Models\Business;
use App\Models\Package;
use App\Models\SyncChange;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class CreatePackageAction
{
    /**
     * Create a new package and log sync change.
     */
    public function execute(
        Business $business,
        array $payload,
        string $userId,
        string $deviceUuid,
        ?string $clientCreatedAt = null
    ): Package {
        return DB::transaction(function () use ($business, $payload, $userId, $deviceUuid, $clientCreatedAt) {

            $package = Package::create([
                'id' => $payload['package_id'],
                'business_id' => $business->id,
                'customer_id' => $payload['customer_id'],
                'pickup_point_id' => $payload['pickup_point_id'] ?? null,
                'public_package_id' => $payload['public_package_id'],
                'pickup_code' => $payload['pickup_code'],
                'amount_due_minor' => $payload['amount_due_minor'] ?? 0,
                'status' => 'WAITING',
                'created_by_user_id' => $userId,
                'created_by_device_uuid' => $deviceUuid,
                'client_created_at' => $clientCreatedAt ? Carbon::parse($clientCreatedAt) : now(),
                'version' => 1,
            ]);

            // Sync Engine: log the change
            SyncChange::create([
                'business_id' => $business->id,
                'entity_type' => 'package',
                'entity_id' => $package->id,
                'operation' => 'CREATED',
                'payload' => $package->toArray(),
            ]);

            // If arrival SMS was requested, queue an outbox intent (omitted true SMS logic for this milestone, just tracking intent if requested)
            if (! empty($payload['arrival_sms_requested'])) {
                DB::table('outbox_events')->insert([
                    'business_id' => $business->id,
                    'type' => 'ARRIVAL_SMS_REQUESTED',
                    'payload' => json_encode(['package_id' => $package->id]),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            return $package;
        });
    }
}
