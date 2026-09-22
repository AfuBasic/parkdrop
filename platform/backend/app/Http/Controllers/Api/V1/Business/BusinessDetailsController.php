<?php

namespace App\Http\Controllers\Api\V1\Business;

use App\Actions\Business\UpdateBusinessDetailsAction;
use App\Http\Controllers\Controller;
use DomainException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;

class BusinessDetailsController extends Controller
{
    /**
     * Get basic business details and current pickup point context.
     */
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();

        $membership = $user->businessMemberships()
            ->where('status', 'active')
            ->with(['business.pickupPoints'])
            ->first();

        if (! $membership) {
            return response()->json(['message' => 'No active business membership found.'], 403);
        }

        $business = $membership->business;
        $pickupPoints = $business->pickupPoints;

        // Current operational pickup point context (first active or primary)
        $currentPickupPoint = $pickupPoints->first();

        return response()->json([
            'business' => [
                'id' => $business->id,
                'public_id' => $business->public_id,
                'name' => $business->name,
                'status' => $business->status,
                'daily_storage_fee_minor' => $business->daily_storage_fee_minor,
                'created_at' => $business->created_at?->toIso8601String(),
            ],
            'current_pickup_point' => $currentPickupPoint ? [
                'id' => $currentPickupPoint->id,
                'name' => $currentPickupPoint->name,
                'park_name' => $currentPickupPoint->park_name,
                'contact_phone' => $currentPickupPoint->contact_phone,
                'contact_phone_confirmed_at' => $currentPickupPoint->contact_phone_confirmed_at?->toIso8601String(),
                'address' => $currentPickupPoint->address ?? null,
                'landmark' => $currentPickupPoint->landmark ?? null,
            ] : null,
            'current_user_role' => $membership->role,
        ]);
    }

    /**
     * Update business name (OWNER only).
     */
    public function update(Request $request, UpdateBusinessDetailsAction $action): JsonResponse
    {
        $user = $request->user();

        $membership = $user->businessMemberships()
            ->where('status', 'active')
            ->first();

        if (! $membership) {
            return response()->json(['message' => 'No active business membership found.'], 403);
        }

        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'min:2', 'max:100'],
            'daily_storage_fee_minor' => ['sometimes', 'required', 'integer', 'min:0', 'max:10000000'],
        ]);

        try {
            $updated = $action->execute($membership->business, $validated, $user);

            return response()->json([
                'message' => 'Business details updated successfully.',
                'business' => [
                    'id' => $updated->id,
                    'public_id' => $updated->public_id,
                    'name' => $updated->name,
                    'daily_storage_fee_minor' => $updated->daily_storage_fee_minor,
                ],
            ]);
        } catch (DomainException $e) {
            if ($e->getMessage() === 'FORBIDDEN') {
                return response()->json(['message' => 'Only an Owner can edit business settings.'], 403);
            }

            return response()->json(['message' => 'Unable to update business details.'], 422);
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => 'Invalid business name provided.'], 422);
        }
    }
}
