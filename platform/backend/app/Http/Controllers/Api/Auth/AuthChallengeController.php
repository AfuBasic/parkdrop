<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RequestChallengeRequest;
use App\Http\Requests\Auth\VerifyChallengeRequest;
use App\Services\Auth\AuthChallengeService;
use Illuminate\Http\JsonResponse;

class AuthChallengeController extends Controller
{
    public function __construct(private AuthChallengeService $challengeService)
    {
    }

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

        $challenge = $this->challengeService->verifyChallenge(
            email: $validated['email'],
            code: $validated['code'],
            purpose: $validated['purpose']
        );

        if (!$challenge) {
            return response()->json([
                'message' => 'Invalid or expired code',
            ], 422);
        }

        // We do NOT create the Sanctum session here for registration.
        // For 'login' or 'new_device' on an existing user, we would log them in.
        // For 'registration', they proceed to onboarding.
        // For V1, the frontend will proceed to Name/PIN, and the final 
        // CompleteOnboardingRequest will create the user and issue the session.

        return response()->json([
            'message' => 'Code verified successfully',
            'challenge_id' => $challenge->id, // Frontend can use this to prove verification later if needed
        ]);
    }
}
