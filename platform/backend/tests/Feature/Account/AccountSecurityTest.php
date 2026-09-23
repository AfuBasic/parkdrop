<?php

use App\Models\Business;
use App\Models\BusinessMembership;
use App\Models\Device;
use App\Models\User;
use App\Models\UserDevice;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

beforeEach(function () {
    $this->user = User::factory()->create([
        'first_name' => 'Ada',
        'email' => 'ada@example.com',
        'email_verified_at' => now(),
    ]);

    $this->otherUser = User::factory()->create([
        'first_name' => 'Tunde',
        'email' => 'tunde@example.com',
        'email_verified_at' => now(),
    ]);

    $this->business = Business::create([
        'name' => 'Lagos Central Logistics',
        'public_id' => (string) Str::uuid(),
    ]);

    BusinessMembership::create([
        'business_id' => $this->business->id,
        'user_id' => $this->user->id,
        'role' => 'owner',
        'status' => 'active',
    ]);
});

test('authenticated user can view account profile and active memberships summary', function () {
    $response = $this->actingAs($this->user)
        ->getJson('/api/v1/account/profile');

    $response->assertStatus(200)
        ->assertJson([
            'user' => [
                'id' => $this->user->id,
                'email' => 'ada@example.com',
                'first_name' => 'Ada',
            ],
            'businesses' => [
                [
                    'business_id' => $this->business->id,
                    'business_name' => 'Lagos Central Logistics',
                    'role' => 'owner',
                ],
            ],
        ]);
});

test('authenticated user can update display name with valid input', function () {
    $response = $this->actingAs($this->user)
        ->patchJson('/api/v1/account/profile', [
            'first_name' => 'Adanna',
        ]);

    $response->assertStatus(200)
        ->assertJson([
            'message' => 'Profile updated successfully.',
            'user' => [
                'first_name' => 'Adanna',
            ],
        ]);

    expect($this->user->fresh()->first_name)->toBe('Adanna');
});

test('display name update rejects too short or too long values', function () {
    $responseShort = $this->actingAs($this->user)
        ->patchJson('/api/v1/account/profile', [
            'first_name' => 'A',
        ]);
    $responseShort->assertStatus(422);

    $responseLong = $this->actingAs($this->user)
        ->patchJson('/api/v1/account/profile', [
            'first_name' => str_repeat('X', 101),
        ]);
    $responseLong->assertStatus(422);
});

test('authenticated user lists only their registered devices and marks current device', function () {
    $currentUuid = (string) Str::uuid();
    $otherUuid = (string) Str::uuid();
    $thirdPartyUuid = (string) Str::uuid();

    UserDevice::create([
        'user_id' => $this->user->id,
        'device_uuid' => $currentUuid,
        'device_name' => 'Chrome on macOS',
        'authorized_at' => now()->subDays(2),
        'last_seen_at' => now()->subMinutes(10),
    ]);

    UserDevice::create([
        'user_id' => $this->user->id,
        'device_uuid' => $otherUuid,
        'device_name' => 'Safari on iPhone',
        'authorized_at' => now()->subDays(5),
        'last_seen_at' => now()->subDays(1),
    ]);

    // Another user's device
    UserDevice::create([
        'user_id' => $this->otherUser->id,
        'device_uuid' => $thirdPartyUuid,
        'device_name' => 'Firefox on Linux',
        'authorized_at' => now()->subDays(1),
    ]);

    $response = $this->actingAs($this->user)
        ->withHeaders(['X-Device-UUID' => $currentUuid])
        ->getJson('/api/v1/account/devices');

    $response->assertStatus(200);
    $devices = $response->json('devices');

    expect($devices)->toHaveCount(2);

    $currentDevice = collect($devices)->firstWhere('is_current', true);
    expect($currentDevice)->not->toBeNull();
    expect($currentDevice['device_name'])->toBe('Chrome on macOS');

    $otherDevice = collect($devices)->firstWhere('is_current', false);
    expect($otherDevice)->not->toBeNull();
    expect($otherDevice['device_name'])->toBe('Safari on iPhone');
});

test('user cannot revoke another users device (IDOR defense)', function () {
    $otherDevice = UserDevice::create([
        'user_id' => $this->otherUser->id,
        'device_uuid' => (string) Str::uuid(),
        'device_name' => 'Other Phone',
        'authorized_at' => now(),
    ]);

    $response = $this->actingAs($this->user)
        ->postJson("/api/v1/account/devices/{$otherDevice->id}/revoke");

    $response->assertStatus(404);
    expect($otherDevice->fresh()->revoked_at)->toBeNull();
});

test('user can revoke their remote device which marks user_devices and sync devices table', function () {
    $remoteUuid = (string) Str::uuid();

    $userDevice = UserDevice::create([
        'user_id' => $this->user->id,
        'device_uuid' => $remoteUuid,
        'device_name' => 'Old iPad',
        'authorized_at' => now()->subMonths(1),
    ]);

    $syncDevice = Device::create([
        'uuid' => $remoteUuid,
        'is_revoked' => false,
    ]);

    $response = $this->actingAs($this->user)
        ->postJson("/api/v1/account/devices/{$userDevice->id}/revoke");

    $response->assertStatus(200)
        ->assertJson([
            'message' => 'Device access revoked successfully.',
            'device' => [
                'id' => $userDevice->id,
                'is_revoked' => true,
            ],
        ]);

    expect($userDevice->fresh()->revoked_at)->not->toBeNull();
    expect($syncDevice->fresh()->is_revoked)->toBeTrue();
});

test('revoke other devices revokes all devices except current device', function () {
    $currentUuid = (string) Str::uuid();
    $device1Uuid = (string) Str::uuid();
    $device2Uuid = (string) Str::uuid();

    $currentDev = UserDevice::create([
        'user_id' => $this->user->id,
        'device_uuid' => $currentUuid,
        'device_name' => 'MacBook Pro',
        'authorized_at' => now(),
    ]);

    $dev1 = UserDevice::create([
        'user_id' => $this->user->id,
        'device_uuid' => $device1Uuid,
        'device_name' => 'Office PC',
        'authorized_at' => now()->subDays(10),
    ]);

    $dev2 = UserDevice::create([
        'user_id' => $this->user->id,
        'device_uuid' => $device2Uuid,
        'device_name' => 'Old Phone',
        'authorized_at' => now()->subDays(20),
    ]);

    $sync1 = Device::create(['uuid' => $device1Uuid, 'is_revoked' => false]);
    $sync2 = Device::create(['uuid' => $device2Uuid, 'is_revoked' => false]);

    $response = $this->actingAs($this->user)
        ->withHeaders(['X-Device-UUID' => $currentUuid])
        ->postJson('/api/v1/account/devices/revoke-others');

    $response->assertStatus(200)
        ->assertJson([
            'message' => 'All other devices revoked successfully.',
            'revoked_count' => 2,
        ]);

    expect($currentDev->fresh()->revoked_at)->toBeNull();
    expect($dev1->fresh()->revoked_at)->not->toBeNull();
    expect($dev2->fresh()->revoked_at)->not->toBeNull();
    expect($sync1->fresh()->is_revoked)->toBeTrue();
    expect($sync2->fresh()->is_revoked)->toBeTrue();
});
