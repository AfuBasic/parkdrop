<?php

namespace App\Services\Sync\Handlers;

use App\Actions\Packages\ReturnPackageAction;
use App\Contracts\Sync\MutationHandler;
use App\Enums\PackageReturnReason;
use App\Models\Business;
use App\Models\Package;
use App\Models\PackageLifecycleEvent;
use DomainException;
use Illuminate\Support\Facades\Validator;
use InvalidArgumentException;

class ReturnPackageMutationHandler implements MutationHandler
{
    public function __construct(
        protected ReturnPackageAction $returnPackageAction
    ) {}

    public function operation(): string
    {
        return 'RETURN_PACKAGE';
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
            'reason' => 'required|string|in:CUSTOMER_DID_NOT_COLLECT,RETURNED_TO_SENDER,WRONG_DESTINATION,DAMAGED,OTHER',
            'reason_note' => 'nullable|string|max:300',
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
                'metadata' => ['error' => 'PACKAGE_NOT_FOUND'],
            ];
        }

        // Idempotency: If this exact lifecycle event ID already exists for this business, return APPLIED
        $existingEvent = PackageLifecycleEvent::where('id', $payload['event_id'])
            ->where('business_id', $businessId)
            ->first();

        if ($existingEvent) {
            return [
                'status' => 'APPLIED',
                'metadata' => [
                    'event_id' => $existingEvent->id,
                    'package_id' => $existingEvent->package_id,
                    'type' => $existingEvent->type,
                    'reason' => $existingEvent->reason,
                    'idempotent_replay' => true,
                ],
            ];
        }

        try {
            $event = $this->returnPackageAction->execute(
                $business,
                $package,
                [
                    'event_id' => $payload['event_id'],
                    'reason' => PackageReturnReason::from($payload['reason']),
                    'reason_note' => $payload['reason_note'] ?? null,
                    'client_event_at' => $payload['client_event_at'] ?? null,
                ],
                $userId,
                $deviceUuid
            );

            return [
                'status' => 'APPLIED',
                'metadata' => [
                    'event_id' => $event->id,
                    'package_id' => $event->package_id,
                    'type' => $event->type,
                    'reason' => $event->reason,
                ],
            ];
        } catch (DomainException $e) {
            $conflictErrors = [
                'PACKAGE_ALREADY_COLLECTED',
                'PACKAGE_ALREADY_RETURNED',
                'PACKAGE_ALREADY_CANCELLED',
                'PACKAGE_NOT_RETURNABLE',
            ];

            if (in_array($e->getMessage(), $conflictErrors, true)) {
                return [
                    'status' => 'CONFLICT',
                    'metadata' => [
                        'error' => $e->getMessage(),
                        'current_status' => $package->fresh()->status,
                        'message' => 'This package was already '.strtolower($package->fresh()->status).' on another device.',
                    ],
                ];
            }

            return [
                'status' => 'REJECTED',
                'metadata' => [
                    'error' => $e->getMessage(),
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
