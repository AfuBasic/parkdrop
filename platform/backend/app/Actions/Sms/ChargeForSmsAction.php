<?php

namespace App\Actions\Sms;

use App\Exceptions\Sms\InsufficientSmsCreditsException;
use App\Models\SmsCreditTransaction;
use App\Models\SmsWallet;
use App\Models\SyncChange;
use Illuminate\Support\Facades\DB;

class ChargeForSmsAction
{
    /**
     * Deducts SMS credits for an outbound SMS.
     *
     * Never lets the balance go negative — throws InsufficientSmsCreditsException
     * instead. Callers that must never block an already-sent message on a
     * billing failure (e.g. SendArrivalSmsJob, which charges only after Termii
     * has already confirmed the message was accepted) should catch this and
     * log it rather than let it fail the job or trigger a retry, since retrying
     * would risk sending the customer a duplicate SMS.
     */
    public function execute(int $businessId, int $amount = 1, ?string $referenceType = 'ARRIVAL_SMS', ?string $referenceId = null): array
    {
        return DB::transaction(function () use ($businessId, $amount, $referenceType, $referenceId) {
            $wallet = SmsWallet::where('business_id', $businessId)->lockForUpdate()->first();

            if (! $wallet) {
                $wallet = SmsWallet::create([
                    'business_id' => $businessId,
                    'balance' => 0,
                ]);
            }

            if ($wallet->balance < $amount) {
                throw new InsufficientSmsCreditsException($businessId, $wallet->balance, $amount);
            }

            $wallet->decrement('balance', $amount);
            $wallet->refresh();

            $transaction = SmsCreditTransaction::create([
                'sms_wallet_id' => $wallet->id,
                'amount' => $amount,
                'type' => 'DEBIT',
                'reference_type' => $referenceType,
                'reference_id' => $referenceId,
            ]);

            // Sync changes
            SyncChange::create([
                'business_id' => $businessId,
                'entity_type' => 'sms_wallet',
                'entity_id' => (string) $wallet->id,
                'operation' => 'UPDATED',
                'entity_version' => 1,
            ]);

            SyncChange::create([
                'business_id' => $businessId,
                'entity_type' => 'sms_credit_transaction',
                'entity_id' => (string) $transaction->id,
                'operation' => 'CREATED',
                'entity_version' => 1,
            ]);

            return [
                'wallet' => $wallet,
                'transaction' => $transaction,
            ];
        });
    }
}
