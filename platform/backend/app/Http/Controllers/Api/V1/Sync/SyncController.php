<?php

namespace App\Http\Controllers\Api\V1\Sync;

use App\Actions\Sync\PullChangesAction;
use App\Actions\Sync\PushMutationsAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Sync\PullChangesRequest;
use App\Http\Requests\Sync\PushMutationsRequest;
use App\Http\Resources\Sync\PullResultResource;
use App\Http\Resources\Sync\PushResultResource;
use Illuminate\Http\JsonResponse;

class SyncController extends Controller
{
    public function push(PushMutationsRequest $request, PushMutationsAction $action): JsonResponse
    {
        $user = $request->user();
        $requestedBusinessId = $request->validated('business_id');

        $membership = $requestedBusinessId
            ? $user->businessMemberships()->where('business_id', $requestedBusinessId)->where('status', 'active')->first()
            : $user->businessMemberships()->where('status', 'active')->first();

        if (! $membership || ! $membership->business) {
            return response()->json(['message' => 'Unauthorized or no active business membership found.'], 403);
        }

        $business = $membership->business;

        $results = $action->execute(
            $request->validated('mutations'),
            $request->validated('device_uuid'),
            $business,
            $user->id
        );

        return response()->json(new PushResultResource($results));
    }

    public function pull(PullChangesRequest $request, PullChangesAction $action): JsonResponse
    {
        $user = $request->user();
        $requestedBusinessId = $request->validated('business_id');

        $membership = $requestedBusinessId
            ? $user->businessMemberships()->where('business_id', $requestedBusinessId)->where('status', 'active')->first()
            : $user->businessMemberships()->where('status', 'active')->first();

        if (! $membership || ! $membership->business) {
            return response()->json(['message' => 'Unauthorized or no active business membership found.'], 403);
        }

        $business = $membership->business;

        $result = $action->execute(
            $business,
            $request->validated('cursor', 0),
            $request->validated('limit', 100)
        );

        return response()->json(new PullResultResource($result));
    }
}
