<?php

namespace App\Jobs;

use App\Actions\Sms\ChargeForSmsAction;
use App\Contracts\Sms\SmsProvider;
use App\Exceptions\Sms\InsufficientSmsCreditsException;
use App\Models\SmsMessage;
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
        public readonly string $packageUuid,
        public readonly int $businessId,
        public readonly string $recipientPhone,
        public readonly string $message,
        public readonly string $idempotencyKey,
        public readonly int $outboxEventId,
    ) {
        $this->onQueue('sms');
    }

    /**
     * Execute the SMS send attempt.
     *
     * On first run: creates an SmsMessage row with status PENDING.
     * On success: updates to SENT with termii_message_id and sent_at.
     * On ambiguous timeout: updates to NEEDS_RECONCILIATION.
     * On definitive failure: updates to FAILED with failed_at and error_message.
     */
    public function handle(SmsProvider $smsProvider): void
    {
        // Check if THIS specific outbox event already sent successfully — guards
        // against a duplicate dispatch of the same job/event (e.g. a Horizon
        // race), not against the package having been messaged before. Scoping
        // by package_id instead of outboxEventId would also block a deliberate
        // resend, since the package's earlier event is already SENT.
        $alreadySent = DB::table('outbox_events')
            ->where('id', $this->outboxEventId)
            ->where('sms_status', 'SENT')
            ->exists();

        if ($alreadySent) {
            Log::info('[SendArrivalSmsJob] SMS already sent — skipping.', [
                'package_id' => $this->packageUuid,
                'idempotency_key' => $this->idempotencyKey,
            ]);

            return;
        }

        // Create or find the sms_messages row for this attempt.
        // We use firstOrCreate so that a retry (after ambiguous/reconciliation)
        // reuses the same row rather than creating duplicates.
        $smsRecord = SmsMessage::firstOrCreate(
            ['outbox_event_id' => $this->outboxEventId],
            [
                'business_id' => $this->businessId,
                'package_id' => $this->packageUuid,
                'recipient_phone' => $this->recipientPhone,
                'message_body' => $this->message,
                'status' => SmsMessage::STATUS_PENDING,
            ]
        );

        Log::info('[SendArrivalSmsJob] Attempting arrival SMS dispatch.', [
            'package_id' => $this->packageUuid,
            'attempt' => $this->attempts(),
            'sms_message_id' => $smsRecord->id,
        ]);

        $result = $smsProvider->send($this->recipientPhone, $this->message);

        if ($result->isSent()) {
            // Update both the sms_messages row and the outbox event atomically.
            $smsRecord->update([
                'status' => SmsMessage::STATUS_SENT,
                'termii_message_id' => $result->messageId,
                'sent_at' => now(),
                'error_message' => null,
            ]);

            // Scoped by this event's own id, not whereNull('dispatched_at') — the
            // claiming command (ProcessOutboxCommand) already sets dispatched_at
            // before this job ever runs, so that guard would never match and
            // sms_status would silently never get written.
            DB::table('outbox_events')
                ->where('id', $this->outboxEventId)
                ->update([
                    'dispatched_at' => now(),
                    'sms_status' => 'SENT',
                    'updated_at' => now(),
                ]);

            Log::info('[SendArrivalSmsJob] Arrival SMS sent successfully.', [
                'package_id' => $this->packageUuid,
                'message_id' => $result->messageId,
            ]);

            // Write a SyncChange so the client's next pull sees the SENT status.
            // No payload column here — PullChangesAction always re-fetches the
            // live Package (with its fresh arrival_sms_status) by entity_id, it
            // never reads a stored payload off this row.
            DB::table('sync_changes')->insert([
                'business_id' => $this->businessId,
                'entity_type' => 'package',
                'entity_id' => $this->packageUuid,
                'operation' => 'SMS_SENT',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Charged only now, after Termii has confirmed the message was
            // accepted — never before the send, so a billing failure can
            // never block or duplicate a message that already went out.
            // A business with no credits left still gets its SMS sent (per
            // the app's own promise that running out never interrupts
            // operations); we simply cannot bill for this one.
            try {
                app(ChargeForSmsAction::class)->execute(
                    businessId: $this->businessId,
                    amount: 1,
                    referenceType: 'ARRIVAL_SMS',
                    referenceId: (string) $smsRecord->id,
                );
            } catch (InsufficientSmsCreditsException $e) {
                Log::warning('[SendArrivalSmsJob] Sent with no SMS credits left to charge.', [
                    'package_id' => $this->packageUuid,
                    'business_id' => $this->businessId,
                    'balance' => $e->balance,
                ]);
            }

            return;
        }

        if ($result->isAmbiguous()) {
            // DO NOT throw — do NOT re-queue — the provider may have already accepted the message.
            Log::warning('[SendArrivalSmsJob] SMS dispatch ambiguous (timeout after connection).', [
                'package_id' => $this->packageUuid,
                'attempt' => $this->attempts(),
                'error' => $result->errorMessage,
            ]);

            $this->markNeedsReconciliation(
                $smsRecord,
                'SMS status could not be confirmed. It may have been sent. No automatic re-send attempted.'
            );

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
            $this->markFailed($smsRecord, $result->errorMessage ?? 'SMS provider rejected the message.');

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

        // Attempt to find the sms_messages row and mark it FAILED.
        $smsRecord = SmsMessage::where('outbox_event_id', $this->outboxEventId)->first();
        if ($smsRecord) {
            $this->markFailed($smsRecord, 'Arrival SMS failed after all retry attempts: '.$exception->getMessage());
        } else {
            // Fallback: if the row was never created (e.g. job died before handle()), create it now.
            $this->markFailedWithoutRecord('Arrival SMS failed after all retry attempts: '.$exception->getMessage());
        }
    }

    private function markFailed(SmsMessage $smsRecord, string $reason): void
    {
        $smsRecord->update([
            'status' => SmsMessage::STATUS_FAILED,
            'failed_at' => now(),
            'error_message' => $reason,
        ]);

        DB::table('outbox_events')
            ->where('id', $this->outboxEventId)
            ->update([
                'dispatched_at' => now(),
                'sms_status' => 'FAILED',
                'updated_at' => now(),
            ]);

        // Write a SyncChange so the client's next pull surfaces this in the Attention Center.
        // No payload column — see the SENT branch above for why.
        DB::table('sync_changes')->insert([
            'business_id' => $this->businessId,
            'entity_type' => 'package',
            'entity_id' => $this->packageUuid,
            'operation' => 'SMS_FAILED',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function markNeedsReconciliation(SmsMessage $smsRecord, string $reason): void
    {
        $smsRecord->update([
            'status' => SmsMessage::STATUS_NEEDS_RECONCILIATION,
            'error_message' => $reason,
        ]);

        DB::table('outbox_events')
            ->where('id', $this->outboxEventId)
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
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * Fallback: create the sms_messages row and mark it FAILED when handle() never ran.
     */
    private function markFailedWithoutRecord(string $reason): void
    {
        SmsMessage::create([
            'business_id' => $this->businessId,
            'package_id' => $this->packageUuid,
            'outbox_event_id' => $this->outboxEventId,
            'recipient_phone' => $this->recipientPhone,
            'message_body' => $this->message,
            'status' => SmsMessage::STATUS_FAILED,
            'failed_at' => now(),
            'error_message' => $reason,
        ]);
    }
}
