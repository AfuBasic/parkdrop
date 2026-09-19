<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RequestChallengeRequest;
use App\Http\Requests\Auth\VerifyChallengeRequest;
use App\Models\User;
use App\Models\UserDevice;
use App\Services\Auth\AuthChallengeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;

class AuthChallengeController extends Controller
{
    public function __construct(private AuthChallengeService $challengeService) {}

    public function requestChallenge(RequestChallengeRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $email = strtolower(trim($validated['email']));
        
        $tooManyRequests = $this->checkRateLimits($request, $email);
        
        if ($tooManyRequests instanceof JsonResponse) {
            return $tooManyRequests;
        }

        $challenge = $this->challengeService->createChallenge(
            email: $email,
            purpose: $validated['purpose'],
            deviceUuid: $validated['device_uuid'] ?? null
        );

        return response()->json([
            'message' => 'Challenge sent successfully',
            'expires_in_minutes' => config('otp.expiry', 10),
        ]);
    }

    public function verifyChallenge(VerifyChallengeRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $normalizedEmail = strtolower(trim($validated['email']));

        // We could also add brute-force protection to verifyChallenge here.
        // But verifyChallenge is natively protected by attempt_count in the service.
        // We will add IP rate limiting for verify endpoint just to be safe.
        $verifyKey = 'verify-ip:'.$request->ip();
        if (RateLimiter::tooManyAttempts($verifyKey, 30)) {
            return response()->json(['message' => 'Too many code verification attempts. Please try again later.'], 429);
        }
        RateLimiter::hit($verifyKey, 15 * 60);

        $challenge = $this->challengeService->verifyChallenge(
            email: $normalizedEmail,
            code: $validated['code'],
            purpose: $validated['purpose']
        );

        if (! $challenge) {
            return response()->json([
                'message' => 'Invalid or expired code',
            ], 422);
        }

        RateLimiter::clear($verifyKey);

        // Look up user by normalized email
        $user = User::where('email_normalized', $normalizedEmail)
            ->orWhere('email', $normalizedEmail)
            ->first();

        if ($user) {
            // Update email_verified_at if null
            if (is_null($user->email_verified_at)) {
                $user->email_verified_at = now();
                $user->save();
            }

            // Update user device if device_uuid was sent
            if (! empty($validated['device_uuid'])) {
                UserDevice::updateOrCreate(
                    [
                        'user_id' => $user->id,
                        'device_uuid' => $validated['device_uuid'],
                    ],
                    [
                        'authorized_at' => now(),
                        'last_seen_at' => now(),
                    ]
                );
            }

            // Create Sanctum session
            Auth::login($user);
            if ($request->hasSession()) {
                $request->session()->regenerate();
            }

            // Load primary business membership
            $membership = $user->businessMemberships()->with('business.pickupPoints')->first();
            $business = $membership?->business;

            return response()->json([
                'outcome' => 'authenticated',
                'message' => 'Logged in successfully',
                'user' => [
                    'id' => $user->id,
                    'email' => $user->email,
                    'first_name' => $user->first_name,
                    'status' => $user->status,
                ],
                'business' => $business ? [
                    'id' => $business->id,
                    'public_id' => $business->public_id,
                    'name' => $business->name,
                    'pickup_points' => $business->pickupPoints,
                ] : null,
                'role' => $membership?->role ?? 'owner',
            ]);
        }

        // User does not exist yet -> new_user outcome
        return response()->json([
            'outcome' => 'new_user',
            'message' => 'Code verified successfully',
            'challenge_id' => $challenge->id,
            'email' => $normalizedEmail,
        ]);
    }
    
    /**
     * Check if the request exceeds any rate limits.
     * Returns a JsonResponse if limits are exceeded, null otherwise.
     */
    protected function checkRateLimits(Request $request, string $email): ?JsonResponse
    {
        $hash = hash('sha256', $email);
        $cooldownKey = 'auth-code-cooldown:'.$hash;
        $ip = $request->ip();
        
        $limiters = [
            'auth-code-global' => 'global-otp-send',
            'auth-code-ip' => $ip,
            'auth-code-daily' => $hash,
            'auth-code-window' => $hash,
        ];

        // 1. Check strict cooldown manually in seconds
        $cooldownSeconds = config('otp.limits.send_cooldown_seconds', 60);
        if (RateLimiter::tooManyAttempts($cooldownKey, 1)) {
            return $this->buildRateLimitResponse(RateLimiter::availableIn($cooldownKey));
        }

        // 2. Check all defined limiters
        foreach ($limiters as $limiter => $key) {
            // Because we defined these in AppServiceProvider via RateLimiter::for(),
            // we have to check them via the middleware, or resolve them manually.
            // But RateLimiter::for() defines limit objects for middleware, it doesn't automatically 
            // map to RateLimiter::tooManyAttempts unless we pass it to the middleware stack.
            // Wait, RateLimiter facade can check custom named limiters using the key if we just apply the same key pattern.
            // Actually, the named limiters in RateLimiter::for() only take effect when `throttle` middleware is used.
            // Since we want standard response logic that doesn't reveal if the email exists, we can apply the `throttle` 
            // middleware to the route, OR just manually enforce limits here. 
            // Since I registered them in RateLimiter::for, it's easier to use the `throttle` middleware in routes.
            // BUT wait, `throttle` middleware throws a `ThrottleRequestsException` which Laravel renders as standard 429.
            // It might reveal information or log differently, and the user requested:
            // "Do NOT reveal whether the email belongs to a ParkDrop account."
            // "Return an appropriate 429 Too Many Requests with a useful Retry-After."
            
            // To be 100% compliant with the spec, doing it manually is safest.
        }
        
        // Manual rate limit enforcement for exact precision and no middleware side-effects:
        
        // Global daily
        if (RateLimiter::tooManyAttempts('global-otp:'.$ip, config('otp.limits.global_daily.attempts', 1000))) {
            return $this->buildRateLimitResponse(RateLimiter::availableIn('global-otp:'.$ip));
        }
        
        // IP 15 min
        if (RateLimiter::tooManyAttempts('ip-otp:'.$ip, config('otp.limits.ip.attempts', 20))) {
            return $this->buildRateLimitResponse(RateLimiter::availableIn('ip-otp:'.$ip));
        }
        
        // Email daily
        if (RateLimiter::tooManyAttempts('email-daily-otp:'.$hash, config('otp.limits.send_daily.attempts', 8))) {
            return $this->buildRateLimitResponse(RateLimiter::availableIn('email-daily-otp:'.$hash));
        }
        
        // Email 15 min
        if (RateLimiter::tooManyAttempts('email-window-otp:'.$hash, config('otp.limits.send_short_window.attempts', 3))) {
            return $this->buildRateLimitResponse(RateLimiter::availableIn('email-window-otp:'.$hash));
        }

        // 3. Register Hits
        RateLimiter::hit($cooldownKey, $cooldownSeconds);
        RateLimiter::hit('global-otp:'.$ip, config('otp.limits.global_daily.minutes', 1440) * 60);
        RateLimiter::hit('ip-otp:'.$ip, config('otp.limits.ip.minutes', 15) * 60);
        RateLimiter::hit('email-daily-otp:'.$hash, config('otp.limits.send_daily.minutes', 1440) * 60);
        RateLimiter::hit('email-window-otp:'.$hash, config('otp.limits.send_short_window.minutes', 15) * 60);

        return null;
    }
    
    protected function buildRateLimitResponse(int $retryAfter): JsonResponse
    {
        $minutes = ceil($retryAfter / 60);
        $message = "Too many code requests. Wait a little and try again.";
        if ($minutes > 0) {
            $message = "Too many code requests. Try again in about {$minutes} minutes.";
        } else {
            $message = "Too many code requests. Try again in a few seconds.";
        }
        
        return response()->json([
            'message' => $message,
        ], 429, [
            'Retry-After' => $retryAfter,
        ]);
    }
}
