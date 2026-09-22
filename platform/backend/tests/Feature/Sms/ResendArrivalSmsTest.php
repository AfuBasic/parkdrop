<?php

namespace Tests\Feature\Sms;

use App\Jobs\SendArrivalSmsJob;
use App\Models\Business;
use App\Models\BusinessMembership;
use App\Models\Customer;
use App\Models\Package;
use App\Models\PickupPoint;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Str;
use Tests\TestCase;

class ResendArrivalSmsTest extends TestCase
{
    use RefreshDatabase;

    protected User $owner;

    protected Business $business;

    protected Package $package;

    protected function setUp(): void
    {
        parent::setUp();

        $this->owner = User::factory()->create();

        $this->business = Business::create(['name' => 'Chima Parcel Services', 'status' => 'active']);

        BusinessMembership::create([
            'user_id' => $this->owner->id,
            'business_id' => $this->business->id,
            'role' => 'owner',
        ]);

        $pickupPoint = PickupPoint::create([
            'business_id' => $this->business->id,
            'public_id' => (string) Str::uuid(),
            'name' => 'Chima Parcel Services',
            'park_name' => 'Peace Park',
            'status' => 'active',
        ]);

        $customer = Customer::create([
            'id' => (string) Str::uuid(),
            'business_id' => $this->business->id,
            'name' => 'Ngozi Eze',
            'phone_display' => '0802 345 6789',
            'phone_normalized' => '2348023456789',
        ]);

        $this->package = Package::create([
            'id' => (string) Str::uuid(),
            'business_id' => $this->business->id,
            'pickup_point_id' => $pickupPoint->id,
            'customer_id' => $customer->id,
            'public_package_id' => 'PD-1',
            'pickup_code' => 'ABC1234',
            'amount_due_minor' => 0,
            'status' => 'WAITING',
            'client_created_at' => now(),
            'version' => 1,
        ]);
    }

    public function test_owner_can_queue_a_resend(): void
    {
        $response = $this->actingAs($this->owner, 'sanctum')
            ->postJson("/api/v1/packages/{$this->package->id}/resend-sms");

        $response->assertStatus(200);

        $this->assertDatabaseHas('outbox_events', [
            'business_id' => $this->business->id,
            'type' => 'ARRIVAL_SMS_REQUESTED',
        ]);
    }

    public function test_user_outside_the_business_is_forbidden(): void
    {
        $stranger = User::factory()->create();

        $response = $this->actingAs($stranger, 'sanctum')
            ->postJson("/api/v1/packages/{$this->package->id}/resend-sms");

        $response->assertStatus(403);
    }

    public function test_a_second_outbox_event_still_sends_even_though_the_first_already_sent(): void
    {
        Queue::fake();

        $this->actingAs($this->owner, 'sanctum')
            ->postJson("/api/v1/packages/{$this->package->id}/resend-sms");

        $this->artisan('outbox:process')->assertExitCode(0);

        Queue::assertPushed(SendArrivalSmsJob::class, fn (SendArrivalSmsJob $job) => $job->packageUuid === $this->package->id
        );
    }

    public function test_resend_actually_sends_a_second_sms_after_the_first_one_sent(): void
    {
        // The job's idempotency guard is scoped to a single outbox event, not
        // to "has this package ever been messaged" — otherwise a resend's new
        // event would be silently skipped forever once the package's very
        // first event flips to sms_status=SENT.
        $this->app->instance(\App\Contracts\Sms\SmsProvider::class, new class implements \App\Contracts\Sms\SmsProvider
        {
            private int $calls = 0;

            public function send(string $to, string $message): \App\Contracts\Sms\SmsResult
            {
                $this->calls++;

                return \App\Contracts\Sms\SmsResult::sent('fake-message-id-'.$this->calls);
            }
        });

        $firstOutboxEventId = \DB::table('outbox_events')->insertGetId([
            'business_id' => $this->business->id,
            'type' => 'ARRIVAL_SMS_REQUESTED',
            'payload' => json_encode(['package_id' => $this->package->id]),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->artisan('outbox:process')->assertExitCode(0);

        $this->assertDatabaseHas('outbox_events', ['id' => $firstOutboxEventId, 'sms_status' => 'SENT']);
        $this->assertSame(1, \DB::table('sms_messages')->where('package_id', $this->package->id)->count());

        $this->actingAs($this->owner, 'sanctum')
            ->postJson("/api/v1/packages/{$this->package->id}/resend-sms")
            ->assertStatus(200);

        $this->artisan('outbox:process')->assertExitCode(0);

        $this->assertSame(2, \DB::table('sms_messages')->where('package_id', $this->package->id)->count());
    }
}
