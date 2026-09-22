<?php

namespace App\Http\Controllers\Api\V1\Reports;

use App\Actions\Reports\BuildRangeReportAction;
use App\Http\Controllers\Controller;
use App\Models\BusinessMembership;
use DomainException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;

class RangeReportController extends Controller
{
    public function show(
        Request $request,
        BuildRangeReportAction $action
    ): JsonResponse {
        $user = $request->user();
        $membership = $this->resolveMembership($request, $user);

        if (! $membership) {
            return response()->json(['message' => 'No active business membership found.'], 403);
        }

        $business = $membership->business;
        $preset = $request->input('preset') ?: 'today';
        $scope = $request->input('scope') ?: $request->input('pickup_point_id') ?: 'all';

        try {
            $report = $action->execute($business, $user, $preset, $scope);
            return response()->json($report);
        } catch (DomainException $e) {
            if ($e->getMessage() === 'UNAUTHORIZED') {
                return response()->json(['message' => 'Unauthorized to view operational reports.'], 403);
            }
            if ($e->getMessage() === 'PICKUP_POINT_NOT_FOUND') {
                return response()->json(['message' => 'Pickup point not found in this business.'], 404);
            }
            return response()->json(['message' => 'Unable to generate report.'], 422);
        } catch (InvalidArgumentException $e) {
            if ($e->getMessage() === 'INVALID_PRESET') {
                return response()->json(['message' => 'Invalid preset. Expected today, this_week, last_7_days, last_30_days.'], 422);
            }
            return response()->json(['message' => 'Invalid arguments.'], 422);
        }
    }

    private function resolveMembership(Request $request, $user): ?BusinessMembership
    {
        $requestedBusinessId = $request->input('business_id');
        if ($requestedBusinessId) {
            return $user->businessMemberships()
                ->where('business_id', $requestedBusinessId)
                ->where('status', 'active')
                ->first();
        }

        return $user->businessMemberships()
            ->where('status', 'active')
            ->first();
    }
}
