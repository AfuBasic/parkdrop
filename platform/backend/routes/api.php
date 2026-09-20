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

    // Sync endpoints
    Route::post('/v1/sync/push', [\App\Http\Controllers\Api\V1\Sync\SyncController::class, 'push']);
    Route::get('/v1/sync/pull', [\App\Http\Controllers\Api\V1\Sync\SyncController::class, 'pull']);
    
    // Package Media endpoints
    Route::prefix('v1/packages/{package}/media')->group(function () {
        Route::post('authorize', [\App\Http\Controllers\Api\V1\PackageMedia\PackageMediaController::class, 'authorizeUpload']);
        Route::post('complete', [\App\Http\Controllers\Api\V1\PackageMedia\PackageMediaController::class, 'completeUpload']);
        Route::get('{media}/view', [\App\Http\Controllers\Api\V1\PackageMedia\PackageMediaController::class, 'view']);
    });
});
