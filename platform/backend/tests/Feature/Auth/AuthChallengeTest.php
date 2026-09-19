<?php

namespace Tests\Feature\Auth;

use App\Mail\AuthChallengeMail;
use App\Models\AuthChallenge;
use App\Models\User;
use Illuminate\Contracts\Queue\ShouldBeEncrypted;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class AuthChallengeTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_request_an_auth_challenge()
    {
        Mail::fake();

        $response = $this->postJson('/api/v1/auth/code', [
            'email' => 'test@example.com',
            'purpose' => 'login',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Challenge sent successfully',
                'expires_in_minutes' => config('otp.expiry', 10),
            ]);

        $this->assertDatabaseHas('auth_challenges', [
            'email' => 'test@example.com',
            'purpose' => 'login',
        ]);

        Mail::assertQueued(AuthChallengeMail::class, function ($mail) {
            $this->assertInstanceOf(ShouldBeEncrypted::class, $mail);
            $this->assertEquals(config('otp.queue', 'auth'), $mail->queue);

            return $mail->hasTo('test@example.com');
        });
    }

    public function test_can_verify_a_valid_auth_challenge()
    {
        Mail::fake();

        $code = '123456';
        $challenge = AuthChallenge::create([
            'email' => 'verify@example.com',
            'code_hash' => Hash::make($code),
            'purpose' => 'login',
            'expires_at' => now()->addMinutes(15),
            'max_attempts' => 5,
        ]);

        $response = $this->postJson('/api/v1/auth/code/verify', [
            'email' => 'verify@example.com',
            'code' => $code,
            'purpose' => 'login',
        ]);

        $response->assertStatus(200)
            ->assertJson(['message' => 'Code verified successfully']);

        $this->assertDatabaseHas('auth_challenges', [
            'id' => $challenge->id,
        ]);

        $this->assertNotNull($challenge->fresh()->used_at);
    }

    public function test_rejects_an_invalid_auth_challenge_code()
    {
        $code = '123456';
        $challenge = AuthChallenge::create([
            'email' => 'fail@example.com',
            'code_hash' => Hash::make($code),
            'purpose' => 'login',
            'expires_at' => now()->addMinutes(15),
            'max_attempts' => 5,
        ]);

        $response = $this->postJson('/api/v1/auth/code/verify', [
            'email' => 'fail@example.com',
            'code' => '000000',
            'purpose' => 'login',
        ]);

        $response->assertStatus(422);
    }

    public function test_universal_otp_returns_authenticated_outcome_for_existing_user()
    {
        $user = User::create([
            'email' => 'owner@example.com',
            'email_normalized' => 'owner@example.com',
            'first_name' => 'Owner',
            'status' => 'active',
        ]);

        $code = '654321';
        AuthChallenge::create([
            'email' => 'owner@example.com',
            'code_hash' => Hash::make($code),
            'purpose' => 'auth',
            'expires_at' => now()->addMinutes(15),
            'max_attempts' => 5,
        ]);

        $response = $this->postJson('/api/v1/auth/code/verify', [
            'email' => 'OWNER@example.com ',
            'code' => $code,
            'purpose' => 'auth',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'outcome' => 'authenticated',
                'user' => [
                    'id' => $user->id,
                    'email' => 'owner@example.com',
                    'first_name' => 'Owner',
                ],
            ]);

        $this->assertAuthenticatedAs($user);
    }

    public function test_universal_otp_returns_new_user_outcome_for_unregistered_email()
    {
        $code = '654321';
        $challenge = AuthChallenge::create([
            'email' => 'newuser@example.com',
            'code_hash' => Hash::make($code),
            'purpose' => 'auth',
            'expires_at' => now()->addMinutes(15),
            'max_attempts' => 5,
        ]);

        $response = $this->postJson('/api/v1/auth/code/verify', [
            'email' => 'newuser@example.com',
            'code' => $code,
            'purpose' => 'auth',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'outcome' => 'new_user',
                'challenge_id' => $challenge->id,
                'email' => 'newuser@example.com',
            ]);

        $this->assertGuest();
    }

    public function test_session_endpoint_and_logout()
    {
        $user = User::create([
            'email' => 'sessionuser@example.com',
            'email_normalized' => 'sessionuser@example.com',
            'first_name' => 'SessionUser',
            'status' => 'active',
        ]);

        $this->actingAs($user);

        $sessionResponse = $this->getJson('/api/v1/auth/session');
        $sessionResponse->assertStatus(200)
            ->assertJson([
                'authenticated' => true,
                'user' => [
                    'email' => 'sessionuser@example.com',
                ],
            ]);

        $logoutResponse = $this->postJson('/api/v1/auth/logout');
        $logoutResponse->assertStatus(200)
            ->assertJson(['message' => 'Logged out successfully']);

        // Check that a fresh request without credentials is unauthenticated
        $this->app['auth']->forgetGuards();
        $this->getJson('/api/v1/auth/session')->assertStatus(401);
    }
}
