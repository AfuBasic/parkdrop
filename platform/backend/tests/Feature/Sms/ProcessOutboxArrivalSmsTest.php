<?php

namespace Tests\Feature\Sms;

use App\Jobs\SendArrivalSmsJob;
use App\Models\Business;
use App\Models\Customer;
use App\Models\Package;
use App\Models\PickupPoint;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Str;
use Tests\TestCase;

class ProcessOutboxArrivalSmsTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_includes_the_real_pickup_point_and_park_in_the_arrival_sms(): void
    {
        Queue::fake();

        $business = Business::create(['name' => 'Chima Parcel Services', 'status' => 'active']);

        $pickupPoint = PickupPoint::create([
            'business_id' => $business->id,
            'public_id' => (string) Str::uuid(),
            'name' => 'Chima Parcel Services',
            'park_name' => 'Peace Park',
            'contact_phone' => '2348031234567',
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

        $eventId = \DB::table('outbox_events')->insertGetId([
            'business_id' => $business->id,
            'type' => 'ARRIVAL_SMS_REQUESTED',
            'payload' => json_encode(['package_id' => $package->id]),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->artisan('outbox:process')->assertExitCode(0);

        Queue::assertPushed(SendArrivalSmsJob::class, function (SendArrivalSmsJob $job) use ($package, $eventId) {
            return $job->packageUuid === $package->id
                && $job->outboxEventId === $eventId
                // The whole point of the feature: the owner's real pickup point
                // and park name must reach the customer, not an empty string.
                && str_contains($job->message, 'Chima Parcel Services, Peace Park')
                && str_contains($job->message, 'Call: 08031234567')
                && str_contains($job->message, $package->pickup_code);
        });
    }
}
