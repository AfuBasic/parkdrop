<?php

use App\Http\Controllers\Api\Auth\AuthChallengeController;
use App\Http\Controllers\Api\Auth\OnboardingController;
use App\Http\Controllers\Api\Auth\SessionController;
use App\Http\Controllers\Api\Media\CloudinarySignController;
use App\Http\Controllers\Api\V1\Account\AccountSecurityController;
use App\Http\Controllers\Api\V1\Business\BusinessDetailsController;
use App\Http\Controllers\Api\V1\Business\BusinessStaffController;
use App\Http\Controllers\Api\V1\Business\PickupPointController;
use App\Http\Controllers\Api\V1\PackageMedia\PackageMediaController;
use App\Http\Controllers\Api\V1\Reports\DailyOperationsReportController;
use App\Http\Controllers\Api\V1\SmsCredits\SmsCreditPurchaseController;
use App\Http\Controllers\Api\V1\Sync\SyncController;
use App\Http\Controllers\Webhooks\PaymentWebhookController;
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
    Route::post('/v1/sync/push', [SyncController::class, 'push']);
    Route::get('/v1/sync/pull', [SyncController::class, 'pull']);

    // Package Media endpoints
    Route::prefix('v1/packages/{package}/media')->group(function () {
        Route::post('authorize', [PackageMediaController::class, 'authorizeUpload']);
        Route::post('complete', [PackageMediaController::class, 'completeUpload']);
        Route::get('{media}/view', [PackageMediaController::class, 'view']);
    });

    // SMS Credit Purchases
    Route::prefix('v1/sms-credit-purchases')->group(function () {
        Route::get('bundles', [SmsCreditPurchaseController::class, 'bundles']);
        Route::post('', [SmsCreditPurchaseController::class, 'store']);
        Route::get('{purchase}', [SmsCreditPurchaseController::class, 'show']);
        Route::post('{purchase}/verify', [SmsCreditPurchaseController::class, 'verify']);
    });

    // Business Staff & Details (Build 18)
    Route::prefix('v1/business')->group(function () {
        Route::get('staff', [BusinessStaffController::class, 'index']);
        Route::post('invitations', [BusinessStaffController::class, 'invite']);
        Route::post('invitations/{invitation}/resend', [BusinessStaffController::class, 'resend']);
        Route::post('invitations/{invitation}/revoke', [BusinessStaffController::class, 'revoke']);
        Route::patch('members/{membership}/role', [BusinessStaffController::class, 'changeRole']);
        Route::post('members/{membership}/remove', [BusinessStaffController::class, 'removeMember']);

        Route::get('details', [BusinessDetailsController::class, 'show']);
        Route::patch('details', [BusinessDetailsController::class, 'update']);

        // Pickup Points (Build 20)
        Route::get('pickup-points', [PickupPointController::class, 'index']);
        Route::post('pickup-points', [PickupPointController::class, 'store']);
        Route::patch('pickup-points/{pickupPoint}', [PickupPointController::class, 'update']);
        Route::post('pickup-points/{pickupPoint}/deactivate', [PickupPointController::class, 'deactivate']);
        Route::post('pickup-points/{pickupPoint}/reactivate', [PickupPointController::class, 'reactivate']);
    });

    // Daily Operations & Reports (Build 21)
    Route::prefix('v1/reports/daily-operations')->group(function () {
        Route::get('', [DailyOperationsReportController::class, 'summary']);
        Route::get('events', [DailyOperationsReportController::class, 'events']);
        Route::get('export', [DailyOperationsReportController::class, 'export']);
    });

    // Account, Security & Device Management (Build 22)
    Route::prefix('v1/account')->group(function () {
        Route::get('profile', [AccountSecurityController::class, 'profile']);
        Route::patch('profile', [AccountSecurityController::class, 'updateProfile']);
        Route::get('devices', [AccountSecurityController::class, 'devices']);
        Route::post('devices/{id}/revoke', [AccountSecurityController::class, 'revokeDevice']);
        Route::post('devices/revoke-others', [AccountSecurityController::class, 'revokeOtherDevices']);
    });
});

// Public Payment Provider Webhooks (Signature verified)
Route::post('/webhooks/payments/{provider}', [PaymentWebhookController::class, 'handle']);
