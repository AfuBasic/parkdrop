<?php

namespace App\Http\Controllers\Api\V1\Business;

use App\Actions\PickupPoints\CreatePickupPointAction;
use App\Actions\PickupPoints\DeactivatePickupPointAction;
use App\Actions\PickupPoints\ReactivatePickupPointAction;
use App\Actions\PickupPoints\RenamePickupPointAction;
use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\BusinessMembership;
use App\Models\Package;
use App\Models\PickupPoint;
use DomainException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;

class PickupPointController extends Controller
{
    /**
     * Get all pickup points for the active business, with waiting package counts.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $requestedBusinessId = $request->input('business_id');
        $membership = $requestedBusinessId
            ? $user->businessMemberships()->where('business_id', $requestedBusinessId)->where('status', 'active')->first()
            : $user->businessMemberships()->where('status', 'active')->first();

        if (! $membership) {
            return response()->json(['message' => 'No active business membership found.'], 403);
        }

        $business = $membership->business;

        $pickupPoints = PickupPoint::where('business_id', $business->id)
            ->orderBy('id', 'asc')
            ->get();

        // Calculate waiting package count per pickup point
        $waitingCounts = Package::where('business_id', $business->id)
            ->where('status', 'WAITING')
            ->selectRaw('pickup_point_id, count(*) as count')
            ->groupBy('pickup_point_id')
            ->pluck('count', 'pickup_point_id');

        return response()->json([
            'business' => [
                'id' => $business->id,
                'name' => $business->name,
            ],
            'pickup_points' => $pickupPoints->map(function ($point) use ($waitingCounts) {
                return [
                    'id' => $point->id,
                    'public_id' => $point->public_id,
                    'name' => $point->name,
                    'park_name' => $point->park_name,
                    'status' => $point->status,
                    'waiting_count' => (int) ($waitingCounts[$point->id] ?? 0),
                    'created_at' => $point->created_at?->toIso8601String(),
                ];
            }),
        ]);
    }

    /**
     * Create a new pickup point (Owner or Manager).
     */
    public function store(Request $request, CreatePickupPointAction $action): JsonResponse
    {
        $user = $request->user();
        $membership = $this->resolveMembership($request, $user);

        if (! $membership) {
            return response()->json(['message' => 'No active business membership found.'], 403);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'min:2', 'max:100'],
            'park_name' => ['nullable', 'string', 'max:100'],
        ]);

        try {
            $point = $action->execute($membership->business, $validated, $user);

            return response()->json([
                'message' => 'Pickup point created successfully.',
                'pickup_point' => [
                    'id' => $point->id,
                    'public_id' => $point->public_id,
                    'name' => $point->name,
                    'park_name' => $point->park_name,
                    'status' => $point->status,
                    'waiting_count' => 0,
                    'created_at' => $point->created_at?->toIso8601String(),
                ],
            ], 201);
        } catch (DomainException $e) {
            if ($e->getMessage() === 'FORBIDDEN') {
                return response()->json(['message' => 'Only an Owner or Manager can add a pickup point.'], 403);
            }
            if ($e->getMessage() === 'DUPLICATE_NAME') {
                return response()->json(['message' => 'An active pickup point with this name already exists.'], 422);
            }

            return response()->json(['message' => 'Unable to create pickup point.'], 422);
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => 'Invalid pickup point name provided.'], 422);
        }
    }

    /**
     * Rename a pickup point (Owner or Manager).
     */
    public function update(
        Request $request,
        PickupPoint $pickupPoint,
        RenamePickupPointAction $action
    ): JsonResponse {
        $user = $request->user();
        $membership = $this->resolveMembership($request, $user);

        if (! $membership) {
            return response()->json(['message' => 'No active business membership found.'], 403);
        }

        if ($pickupPoint->business_id !== $membership->business_id) {
            return response()->json(['message' => 'Pickup point not found in this business.'], 404);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'min:2', 'max:100'],
            'park_name' => ['nullable', 'string', 'max:100'],
        ]);

        try {
            $point = $action->execute($membership->business, $pickupPoint, $validated, $user);

            return response()->json([
                'message' => 'Pickup point renamed successfully.',
                'pickup_point' => [
                    'id' => $point->id,
                    'public_id' => $point->public_id,
                    'name' => $point->name,
                    'park_name' => $point->park_name,
                    'status' => $point->status,
                ],
            ]);
        } catch (DomainException $e) {
            if ($e->getMessage() === 'FORBIDDEN') {
                return response()->json(['message' => 'Only an Owner or Manager can rename a pickup point.'], 403);
            }
            if ($e->getMessage() === 'DUPLICATE_NAME') {
                return response()->json(['message' => 'An active pickup point with this name already exists.'], 422);
            }

            return response()->json(['message' => 'Unable to rename pickup point.'], 422);
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => 'Invalid pickup point name provided.'], 422);
        }
    }

    /**
     * Deactivate a pickup point safely.
     */
    public function deactivate(
        Request $request,
        PickupPoint $pickupPoint,
        DeactivatePickupPointAction $action
    ): JsonResponse {
        $user = $request->user();
        $membership = $this->resolveMembership($request, $user);

        if (! $membership) {
            return response()->json(['message' => 'No active business membership found.'], 403);
        }

        if ($pickupPoint->business_id !== $membership->business_id) {
            return response()->json(['message' => 'Pickup point not found in this business.'], 404);
        }

        try {
            $point = $action->execute($membership->business, $pickupPoint, $user);

            return response()->json([
                'message' => 'Pickup point deactivated successfully.',
                'pickup_point' => [
                    'id' => $point->id,
                    'public_id' => $point->public_id,
                    'name' => $point->name,
                    'status' => $point->status,
                ],
            ]);
        } catch (DomainException $e) {
            if ($e->getMessage() === 'FORBIDDEN') {
                return response()->json(['message' => 'Only an Owner or Manager can deactivate a pickup point.'], 403);
            }
            if (str_starts_with($e->getMessage(), 'HAS_WAITING_PACKAGES:')) {
                $count = explode(':', $e->getMessage())[1] ?? 'packages';

                return response()->json([
                    'message' => "This pickup point still has {$count} packages waiting. Collect, return, or cancel those packages before deactivating this location.",
                ], 422);
            }
            if ($e->getMessage() === 'LAST_ACTIVE_PICKUP_POINT') {
                return response()->json([
                    'message' => 'This is the only active pickup point. Add another pickup point before deactivating it.',
                ], 422);
            }

            return response()->json(['message' => 'Unable to deactivate pickup point.'], 422);
        }
    }

    /**
     * Reactivate a pickup point.
     */
    public function reactivate(
        Request $request,
        PickupPoint $pickupPoint,
        ReactivatePickupPointAction $action
    ): JsonResponse {
        $user = $request->user();
        $membership = $this->resolveMembership($request, $user);

        if (! $membership) {
            return response()->json(['message' => 'No active business membership found.'], 403);
        }

        if ($pickupPoint->business_id !== $membership->business_id) {
            return response()->json(['message' => 'Pickup point not found in this business.'], 404);
        }

        try {
            $point = $action->execute($membership->business, $pickupPoint, $user);

            return response()->json([
                'message' => 'Pickup point reactivated successfully.',
                'pickup_point' => [
                    'id' => $point->id,
                    'public_id' => $point->public_id,
                    'name' => $point->name,
                    'status' => $point->status,
                ],
            ]);
        } catch (DomainException $e) {
            if ($e->getMessage() === 'FORBIDDEN') {
                return response()->json(['message' => 'Only an Owner or Manager can reactivate a pickup point.'], 403);
            }
            if ($e->getMessage() === 'DUPLICATE_NAME') {
                return response()->json(['message' => 'An active pickup point with this name already exists.'], 422);
            }

            return response()->json(['message' => 'Unable to reactivate pickup point.'], 422);
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
