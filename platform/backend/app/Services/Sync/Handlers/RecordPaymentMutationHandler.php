<?php

namespace App\Services\Sync\Handlers;

use App\Actions\Payments\RecordPaymentAction;
use App\Contracts\Sync\MutationHandler;
use App\Enums\PaymentMethod;
use App\Models\Business;
use App\Models\Package;
use App\Models\Payment;
use DomainException;
use Illuminate\Support\Facades\Validator;
use InvalidArgumentException;

class RecordPaymentMutationHandler implements MutationHandler
{
    public function __construct(
        protected RecordPaymentAction $recordPaymentAction
    ) {}

    public function operation(): string
    {
        return 'RECORD_PAYMENT';
    }

    public function handle(
        array $payload,
        int $businessId,
        ?int $userId,
        string $deviceUuid,
        ?int $pickupPointId
    ): array {
        $validator = Validator::make($payload, [
            'payment_id' => 'required|uuid',
            'package_id' => 'required|uuid',
            'amount_minor' => 'required|integer|min:1',
            'method' => 'required|string|in:CASH,TRANSFER,POS,OTHER',
            'client_recorded_at' => 'nullable|date',
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

        // Idempotency: If this exact payment ID already exists for this package, return APPLIED immediately
        $existingPayment = Payment::where('id', $payload['payment_id'])
            ->where('business_id', $businessId)
            ->first();

        if ($existingPayment) {
            return [
                'status' => 'APPLIED',
                'metadata' => [
                    'payment_id' => $existingPayment->id,
                    'amount_minor' => $existingPayment->amount_minor,
                    'status' => $existingPayment->status,
                    'idempotent_replay' => true,
                ],
            ];
        }

        try {
            $payment = $this->recordPaymentAction->execute(
                $business,
                $package,
                [
                    'payment_id' => $payload['payment_id'],
                    'amount_minor' => (int) $payload['amount_minor'],
                    'method' => PaymentMethod::from($payload['method']),
                    'client_recorded_at' => $payload['client_recorded_at'] ?? null,
                ],
                $userId,
                $deviceUuid
            );

            return [
                'status' => 'APPLIED',
                'metadata' => [
                    'payment_id' => $payment->id,
                    'amount_minor' => $payment->amount_minor,
                    'method' => $payment->method->value,
                    'status' => $payment->status,
                ],
            ];
        } catch (DomainException $e) {
            return [
                'status' => 'REJECTED',
                'metadata' => [
                    'error' => $e->getMessage(),
                    'user_message' => match ($e->getMessage()) {
                        'OVERPAYMENT_FORBIDDEN' => 'Payment could not be recorded because the package is already fully paid or the amount exceeds the remaining balance.',
                        'PACKAGE_STATUS_FORBIDS_PAYMENT' => 'Payments cannot be recorded for this package because its status does not permit payment.',
                        default => 'Payment could not be recorded.',
                    },
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
