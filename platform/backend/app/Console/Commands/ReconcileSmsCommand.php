<?php

namespace App\Console\Commands;

use App\Models\SmsMessage;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Reconciles SMS messages whose delivery status is unknown.
 *
 * Targets rows with status SENT or NEEDS_RECONCILIATION that have been waiting
 * longer than --minutes (default 30) without a delivery webhook arriving.
 *
 * Strategy:
 *   - For each stale row that has a termii_message_id, call Termii's
 *     message-status API (GET /api/sms/inbox?message_id=…) to fetch the
 *     current delivery status.
 *   - For rows without a termii_message_id (send was ambiguous / timed out),
 *     mark as FAILED with a clear explanation — we cannot safely re-send.
 *
 * Safe to run from the scheduler every 30 minutes. It never re-sends messages.
 *
 * Usage:
 *   php artisan sms:reconcile
 *   php artisan sms:reconcile --minutes=60 --batch=20
 *   php artisan sms:reconcile --dry-run
 */
class ReconcileSmsCommand extends Command
{
    /** @var string */
    protected $signature = 'sms:reconcile
                            {--minutes=30 : Minimum age in minutes before a SENT/NEEDS_RECONCILIATION row is reconciled}
                            {--batch=50   : Maximum rows to process per run}
                            {--dry-run    : List rows that would be reconciled without making any changes}';

    /** @var string */
    protected $description = 'Reconcile SMS messages without a delivery status. Safe to run every 30 minutes via scheduler.';

    public function handle(): int
    {
        $minutes = (int) $this->option('minutes');
        $batchSize = (int) $this->option('batch');
        $isDryRun = (bool) $this->option('dry-run');

        $rows = SmsMessage::pendingReconciliation($minutes)
            ->orderBy('sent_at')
            ->limit($batchSize)
            ->get();

        if ($rows->isEmpty()) {
            $this->line('<info>No SMS messages need reconciliation.</info>');

            return self::SUCCESS;
        }

        $this->info(sprintf(
            'Reconciling %d SMS message(s) older than %d minute(s).',
            $rows->count(),
            $minutes
        ));

        if ($isDryRun) {
            $this->table(
                ['ID', 'Status', 'Termii Message ID', 'Sent At', 'Recipient'],
                $rows->map(fn ($r) => [
                    $r->id,
                    $r->status,
                    $r->termii_message_id ?? '(none)',
                    $r->sent_at?->toDateTimeString() ?? '-',
                    $r->recipient_phone,
                ])->all()
            );

            return self::SUCCESS;
        }

        $resolved = 0;
        $unresolvable = 0;

        foreach ($rows as $smsRecord) {
            try {
                if (empty($smsRecord->termii_message_id)) {
                    // No message ID — the send was ambiguous and may or may not have reached Termii.
                    // We cannot query the provider. Mark as FAILED with a clear note.
                    $smsRecord->update([
                        'status' => SmsMessage::STATUS_FAILED,
                        'failed_at' => now(),
                        'error_message' => 'Send was ambiguous (no provider message ID recorded). Status could not be determined. Message may or may not have been delivered.',
                    ]);

                    $unresolvable++;

                    Log::info('[ReconcileSmsCommand] Marked ambiguous-send row as FAILED.', [
                        'sms_message_id' => $smsRecord->id,
                    ]);

                    continue;
                }

                $apiStatus = $this->fetchTermiiStatus($smsRecord->termii_message_id);

                if ($apiStatus === null) {
                    // API call failed or returned nothing useful. Leave as-is and retry next run.
                    Log::warning('[ReconcileSmsCommand] Could not fetch status from Termii API.', [
                        'sms_message_id' => $smsRecord->id,
                        'termii_message_id' => $smsRecord->termii_message_id,
                    ]);

                    continue;
                }

                $this->applyReconciledStatus($smsRecord, $apiStatus);
                $resolved++;

            } catch (\Throwable $e) {
                Log::error('[ReconcileSmsCommand] Unexpected error reconciling SMS.', [
                    'sms_message_id' => $smsRecord->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        $this->info(sprintf(
            'Done. Resolved: %d, Unresolvable (no message ID): %d, Skipped (API unavailable): %d.',
            $resolved,
            $unresolvable,
            $rows->count() - $resolved - $unresolvable
        ));

        Log::info('[ReconcileSmsCommand] Reconciliation batch complete.', [
            'resolved' => $resolved,
            'unresolvable' => $unresolvable,
            'total' => $rows->count(),
        ]);

        return self::SUCCESS;
    }

    /**
     * Query the Termii message-status API for a given message ID.
     *
     * Returns the lowercase status string if resolved, null if the API call
     * failed or returned an unusable response.
     */
    private function fetchTermiiStatus(string $termiiMessageId): ?string
    {
        $apiKey = (string) config('services.termii.api_key');
        $baseUrl = rtrim((string) config('services.termii.base_url', 'https://api.ng.termii.com/api'), '/');

        if (empty($apiKey)) {
            Log::error('[ReconcileSmsCommand] Termii API key not configured — cannot reconcile.');

            return null;
        }

        try {
            // Termii message-history endpoint: GET /api/sms/inbox?api_key=…&message_id=…
            $response = Http::connectTimeout(5)
                ->timeout(15)
                ->get("{$baseUrl}/sms/inbox", [
                    'api_key' => $apiKey,
                    'message_id' => $termiiMessageId,
                ]);

            if (! $response->successful()) {
                Log::warning('[ReconcileSmsCommand] Termii API returned non-2xx.', [
                    'status' => $response->status(),
                    'termii_message_id' => $termiiMessageId,
                ]);

                return null;
            }

            // The Termii inbox endpoint returns a data array; the first item is the message.
            $data = $response->json('data') ?? $response->json();

            // Handle both single-object and array-of-objects responses
            if (is_array($data) && isset($data[0])) {
                $data = $data[0];
            }

            $status = $data['status'] ?? null;

            return $status ? strtolower(trim((string) $status)) : null;

        } catch (\Throwable $e) {
            Log::warning('[ReconcileSmsCommand] Termii API call failed.', [
                'termii_message_id' => $termiiMessageId,
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }

    /**
     * Map a reconciled Termii status string to our internal constant and update the row.
     */
    private function applyReconciledStatus(SmsMessage $smsRecord, string $termiiStatus): void
    {
        // Use the same mapping as TermiiWebhookController for consistency.
        $statusMap = [
            'delivered' => SmsMessage::STATUS_DELIVERED,
            'message sent' => SmsMessage::STATUS_SENT,
            'message failed' => SmsMessage::STATUS_FAILED,
            'dnd active on phone number' => SmsMessage::STATUS_UNDELIVERED,
            'rejected' => SmsMessage::STATUS_UNDELIVERED,
            'expired' => SmsMessage::STATUS_UNDELIVERED,
        ];

        $internalStatus = $statusMap[$termiiStatus] ?? null;

        if ($internalStatus === null) {
            Log::info('[ReconcileSmsCommand] Unrecognised Termii status during reconciliation — leaving as-is.', [
                'sms_message_id' => $smsRecord->id,
                'termii_status' => $termiiStatus,
            ]);

            return;
        }

        $updates = ['status' => $internalStatus];

        if ($internalStatus === SmsMessage::STATUS_DELIVERED && ! $smsRecord->delivered_at) {
            $updates['delivered_at'] = now();
        }

        if (
            in_array($internalStatus, [SmsMessage::STATUS_FAILED, SmsMessage::STATUS_UNDELIVERED], true)
            && ! $smsRecord->failed_at
        ) {
            $updates['failed_at'] = now();
            $updates['error_message'] = 'Reconciliation determined: '.$termiiStatus;
        }

        $smsRecord->update($updates);

        Log::info('[ReconcileSmsCommand] Row reconciled.', [
            'sms_message_id' => $smsRecord->id,
            'old_status' => $smsRecord->getOriginal('status'),
            'new_status' => $internalStatus,
        ]);
    }
}
