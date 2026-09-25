<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Business;
use Illuminate\Http\Request;

class AdminPickupPointsController extends Controller
{
    public function index(Request $request)
    {
        $query = Business::query()
            ->select('id', 'name', 'park', 'contact_phone', 'is_active', 'created_at')
            ->withCount(['packages as today_count' => fn ($q) => $q->whereDate('created_at', today())]);

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('park', 'like', "%{$search}%");
            });
        }

        if ($request->query('status') === 'active') {
            $query->where('is_active', true);
        } elseif ($request->query('status') === 'inactive') {
            $query->where('is_active', false);
        }

        $pickupPoints = $query->orderBy('name')
            ->paginate(25)
            ->through(fn ($pp) => [
                'id' => $pp->id,
                'name' => $pp->name,
                'park' => $pp->park,
                'contactPhone' => $pp->contact_phone,
                'today' => $pp->today_count,
                'total' => $pp->packages_count ?? 0,
                'isActive' => $pp->is_active,
            ]);

        return inertia('Admin/PickupPoints', [
            'pickupPoints' => $pickupPoints,
        ]);
    }

    public function show($id)
    {
        $business = Business::with('packages')->findOrFail($id);

        return inertia('Admin/PickupPoints/Detail', [
            'pickupPoint' => [
                'id' => $business->id,
                'name' => $business->name,
                'park' => $business->park,
                'contactPhone' => $business->contact_phone,
                'isActive' => $business->is_active,
                'stats' => [
                    'totalReceived' => $business->packages->count(),
                    'totalCollected' => $business->packages->where('status', 'collected')->count(),
                    'totalRevenue' => $business->packages->where('status', 'collected')->sum('amount_paid'),
                    'waiting' => $business->packages->where('status', 'waiting')->count(),
                    'overdue' => $business->packages->where('status', 'waiting')->filter(fn ($p) => $p->created_at->diffInHours(now()) > 24)->count(),
                ],
                'recentPackages' => $business->packages()
                    ->latest()->limit(20)
                    ->get(['id', 'code', 'status', 'created_at', 'amount']),
            ],
        ]);
    }
}
