<?php

namespace App\Services\Sync\Handlers;

use App\Contracts\Sync\MutationHandler;
use App\Models\Customer;
use App\Models\SyncChange;
use App\Services\PhoneNormalizer;
use Illuminate\Support\Facades\Validator;

class CreateCustomerMutationHandler implements MutationHandler
{
    public function operation(): string
    {
        return 'CREATE_CUSTOMER';
    }

    public function handle(array $payload, int $businessId, ?int $userId, string $deviceUuid, ?int $pickupPointId): array
    {
        $validator = Validator::make($payload, [
            'customer_id' => 'required|uuid',
            'name' => 'required|string|max:255',
            'phone_display' => 'required|string|max:255',
        ]);

        if ($validator->fails()) {
            return [
                'status' => 'REJECTED',
                'metadata' => ['errors' => $validator->errors()->toArray()],
            ];
        }

        $data = $validator->validated();

        $normalizedPhone = PhoneNormalizer::normalize($data['phone_display']);

        if (! $normalizedPhone) {
            return [
                'status' => 'REJECTED',
                'metadata' => ['error' => 'INVALID_PHONE'],
            ];
        }

        // Clean up name
        $name = trim(preg_replace('/\s+/', ' ', $data['name']));

        // Concurrency / Duplicate check
        $existing = Customer::where('business_id', $businessId)
            ->where('phone_normalized', $normalizedPhone)
            ->lockForUpdate()
            ->first();

        if ($existing) {
            // Duplicate reconciliation.
            // A customer with this normalized phone already exists for this business.
            // We map the locally requested customer_id to the canonical one.
            return [
                'status' => 'APPLIED',
                'metadata' => [
                    'canonical_id' => $existing->id,
                    'reconciled' => true,
                ],
            ];
        }

        // Create new customer
        $customer = Customer::create([
            'id' => $data['customer_id'],
            'business_id' => $businessId,
            'name' => $name,
            'phone_display' => $data['phone_display'],
            'phone_normalized' => $normalizedPhone,
            'version' => 1,
        ]);

        // Record sync change
        SyncChange::create([
            'business_id' => $businessId,
            'pickup_point_id' => null, // Customers are business-wide
            'entity_type' => 'customer',
            'entity_id' => $customer->id,
            'operation' => 'CREATED',
            'entity_version' => 1,
        ]);

        return [
            'status' => 'APPLIED',
            'metadata' => [
                'canonical_id' => $customer->id,
                'reconciled' => false,
            ],
        ];
    }
}
