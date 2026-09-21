<?php

namespace Tests\Feature\Sync;

use App\Models\Business;
use App\Models\BusinessMembership;
use App\Models\Customer;
use App\Models\Package;
use App\Models\PackageLifecycleEvent;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class CollectPackageMutationTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_collects_a_waiting_package_authoritatively(): void
    {
        $user = User::factory()->create();
        $business = Business::create([
            'name' => 'Mile 12 Express Hub',
            'slug' => 'mile-12-express-hub',
        ]);

        BusinessMembership::create([
            'user_id' => $user->id,
            'business_id' => $business->id,
            'role' => 'owner',
        ]);

        $customer = Customer::create([
            'id' => (string) Str::uuid(),
            'business_id' => $business->id,
            'name' => 'Abiola Johnson',
            'phone_display' => '08023456789',
            'phone_normalized' => '+2348023456789',
            'version' => 1,
        ]);

        $package = Package::create([
            'id' => (string) Str::uuid(),
            'business_id' => $business->id,
            'customer_id' => $customer->id,
            'public_package_id' => 'PKG-1001',
            'pickup_code' => 'K7X9P2M',
            'amount_due_minor' => 150000,
            'status' => 'WAITING',
            'created_by_user_id' => $user->id,
            'version' => 1,
        ]);

        $eventId = (string) Str::uuid();

        $response = $this->actingAs($user)->postJson('/api/v1/sync/push', [
            'business_id' => $business->id,
            'device_uuid' => (string) Str::uuid(),
            'mutations' => [
                [
                    'mutation_id' => (string) Str::uuid(),
                    'operation' => 'COLLECT_PACKAGE',
                    'entity_id' => $package->id,
                    'base_version' => 1,
                    'device_sequence' => 1,
                    'client_created_at' => now()->toISOString(),
                    'payload' => [
                        'event_id' => $eventId,
                        'package_id' => $package->id,
                        'pickup_code' => 'K7X9P2M',
                        'notes' => 'Customer collected with ID verified',
                    ],
                ],
            ],
        ]);

        $response->assertOk();
        $response->assertJsonPath('results.0.status', 'APPLIED');

        $this->assertDatabaseHas('packages', [
            'id' => $package->id,
            'status' => 'COLLECTED',
            'version' => 2,
        ]);

        $this->assertDatabaseHas('package_lifecycle_events', [
            'id' => $eventId,
            'package_id' => $package->id,
            'type' => 'COLLECT',
            'reason' => 'CUSTOMER_COLLECTION',
        ]);
    }

    public function test_it_enforces_idempotency_on_collect_mutation(): void
    {
        $user = User::factory()->create();
        $business = Business::create([
            'name' => 'Mile 12 Express Hub',
            'slug' => 'mile-12-express-hub',
        ]);

        BusinessMembership::create([
            'user_id' => $user->id,
            'business_id' => $business->id,
            'role' => 'owner',
        ]);

        $customer = Customer::create([
            'id' => (string) Str::uuid(),
            'business_id' => $business->id,
            'name' => 'Chidi Eze',
            'phone_display' => '08034567890',
            'phone_normalized' => '+2348034567890',
            'version' => 1,
        ]);

        $package = Package::create([
            'id' => (string) Str::uuid(),
            'business_id' => $business->id,
            'customer_id' => $customer->id,
            'public_package_id' => 'PKG-1002',
            'pickup_code' => 'A9B8C7D',
            'amount_due_minor' => 0,
            'status' => 'WAITING',
            'created_by_user_id' => $user->id,
            'version' => 1,
        ]);

        $eventId = (string) Str::uuid();

        // First collection push
        $res1 = $this->actingAs($user)->postJson('/api/v1/sync/push', [
            'business_id' => $business->id,
            'device_uuid' => (string) Str::uuid(),
            'mutations' => [
                [
                    'mutation_id' => (string) Str::uuid(),
                    'operation' => 'COLLECT_PACKAGE',
                    'entity_id' => $package->id,
                    'base_version' => 1,
                    'device_sequence' => 1,
                    'client_created_at' => now()->toISOString(),
                    'payload' => [
                        'event_id' => $eventId,
                        'package_id' => $package->id,
                        'pickup_code' => 'A9B8C7D',
                    ],
                ],
            ],
        ]);
        $res1->assertOk();
        $res1->assertJsonPath('results.0.status', 'APPLIED');

        // Second push with same eventId returns APPLIED idempotently
        $res2 = $this->actingAs($user)->postJson('/api/v1/sync/push', [
            'business_id' => $business->id,
            'device_uuid' => (string) Str::uuid(),
            'mutations' => [
                [
                    'mutation_id' => (string) Str::uuid(),
                    'operation' => 'COLLECT_PACKAGE',
                    'entity_id' => $package->id,
                    'base_version' => 1,
                    'device_sequence' => 2,
                    'client_created_at' => now()->toISOString(),
                    'payload' => [
                        'event_id' => $eventId,
                        'package_id' => $package->id,
                        'pickup_code' => 'A9B8C7D',
                    ],
                ],
            ],
        ]);
        $res2->assertOk();
        $res2->assertJsonPath('results.0.status', 'APPLIED');
        $res2->assertJsonPath('results.0.metadata.idempotent', true);
    }
}
