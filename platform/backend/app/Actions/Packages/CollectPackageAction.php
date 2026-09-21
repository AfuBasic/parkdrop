<?php

namespace App\Actions\Packages;

use App\Models\ActivityLog;
use App\Models\Business;
use App\Models\Package;
use App\Models\PackageLifecycleEvent;
use App\Models\SyncChange;
use App\Models\User;
use Carbon\Carbon;
use DomainException;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class CollectPackageAction
{
    /**
     * Authoritatively transition a WAITING package to COLLECTED within a DB transaction and row-lock.
     *
     * @throws DomainException
     * @throws InvalidArgumentException
     */
    public function execute(
        Business $business,
        Package $package,
        array $payload,
        ?int $userId = null,
        ?string $deviceUuid = null
    ): PackageLifecycleEvent {
        return DB::transaction(function () use ($business, $package, $payload, $userId, $deviceUuid) {
            $eventId = $payload['event_id'];

            // Idempotency check: see if this exact lifecycle event ID already exists
            $existingEvent = PackageLifecycleEvent::where('id', $eventId)
                ->where('business_id', $business->id)
                ->first();

            if ($existingEvent) {
                return $existingEvent;
            }

            // Concurrency: acquire row-lock on Package
            $lockedPackage = Package::where('id', $package->id)
                ->where('business_id', $business->id)
                ->lockForUpdate()
                ->first();

            if (! $lockedPackage) {
                throw new DomainException('PACKAGE_NOT_FOUND');
            }

            // Strictly validate terminal state
            if ($lockedPackage->status === 'COLLECTED') {
                throw new DomainException('PACKAGE_ALREADY_COLLECTED');
            }

            if ($lockedPackage->status === 'RETURNED') {
                throw new DomainException('PACKAGE_ALREADY_RETURNED');
            }

            if ($lockedPackage->status === 'CANCELLED') {
                throw new DomainException('PACKAGE_ALREADY_CANCELLED');
            }

            if ($lockedPackage->status !== 'WAITING') {
                throw new DomainException('PACKAGE_NOT_COLLECTABLE');
            }

            // Verify pickup code if provided
            $providedCode = isset($payload['pickup_code']) ? strtoupper(trim((string) $payload['pickup_code'])) : null;
            if ($providedCode && strtoupper(trim($lockedPackage->pickup_code)) !== $providedCode) {
                throw new InvalidArgumentException('INVALID_PICKUP_CODE');
            }

            // Resolve actor name
            $actor = $userId ? User::find($userId) : null;
            $actorName = $actor?->first_name ?: ($actor?->email ? explode('@', $actor->email)[0] : 'Staff');

            $clientEventAt = ! empty($payload['client_event_at'])
                ? Carbon::parse($payload['client_event_at'])
                : now();

            $event = PackageLifecycleEvent::create([
                'id' => $eventId,
                'business_id' => $business->id,
                'package_id' => $lockedPackage->id,
                'type' => 'COLLECT',
                'reason' => 'CUSTOMER_COLLECTION',
                'reason_note' => $payload['notes'] ?? null,
                'actor_user_id' => $userId,
                'device_uuid' => $deviceUuid,
                'client_event_at' => $clientEventAt,
                'server_received_at' => now(),
            ]);

            // Update package status
            $lockedPackage->update([
                'status' => 'COLLECTED',
                'terminal_actor_name' => $actorName,
                'version' => $lockedPackage->version + 1,
            ]);

            // Write SyncChange for Package
            SyncChange::create([
                'business_id' => $business->id,
                'entity_type' => 'package',
                'entity_id' => $lockedPackage->id,
                'operation' => 'UPDATED',
                'payload' => array_merge($lockedPackage->fresh()->toArray(), [
                    'creator_name' => $lockedPackage->creator?->first_name,
                    'pickup_point_name' => $lockedPackage->pickupPoint?->name,
                ]),
            ]);

            // Write ActivityLog
            ActivityLog::create([
                'business_id' => $business->id,
                'package_id' => $lockedPackage->id,
                'user_id' => $userId,
                'type' => 'PACKAGE_COLLECTED',
                'payload' => [
                    'event_id' => $event->id,
                    'actor_name' => $actorName,
                    'pickup_code' => $lockedPackage->pickup_code,
                ],
                'created_at' => now(),
            ]);

            return $event;
        });
    }
}
