<?php

namespace Tests\Feature\Auth;

use App\Mail\WelcomeMail;
use App\Models\AuthChallenge;
use App\Models\Business;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class OnboardingTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_complete_owner_onboarding_with_a_valid_challenge()
    {
        Mail::fake();

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
            'park_name' => 'Peace Park',
            'contact_phone' => '08031234567',
            'challenge_id' => $challenge->id,
            'device_uuid' => 'test-device-uuid',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['user' => ['id'], 'business' => ['id']]);

        // The pickup point just created in this same request must come back
        // on the business object immediately — not just after a reload. A
        // first-time owner whose Home screen reads pickup_points from this
        // very response would otherwise see a stale "add your pickup point"
        // banner for a name they just typed.
        $response->assertJsonPath('business.pickup_points.0.name', 'Main Gate');
        $response->assertJsonPath('business.pickup_points.0.park_name', 'Peace Park');

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

        // Assert Welcome Email is queued
        Mail::assertQueued(WelcomeMail::class, function ($mail) {
            return $mail->hasTo('owner@example.com') &&
                $mail->user->first_name === 'John' &&
                $mail->pickupPoint?->name === 'Main Gate';
        });
    }
}
