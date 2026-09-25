<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Business;
use Illuminate\Http\Request;

class AdminSmsCreditsController extends Controller
{
    public function index(Request $request)
    {
        $pickupPoints = Business::withSum('smsCreditTransactions as allocated' => fn ($q) => $q->where('type', 'allocated'), 'amount')
            ->withSum('smsCreditTransactions as used' => fn ($q) => $q->where('type', 'used'), 'amount')
            ->orderBy('name')
            ->get()
            ->map(fn ($pp) => [
                'id' => $pp->id,
                'name' => $pp->name,
                'park' => $pp->park,
                'allocated' => $pp->allocated ?? 0,
                'used' => $pp->used ?? 0,
                'remaining' => ($pp->allocated ?? 0) - ($pp->used ?? 0),
                'status' => (($pp->allocated ?? 0) - ($pp->used ?? 0)) <= 0 ? 'depleted' : ((($pp->allocated ?? 0) - ($pp->used ?? 0)) < 100 ? 'low' : 'ok'),
            ]);

        $overview = [
            'totalAllocated' => $pickupPoints->sum('allocated'),
            'totalUsed' => $pickupPoints->sum('used'),
            'totalRemaining' => $pickupPoints->sum('remaining'),
            'lowCount' => $pickupPoints->where('status', 'low')->count(),
        ];

        return inertia('Admin/SmsCredits', [
            'overview' => $overview,
            'pickupPoints' => $pickupPoints,
        ]);
    }
}
