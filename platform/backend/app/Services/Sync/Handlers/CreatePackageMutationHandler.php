<?php

namespace App\Services\Sync\Handlers;

use App\Actions\Packages\CreatePackageAction;
use App\Models\Business;
use App\Models\Customer;
use App\Models\Package;
use App\Models\PickupPoint;
use App\Services\Sync\MutationHandler;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class CreatePackageMutationHandler implements MutationHandler
{
    public function getOperationName(): string
    {
        return 'CREATE_PACKAGE';
    }

    public function handle(
        array $payload,
        int $businessId,
        ?int $pickupPointId,
        string $deviceUuid,
        ?string $userId = null
    ): array {
        $validator = Validator::make($payload, [
            'package_id' => 'required|uuid',
            'customer_id' => 'required|uuid',
            'public_package_id' => 'required|string|max:50',
            'pickup_code' => 'required|string|max:50',
            'amount_due_minor' => 'required|integer|min:0',
            'client_created_at' => 'nullable|date',
            'arrival_sms_requested' => 'nullable|boolean',
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

        // Validate Business Access and Tenancy
        $business = Business::find($businessId);
        if (! $business) {
            return [
                'status' => 'REJECTED',
                'metadata' => ['error' => 'BUSINESS_NOT_FOUND'],
            ];
        }

        // Validate Customer belongs to Business
        $customer = Customer::where('id', $payload['customer_id'])
            ->where('business_id', $businessId)
            ->first();

        if (! $customer) {
            return [
                'status' => 'REJECTED',
                'metadata' => ['error' => 'CUSTOMER_NOT_FOUND_OR_UNAUTHORIZED'],
            ];
        }

        // Validate Pickup Point belongs to Business if provided
        if (! empty($payload['pickup_point_id'])) {
            $pickupPoint = PickupPoint::where('id', $payload['pickup_point_id'])
                ->where('business_id', $businessId)
                ->first();

            if (! $pickupPoint) {
                return [
                    'status' => 'REJECTED',
                    'metadata' => ['error' => 'PICKUP_POINT_NOT_FOUND_OR_UNAUTHORIZED'],
                ];
            }
        }

        $payload['pickup_point_id'] = $payload['pickup_point_id'] ?? $pickupPointId;

        // Ensure user ID is available
        if (! $userId) {
            return [
                'status' => 'REJECTED',
                'metadata' => ['error' => 'UNAUTHORIZED_USER'],
            ];
        }

        // Enforce uniqueness for public_package_id and pickup_code within business
        // Handled within lock
        try {
            DB::beginTransaction();

            $existingPublicId = Package::where('business_id', $businessId)
                ->where('public_package_id', $payload['public_package_id'])
                ->lockForUpdate()
                ->first();

            if ($existingPublicId) {
                DB::rollBack();

                return [
                    'status' => 'CONFLICT',
                    'metadata' => [
                        'error' => 'PUBLIC_PACKAGE_ID_COLLISION',
                    ],
                ];
            }

            $existingPickupCode = Package::where('business_id', $businessId)
                ->where('pickup_code', $payload['pickup_code'])
                ->lockForUpdate()
                ->first();

            if ($existingPickupCode) {
                DB::rollBack();

                return [
                    'status' => 'CONFLICT',
                    'metadata' => [
                        'error' => 'PICKUP_CODE_COLLISION',
                    ],
                ];
            }

            $action = new CreatePackageAction;
            $package = $action->execute(
                $business,
                $payload,
                $userId,
                $deviceUuid,
                $payload['client_created_at'] ?? null
            );

            DB::commit();

            return [
                'status' => 'APPLIED',
                'metadata' => [
                    'package_id' => $package->id,
                ],
            ];

        } catch (\Exception $e) {
            DB::rollBack();

            return [
                'status' => 'RETRYABLE',
                'metadata' => [
                    'error' => 'DATABASE_ERROR',
                    'message' => $e->getMessage(),
                ],
            ];
        }
    }
}
