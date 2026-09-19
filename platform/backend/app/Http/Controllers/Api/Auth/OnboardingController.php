<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\CompleteOnboardingRequest;
use App\Actions\Auth\CompleteOwnerOnboardingAction;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class OnboardingController extends Controller
{
    public function __construct(private CompleteOwnerOnboardingAction $onboardingAction)
    {
    }

    public function complete(CompleteOnboardingRequest $request): JsonResponse
    {
        $validated = $request->validated();
        
        $result = $this->onboardingAction->execute($validated);

        // Issue Sanctum session by logging the user in
        Auth::login($result['user']);

        return response()->json([
            'message' => 'Onboarding completed successfully',
            'user' => $result['user'],
            'business' => $result['business'],
        ]);
    }
}
