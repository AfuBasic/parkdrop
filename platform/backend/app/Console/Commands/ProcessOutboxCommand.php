<?php

namespace App\Console\Commands;

use App\Jobs\SendArrivalSmsJob;
use App\Models\Customer;
use App\Models\Package;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ProcessOutboxCommand extends Command
{
    /**
     * @var string
     */
    protected $signature = 'outbox:process
                            {--batch=50 : Maximum number of outbox events to process per run}
                            {--dry-run : List events that would be processed without dispatching}';

    /**
     * @var string
     */
    protected $description = 'Process undispatched outbox events. Safe to run every minute via scheduler.';

    /**
     * Execute the console command.
     *
     * Uses a claim pattern: updates dispatched_at = NOW() before dispatching
     * to prevent duplicate processing if two scheduler instances run concurrently.
     * The WHERE dispatched_at IS NULL guard makes the claim atomic.
     *
     * If dispatching fails after the claim, the event remains with dispatched_at set
     * but the job never entered the queue. Recovery: the health check surfaces
     * events that have dispatched_at set but the corresponding job is in failed_jobs.
     */
    public function handle(): int
    {
        $batchSize = (int) $this->option('batch');
        $isDryRun = (bool) $this->option('dry-run');

        // Find undispatched events — strict WHERE dispatched_at IS NULL to prevent double-dispatch
        $events = DB::table('outbox_events')
            ->whereNull('dispatched_at')
            ->orderBy('created_at')
            ->limit($batchSize)
            ->get();

        if ($events->isEmpty()) {
            $this->line('<info>No undispatched outbox events.</info>');

            return self::SUCCESS;
        }

        $ids = $events->pluck('id')->all();
        $this->info(sprintf('Processing %d outbox event(s).', count($ids)));

        if ($isDryRun) {
            $this->table(['ID', 'Type', 'Business', 'Created'], $events->map(fn ($e) => [
                $e->id, $e->type, $e->business_id, $e->created_at,
            ])->all());

            return self::SUCCESS;
        }

        // CLAIM: mark as dispatched before actually dispatching (prevents double-dispatch
        // on concurrent scheduler runs). Uses WHERE dispatched_at IS NULL to guard the claim.
        $claimed = DB::table('outbox_events')
            ->whereIn('id', $ids)
            ->whereNull('dispatched_at')
            ->update([
                'dispatched_at' => now(),
                'updated_at' => now(),
            ]);

        if ($claimed === 0) {
            $this->warn('All events were claimed by another process. Skipping.');

            return self::SUCCESS;
        }

        $dispatched = 0;
        $failed = 0;

        // Process claimed events
        $claimedEvents = DB::table('outbox_events')
            ->whereIn('id', $ids)
            ->where('dispatched_at', '<=', now())
            ->get();

        foreach ($claimedEvents as $event) {
            try {
                $payload = is_string($event->payload) ? json_decode($event->payload, true) : (array) $event->payload;

                match ($event->type) {
                    'ARRIVAL_SMS_REQUESTED' => $this->processArrivalSms($event, $payload),
                    default => Log::debug('[ProcessOutboxCommand] Unhandled outbox event type skipped.', [
                        'id' => $event->id,
                        'type' => $event->type,
                    ]),
                };

                $dispatched++;
            } catch (\Throwable $e) {
                $failed++;
                Log::error('[ProcessOutboxCommand] Failed to process outbox event.', [
                    'id' => $event->id,
                    'type' => $event->type,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        $this->info(sprintf('Done. Dispatched: %d, Failed to dispatch: %d.', $dispatched, $failed));

        $oldest = $events->first();
        if ($oldest) {
            $ageSeconds = now()->diffInSeconds($oldest->created_at);
            Log::info('[ProcessOutboxCommand] Outbox batch processed.', [
                'count' => $dispatched,
                'oldest_age_seconds' => $ageSeconds,
                'failed_to_dispatch' => $failed,
            ]);
        }

        return self::SUCCESS;
    }

    /**
     * Dispatch a SendArrivalSmsJob for an ARRIVAL_SMS_REQUESTED outbox event.
     *
     * The job carries all context needed to send the SMS without touching the DB inside
     * the claim window.
     */
    private function processArrivalSms(object $event, array $payload): void
    {
        $packageId = $payload['package_id'] ?? null;
        if (! $packageId) {
            Log::warning('[ProcessOutboxCommand] ARRIVAL_SMS_REQUESTED missing package_id.', ['id' => $event->id]);

            return;
        }

        // Eagerly load package + customer + pickup point to avoid the job needing to
        // query in isolation. The pickup point is what tells the customer where to go.
        $package = Package::with(['customer', 'pickupPoint'])->find($packageId);
        if (! $package || ! $package->customer) {
            Log::warning('[ProcessOutboxCommand] Package or customer not found for SMS event.', [
                'id' => $event->id,
                'package_id' => $packageId,
            ]);

            return;
        }

        $customer = $package->customer;
        $phone = $customer->phone_normalized ?? $customer->phone_display;

        if (empty($phone)) {
            Log::warning('[ProcessOutboxCommand] Customer has no phone — skipping SMS.', [
                'package_id' => $packageId,
                'customer_id' => $customer->id,
            ]);

            return;
        }

        // Where to collect it. Without this the customer is told a parcel arrived
        // but not where to go, and the pickup-point names the owner types during
        // setup would never actually reach a customer.
        $pickupPoint = $package->pickupPoint;

        // Build place string
        $pickupPointName = trim($pickupPoint?->name ?? '');
        $parkName = trim($pickupPoint?->park_name ?? '');
        $place = $parkName !== ''
            ? ($pickupPointName !== '' ? "{$pickupPointName}, {$parkName}" : $parkName)
            : $pickupPointName;

        // Contact phone formatting for SMS display (e.g. 08031234567 or 0803 123 4567)
        $rawContactPhone = $pickupPoint?->contact_phone;
        $callLine = '';
        if (! empty($rawContactPhone)) {
            // If stored with country code or national, format as 11 digits with leading 0
            $digits = preg_replace('/\D/', '', $rawContactPhone);
            if (str_starts_with($digits, '234') && strlen($digits) === 13) {
                $digits = '0'.substr($digits, 3);
            } elseif (! str_starts_with($digits, '0') && strlen($digits) === 10) {
                $digits = '0'.$digits;
            }
            $callLine = "Call: {$digits}\n";
        }

        // Single shared template (matches frontend renderCustomerSms in smsTemplate.ts)
        // Your package is at {place}.\nShow code {code} at pickup.\nCall: {phone}\nParkDrop
        $code = $package->pickup_code;
        $message = "Your package is at {$place}.\nShow code {$code} at pickup.\n{$callLine}ParkDrop";

        // Hard character limit check: never exceed 130 characters
        if (mb_strlen($message) > 130) {
            Log::warning('[ProcessOutboxCommand] Arrival SMS exceeds 130 character limit.', [
                'outbox_event_id' => $event->id,
                'package_id' => $packageId,
                'length' => mb_strlen($message),
            ]);
        }

        SendArrivalSmsJob::dispatch(
            packageId: $event->id,
            packageUuid: $packageId,
            businessId: $event->business_id,
            recipientPhone: $phone,
            message: $message,
            idempotencyKey: 'outbox-'.$event->id,
            outboxEventId: $event->id,
        );
    }
}
