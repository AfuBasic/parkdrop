<?php

namespace App\Actions\Payments;

use App\Models\ActivityLog;
use App\Models\Business;
use App\Models\Package;
use App\Models\Payment;
use App\Models\SyncChange;
use DomainException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ReversePaymentAction
{
    /**
     * Authoritatively reverses a previously recorded payment.
     * Creates an immutable reversal payment record and updates the ledger.
     *
     * @throws DomainException
     */
    public function execute(
        Business $business,
        Payment $targetPayment,
        ?string $reversalReason = null,
        ?int $userId = null,
        ?string $deviceUuid = null
    ): Payment {
        return DB::transaction(function () use ($business, $targetPayment, $reversalReason, $userId, $deviceUuid) {
            // Lock package and target payment
            $package = Package::where('id', $targetPayment->package_id)
                ->where('business_id', $business->id)
                ->lockForUpdate()
                ->first();

            if (! $package) {
                throw new DomainException('PACKAGE_NOT_FOUND');
            }

            $lockedPayment = Payment::where('id', $targetPayment->id)
                ->where('business_id', $business->id)
                ->lockForUpdate()
                ->first();

            if (! $lockedPayment) {
                throw new DomainException('PAYMENT_NOT_FOUND');
            }

            if ($lockedPayment->status === 'REVERSED') {
                throw new DomainException('PAYMENT_ALREADY_REVERSED');
            }

            // Mark target payment as REVERSED
            $lockedPayment->update([
                'status' => 'REVERSED',
                'reversal_reason' => $reversalReason,
                'version' => $lockedPayment->version + 1,
            ]);

            // Create an immutable reversal offsetting audit record
            $reversalPayment = Payment::create([
                'id' => (string) Str::uuid(),
                'business_id' => $business->id,
                'package_id' => $package->id,
                'amount_minor' => -$lockedPayment->amount_minor,
                'method' => $lockedPayment->method,
                'recorded_by_user_id' => $userId,
                'recorded_by_device_uuid' => $deviceUuid,
                'recorded_at' => now(),
                'client_recorded_at' => now(),
                'status' => 'REVERSED',
                'reverses_payment_id' => $lockedPayment->id,
                'reversal_reason' => $reversalReason,
                'version' => 1,
            ]);

            // Sync projection
            SyncChange::create([
                'business_id' => $business->id,
                'entity_type' => 'payment',
                'entity_id' => $lockedPayment->id,
                'operation' => 'UPDATED',
                'payload' => $lockedPayment->toArray(),
            ]);

            SyncChange::create([
                'business_id' => $business->id,
                'entity_type' => 'payment',
                'entity_id' => $reversalPayment->id,
                'operation' => 'CREATED',
                'payload' => $reversalPayment->toArray(),
            ]);

            // Activity Log
            ActivityLog::create([
                'business_id' => $business->id,
                'package_id' => $package->id,
                'user_id' => $userId,
                'type' => 'PAYMENT_REVERSED',
                'payload' => [
                    'reversed_payment_id' => $lockedPayment->id,
                    'reversal_payment_id' => $reversalPayment->id,
                    'amount_minor' => $lockedPayment->amount_minor,
                    'reason' => $reversalReason,
                ],
                'created_at' => now(),
            ]);

            return $reversalPayment;
        });
    }
}
