<?php

namespace Tests\Feature\Business;

use App\Mail\StaffInvitationMail;
use App\Models\Business;
use App\Models\BusinessInvitation;
use App\Models\BusinessMembership;
use App\Models\PickupPoint;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class BusinessStaffManagementTest extends TestCase
{
    use RefreshDatabase;

    protected User $owner;

    protected User $manager;

    protected User $attendant;

    protected Business $business;

    protected PickupPoint $pickupPoint;

    protected BusinessMembership $ownerMembership;

    protected BusinessMembership $managerMembership;

    protected BusinessMembership $attendantMembership;

    protected function setUp(): void
    {
        parent::setUp();
        Mail::fake();

        $this->owner = User::factory()->create([
            'first_name' => 'Owner Ada',
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
            'address' => 'Ojota Motor Park, Lagos',
            'landmark' => 'Near Counter 2',
            'status' => 'active',
        ]);

        $this->ownerMembership = BusinessMembership::create([
            'business_id' => $this->business->id,
            'user_id' => $this->owner->id,
            'role' => 'owner',
            'status' => 'active',
            'joined_at' => now(),
        ]);

        $this->manager = User::factory()->create([
            'first_name' => 'Manager Tunde',
            'email' => 'tunde@example.com',
            'email_normalized' => 'tunde@example.com',
        ]);

        $this->managerMembership = BusinessMembership::create([
            'business_id' => $this->business->id,
            'user_id' => $this->manager->id,
            'role' => 'manager',
            'status' => 'active',
            'joined_at' => now(),
        ]);

        $this->attendant = User::factory()->create([
            'first_name' => 'Attendant Chioma',
            'email' => 'chioma@example.com',
            'email_normalized' => 'chioma@example.com',
        ]);

        $this->attendantMembership = BusinessMembership::create([
            'business_id' => $this->business->id,
            'user_id' => $this->attendant->id,
            'role' => 'attendant',
            'status' => 'active',
            'joined_at' => now(),
        ]);
    }

    public function test_owner_can_view_staff_list_with_active_members_and_pending_invitations()
    {
        BusinessInvitation::create([
            'business_id' => $this->business->id,
            'email' => 'pending@example.com',
            'email_normalized' => 'pending@example.com',
            'role' => 'attendant',
            'status' => 'pending',
            'invited_by_user_id' => $this->owner->id,
            'expires_at' => now()->addDays(7),
        ]);

        $response = $this->actingAs($this->owner)
            ->getJson('/api/v1/business/staff');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'current_user_role',
                'members',
                'invitations',
            ]);

        $this->assertCount(3, $response->json('members'));
        $this->assertCount(1, $response->json('invitations'));
        $this->assertEquals('pending@example.com', $response->json('invitations.0.email'));
    }

    public function test_attendant_is_forbidden_from_viewing_staff_list()
    {
        $response = $this->actingAs($this->attendant)
            ->getJson('/api/v1/business/staff');

        $response->assertStatus(403);
    }

    public function test_owner_can_invite_an_attendant_and_email_is_queued()
    {
        $response = $this->actingAs($this->owner)
            ->postJson('/api/v1/business/invitations', [
                'email' => 'Emeka@Example.com',
                'role' => 'attendant',
            ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('business_invitations', [
            'business_id' => $this->business->id,
            'email_normalized' => 'emeka@example.com',
            'role' => 'attendant',
            'status' => 'pending',
        ]);

        Mail::assertQueued(StaffInvitationMail::class, function ($mail) {
            return $mail->hasTo('emeka@example.com');
        });
    }

    public function test_cannot_invite_someone_who_is_already_an_active_member()
    {
        $response = $this->actingAs($this->owner)
            ->postJson('/api/v1/business/invitations', [
                'email' => 'chioma@example.com',
                'role' => 'attendant',
            ]);

        $response->assertStatus(422)
            ->assertJsonFragment(['message' => 'This person already has access to this Business.']);
    }

    public function test_manager_can_invite_attendant_but_cannot_invite_manager_or_owner()
    {
        // Manager inviting attendant -> allowed
        $response1 = $this->actingAs($this->manager)
            ->postJson('/api/v1/business/invitations', [
                'email' => 'attendant2@example.com',
                'role' => 'attendant',
            ]);
        $response1->assertStatus(201);

        // Manager inviting manager -> forbidden
        $response2 = $this->actingAs($this->manager)
            ->postJson('/api/v1/business/invitations', [
                'email' => 'manager2@example.com',
                'role' => 'manager',
            ]);
        $response2->assertStatus(403);

        // Manager inviting owner -> forbidden
        $response3 = $this->actingAs($this->manager)
            ->postJson('/api/v1/business/invitations', [
                'email' => 'owner2@example.com',
                'role' => 'owner',
            ]);
        $response3->assertStatus(403);
    }

    public function test_duplicate_pending_invitation_updates_existing_record_idempotently()
    {
        $this->actingAs($this->owner)
            ->postJson('/api/v1/business/invitations', [
                'email' => 'duplicate@example.com',
                'role' => 'attendant',
            ])->assertStatus(201);

        // Second invite with same email
        $this->actingAs($this->owner)
            ->postJson('/api/v1/business/invitations', [
                'email' => 'duplicate@example.com',
                'role' => 'manager',
            ])->assertStatus(201);

        $count = BusinessInvitation::where('business_id', $this->business->id)
            ->where('email_normalized', 'duplicate@example.com')
            ->count();

        $this->assertEquals(1, $count);
        $this->assertEquals('manager', BusinessInvitation::where('email_normalized', 'duplicate@example.com')->first()->role);
    }

    public function test_owner_can_change_attendant_role_to_manager()
    {
        $response = $this->actingAs($this->owner)
            ->patchJson("/api/v1/business/members/{$this->attendantMembership->id}/role", [
                'role' => 'manager',
            ]);

        $response->assertStatus(200);
        $this->assertEquals('manager', $this->attendantMembership->fresh()->role);
    }

    public function test_manager_cannot_change_an_owner_or_manager_role()
    {
        $response = $this->actingAs($this->manager)
            ->patchJson("/api/v1/business/members/{$this->ownerMembership->id}/role", [
                'role' => 'attendant',
            ]);

        $response->assertStatus(403);
        $this->assertEquals('owner', $this->ownerMembership->fresh()->role);
    }

    public function test_last_owner_cannot_be_demoted_or_removed()
    {
        // Attempt to demote only owner
        $demoteResponse = $this->actingAs($this->owner)
            ->patchJson("/api/v1/business/members/{$this->ownerMembership->id}/role", [
                'role' => 'manager',
            ]);

        $demoteResponse->assertStatus(422)
            ->assertJsonFragment([
                'message' => 'This is the only Owner. Add another Owner before removing or changing this role.',
            ]);

        $this->assertEquals('owner', $this->ownerMembership->fresh()->role);

        // Attempt to remove only owner
        $removeResponse = $this->actingAs($this->owner)
            ->postJson("/api/v1/business/members/{$this->ownerMembership->id}/remove");

        $removeResponse->assertStatus(422)
            ->assertJsonFragment([
                'message' => 'This is the only Owner. Add another Owner before removing or changing this role.',
            ]);

        $this->assertEquals('active', $this->ownerMembership->fresh()->status);
    }

    public function test_owner_can_remove_an_attendant_safely_without_deleting_user_record()
    {
        $response = $this->actingAs($this->owner)
            ->postJson("/api/v1/business/members/{$this->attendantMembership->id}/remove");

        $response->assertStatus(200);
        $this->assertEquals('removed', $this->attendantMembership->fresh()->status);

        // User record is intact
        $this->assertDatabaseHas('users', ['id' => $this->attendant->id]);

        // Attendant's subsequent session request shows no active business
        $sessionResponse = $this->actingAs($this->attendant)
            ->getJson('/api/v1/auth/session');

        $sessionResponse->assertStatus(200);
        $this->assertNull($sessionResponse->json('business'));
        $this->assertTrue($sessionResponse->json('needs_onboarding'));
    }

    public function test_owner_can_view_and_update_business_details()
    {
        $showResponse = $this->actingAs($this->owner)
            ->getJson('/api/v1/business/details');

        $showResponse->assertStatus(200)
            ->assertJsonFragment(['name' => 'ParkDrop Express Hub'])
            ->assertJsonPath('current_pickup_point.name', 'Ojota Counter 2');

        $updateResponse = $this->actingAs($this->owner)
            ->patchJson('/api/v1/business/details', [
                'name' => 'ParkDrop New Name',
            ]);

        $updateResponse->assertStatus(200);
        $this->assertEquals('ParkDrop New Name', $this->business->fresh()->name);
    }

    public function test_manager_and_attendant_cannot_update_business_details()
    {
        $response = $this->actingAs($this->manager)
            ->patchJson('/api/v1/business/details', [
                'name' => 'Hacked Name',
            ]);

        $response->assertStatus(403);
    }

    public function test_cross_tenant_protection_blocks_access_to_other_business_staff()
    {
        $otherBusiness = Business::create(['name' => 'Other Business']);
        $otherUser = User::factory()->create(['email' => 'other@example.com']);
        $otherMembership = BusinessMembership::create([
            'business_id' => $otherBusiness->id,
            'user_id' => $otherUser->id,
            'role' => 'attendant',
            'status' => 'active',
        ]);

        // Ada (owner of Business 1) tries to remove otherMembership
        $response = $this->actingAs($this->owner)
            ->postJson("/api/v1/business/members/{$otherMembership->id}/remove");

        $response->assertStatus(404);
    }
}
