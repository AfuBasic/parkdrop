<?php

namespace Tests\Feature\Sms;

use App\Actions\Sync\PullChangesAction;
use App\Contracts\Sms\SmsProvider;
use App\Contracts\Sms\SmsResult;
use App\Jobs\SendArrivalSmsJob;
use App\Models\Business;
use App\Models\Customer;
use App\Models\Package;
use App\Models\PickupPoint;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class ArrivalSmsStatusReachesPullSyncTest extends TestCase
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

    public function test_a_sent_arrival_sms_shows_up_in_the_next_pull_sync(): void
    {
        $business = Business::create(['name' => 'Chima Parcel Services', 'status' => 'active']);

        $pickupPoint = PickupPoint::create([
            'business_id' => $business->id,
            'public_id' => (string) Str::uuid(),
            'name' => 'Chima Parcel Services',
            'park_name' => 'Peace Park',
            'status' => 'active',
        ]);

        $customer = Customer::create([
            'id' => (string) Str::uuid(),
            'business_id' => $business->id,
            'name' => 'Ngozi Eze',
            'phone_display' => '0802 345 6789',
            'phone_normalized' => '2348023456789',
        ]);

        $package = Package::create([
            'id' => (string) Str::uuid(),
            'business_id' => $business->id,
            'pickup_point_id' => $pickupPoint->id,
            'customer_id' => $customer->id,
            'public_package_id' => 'PD-1',
            'pickup_code' => 'ABC1234',
            'amount_due_minor' => 0,
            'status' => 'WAITING',
            'client_created_at' => now(),
            'version' => 1,
        ]);

        $this->app->instance(SmsProvider::class, $this->fakeSentProvider());

        $job = new SendArrivalSmsJob(
            packageUuid: $package->id,
            businessId: $business->id,
            recipientPhone: '2348023456789',
            message: 'Your package is at Chima Parcel Services, Peace Park.',
            idempotencyKey: 'test-key',
            outboxEventId: 999,
        );

        $this->app->call([$job, 'handle']);

        $result = app(PullChangesAction::class)->execute($business, afterCursor: 0);

        $packageChange = collect($result['changes'])
            ->first(fn ($change) => $change['entity_type'] === 'package' && $change['entity_id'] === $package->id && $change['operation'] === 'SMS_SENT');

        $this->assertNotNull($packageChange, 'Expected an SMS_SENT sync_changes row for the package.');
        $this->assertSame('SENT', $packageChange['payload']['arrival_sms_status']);
    }
}
