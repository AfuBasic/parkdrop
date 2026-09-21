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
