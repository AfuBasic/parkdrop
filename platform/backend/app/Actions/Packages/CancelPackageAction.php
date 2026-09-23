<?php

namespace App\Actions\Packages;

use App\Enums\PackageCancelReason;
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

class CancelPackageAction
{
    /**
     * Authoritatively transition a WAITING package to CANCELLED within a DB transaction and row-lock.
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
                throw new DomainException('PACKAGE_NOT_CANCELLABLE');
            }

            // Validate reason
            $reasonVal = $payload['reason'] ?? null;
            $reason = $reasonVal instanceof PackageCancelReason
                ? $reasonVal
                : PackageCancelReason::tryFrom((string) $reasonVal);

            if (! $reason) {
                throw new InvalidArgumentException('INVALID_CANCEL_REASON');
            }

            $reasonNote = isset($payload['reason_note']) ? trim($payload['reason_note']) : null;
            if ($reason === PackageCancelReason::OTHER && empty($reasonNote)) {
                throw new InvalidArgumentException('REASON_NOTE_REQUIRED_FOR_OTHER');
            }

            if ($reasonNote && mb_strlen($reasonNote) > 300) {
                throw new InvalidArgumentException('REASON_NOTE_TOO_LONG');
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
                'type' => 'CANCEL',
                'reason' => $reason->value,
                'reason_note' => $reasonNote,
                'actor_user_id' => $userId,
                'device_uuid' => $deviceUuid,
                'client_event_at' => $clientEventAt,
                'server_received_at' => now(),
            ]);

            // Update package status and terminal fields
            $lockedPackage->update([
                'status' => 'CANCELLED',
                'cancelled_at' => now(),
                'terminal_reason' => $reason->value,
                'terminal_reason_note' => $reasonNote,
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
                'type' => 'PACKAGE_CANCELLED',
                'payload' => [
                    'event_id' => $event->id,
                    'reason' => $reason->value,
                    'reason_label' => $reason->label(),
                    'reason_note' => $reasonNote,
                    'actor_name' => $actorName,
                ],
                'created_at' => now(),
            ]);

            return $event;
        });
    }
}
