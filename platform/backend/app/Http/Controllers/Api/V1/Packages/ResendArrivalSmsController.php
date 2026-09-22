<?php

namespace App\Http\Controllers\Api\V1\Packages;

use App\Actions\Sms\ResendArrivalSmsAction;
use App\Http\Controllers\Controller;
use App\Models\Package;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ResendArrivalSmsController extends Controller
{
    public function __invoke(Request $request, string $packageId, ResendArrivalSmsAction $action): JsonResponse
    {
        $package = Package::with('customer')->find($packageId);

        if (! $package) {
            return response()->json(['error' => 'Package not found.'], 404);
        }

        if (! $request->user()->businessMemberships()->where('business_id', $package->business_id)->exists()) {
            return response()->json(['error' => 'Unauthorized access to this business.'], 403);
        }

        if (! $package->customer || empty($package->customer->phone_normalized ?? $package->customer->phone_display)) {
            return response()->json(['error' => 'This package has no customer phone number to notify.'], 422);
        }

        $action->execute($package);

        return response()->json(['message' => 'SMS queued for resend.']);
    }
}
