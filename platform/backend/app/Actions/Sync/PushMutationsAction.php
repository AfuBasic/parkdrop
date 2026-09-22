<?php

namespace App\Actions\Sync;

use App\Models\Business;
use App\Models\Device;
use App\Models\SyncMutationReceipt;
use App\Services\Sync\MutationRegistry;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PushMutationsAction
{
    public function __construct(
        protected MutationRegistry $registry
    ) {}

    public function execute(array $mutations, string $deviceUuid, Business $business, ?int $userId): array
    {
        $results = [];

        // Ensure device exists or touch last seen
        $device = Device::firstOrCreate(
            ['uuid' => $deviceUuid],
            ['user_id' => $userId, 'is_revoked' => false, 'last_seen_at' => now()]
        );
        $device->update(['last_seen_at' => now()]);

        if ($device->is_revoked) {
            foreach ($mutations as $mutation) {
                $results[] = [
                    'mutation_id' => $mutation['mutation_id'],
                    'status' => 'REJECTED',
                    'error' => 'DEVICE_REVOKED',
                ];
            }

            return $results;
        }

        foreach ($mutations as $mutation) {
            $mutationId = $mutation['mutation_id'];
            $operation = $mutation['operation'];
            $payload = $mutation['payload'] ?? [];
            $deviceSequence = $mutation['device_sequence'] ?? null;
            $pickupPointId = $mutation['pickup_point_id'] ?? null;

            $payloadHash = md5(json_encode($payload));

            try {
                // Idempotency check: see if we already have a receipt for this mutation_id
                $receipt = SyncMutationReceipt::where('mutation_id', $mutationId)->first();

                if ($receipt) {
                    $results[] = [
                        'mutation_id' => $mutationId,
                        'status' => $receipt->result_status,
                        'metadata' => $receipt->result_metadata,
                    ];

                    continue;
                }

                $handler = $this->registry->getHandler($operation);
                if (! $handler) {
                    $this->recordReceipt($mutationId, $deviceUuid, $deviceSequence, $userId, $business->id, $operation, $payloadHash, 'REJECTED', ['error' => 'UNSUPPORTED_OPERATION']);
                    $results[] = [
                        'mutation_id' => $mutationId,
                        'status' => 'REJECTED',
                        'metadata' => ['error' => 'UNSUPPORTED_OPERATION'],
                    ];

                    continue;
                }

                // Execute the mutation in a transaction
                $result = DB::transaction(function () use ($handler, $payload, $business, $userId, $deviceUuid, $pickupPointId, $mutationId, $deviceSequence, $operation, $payloadHash) {

                    $handlerResult = $handler->handle($payload, $business->id, $userId, $deviceUuid, $pickupPointId);

                    $status = $handlerResult['status'] ?? 'APPLIED';
                    $metadata = $handlerResult['metadata'] ?? [];

                    $this->recordReceipt($mutationId, $deviceUuid, $deviceSequence, $userId, $business->id, $operation, $payloadHash, $status, $metadata);

                    return [
                        'status' => $status,
                        'metadata' => $metadata,
                    ];
                });

                $results[] = [
                    'mutation_id' => $mutationId,
                    'status' => $result['status'],
                    'metadata' => $result['metadata'],
                ];

            } catch (\Exception $e) {
                Log::error("Mutation failed: {$operation} ({$mutationId})", ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);

                // For unhandled exceptions, we might not want to record a permanent receipt if it's retryable (e.g., deadlock).
                // Let's assume generic exceptions are retryable server errors unless they are specific validation exceptions.
                $results[] = [
                    'mutation_id' => $mutationId,
                    'status' => 'RETRYABLE',
                    'metadata' => ['error' => 'SERVER_TEMPORARY_FAILURE'],
                ];
            }
        }

        return $results;
    }

    protected function recordReceipt(string $mutationId, string $deviceUuid, ?int $deviceSequence, ?int $userId, int $businessId, string $operation, string $payloadHash, string $status, array $metadata): void
    {
        try {
            SyncMutationReceipt::create([
                'mutation_id' => $mutationId,
                'device_uuid' => $deviceUuid,
                'device_sequence' => $deviceSequence,
                'user_id' => $userId,
                'business_id' => $businessId,
                'operation' => $operation,
                'payload_hash' => $payloadHash,
                'result_status' => $status,
                'result_metadata' => $metadata,
                'processed_at' => now(),
            ]);
        } catch (\Illuminate\Database\QueryException $e) {
            // If the legacy unique constraint on device_sequence fails (migration not applied), insert with null sequence
            if (str_contains($e->getMessage(), 'device_uuid_device_sequence_unique')) {
                SyncMutationReceipt::create([
                    'mutation_id' => $mutationId,
                    'device_uuid' => $deviceUuid,
                    'device_sequence' => null,
                    'user_id' => $userId,
                    'business_id' => $businessId,
                    'operation' => $operation,
                    'payload_hash' => $payloadHash,
                    'result_status' => $status,
                    'result_metadata' => $metadata,
                    'processed_at' => now(),
                ]);
            } else {
                throw $e;
            }
        }
    }
}
