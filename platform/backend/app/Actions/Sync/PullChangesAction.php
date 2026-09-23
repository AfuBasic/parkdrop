<?php

namespace App\Actions\Sync;

use App\Models\Business;
use App\Models\Customer;
use App\Models\Package;
use App\Models\PackageMedia;
use App\Models\Payment;
use App\Models\SmsCreditTransaction;
use App\Models\SmsMessage;
use App\Models\SmsWallet;
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
            'changes' => $changes->map(function ($change) {
                $payload = null;
                if ($change->operation !== 'DELETED') {
                    switch ($change->entity_type) {
                        case 'sms_wallet':
                            $wallet = SmsWallet::find($change->entity_id);
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
                            $tx = SmsCreditTransaction::find($change->entity_id);
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
                            $pkg = Package::with(['creator', 'pickupPoint'])->find($change->entity_id);
                            if ($pkg) {
                                $data = $pkg->toArray();
                                $data['creator_name'] = $pkg->creator?->first_name ?: ($pkg->creator?->email ? explode('@', $pkg->creator->email)[0] : null);
                                $data['pickup_point_name'] = $pkg->pickupPoint?->name;

                                // Attach the latest SMS delivery status so the frontend
                                // can display a truthful status on the activity timeline.
                                // Only the most recent sms_messages row for this package is used.
                                $smsRecord = SmsMessage::where('package_id', $pkg->id)
                                    ->orderByDesc('created_at')
                                    ->first(['status', 'sent_at']);
                                $data['arrival_sms_status'] = $smsRecord?->status;
                                $data['arrival_sms_sent_at'] = $smsRecord?->sent_at?->toISOString();

                                $payload = $data;
                            }
                            break;
                        case 'customer':
                            $cust = Customer::find($change->entity_id);
                            if ($cust) {
                                $payload = $cust->toArray();
                            }
                            break;
                        case 'package_media':
                            $media = PackageMedia::find($change->entity_id);
                            if ($media) {
                                $payload = $media->toArray();
                            }
                            break;
                        case 'payment':
                            $payment = Payment::with('recordedBy')->find($change->entity_id);
                            if ($payment) {
                                $paymentData = $payment->toArray();
                                $paymentData['recorded_by_user_name'] = $payment->recordedBy?->first_name
                                    ?: ($payment->recordedBy?->email ? explode('@', $payment->recordedBy->email)[0] : null);
                                $payload = $paymentData;
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
