<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\Media\CloudinarySignController;
use App\Http\Controllers\Api\Auth\AuthChallengeController;

use App\Http\Controllers\Api\Auth\OnboardingController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::prefix('v1/auth')->group(function () {
    Route::post('/challenge', [AuthChallengeController::class, 'requestChallenge']);
    Route::post('/verify', [AuthChallengeController::class, 'verifyChallenge']);
    Route::post('/onboarding/complete', [OnboardingController::class, 'complete']);
});

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/v1/media/cloudinary/sign', [CloudinarySignController::class, 'sign']);
});
