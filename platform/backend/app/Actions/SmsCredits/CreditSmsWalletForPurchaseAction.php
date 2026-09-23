<?php

namespace App\Actions\SmsCredits;

use App\Events\SyncHint;
use App\Models\SmsCreditPurchase;
use App\Models\SmsCreditTransaction;
use App\Models\SmsWallet;
use App\Models\SyncChange;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;

class CreditSmsWalletForPurchaseAction
{
    /**
     * Atomically credits the business SMS wallet for a verified payment.
     * Enforces row-level locks, idempotent ledger entry, and sync changes.
     */
    public function execute(
        SmsCreditPurchase $purchase,
        int $verifiedAmountMinor,
        string $verifiedCurrency,
        ?string $providerTransactionId = null,
        array $providerMetadata = []
    ): SmsCreditPurchase {
        return DB::transaction(function () use (
            $purchase,
            $verifiedAmountMinor,
            $verifiedCurrency,
            $providerTransactionId

        ) {
            // 1. Row-lock the purchase record
            $lockedPurchase = SmsCreditPurchase::where('id', $purchase->id)
                ->lockForUpdate()
                ->firstOrFail();

            // 2. Idempotent short-circuit if already PAID
            if ($lockedPurchase->status === 'PAID') {
                return $lockedPurchase;
            }

            // 3. Strict verification of amount, currency, and provider transaction uniqueness
            if ($verifiedAmountMinor !== $lockedPurchase->amount_minor) {
                Log::warning('SmsCreditPurchase amount mismatch', [
                    'purchase_id' => $lockedPurchase->id,
                    'expected' => $lockedPurchase->amount_minor,
                    'received' => $verifiedAmountMinor,
                ]);

                throw new UnprocessableEntityHttpException(
                    "Payment amount mismatch: expected {$lockedPurchase->amount_minor}, got {$verifiedAmountMinor}"
                );
            }

            if (strtoupper($verifiedCurrency) !== strtoupper($lockedPurchase->currency)) {
                Log::warning('SmsCreditPurchase currency mismatch', [
                    'purchase_id' => $lockedPurchase->id,
                    'expected' => $lockedPurchase->currency,
                    'received' => $verifiedCurrency,
                ]);

                throw new UnprocessableEntityHttpException(
                    "Payment currency mismatch: expected {$lockedPurchase->currency}, got {$verifiedCurrency}"
                );
            }

            if ($providerTransactionId) {
                $duplicate = SmsCreditPurchase::where('provider', $lockedPurchase->provider)
                    ->where('provider_transaction_id', $providerTransactionId)
                    ->where('id', '!=', $lockedPurchase->id)
                    ->first();

                if ($duplicate) {
                    Log::error('Provider transaction ID already used by another purchase', [
                        'purchase_id' => $lockedPurchase->id,
                        'duplicate_purchase_id' => $duplicate->id,
                        'provider_transaction_id' => $providerTransactionId,
                    ]);

                    throw new UnprocessableEntityHttpException(
                        'Provider transaction ID has already been credited to another purchase.'
                    );
                }
            }

            // 4. Row-lock or create the SmsWallet
            $wallet = SmsWallet::where('business_id', $lockedPurchase->business_id)
                ->lockForUpdate()
                ->first();

            if (! $wallet) {
                $wallet = SmsWallet::create([
                    'business_id' => $lockedPurchase->business_id,
                    'balance' => 0,
                ]);
            }

            // 5. Unique ledger entry with reference_type 'PURCHASE' and reference_id
            $ledgerReferenceId = "purchase:{$lockedPurchase->id}";

            $existingTx = SmsCreditTransaction::where('sms_wallet_id', $wallet->id)
                ->where('reference_type', 'PURCHASE')
                ->where('reference_id', $ledgerReferenceId)
                ->first();

            if (! $existingTx) {
                // Increment wallet balance
                $wallet->increment('balance', $lockedPurchase->credits);
                $wallet->refresh();

                // Create audit ledger entry
                $transaction = SmsCreditTransaction::create([
                    'sms_wallet_id' => $wallet->id,
                    'amount' => $lockedPurchase->credits,
                    'type' => 'credit',
                    'reference_type' => 'PURCHASE',
                    'reference_id' => $ledgerReferenceId,
                ]);

                // 6. Record sync_changes for offline synchronization
                $walletChange = SyncChange::create([
                    'business_id' => $lockedPurchase->business_id,
                    'entity_type' => 'sms_wallet',
                    'entity_id' => (string) $wallet->id,
                    'operation' => 'UPDATED',
                    'entity_version' => 1,
                ]);

                $txChange = SyncChange::create([
                    'business_id' => $lockedPurchase->business_id,
                    'entity_type' => 'sms_credit_transaction',
                    'entity_id' => (string) $transaction->id,
                    'operation' => 'CREATED',
                    'entity_version' => 1,
                ]);

                // 7. Reverb real-time sync hint (broadcast cursor to business channel)
                try {
                    broadcast(new SyncHint($lockedPurchase->business_id, $txChange->id))->toOthers();
                } catch (\Throwable $e) {
                    Log::info('Reverb broadcast skipped or failed', ['error' => $e->getMessage()]);
                }
            }

            // 8. Mark purchase PAID
            $lockedPurchase->update([
                'status' => 'PAID',
                'provider_transaction_id' => $providerTransactionId ?: $lockedPurchase->provider_transaction_id,
                'paid_at' => now(),
            ]);

            // Sync the purchase itself down to the device — without this the
            // owner has no way to see what they actually paid or which
            // provider they used once they leave the post-purchase screen,
            // only the generic credit-ledger entry.
            SyncChange::create([
                'business_id' => $lockedPurchase->business_id,
                'entity_type' => 'sms_credit_purchase',
                'entity_id' => (string) $lockedPurchase->id,
                'operation' => 'UPDATED',
                'entity_version' => 1,
            ]);

            return $lockedPurchase->fresh();
        });
    }
}
