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
            packageId: 1,
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
    }

    public function test_sending_with_zero_credits_still_sends_and_does_not_fail_the_job(): void
    {
        $business = Business::create(['name' => 'Chima Parcel Services', 'status' => 'active']);
        SmsWallet::create(['business_id' => $business->id, 'balance' => 0]);

        $this->app->instance(SmsProvider::class, $this->fakeSentProvider());

        $job = new SendArrivalSmsJob(
            packageId: 1,
            packageUuid: (string) Str::uuid(),
            businessId: $business->id,
            recipientPhone: '2348031234567',
            message: 'Your package is at Peace Park.',
            idempotencyKey: 'test-key-2',
            outboxEventId: 1000,
        );

        // Must not throw — a billing failure can never block a message that
        // Termii has already accepted, and running out of credits must never
        // interrupt operations.
        $this->app->call([$job, 'handle']);

        $smsRecord = SmsMessage::where('outbox_event_id', 1000)->first();
        $this->assertSame(SmsMessage::STATUS_SENT, $smsRecord->status);

        // Balance stays at 0 — never goes negative.
        $this->assertDatabaseHas('sms_wallets', [
            'business_id' => $business->id,
            'balance' => 0,
        ]);

        $this->assertDatabaseMissing('sms_credit_transactions', [
            'type' => 'DEBIT',
            'reference_type' => 'ARRIVAL_SMS',
        ]);
    }
}
