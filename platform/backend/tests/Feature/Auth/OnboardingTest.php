<?php

namespace Tests\Feature\Auth;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\AuthChallenge;
use App\Models\User;
use App\Models\Business;
use Illuminate\Support\Facades\Hash;

class OnboardingTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_complete_owner_onboarding_with_a_valid_challenge()
    {
        // 1. Create a verified challenge
        $challenge = AuthChallenge::create([
            'email' => 'owner@example.com',
            'code_hash' => Hash::make('123456'),
            'purpose' => 'registration',
            'expires_at' => now()->addMinutes(15),
            'used_at' => now(),
            'max_attempts' => 3,
        ]);

        // 2. Complete onboarding
        $response = $this->postJson('/api/v1/auth/onboarding/complete', [
            'email' => 'owner@example.com',
            'first_name' => 'John',
            'pickup_point_name' => 'Main Gate',
            'challenge_id' => $challenge->id,
            'device_uuid' => 'test-device-uuid',
        ]);

        $response->assertStatus(200)
                 ->assertJsonStructure(['user' => ['id'], 'business' => ['id']]);

        // Assert User created
        $this->assertDatabaseHas('users', [
            'email' => 'owner@example.com',
            'first_name' => 'John',
        ]);

        $user = User::where('email', 'owner@example.com')->first();

        // Assert Business created
        $this->assertDatabaseHas('businesses', [
            'name' => "John's Business",
        ]);

        $business = Business::first();

        // Assert Membership
        $this->assertDatabaseHas('business_memberships', [
            'business_id' => $business->id,
            'user_id' => $user->id,
            'role' => 'owner',
        ]);

        // Assert Pickup Point
        $this->assertDatabaseHas('pickup_points', [
            'business_id' => $business->id,
            'name' => 'Main Gate',
        ]);

        // Assert SMS Wallet and Welcome Credits
        $this->assertDatabaseHas('sms_wallets', [
            'business_id' => $business->id,
            'balance' => 20,
        ]);

        // Assert Device
        $this->assertDatabaseHas('user_devices', [
            'user_id' => $user->id,
            'device_uuid' => 'test-device-uuid',
        ]);

        // Assert Session is authenticated
        $this->assertAuthenticatedAs($user);
    }
}
