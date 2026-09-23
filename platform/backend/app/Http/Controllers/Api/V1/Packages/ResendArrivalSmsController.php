<?php

namespace App\Http\Controllers\Api\V1\Packages;

use App\Actions\Sms\ResendArrivalSmsAction;
use App\Http\Controllers\Controller;
use App\Models\Package;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ResendArrivalSmsController extends Controller
{
    public function __invoke(Request $request, string $package, ResendArrivalSmsAction $action): JsonResponse
    {
        Log::info('Resend SMS request', ['packageId' => $package]);
        $packageModel = Package::with('customer')->find($package);

        if (! $packageModel) {
            Log::info('Package not found', ['packageId' => $package]);
            return response()->json(['error' => 'Package not found.'], 404);
        }

        if (! $request->user()->businessMemberships()->where('business_id', $packageModel->business_id)->exists()) {
            return response()->json(['error' => 'Unauthorized access to this business.'], 403);
        }

        if (! $packageModel->customer || empty($packageModel->customer->phone_normalized ?? $packageModel->customer->phone_display)) {
            return response()->json(['error' => 'This package has no customer phone number to notify.'], 422);
        }

        $action->execute($packageModel);

        return response()->json(['message' => 'SMS queued for resend.']);
    }
}
