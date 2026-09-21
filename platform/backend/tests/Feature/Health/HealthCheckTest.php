<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

test('liveness probe returns 200 with status and timestamp', function () {
    $response = $this->getJson('/api/v1/health/live');

    $response->assertOk()
        ->assertJsonStructure([
            'status',
            'timestamp',
            'version',
        ])
        ->assertJson([
            'status' => 'healthy',
        ]);
});

test('readiness probe returns 200 when database is healthy', function () {
    $response = $this->getJson('/api/v1/health/ready');

    $response->assertOk()
        ->assertJsonStructure([
            'status',
            'timestamp',
            'version',
        ])
        ->assertJson([
            'status' => 'ready',
        ]);
});

test('dependencies probe is protected by auth and returns status', function () {
    // Unauthenticated
    $unauthRes = $this->getJson('/api/v1/health/dependencies');
    $unauthRes->assertUnauthorized();

    // Authenticated
    $user = User::factory()->create();
    $authRes = $this->actingAs($user)->getJson('/api/v1/health/dependencies');

    $authRes->assertOk()
        ->assertJsonStructure([
            'status',
            'timestamp',
            'database',
            'redis',
            'scheduler' => [
                'status',
                'last_heartbeat_at',
            ],
            'outbox' => [
                'pending_count',
            ],
        ]);
});

test('X-Request-ID header is propagated and assigned to API responses', function () {
    $customId = 'test-request-id-1234567890';
    $response = $this->withHeader('X-Request-ID', $customId)
        ->getJson('/api/v1/health/live');

    $response->assertOk();
    $response->assertHeader('X-Request-ID', $customId);

    // Without header, server generates UUID
    $resWithoutHeader = $this->getJson('/api/v1/health/live');
    $resWithoutHeader->assertOk();
    expect($resWithoutHeader->headers->get('X-Request-ID'))->not->toBeNull();
});

test('security headers are present in responses', function () {
    $response = $this->getJson('/api/v1/health/live');

    $response->assertHeader('X-Content-Type-Options', 'nosniff');
    $response->assertHeader('X-Frame-Options', 'DENY');
    $response->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    $response->assertHeader('Permissions-Policy', 'camera=(self), microphone=(), geolocation=()');
});
