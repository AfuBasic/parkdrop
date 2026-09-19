<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SessionController extends Controller
{
    /**
     * Get the current authenticated session, user, and primary business.
     */
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'authenticated' => false,
                'user' => null,
                'business' => null,
            ], 401);
        }

        $membership = $user->businessMemberships()->with('business.pickupPoints')->first();
        $business = $membership?->business;

        return response()->json([
            'authenticated' => true,
            'user' => [
                'id' => $user->id,
                'email' => $user->email,
                'first_name' => $user->first_name,
                'status' => $user->status,
            ],
            'business' => $business ? [
                'id' => $business->id,
                'public_id' => $business->public_id,
                'name' => $business->name,
                'pickup_points' => $business->pickupPoints,
            ] : null,
            'role' => $membership?->role ?? 'owner',
        ]);
    }

    /**
     * Log out of current session and invalidate cookies.
     */
    public function destroy(Request $request): JsonResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json([
            'message' => 'Logged out successfully',
        ]);
    }
}
