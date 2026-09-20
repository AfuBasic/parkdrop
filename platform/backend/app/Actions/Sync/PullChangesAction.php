<?php

namespace App\Actions\Sync;

use App\Models\Business;
use App\Models\SyncChange;

class PullChangesAction
{
    public function execute(Business $business, int $afterCursor, int $limit = 100): array
    {
        $changes = SyncChange::where('business_id', $business->id)
            ->where('id', '>', $afterCursor)
            ->orderBy('id', 'asc')
            ->limit($limit + 1)
            ->get();

        $hasMore = $changes->count() > $limit;
        if ($hasMore) {
            $changes->pop();
        }

        $nextCursor = $changes->last()?->id ?? $afterCursor;

        return [
            'changes' => $changes->map(function ($change) use ($business) {
                $payload = null;
                if ($change->operation !== 'DELETED') {
                    switch ($change->entity_type) {
                        case 'sms_wallet':
                            $wallet = \App\Models\SmsWallet::find($change->entity_id);
                            if ($wallet) {
                                $payload = [
                                    'id' => $wallet->id,
                                    'business_id' => $wallet->business_id,
                                    'balance' => $wallet->balance,
                                    'updated_at' => $wallet->updated_at?->toISOString() ?? now()->toISOString(),
                                ];
                            }
                            break;
                        case 'sms_credit_transaction':
                            $tx = \App\Models\SmsCreditTransaction::find($change->entity_id);
                            if ($tx) {
                                $payload = [
                                    'id' => $tx->id,
                                    'sms_wallet_id' => $tx->sms_wallet_id,
                                    'amount' => $tx->amount,
                                    'type' => strtoupper($tx->type),
                                    'reference_type' => $tx->reference_type,
                                    'reference_id' => $tx->reference_id,
                                    'created_at' => $tx->created_at?->toISOString() ?? now()->toISOString(),
                                ];
                            }
                            break;
                        case 'package':
                            $pkg = \App\Models\Package::find($change->entity_id);
                            if ($pkg) {
                                $payload = $pkg->toArray();
                            }
                            break;
                        case 'customer':
                            $cust = \App\Models\Customer::find($change->entity_id);
                            if ($cust) {
                                $payload = $cust->toArray();
                            }
                            break;
                    }
                }

                return [
                    'id' => $change->id,
                    'entity_type' => $change->entity_type,
                    'entity_id' => $change->entity_id,
                    'operation' => $change->operation,
                    'entity_version' => $change->entity_version,
                    'payload' => $payload,
                ];
            })->values()->all(),
            'cursor' => $nextCursor,
            'has_more' => $hasMore,
        ];
    }
}
