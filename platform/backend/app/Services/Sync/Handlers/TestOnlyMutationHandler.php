<?php

namespace App\Services\Sync\Handlers;

use App\Contracts\Sync\MutationHandler;
use Illuminate\Support\Facades\Log;

class TestOnlyMutationHandler implements MutationHandler
{
    public function operation(): string
    {
        return 'TEST_OPERATION';
    }

    public function handle(array $payload, int $businessId, ?int $userId, string $deviceUuid, ?int $pickupPointId): array
    {
        Log::info('TestOnlyMutationHandler executed', [
            'payload' => $payload,
            'business_id' => $businessId,
            'user_id' => $userId,
            'device_uuid' => $deviceUuid,
            'pickup_point_id' => $pickupPointId,
        ]);

        if (isset($payload['fail'])) {
            return [
                'status' => 'REJECTED',
                'metadata' => ['error' => 'TEST_FAILURE_REQUESTED'],
            ];
        }

        if (isset($payload['conflict'])) {
            return [
                'status' => 'CONFLICT',
                'metadata' => ['error' => 'TEST_CONFLICT_REQUESTED'],
            ];
        }

        return [
            'status' => 'APPLIED',
            'metadata' => ['result' => 'TEST_SUCCESS'],
        ];
    }
}
