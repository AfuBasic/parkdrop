<?php

use App\Http\Controllers\Api\Auth\AuthChallengeController;
use App\Http\Controllers\Api\Auth\OnboardingController;
use App\Http\Controllers\Api\Auth\SessionController;
use App\Http\Controllers\Api\Media\CloudinarySignController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::prefix('v1/auth')->group(function () {
    // Universal OTP endpoints
    Route::post('/code', [AuthChallengeController::class, 'requestChallenge']);
    Route::post('/code/verify', [AuthChallengeController::class, 'verifyChallenge']);

    // Backward-compatible aliases
    Route::post('/challenge', [AuthChallengeController::class, 'requestChallenge']);
    Route::post('/verify', [AuthChallengeController::class, 'verifyChallenge']);

    // Registration completion for new users
    Route::post('/onboarding/complete', [OnboardingController::class, 'complete']);

    // Authenticated session management
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/session', [SessionController::class, 'show']);
        Route::post('/logout', [SessionController::class, 'destroy']);
    });
});

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/v1/media/cloudinary/sign', [CloudinarySignController::class, 'sign']);
});
