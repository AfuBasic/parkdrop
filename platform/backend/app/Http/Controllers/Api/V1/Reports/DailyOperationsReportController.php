<?php

namespace App\Http\Controllers\Api\V1\Reports;

use App\Actions\Reports\BuildDailyOperationsReportAction;
use App\Actions\Reports\ExportDailyOperationsReportAction;
use App\Actions\Reports\ListDailyOperationsEventsAction;
use App\Http\Controllers\Controller;
use App\Models\BusinessMembership;
use App\Support\BusinessDayBounds;
use DomainException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;
use Symfony\Component\HttpFoundation\StreamedResponse;

class DailyOperationsReportController extends Controller
{
    /**
     * Get summary metrics for a given business-local date and scope.
     */
    public function summary(
        Request $request,
        BuildDailyOperationsReportAction $action
    ): JsonResponse {
        $user = $request->user();
        $membership = $this->resolveMembership($request, $user);

        if (! $membership) {
            return response()->json(['message' => 'No active business membership found.'], 403);
        }

        $business = $membership->business;

        $date = $request->input('date') ?: BusinessDayBounds::todayLocal();
        $scope = $request->input('scope') ?: $request->input('pickup_point_id') ?: 'all';

        try {
            $report = $action->execute($business, $user, $date, $scope);

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
            if ($e->getMessage() === 'FUTURE_DATE_NOT_ALLOWED') {
                return response()->json(['message' => 'Reports cannot be generated for future dates.'], 422);
            }

            return response()->json(['message' => 'Invalid date format. Expected YYYY-MM-DD.'], 422);
        }
    }

    /**
     * Get paginated operational events for a given business-local date and scope.
     */
    public function events(
        Request $request,
        ListDailyOperationsEventsAction $action
    ): JsonResponse {
        $user = $request->user();
        $membership = $this->resolveMembership($request, $user);

        if (! $membership) {
            return response()->json(['message' => 'No active business membership found.'], 403);
        }

        $business = $membership->business;

        $date = $request->input('date') ?: BusinessDayBounds::todayLocal();
        $scope = $request->input('scope') ?: $request->input('pickup_point_id') ?: 'all';
        $limit = min(100, max(1, (int) ($request->input('limit') ?: 30)));
        $offset = max(0, (int) ($request->input('offset') ?: 0));

        try {
            $events = $action->execute($business, $user, $date, $scope, $limit, $offset);

            return response()->json($events);
        } catch (DomainException $e) {
            if ($e->getMessage() === 'UNAUTHORIZED') {
                return response()->json(['message' => 'Unauthorized to view operational reports.'], 403);
            }
            if ($e->getMessage() === 'PICKUP_POINT_NOT_FOUND') {
                return response()->json(['message' => 'Pickup point not found in this business.'], 404);
            }

            return response()->json(['message' => 'Unable to fetch report events.'], 422);
        } catch (InvalidArgumentException $e) {
            if ($e->getMessage() === 'FUTURE_DATE_NOT_ALLOWED') {
                return response()->json(['message' => 'Reports cannot be generated for future dates.'], 422);
            }

            return response()->json(['message' => 'Invalid date format. Expected YYYY-MM-DD.'], 422);
        }
    }

    /**
     * Export canonical CSV stream for a given business-local date and scope.
     */
    public function export(
        Request $request,
        ExportDailyOperationsReportAction $action
    ): StreamedResponse|JsonResponse {
        $user = $request->user();
        $membership = $this->resolveMembership($request, $user);

        if (! $membership) {
            return response()->json(['message' => 'No active business membership found.'], 403);
        }

        $business = $membership->business;

        $date = $request->input('date') ?: BusinessDayBounds::todayLocal();
        $scope = $request->input('scope') ?: $request->input('pickup_point_id') ?: 'all';

        try {
            return $action->execute($business, $user, $date, $scope);
        } catch (DomainException $e) {
            if ($e->getMessage() === 'UNAUTHORIZED') {
                return response()->json(['message' => 'Unauthorized to export operational reports.'], 403);
            }
            if ($e->getMessage() === 'PICKUP_POINT_NOT_FOUND') {
                return response()->json(['message' => 'Pickup point not found in this business.'], 404);
            }

            return response()->json(['message' => 'Unable to export report.'], 422);
        } catch (InvalidArgumentException $e) {
            if ($e->getMessage() === 'FUTURE_DATE_NOT_ALLOWED') {
                return response()->json(['message' => 'Reports cannot be generated for future dates.'], 422);
            }

            return response()->json(['message' => 'Invalid date format. Expected YYYY-MM-DD.'], 422);
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
