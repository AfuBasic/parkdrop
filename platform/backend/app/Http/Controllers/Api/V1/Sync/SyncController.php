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
        $business = $request->user()->business ?? $request->user()->memberships()->first()->business;
        
        $results = $action->execute(
            $request->validated('mutations'),
            $request->validated('device_uuid'),
            $business,
            $request->user()->id
        );

        return response()->json(new PushResultResource($results));
    }

    public function pull(PullChangesRequest $request, PullChangesAction $action): JsonResponse
    {
        $business = $request->user()->business ?? $request->user()->memberships()->first()->business;
        
        $result = $action->execute(
            $business,
            $request->validated('cursor', 0),
            $request->validated('limit', 100)
        );

        return response()->json(new PullResultResource($result));
    }
}
