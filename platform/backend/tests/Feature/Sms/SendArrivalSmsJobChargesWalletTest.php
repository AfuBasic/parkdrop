<?php

namespace Tests\Feature\Sms;

use App\Contracts\Sms\SmsProvider;
use App\Contracts\Sms\SmsResult;
use App\Jobs\SendArrivalSmsJob;
use App\Models\Business;
use App\Models\SmsMessage;
use App\Models\SmsWallet;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class SendArrivalSmsJobChargesWalletTest extends TestCase
{
    use RefreshDatabase;

    private function fakeSentProvider(): SmsProvider
    {
        return new class implements SmsProvider
        {
            public function send(string $to, string $message): SmsResult
            {
                return SmsResult::sent('fake-message-id');
            }
        };
    }

    public function test_a_successfully_sent_sms_debits_one_credit(): void
    {
        $business = Business::create(['name' => 'Chima Parcel Services', 'status' => 'active']);
        SmsWallet::create(['business_id' => $business->id, 'balance' => 20]);

        $this->app->instance(SmsProvider::class, $this->fakeSentProvider());

        $job = new SendArrivalSmsJob(
            packageUuid: (string) Str::uuid(),
            businessId: $business->id,
            recipientPhone: '2348031234567',
            message: 'Your package is at Peace Park.',
            idempotencyKey: 'test-key',
            outboxEventId: 999,
        );

        $this->app->call([$job, 'handle']);

        $this->assertDatabaseHas('sms_wallets', [
            'business_id' => $business->id,
            'balance' => 19,
        ]);

        $this->assertDatabaseHas('sms_credit_transactions', [
            'type' => 'DEBIT',
            'reference_type' => 'ARRIVAL_SMS',
            'amount' => 1,
        ]);

        $smsRecord = SmsMessage::where('outbox_event_id', 999)->first();
        $this->assertNotNull($smsRecord);
        $this->assertSame(SmsMessage::STATUS_SENT, $smsRecord->status);

        // A successful send must still write a sync_changes row — otherwise the
        // frontend's next pull never learns the SMS went out at all.
        $this->assertDatabaseHas('sync_changes', [
            'business_id' => $business->id,
            'entity_type' => 'package',
            'operation' => 'SMS_SENT',
        ]);
    }

    public function test_sending_with_zero_credits_is_skipped_and_never_calls_the_provider(): void
    {
        $business = Business::create(['name' => 'Chima Parcel Services', 'status' => 'active']);
        SmsWallet::create(['business_id' => $business->id, 'balance' => 0]);

        // A provider that fails the test if it's ever actually called — the
        // hard credit check must stop the job before send() is attempted.
        $this->app->instance(SmsProvider::class, new class implements SmsProvider
        {
            public function send(string $to, string $message): SmsResult
            {
                throw new \RuntimeException('SmsProvider::send() must not be called when the wallet has no credits.');
            }
        });

        $packageUuid = (string) Str::uuid();

        $outboxEventId = \DB::table('outbox_events')->insertGetId([
            'business_id' => $business->id,
            'type' => 'ARRIVAL_SMS_REQUESTED',
            'payload' => json_encode(['package_id' => $packageUuid]),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $job = new SendArrivalSmsJob(
            packageUuid: $packageUuid,
            businessId: $business->id,
            recipientPhone: '2348031234567',
            message: 'Your package is at Peace Park.',
            idempotencyKey: 'test-key-2',
            outboxEventId: $outboxEventId,
        );

        // Must not throw — an empty wallet is an expected, handled state.
        $this->app->call([$job, 'handle']);

        $smsRecord = SmsMessage::where('outbox_event_id', $outboxEventId)->first();
        $this->assertNotNull($smsRecord);
        $this->assertSame(SmsMessage::STATUS_SKIPPED_NO_CREDITS, $smsRecord->status);

        // Balance stays at 0 — never goes negative, and nothing was charged
        // for a message that was never actually sent.
        $this->assertDatabaseHas('sms_wallets', [
            'business_id' => $business->id,
            'balance' => 0,
        ]);

        $this->assertDatabaseMissing('sms_credit_transactions', [
            'type' => 'DEBIT',
            'reference_type' => 'ARRIVAL_SMS',
        ]);

        $this->assertDatabaseHas('outbox_events', [
            'id' => $outboxEventId,
            'sms_status' => 'SKIPPED_NO_CREDITS',
        ]);

        // The package timeline needs to actually reflect this, not silently
        // look like nothing happened.
        $this->assertDatabaseHas('sync_changes', [
            'business_id' => $business->id,
            'entity_type' => 'package',
            'entity_id' => $packageUuid,
            'operation' => 'SMS_SKIPPED_NO_CREDITS',
        ]);
    }
}
