<?php

namespace App\Jobs;

use App\Contracts\Sms\SmsProvider;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SendArrivalSmsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Maximum attempts before the job is moved to failed_jobs.
     *
     * 2 attempts only — after 2 attempts with AMBIGUOUS outcome, the system enters
     * NEEDS_RECONCILIATION state. We never exceed this to avoid duplicating
     * customer SMS messages when a timeout occurred on a prior attempt.
     */
    public int $tries = 2;

    /**
     * Wait 30s before first retry, 2 minutes before second.
     *
     * @var array<int>
     */
    public array $backoff = [30, 120];

    public function __construct(
        public readonly int $packageId,
        public readonly string $packageUuid,
        public readonly int $businessId,
        public readonly string $recipientPhone,
        public readonly string $message,
        public readonly string $idempotencyKey,
    ) {
        $this->onQueue('sms');
    }

    /**
     * Execute the SMS send attempt.
     *
     * On success: marks the outbox event as dispatched + success.
     * On definitive failure: marks FAILED, creates Attention attention entry via sync change.
     * On ambiguous timeout: marks NEEDS_RECONCILIATION. Does NOT auto-retry with a fresh send
     * to prevent duplicate SMS delivery.
     */
    public function handle(SmsProvider $smsProvider): void
    {
        // Check if already successfully sent (idempotency guard via outbox_events)
        $alreadySent = DB::table('outbox_events')
            ->where('business_id', $this->businessId)
            ->where('type', 'ARRIVAL_SMS_REQUESTED')
            ->whereJsonContains('payload->package_id', $this->packageUuid)
            ->where('sms_status', 'SENT')
            ->exists();

        if ($alreadySent) {
            Log::info('[SendArrivalSmsJob] SMS already sent — skipping.', [
                'package_id' => $this->packageUuid,
                'idempotency_key' => $this->idempotencyKey,
            ]);

            return;
        }

        Log::info('[SendArrivalSmsJob] Attempting arrival SMS dispatch.', [
            'package_id' => $this->packageUuid,
            'attempt' => $this->attempts(),
        ]);

        $result = $smsProvider->send($this->recipientPhone, $this->message);

        if ($result->isSent()) {
            DB::table('outbox_events')
                ->where('business_id', $this->businessId)
                ->where('type', 'ARRIVAL_SMS_REQUESTED')
                ->whereJsonContains('payload->package_id', $this->packageUuid)
                ->whereNull('dispatched_at')
                ->update([
                    'dispatched_at' => now(),
                    'sms_status' => 'SENT',
                    'updated_at' => now(),
                ]);

            Log::info('[SendArrivalSmsJob] Arrival SMS sent successfully.', [
                'package_id' => $this->packageUuid,
                'message_id' => $result->messageId,
            ]);

            return;
        }

        if ($result->isAmbiguous()) {
            // DO NOT throw — do NOT re-queue — the provider may have already accepted the message.
            // If attempts are exhausted, failed() hook handles the final state.
            // If there are retries remaining, Horizon will retry (but our policy is
            // to mark NEEDS_RECONCILIATION immediately and not re-send).
            Log::warning('[SendArrivalSmsJob] SMS dispatch ambiguous (timeout after connection).', [
                'package_id' => $this->packageUuid,
                'attempt' => $this->attempts(),
                'error' => $result->errorMessage,
            ]);

            $this->markNeedsReconciliation('SMS status could not be confirmed. It may have been sent. No automatic re-send attempted.');

            // Release to prevent further automatic retries with duplicate send risk
            $this->release();

            return;
        }

        // Definitive FAILED — safe to report and let Horizon retry within budget
        Log::error('[SendArrivalSmsJob] Arrival SMS definitively failed.', [
            'package_id' => $this->packageUuid,
            'attempt' => $this->attempts(),
            'error' => $result->errorMessage,
        ]);

        if ($this->attempts() >= $this->tries) {
            $this->markFailed($result->errorMessage ?? 'SMS provider rejected the message.');

            return;
        }

        // Throw to trigger Horizon's backoff and retry for transient provider errors
        throw new \RuntimeException('[SendArrivalSmsJob] SMS failed: '.($result->errorMessage ?? 'Unknown error'));
    }

    /**
     * Handle the job failing after all attempts are exhausted (including for FAILED results).
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('[SendArrivalSmsJob] Job exhausted all attempts.', [
            'package_id' => $this->packageUuid,
            'error' => $exception->getMessage(),
        ]);

        $this->markFailed('Arrival SMS failed after all retry attempts: '.$exception->getMessage());
    }

    private function markFailed(string $reason): void
    {
        DB::table('outbox_events')
            ->where('business_id', $this->businessId)
            ->where('type', 'ARRIVAL_SMS_REQUESTED')
            ->whereJsonContains('payload->package_id', $this->packageUuid)
            ->whereNull('dispatched_at')
            ->update([
                'dispatched_at' => now(),
                'sms_status' => 'FAILED',
                'updated_at' => now(),
            ]);

        // Write a SyncChange so the client's next pull surfaces this in the Attention Center
        DB::table('sync_changes')->insert([
            'business_id' => $this->businessId,
            'entity_type' => 'package',
            'entity_id' => $this->packageUuid,
            'operation' => 'SMS_FAILED',
            'payload' => json_encode([
                'package_id' => $this->packageUuid,
                'arrival_sms_status' => 'FAILED',
                'arrival_sms_error' => $reason,
            ]),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function markNeedsReconciliation(string $reason): void
    {
        DB::table('outbox_events')
            ->where('business_id', $this->businessId)
            ->where('type', 'ARRIVAL_SMS_REQUESTED')
            ->whereJsonContains('payload->package_id', $this->packageUuid)
            ->whereNull('dispatched_at')
            ->update([
                'dispatched_at' => now(),
                'sms_status' => 'NEEDS_RECONCILIATION',
                'updated_at' => now(),
            ]);

        DB::table('sync_changes')->insert([
            'business_id' => $this->businessId,
            'entity_type' => 'package',
            'entity_id' => $this->packageUuid,
            'operation' => 'SMS_NEEDS_RECONCILIATION',
            'payload' => json_encode([
                'package_id' => $this->packageUuid,
                'arrival_sms_status' => 'NEEDS_RECONCILIATION',
                'arrival_sms_note' => $reason,
            ]),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
