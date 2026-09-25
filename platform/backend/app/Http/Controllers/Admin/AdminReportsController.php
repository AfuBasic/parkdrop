<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\Package;
use Illuminate\Http\Request;

class AdminReportsController extends Controller
{
    public function show(Request $request)
    {
        $period = $request->query('period', '7d');

        [$start, $end] = match ($period) {
            'today' => [now()->startOfDay(), now()->endOfDay()],
            'week' => [now()->startOfWeek(), now()->endOfWeek()],
            '7d' => [now()->subDays(7)->startOfDay(), now()->endOfDay()],
            '30d' => [now()->subDays(30)->startOfDay(), now()->endOfDay()],
            default => [now()->subDays(7)->startOfDay(), now()->endOfDay()],
        };

        $packagesQuery = Package::whereBetween('created_at', [$start, $end]);

        $received = (int) $packagesQuery->count('id');
        $collected = (int) (clone $packagesQuery)->where('status', 'COLLECTED')->count('id');
        $revenueMinor = (int) (clone $packagesQuery)->where('status', 'COLLECTED')->sum('amount_due_minor');
        $waiting = (int) (clone $packagesQuery)->where('status', 'WAITING')->count('id');
        $overdue = (int) (clone $packagesQuery)->where('status', 'WAITING')->where('created_at', '<', now()->subHours(24))->count('id');
        $returned = (int) (clone $packagesQuery)->where('status', 'RETURNED')->count('id');
        $cancelled = (int) (clone $packagesQuery)->where('status', 'CANCELLED')->count('id');

        $collectedPackages = (clone $packagesQuery)->where('status', 'COLLECTED')->whereNotNull('collected_at')->get();
        $avgPickupMinutes = $collectedPackages->isNotEmpty()
            ? $collectedPackages->avg(fn ($p) => $p->created_at->diffInMinutes($p->collected_at))
            : null;

        $trendData = Package::whereBetween('created_at', [$start, $end])
            ->selectRaw('DATE(created_at) as date, COUNT(*) as received_count, SUM(CASE WHEN status = "COLLECTED" THEN 1 ELSE 0 END) as collected_count')
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        $pickupPointComparison = Business::query()
            ->with(['pickupPoints'])
            ->withCount([
                'packages as received_count' => fn ($q) => $q->whereBetween('created_at', [$start, $end]),
                'packages as collected_count' => fn ($q) => $q->where('status', 'COLLECTED')->whereBetween('created_at', [$start, $end]),
            ])
            ->withSum([
                'packages as revenue_minor' => fn ($q) => $q->where('status', 'COLLECTED')->whereBetween('created_at', [$start, $end])
            ], 'amount_due_minor')
            ->get()
            ->map(function ($biz) {
                $point = $biz->pickupPoints->first();
                return [
                    'id' => $biz->id,
                    'name' => $biz->name,
                    'park' => $point?->park_name ?? '—',
                    'received' => (int) $biz->received_count,
                    'collected' => (int) $biz->collected_count,
                    'revenue' => '₦' . number_format(($biz->revenue_minor ?? 0) / 100, 2),
                    'collectionRate' => $biz->received_count > 0 ? round(($biz->collected_count / $biz->received_count) * 100, 1) : 0,
                ];
            });

        return inertia('Admin/Reports', [
            'period' => $period,
            'metrics' => [
                'received' => $received,
                'collected' => $collected,
                'revenueFormatted' => '₦' . number_format($revenueMinor / 100, 2),
                'waiting' => $waiting,
                'overdue' => $overdue,
                'avgPickupTime' => $avgPickupMinutes ? round($avgPickupMinutes / 60, 1) . ' hrs' : '—',
                'returned' => $returned,
                'cancelled' => $cancelled,
            ],
            'trendData' => $trendData,
            'pickupPointComparison' => $pickupPointComparison,
        ]);
    }
}
