<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Business;
use Illuminate\Http\Request;

class AdminFinanceController extends Controller
{
    public function show(Request $request)
    {
        $period = $request->query('period', 'today');

        [$start, $end] = match ($period) {
            'today' => [now()->startOfDay(), now()->endOfDay()],
            'week' => [now()->startOfWeek(), now()->endOfWeek()],
            '7d' => [now()->subDays(7), now()],
            '30d' => [now()->subDays(30), now()],
            default => [now()->startOfDay(), now()->endOfDay()],
        };

        $collectedPackages = \App\Models\Package::where('status', 'collected')
            ->whereBetween('created_at', [$start, $end])
            ->get();

        $revenue = $collectedPackages->sum('amount_paid');
        $packagesCount = $collectedPackages->count();
        $avgPerPackage = $packagesCount > 0 ? $revenue / $packagesCount : 0;
        $owed = \App\Models\Package::where('status', 'waiting')->sum('amount');

        $dailyRevenue = \App\Models\Package::where('status', 'collected')
            ->whereBetween('created_at', [$start, $end])
            ->selectRaw('DATE(created_at) as date, SUM(amount_paid) as revenue')
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        $byPickupPoint = Business::query()
            ->withSum(['packages as revenue' => fn ($q) => $q->where('status', 'collected')->whereBetween('created_at', [$start, $end])], 'amount_paid')
            ->having('revenue', '>', 0)
            ->orderByDesc('revenue')
            ->get();

        return inertia('Admin/Finance', [
            'period' => $period,
            'kpi' => [
                'revenue' => $revenue,
                'collected' => $packagesCount,
                'average' => $avgPerPackage,
                'owed' => $owed,
            ],
            'dailyRevenue' => $dailyRevenue,
            'byPickupPoint' => $byPickupPoint,
        ]);
    }
}
