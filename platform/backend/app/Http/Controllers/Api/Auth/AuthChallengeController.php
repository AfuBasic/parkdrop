<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RequestChallengeRequest;
use App\Http\Requests\Auth\VerifyChallengeRequest;
use App\Models\User;
use App\Models\UserDevice;
use App\Services\Auth\AuthChallengeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class AuthChallengeController extends Controller
{
    public function __construct(private AuthChallengeService $challengeService) {}

    public function requestChallenge(RequestChallengeRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $challenge = $this->challengeService->createChallenge(
            email: $validated['email'],
            purpose: $validated['purpose'],
            deviceUuid: $validated['device_uuid'] ?? null
        );

        return response()->json([
            'message' => 'Challenge sent successfully',
            'expires_in_minutes' => 15,
        ]);
    }

    public function verifyChallenge(VerifyChallengeRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $normalizedEmail = strtolower(trim($validated['email']));

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
            $request->session()->regenerate();

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
}
