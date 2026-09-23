<?php

namespace App\Actions\Payments;

use App\Enums\PaymentMethod;
use App\Models\ActivityLog;
use App\Models\Business;
use App\Models\Package;
use App\Models\Payment;
use App\Models\SyncChange;
use Carbon\Carbon;
use DomainException;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class RecordPaymentAction
{
    /**
     * Record a payment against a package authoritatively inside a DB transaction with row locking.
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
    ): Payment {
        return DB::transaction(function () use ($business, $package, $payload, $userId, $deviceUuid) {
            // Row-lock the package for authoritative concurrency safety
            $lockedPackage = Package::where('id', $package->id)
                ->where('business_id', $business->id)
                ->lockForUpdate()
                ->first();

            if (! $lockedPackage) {
                throw new DomainException('PACKAGE_NOT_FOUND');
            }

            // Only WAITING packages permit new ordinary payments in V1
            if ($lockedPackage->status !== 'WAITING') {
                throw new DomainException('PACKAGE_STATUS_FORBIDS_PAYMENT');
            }

            $paymentId = $payload['payment_id'];
            $amountMinor = (int) $payload['amount_minor'];

            if ($amountMinor <= 0) {
                throw new InvalidArgumentException('PAYMENT_AMOUNT_MUST_BE_POSITIVE');
            }

            // Idempotency: If this exact payment ID already exists for this business/package, return it
            $existingPayment = Payment::where('id', $paymentId)
                ->where('business_id', $business->id)
                ->first();

            if ($existingPayment) {
                return $existingPayment;
            }

            // Calculate current net paid from canonical ledger
            $currentNetPaidMinor = (int) Payment::where('package_id', $lockedPackage->id)
                ->where('business_id', $business->id)
                ->where('status', 'COMPLETED')
                ->sum('amount_minor');

            $remainingBalanceMinor = max(0, $lockedPackage->amount_due_minor - $currentNetPaidMinor);

            // Enforce V1 overpayment prevention policy
            if ($amountMinor > $remainingBalanceMinor) {
                throw new DomainException('OVERPAYMENT_FORBIDDEN');
            }

            $method = $payload['method'] instanceof PaymentMethod
                ? $payload['method']
                : PaymentMethod::from($payload['method']);

            $clientRecordedAt = ! empty($payload['client_recorded_at'])
                ? Carbon::parse($payload['client_recorded_at'])
                : now();

            $payment = Payment::create([
                'id' => $paymentId,
                'business_id' => $business->id,
                'package_id' => $lockedPackage->id,
                'amount_minor' => $amountMinor,
                'method' => $method,
                'recorded_by_user_id' => $userId,
                'recorded_by_device_uuid' => $deviceUuid,
                'recorded_at' => now(),
                'client_recorded_at' => $clientRecordedAt,
                'status' => 'COMPLETED',
                'version' => 1,
            ]);

            // Sync projection
            SyncChange::create([
                'business_id' => $business->id,
                'entity_type' => 'payment',
                'entity_id' => $payment->id,
                'operation' => 'CREATED',
                'payload' => $payment->toArray(),
            ]);

            // Activity Log entry (auditable event)
            ActivityLog::create([
                'business_id' => $business->id,
                'package_id' => $lockedPackage->id,
                'user_id' => $userId,
                'type' => 'PAYMENT_RECORDED',
                'payload' => [
                    'payment_id' => $payment->id,
                    'amount_minor' => $amountMinor,
                    'method' => $method->value,
                ],
                'created_at' => now(),
            ]);

            return $payment;
        });
    }
}
