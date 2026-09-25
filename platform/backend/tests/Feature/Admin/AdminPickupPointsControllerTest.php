<?php

namespace Tests\Feature\Admin;

use App\Models\AdminUser;
use App\Models\Business;
use App\Models\Package;
use App\Models\PickupPoint;
use App\Models\SmsWallet;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminPickupPointsControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function admin(): AdminUser
    {
        return AdminUser::factory()->create();
    }

    /** @test */
    public function unauthenticated_user_is_redirected_to_login()
    {
        $this->get('/admin/pickup-points')
            ->assertRedirect('/admin/login');
    }

    /** @test */
    public function index_returns_paginated_pickup_points()
    {
        $this->actingAs($this->admin(), 'admin');

        $b1 = Business::create(['name' => 'Alpha', 'status' => 'active']);
        PickupPoint::create(['business_id' => $b1->id, 'park_name' => 'Park A', 'contact_phone' => '0801', 'status' => 'active']);
        SmsWallet::create(['business_id' => $b1->id, 'balance' => 500]);

        $response = $this->get('/admin/pickup-points');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                '*' => ['id', 'name', 'park', 'contactPhone', 'today', 'total', 'smsBalance']
            ]
        ]);
    }

    /** @test */
    public function index_filters_by_status()
    {
        $this->actingAs($this->admin(), 'admin');

        $active = Business::create(['name' => 'Active Park', 'status' => 'active']);
        $inactive = Business::create(['name' => 'Inactive Park', 'status' => 'inactive']);

        PickupPoint::create(['business_id' => $active->id, 'park_name' => 'A', 'contact_phone' => '0801', 'status' => 'active']);
        PickupPoint::create(['business_id' => $inactive->id, 'park_name' => 'I', 'contact_phone' => '0802', 'status' => 'inactive']);

        $response = $this->get('/admin/pickup-points?status=active');
        $response->assertStatus(200);
        $response->assertJsonCount(1, 'data');
    }

    /** @test */
    public function store_creates_business_and_pickup_point_with_wallet()
    {
        $this->actingAs($this->admin(), 'admin');

        $response = $this->post('/admin/pickup-points', [
            'name' => 'New Park',
            'park_name' => 'New Park Plaza',
            'contact_phone' => '08055551234',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('businesses', ['name' => 'New Park', 'status' => 'active']);
        $this->assertDatabaseHas('pickup_points', ['park_name' => 'New Park Plaza']);
        $this->assertDatabaseHas('sms_wallets', ['balance' => 0]);
    }

    /** @test */
    public function show_returns_pickup_point_detail_with_stats()
    {
        $this->actingAs($this->admin(), 'admin');

        $business = Business::create(['name' => 'Detail Park', 'status' => 'active']);
        $point = PickupPoint::create(['business_id' => $business->id, 'park_name' => 'DP', 'contact_phone' => '0801', 'status' => 'active']);

        $response = $this->get("/admin/pickup-points/{$point->id}");

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'pickupPoint' => ['id', 'name', 'park', 'stats' => ['totalReceived', 'totalCollected', 'waiting', 'overdue']]
        ]);
    }

    /** @test */
    public function update_changes_pickup_point_details()
    {
        $this->actingAs($this->admin(), 'admin');

        $business = Business::create(['name' => 'Old Name', 'status' => 'active']);
        $point = PickupPoint::create(['business_id' => $business->id, 'park_name' => 'Old Park', 'contact_phone' => '0801', 'status' => 'active']);

        $this->put("/admin/pickup-points/{$point->id}", [
            'name' => 'New Name',
            'park_name' => 'New Park',
            'contact_phone' => '08055559999',
        ])
        ->assertRedirect();

        $this->assertDatabaseHas('businesses', ['name' => 'New Name']);
        $this->assertDatabaseHas('pickup_points', ['park_name' => 'New Park', 'contact_phone' => '08055559999']);
    }

    /** @test */
    public function toggle_activates_and_deactivates_pickup_point()
    {
        $this->actingAs($this->admin(), 'admin');

        $business = Business::create(['name' => 'Toggle Park', 'status' => 'active']);
        $point = PickupPoint::create(['business_id' => $business->id, 'park_name' => 'TP', 'contact_phone' => '0801', 'status' => 'active']);

        $this->post("/admin/pickup-points/{$point->id}/toggle")->assertRedirect();
        $this->assertDatabaseHas('businesses', ['id' => $business->id, 'status' => 'inactive']);

        $this->post("/admin/pickup-points/{$point->id}/toggle")->assertRedirect();
        $this->assertDatabaseHas('businesses', ['id' => $business->id, 'status' => 'active']);
    }
}
