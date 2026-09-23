<?php

namespace App\Services\Sync\Handlers;

use App\Actions\Packages\CollectPackageAction;
use App\Contracts\Sync\MutationHandler;
use App\Models\Business;
use App\Models\Package;
use App\Models\PackageLifecycleEvent;
use DomainException;
use Illuminate\Support\Facades\Validator;
use InvalidArgumentException;

class CollectPackageMutationHandler implements MutationHandler
{
    public function __construct(
        protected CollectPackageAction $collectPackageAction
    ) {}

    public function operation(): string
    {
        return 'COLLECT_PACKAGE';
    }

    public function handle(
        array $payload,
        int $businessId,
        ?int $userId,
        string $deviceUuid,
        ?int $pickupPointId
    ): array {
        $validator = Validator::make($payload, [
            'event_id' => 'required|uuid',
            'package_id' => 'required|uuid',
            'pickup_code' => 'nullable|string',
            'notes' => 'nullable|string|max:300',
            'client_event_at' => 'nullable|date',
        ]);

        if ($validator->fails()) {
            return [
                'status' => 'REJECTED',
                'metadata' => [
                    'error' => 'VALIDATION_FAILED',
                    'errors' => $validator->errors()->toArray(),
                ],
            ];
        }

        $business = Business::find($businessId);
        if (! $business) {
            return [
                'status' => 'REJECTED',
                'metadata' => ['error' => 'BUSINESS_NOT_FOUND'],
            ];
        }

        // Validate package belongs to this business
        $package = Package::where('id', $payload['package_id'])
            ->where('business_id', $businessId)
            ->first();

        if (! $package) {
            return [
                'status' => 'REJECTED',
                'metadata' => [
                    'error' => 'PACKAGE_NOT_FOUND',
                    'message' => 'Package does not exist in this business.',
                ],
            ];
        }

        // Check idempotency: if event already processed, return success immediately
        $existingEvent = PackageLifecycleEvent::where('id', $payload['event_id'])
            ->where('business_id', $businessId)
            ->first();

        if ($existingEvent) {
            return [
                'status' => 'APPLIED',
                'entity_id' => $package->id,
                'entity_type' => 'package',
                'version' => $package->version,
                'metadata' => [
                    'event_id' => $existingEvent->id,
                    'status' => $package->status,
                    'idempotent' => true,
                ],
            ];
        }

        // Check if package is already in terminal state
        if ($package->status === 'COLLECTED') {
            return [
                'status' => 'CONFLICT',
                'entity_id' => $package->id,
                'entity_type' => 'package',
                'version' => $package->version,
                'metadata' => [
                    'error' => 'ALREADY_COLLECTED',
                    'message' => 'This package has already been collected.',
                    'server_status' => 'COLLECTED',
                ],
            ];
        }

        if ($package->status === 'RETURNED' || $package->status === 'CANCELLED') {
            return [
                'status' => 'CONFLICT',
                'entity_id' => $package->id,
                'entity_type' => 'package',
                'version' => $package->version,
                'metadata' => [
                    'error' => 'PACKAGE_TERMINAL_CONFLICT',
                    'message' => "Package is in terminal state ({$package->status}) and cannot be collected.",
                    'server_status' => $package->status,
                ],
            ];
        }

        try {
            $event = $this->collectPackageAction->execute(
                $business,
                $package,
                $payload,
                $userId,
                $deviceUuid
            );

            $freshPackage = $package->fresh();

            return [
                'status' => 'APPLIED',
                'entity_id' => $freshPackage->id,
                'entity_type' => 'package',
                'version' => $freshPackage->version,
                'metadata' => [
                    'event_id' => $event->id,
                    'status' => $freshPackage->status,
                    'collected_at' => $event->server_received_at?->toISOString() ?? now()->toISOString(),
                ],
            ];
        } catch (DomainException $e) {
            return [
                'status' => 'CONFLICT',
                'entity_id' => $package->id,
                'entity_type' => 'package',
                'version' => $package->version,
                'metadata' => [
                    'error' => $e->getMessage(),
                    'server_status' => $package->fresh()->status,
                ],
            ];
        } catch (InvalidArgumentException $e) {
            return [
                'status' => 'REJECTED',
                'metadata' => [
                    'error' => $e->getMessage(),
                ],
            ];
        }
    }
}
