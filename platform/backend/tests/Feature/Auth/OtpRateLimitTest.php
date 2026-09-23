<?php

namespace Tests\Feature\Auth;

use App\Models\AuthChallenge;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use Tests\TestCase;

class OtpRateLimitTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // Clear rate limiters before each test to ensure a clean state
        foreach (['auth-code-global', 'auth-code-ip', 'auth-code-daily', 'auth-code-window', 'auth-code-cooldown'] as $limiter) {
            RateLimiter::clear($limiter); // not quite perfect for dynamic keys, but we'll clear by key manually
        }
        $this->artisan('cache:clear');
    }

    public function test_cooldown_prevents_immediate_subsequent_request()
    {
        Mail::fake();
        $email = 'cooldown@example.com';

        // 1. First request should succeed
        $response1 = $this->postJson('/api/v1/auth/code', [
            'email' => $email,
            'purpose' => 'auth',
        ]);
        $response1->assertStatus(200);

        // 2. Immediate second request should be rate-limited
        $response2 = $this->postJson('/api/v1/auth/code', [
            'email' => $email,
            'purpose' => 'auth',
        ]);

        $response2->assertStatus(429)
            ->assertJsonStructure(['message'])
            ->assertHeader('Retry-After');

        $this->assertStringContainsString('Too many code requests', $response2->json('message'));
    }

    public function test_different_email_has_different_bucket()
    {
        Mail::fake();

        // 1. First request for email A
        $this->postJson('/api/v1/auth/code', [
            'email' => 'user_a@example.com',
            'purpose' => 'auth',
        ])->assertStatus(200);

        // 2. Request for email B should succeed even if A is in cooldown
        $this->postJson('/api/v1/auth/code', [
            'email' => 'user_b@example.com',
            'purpose' => 'auth',
        ])->assertStatus(200);
    }

    public function test_email_casing_cannot_bypass_limiter()
    {
        Mail::fake();

        $this->postJson('/api/v1/auth/code', [
            'email' => 'casing@example.com',
            'purpose' => 'auth',
        ])->assertStatus(200);

        $this->postJson('/api/v1/auth/code', [
            'email' => 'CASING@example.com',
            'purpose' => 'auth',
        ])->assertStatus(429);
    }

    public function test_leading_trailing_spaces_cannot_bypass_limiter()
    {
        Mail::fake();

        $this->postJson('/api/v1/auth/code', [
            'email' => 'spaces@example.com',
            'purpose' => 'auth',
        ])->assertStatus(200);

        $this->postJson('/api/v1/auth/code', [
            'email' => ' spaces@example.com ',
            'purpose' => 'auth',
        ])->assertStatus(429);
    }

    public function test_short_window_limit_blocks_excessive_requests()
    {
        Mail::fake();
        $email = 'window@example.com';

        // Temporarily clear cooldown limiter manually to simulate time passing for cooldown,
        // but keep window limiter accumulating hits.
        // Actually, we can just clear the specific cooldown key.
        $hash = hash('sha256', $email);

        for ($i = 0; $i < 3; $i++) {
            $this->postJson('/api/v1/auth/code', [
                'email' => $email,
                'purpose' => 'auth',
            ])->assertStatus(200);

            RateLimiter::clear('auth-code-cooldown:'.$hash);
        }

        // The 4th request should fail due to short window limit
        $this->postJson('/api/v1/auth/code', [
            'email' => $email,
            'purpose' => 'auth',
        ])->assertStatus(429);
    }

    public function test_rate_limiter_clears_on_successful_verification()
    {
        Mail::fake();
        $email = 'verified_user@example.com';

        // 1. Request code
        $this->postJson('/api/v1/auth/code', [
            'email' => $email,
            'purpose' => 'auth',
        ])->assertStatus(200);

        // Immediate subsequent request is blocked by cooldown
        $this->postJson('/api/v1/auth/code', [
            'email' => $email,
            'purpose' => 'auth',
        ])->assertStatus(429);

        // Retrieve generated challenge code
        $challenge = AuthChallenge::where('email', $email)->first();
        $this->assertNotNull($challenge);

        // 2. Successfully verify with the challenge (simulate correct code verification)
        AuthChallenge::where('email', $email)->delete();

        $knownChallenge = AuthChallenge::create([
            'email' => $email,
            'code_hash' => Hash::make('654321'),
            'purpose' => 'auth',
            'expires_at' => now()->addMinutes(10),
            'max_attempts' => 5,
        ]);

        $this->postJson('/api/v1/auth/code/verify', [
            'email' => $email,
            'code' => '654321',
            'purpose' => 'auth',
        ])->assertStatus(200);

        // 3. Immediately request code again: cooldown and rate limiter were cleared on success!
        $this->postJson('/api/v1/auth/code', [
            'email' => $email,
            'purpose' => 'auth',
        ])->assertStatus(200);
    }
}
