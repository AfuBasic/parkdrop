<?php

namespace Tests\Feature\Business;

use App\Models\Business;
use App\Models\BusinessMembership;
use App\Models\PickupPoint;
use App\Models\PickupPointPhoneAudit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PickupPointPhoneTest extends TestCase
{
    use RefreshDatabase;

    protected User $owner;
    protected Business $business;
    protected PickupPoint $pickupPoint;
    protected BusinessMembership $ownerMembership;

    protected function setUp(): void
    {
        parent::setUp();

        $this->owner = User::factory()->create([
            'first_name' => 'Ada Owner',
            'email' => 'ada@example.com',
            'email_normalized' => 'ada@example.com',
        ]);

        $this->business = Business::create([
            'name' => 'ParkDrop Express Hub',
            'status' => 'active',
        ]);

        $this->pickupPoint = PickupPoint::create([
            'business_id' => $this->business->id,
            'name' => 'Ojota Counter 2',
            'park_name' => 'Ojota Motor Park',
            'contact_phone' => '2348031234567',
            'contact_phone_confirmed_at' => now(),
            'contact_phone_source' => 'onboarding',
            'status' => 'active',
        ]);

        $this->ownerMembership = BusinessMembership::create([
            'business_id' => $this->business->id,
            'user_id' => $this->owner->id,
            'role' => 'owner',
            'status' => 'active',
        ]);
    }

    public function test_owner_can_update_pickup_point_contact_phone_and_creates_audit_log(): void
    {
        $response = $this->actingAs($this->owner, 'sanctum')
            ->patchJson("/api/v1/business/pickup-points/{$this->pickupPoint->id}", [
                'name' => 'Ojota Counter 2',
                'park_name' => 'Ojota Motor Park',
                'contact_phone' => '0809 988 7766',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Pickup point updated successfully.',
                'pickup_point' => [
                    'id' => $this->pickupPoint->id,
                    'name' => 'Ojota Counter 2',
                    'contact_phone' => '2348099887766',
                ],
            ]);

        $this->assertDatabaseHas('pickup_points', [
            'id' => $this->pickupPoint->id,
            'contact_phone' => '2348099887766',
            'contact_phone_source' => 'entered',
        ]);

        $this->assertDatabaseHas('pickup_point_phone_audits', [
            'pickup_point_id' => $this->pickupPoint->id,
            'business_id' => $this->business->id,
            'user_id' => $this->owner->id,
            'old_phone_masked' => '...4567',
            'new_phone_masked' => '...7766',
        ]);
    }

    public function test_rejects_pickup_point_update_when_sms_exceeds_130_characters(): void
    {
        $response = $this->actingAs($this->owner, 'sanctum')
            ->patchJson("/api/v1/business/pickup-points/{$this->pickupPoint->id}", [
                'name' => str_repeat('A', 50),
                'park_name' => str_repeat('B', 50),
                'contact_phone' => '0803 123 4567',
            ]);

        $response->assertStatus(422)
            ->assertJson([
                'message' => 'These names are a bit long. Shorten them so your customers get one SMS.',
            ]);
    }

    public function test_rate_limits_phone_changes_to_max_3_per_day(): void
    {
        // Simulate 3 audit records in the last 24 hours
        for ($i = 0; $i < 3; $i++) {
            PickupPointPhoneAudit::create([
                'pickup_point_id' => $this->pickupPoint->id,
                'business_id' => $this->business->id,
                'user_id' => $this->owner->id,
                'old_phone_masked' => '...0000',
                'new_phone_masked' => "...000{$i}",
                'created_at' => now()->subHours(2),
            ]);
        }

        // 4th attempt should return 429
        $response = $this->actingAs($this->owner, 'sanctum')
            ->patchJson("/api/v1/business/pickup-points/{$this->pickupPoint->id}", [
                'name' => 'Ojota Counter 2',
                'park_name' => 'Ojota Motor Park',
                'contact_phone' => '0809 111 2233',
            ]);

        $response->assertStatus(429)
            ->assertJson([
                'message' => 'Phone number has been changed too many times today. Please try again tomorrow.',
            ]);
    }

    public function test_business_details_endpoint_returns_contact_phone_and_park_name(): void
    {
        $response = $this->actingAs($this->owner, 'sanctum')
            ->getJson('/api/v1/business/details');

        $response->assertStatus(200)
            ->assertJson([
                'current_pickup_point' => [
                    'id' => $this->pickupPoint->id,
                    'name' => 'Ojota Counter 2',
                    'park_name' => 'Ojota Motor Park',
                    'contact_phone' => '2348031234567',
                ],
            ]);
    }
}
