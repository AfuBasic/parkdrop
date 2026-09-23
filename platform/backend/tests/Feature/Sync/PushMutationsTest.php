<?php

use App\Models\Business;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

test('it rejects unauthorized push attempts', function () {
    $response = $this->postJson('/api/v1/sync/push', [
        'device_uuid' => Str::uuid(),
        'mutations' => [],
    ]);

    $response->assertUnauthorized();
});

test('it processes valid mutations and enforces idempotency', function () {
    $user = User::factory()->create();
    $business = Business::create([
        'public_id' => (string) Str::uuid(),
        'name' => 'Push Test Business',
    ]);
    $user->memberships()->create(['business_id' => $business->id, 'role' => 'owner']);

    $deviceUuid = Str::uuid()->toString();
    $mutationId = Str::uuid()->toString();

    // First push
    $response1 = $this->actingAs($user)->postJson('/api/v1/sync/push', [
        'device_uuid' => $deviceUuid,
        'mutations' => [
            [
                'mutation_id' => $mutationId,
                'operation' => 'TEST_OPERATION',
                'payload' => [],
                'device_sequence' => 1,
            ],
        ],
    ]);

    $response1->assertOk();
    $response1->assertJsonPath('results.0.status', 'APPLIED');
    $this->assertDatabaseHas('sync_mutation_receipts', ['mutation_id' => $mutationId]);

    // Second push (idempotent)
    $response2 = $this->actingAs($user)->postJson('/api/v1/sync/push', [
        'device_uuid' => $deviceUuid,
        'mutations' => [
            [
                'mutation_id' => $mutationId,
                'operation' => 'TEST_OPERATION',
                'payload' => [],
                'device_sequence' => 1,
            ],
        ],
    ]);

    $response2->assertOk();
    $response2->assertJsonPath('results.0.status', 'APPLIED');
    $this->assertDatabaseCount('sync_mutation_receipts', 1);
});

test('it scopes push and pull to explicitly requested business_id when authorized', function () {
    $user = User::factory()->create();
    $businessA = Business::create(['public_id' => (string) Str::uuid(), 'name' => 'Business A']);
    $businessB = Business::create(['public_id' => (string) Str::uuid(), 'name' => 'Business B']);

    $user->memberships()->create(['business_id' => $businessA->id, 'role' => 'owner', 'status' => 'active']);
    $user->memberships()->create(['business_id' => $businessB->id, 'role' => 'attendant', 'status' => 'active']);

    $deviceUuid = (string) Str::uuid();
    $mutationId = (string) Str::uuid();

    // Push with explicit business_id
    $pushRes = $this->actingAs($user)->postJson('/api/v1/sync/push', [
        'business_id' => $businessB->id,
        'device_uuid' => $deviceUuid,
        'mutations' => [
            [
                'mutation_id' => $mutationId,
                'operation' => 'TEST_OPERATION',
                'payload' => [],
                'device_sequence' => 1,
            ],
        ],
    ]);

    $pushRes->assertOk();
    $this->assertDatabaseHas('sync_mutation_receipts', [
        'mutation_id' => $mutationId,
        'business_id' => $businessB->id,
    ]);

    // Pull with explicit business_id
    $pullRes = $this->actingAs($user)->getJson("/api/v1/sync/pull?business_id={$businessB->id}&cursor=0");
    $pullRes->assertOk();
});

test('a second distinct mutation reusing a device_sequence does not crash-loop the push', function () {
    // This is the real failure mode: the client's local sequence counter
    // can legitimately regress (e.g. its mutation queue fully drains) and
    // generate a new mutation_id under a device_sequence the server has
    // already recorded a receipt for under the same device_uuid.
    // mutation_id is the real idempotency key — device_sequence must never
    // be allowed to crash the request.
    $user = User::factory()->create();
    $business = Business::create(['public_id' => (string) Str::uuid(), 'name' => 'Push Test Business']);
    $user->memberships()->create(['business_id' => $business->id, 'role' => 'owner']);

    $deviceUuid = (string) Str::uuid();

    $first = $this->actingAs($user)->postJson('/api/v1/sync/push', [
        'device_uuid' => $deviceUuid,
        'mutations' => [[
            'mutation_id' => (string) Str::uuid(),
            'operation' => 'TEST_OPERATION',
            'payload' => [],
            'device_sequence' => 1,
        ]],
    ]);
    $first->assertOk();
    $first->assertJsonPath('results.0.status', 'APPLIED');

    $second = $this->actingAs($user)->postJson('/api/v1/sync/push', [
        'device_uuid' => $deviceUuid,
        'mutations' => [[
            'mutation_id' => (string) Str::uuid(),
            'operation' => 'TEST_OPERATION',
            'payload' => [],
            'device_sequence' => 1,
        ]],
    ]);

    $second->assertOk();
    $second->assertJsonPath('results.0.status', 'APPLIED');
    $this->assertDatabaseCount('sync_mutation_receipts', 2);
});

test('it rejects push to a business where user has no active membership', function () {
    $user = User::factory()->create();
    $foreignBusiness = Business::create(['public_id' => (string) Str::uuid(), 'name' => 'Foreign Business']);

    $response = $this->actingAs($user)->postJson('/api/v1/sync/push', [
        'business_id' => $foreignBusiness->id,
        'device_uuid' => (string) Str::uuid(),
        'mutations' => [
            [
                'mutation_id' => (string) Str::uuid(),
                'operation' => 'TEST_OPERATION',
                'payload' => [],
                'device_sequence' => 1,
            ],
        ],
    ]);

    $response->assertStatus(403);
});
