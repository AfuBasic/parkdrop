<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\Package;
use Illuminate\Http\Request;

class AdminFinanceController extends Controller
{
    public function show(Request $request)
    {
        $period = $request->query('period', 'today');

        [$start, $end] = match ($period) {
            'today' => [now()->startOfDay(), now()->endOfDay()],
            'week' => [now()->startOfWeek(), now()->endOfWeek()],
            '7d' => [now()->subDays(7)->startOfDay(), now()->endOfDay()],
            '30d' => [now()->subDays(30)->startOfDay(), now()->endOfDay()],
            default => [now()->startOfDay(), now()->endOfDay()],
        };

        $collectedPackagesQuery = Package::where('status', 'COLLECTED')
            ->whereBetween('collected_at', [$start, $end]);

        $revenueMinor = (int) $collectedPackagesQuery->sum('amount_due_minor');
        $packagesCount = (int) $collectedPackagesQuery->count('id');
        $avgPerPackageMinor = $packagesCount > 0 ? (int) round($revenueMinor / $packagesCount) : 0;
        $owedMinor = (int) Package::where('status', 'WAITING')->sum('amount_due_minor');

        $dailyRevenue = Package::where('status', 'COLLECTED')
            ->whereBetween('collected_at', [$start, $end])
            ->selectRaw('DATE(collected_at) as date, SUM(amount_due_minor) as revenue_minor, COUNT(*) as package_count')
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->map(fn ($row) => [
                'date' => $row->date,
                'revenue' => round($row->revenue_minor / 100, 2),
                'count' => (int) $row->package_count,
            ]);

        $byPickupPoint = Business::query()
            ->with(['pickupPoints'])
            ->withSum([
                'packages as revenue_minor' => fn ($q) =>
                    $q->where('status', 'COLLECTED')->whereBetween('collected_at', [$start, $end])
            ], 'amount_due_minor')
            ->withCount([
                'packages as collected_count' => fn ($q) =>
                    $q->where('status', 'COLLECTED')->whereBetween('collected_at', [$start, $end])
            ])
            ->having('revenue_minor', '>', 0)
            ->orderByDesc('revenue_minor')
            ->get()
            ->map(function ($biz) {
                $point = $biz->pickupPoints->first();
                return [
                    'id' => $biz->id,
                    'name' => $biz->name,
                    'park' => $point?->park_name ?? '—',
                    'revenueMinor' => (int) $biz->revenue_minor,
                    'revenueFormatted' => '₦' . number_format(($biz->revenue_minor ?? 0) / 100, 2),
                    'packagesCount' => (int) $biz->collected_count,
                ];
            });

        return inertia('Admin/Finance', [
            'period' => $period,
            'kpi' => [
                'revenueMinor' => $revenueMinor,
                'revenueFormatted' => '₦' . number_format($revenueMinor / 100, 2),
                'collected' => $packagesCount,
                'averageFormatted' => '₦' . number_format($avgPerPackageMinor / 100, 2),
                'owedFormatted' => '₦' . number_format($owedMinor / 100, 2),
            ],
            'dailyRevenue' => $dailyRevenue,
            'byPickupPoint' => $byPickupPoint,
        ]);
    }
}
