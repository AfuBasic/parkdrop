<?php

namespace Tests\Feature\Business;

use App\Models\Business;
use App\Models\BusinessMembership;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BusinessDetailsUpdateTest extends TestCase
{
    use RefreshDatabase;

    protected User $owner;

    protected User $manager;

    protected Business $business;

    protected function setUp(): void
    {
        parent::setUp();

        $this->owner = User::factory()->create([
            'first_name' => 'Owner Ada',
            'email' => 'ada@example.com',
            'email_normalized' => 'ada@example.com',
        ]);

        $this->manager = User::factory()->create([
            'first_name' => 'Manager Bayo',
            'email' => 'bayo@example.com',
            'email_normalized' => 'bayo@example.com',
        ]);

        $this->business = Business::create([
            'name' => 'ParkDrop Express Hub',
            'status' => 'active',
        ]);

        BusinessMembership::create([
            'business_id' => $this->business->id,
            'user_id' => $this->owner->id,
            'role' => 'owner',
            'status' => 'active',
        ]);

        BusinessMembership::create([
            'business_id' => $this->business->id,
            'user_id' => $this->manager->id,
            'role' => 'manager',
            'status' => 'active',
        ]);
    }

    public function test_new_business_defaults_to_500_naira_daily_storage_fee(): void
    {
        $this->assertSame(50_000, $this->business->fresh()->daily_storage_fee_minor);
    }

    public function test_owner_can_update_the_daily_storage_fee_alone(): void
    {
        $response = $this->actingAs($this->owner)
            ->patchJson('/api/v1/business/details', [
                'daily_storage_fee_minor' => 75_000,
            ]);

        $response->assertOk();
        $response->assertJsonPath('business.daily_storage_fee_minor', 75_000);

        $this->assertSame(75_000, $this->business->fresh()->daily_storage_fee_minor);
        // The name must be untouched by a fee-only update.
        $this->assertSame('ParkDrop Express Hub', $this->business->fresh()->name);
    }

    public function test_owner_can_update_name_and_fee_together(): void
    {
        $response = $this->actingAs($this->owner)
            ->patchJson('/api/v1/business/details', [
                'name' => 'Chima Parcel Services',
                'daily_storage_fee_minor' => 100_000,
            ]);

        $response->assertOk();

        $fresh = $this->business->fresh();
        $this->assertSame('Chima Parcel Services', $fresh->name);
        $this->assertSame(100_000, $fresh->daily_storage_fee_minor);
    }

    public function test_negative_daily_storage_fee_is_rejected(): void
    {
        $response = $this->actingAs($this->owner)
            ->patchJson('/api/v1/business/details', [
                'daily_storage_fee_minor' => -1,
            ]);

        $response->assertStatus(422);
        $this->assertSame(50_000, $this->business->fresh()->daily_storage_fee_minor);
    }

    public function test_zero_daily_storage_fee_is_allowed(): void
    {
        $response = $this->actingAs($this->owner)
            ->patchJson('/api/v1/business/details', [
                'daily_storage_fee_minor' => 0,
            ]);

        $response->assertOk();
        $this->assertSame(0, $this->business->fresh()->daily_storage_fee_minor);
    }

    public function test_manager_cannot_update_the_daily_storage_fee(): void
    {
        $response = $this->actingAs($this->manager)
            ->patchJson('/api/v1/business/details', [
                'daily_storage_fee_minor' => 100_000,
            ]);

        $response->assertStatus(403);
        $this->assertSame(50_000, $this->business->fresh()->daily_storage_fee_minor);
    }

    public function test_empty_payload_is_rejected(): void
    {
        $response = $this->actingAs($this->owner)
            ->patchJson('/api/v1/business/details', []);

        $response->assertStatus(422);
    }
}
