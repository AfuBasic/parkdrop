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
            '7d' => [now()->subDays(7), now()],
            '30d' => [now()->subDays(30), now()],
            default => [now()->subDays(7), now()],
        };

        $packages = Package::whereBetween('created_at', [$start, $end]);

        $received = (clone $packages)->count();
        $collected = (clone $packages)->where('status', 'collected')->count();
        $revenue = (clone $packages)->where('status', 'collected')->sum('amount_paid');
        $waiting = (clone $packages)->where('status', 'waiting')->count();
        $overdue = (clone $packages)->where('status', 'waiting')->where('created_at', '<', now()->subHours(24))->count();
        $returned = (clone $packages)->where('status', 'returned')->count();
        $cancelled = (clone $packages)->where('status', 'cancelled')->count();

        $avgPickupTime = (clone $packages)->where('status', 'collected')->get()->avg(function ($p) {
            return $p->created_at->diffInMinutes($p->updated_at);
        });

        return inertia('Admin/Reports', [
            'period' => $period,
            'metrics' => [
                'received' => $received,
                'collected' => $collected,
                'revenue' => $revenue,
                'waiting' => $waiting,
                'overdue' => $overdue,
                'avgPickupTime' => $avgPickupTime ? round($avgPickupTime / 60, 1) . 'h' : '—',
                'returned' => $returned,
                'cancelled' => $cancelled,
            ],
        ]);
    }
}
