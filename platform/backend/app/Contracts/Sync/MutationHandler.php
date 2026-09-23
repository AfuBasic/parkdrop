<?php

namespace App\Contracts\Sync;

interface MutationHandler
{
    /**
     * The unique operation name this handler processes (e.g. 'CREATE_PACKAGE').
     */
    public function operation(): string;

    /**
     * Execute the mutation securely and idempotently within the current transaction.
     * Returns an array with status and metadata.
     */
    public function handle(array $payload, int $businessId, ?int $userId, string $deviceUuid, ?int $pickupPointId): array;
}
