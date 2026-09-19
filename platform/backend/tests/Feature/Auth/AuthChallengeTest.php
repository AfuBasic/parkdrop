<?php

namespace Tests\Feature\Auth;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\AuthChallenge;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Hash;
use App\Mail\AuthChallengeMail;

class AuthChallengeTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_request_an_auth_challenge()
    {
        Mail::fake();

        $response = $this->postJson('/api/v1/auth/challenge', [
            'email' => 'test@example.com',
            'purpose' => 'login',
        ]);

        $response->assertStatus(200)
                 ->assertJson(['message' => 'Challenge sent successfully']);

        $this->assertDatabaseHas('auth_challenges', [
            'email' => 'test@example.com',
            'purpose' => 'login',
        ]);

        Mail::assertQueued(AuthChallengeMail::class);
    }

    public function test_can_verify_a_valid_auth_challenge()
    {
        Mail::fake();

        // Create a challenge
        $this->postJson('/api/v1/auth/challenge', [
            'email' => 'test@example.com',
            'purpose' => 'registration',
        ]);

        $code = '123456';
        $challenge = AuthChallenge::create([
            'email' => 'verify@example.com',
            'code_hash' => Hash::make($code),
            'purpose' => 'login',
            'expires_at' => now()->addMinutes(15),
            'max_attempts' => 3,
        ]);

        $response = $this->postJson('/api/v1/auth/verify', [
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
            'max_attempts' => 3,
        ]);

        $response = $this->postJson('/api/v1/auth/verify', [
            'email' => 'fail@example.com',
            'code' => '000000',
            'purpose' => 'login',
        ]);

        $response->assertStatus(422);
    }
}
