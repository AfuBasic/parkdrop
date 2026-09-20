<?php

namespace App\Actions\Sms;

use App\Models\Business;
use App\Models\SmsCreditTransaction;
use App\Models\SmsWallet;
use App\Models\SyncChange;
use Exception;
use Illuminate\Support\Facades\DB;

class ChargeForSmsAction
{
    /**
     * Deducts SMS credits for an outbound SMS.
     * Throws an Exception if insufficient balance.
     */
    public function execute(Business $business, int $amount = 1, ?string $referenceType = 'ARRIVAL_SMS', ?string $referenceId = null): array
    {
        return DB::transaction(function () use ($business, $amount, $referenceType, $referenceId) {
            $wallet = SmsWallet::where('business_id', $business->id)->lockForUpdate()->first();

            if (! $wallet) {
                $wallet = SmsWallet::create([
                    'business_id' => $business->id,
                    'balance' => 0,
                ]);
            }

            if ($wallet->balance < $amount) {
                throw new Exception('INSUFFICIENT_CREDITS');
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
                'business_id' => $business->id,
                'entity_type' => 'sms_wallet',
                'entity_id' => (string) $wallet->id,
                'operation' => 'UPDATED',
                'entity_version' => 1,
            ]);

            SyncChange::create([
                'business_id' => $business->id,
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
