<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\Package;
use App\Models\SmsWallet;
use App\Models\User;
use Illuminate\Http\Request;

class AdminDashboardController extends Controller
{
    public function show()
    {
        $today = now()->startOfDay();
        $weekStart = now()->startOfWeek();

        $pickupPoints = Business::count();
        $activePickupPoints = Business::where('status', 'active')->count();
        $packagesToday = Package::whereDate('created_at', $today)->count();
        $thisWeek = Package::where('created_at', '>=', $weekStart)->count();
        $lastWeek = Package::where('created_at', '>=', $weekStart->copy()->subWeek())
            ->where('created_at', '<', $weekStart)->count();
        $trend = $lastWeek > 0 ? round((($thisWeek - $lastWeek) / $lastWeek) * 100) : 0;

        $revenueToday = Package::where('status', 'COLLECTED')
            ->whereDate('collected_at', $today)
            ->sum('amount_due_minor');
        $revenueYesterday = Package::where('status', 'COLLECTED')
            ->whereDate('collected_at', $today->copy()->subDay())
            ->sum('amount_due_minor');
        $revenueTrend = $revenueYesterday > 0 ? round((($revenueToday - $revenueYesterday) / $revenueYesterday) * 100) : 0;

        $totalSmsBalance = (int) SmsWallet::sum('balance');
        $hasLowSms = SmsWallet::where('balance', '<', 100)->exists();

        $collectedToday = Package::where('status', 'COLLECTED')->whereDate('collected_at', $today)->count();
        $overdue = Package::where('status', 'WAITING')->where('created_at', '<', now()->subHours(24))->count();
        $activeStaff = User::where('status', 'active')->count();

        // 7-day throughput chart for dashboard
        $past7Days = collect(range(6, 0))->map(function ($daysAgo) {
            $date = now()->subDays($daysAgo)->format('Y-m-d');
            $dayLabel = now()->subDays($daysAgo)->format('D d');
            $received = Package::whereDate('created_at', $date)->count();
            $collected = Package::where('status', 'COLLECTED')->whereDate('collected_at', $date)->count();
            $revenueMinor = (int) Package::where('status', 'COLLECTED')->whereDate('collected_at', $date)->sum('amount_due_minor');

            return [
                'date' => $dayLabel,
                'fullDate' => $date,
                'received' => $received,
                'collected' => $collected,
                'revenue' => round($revenueMinor / 100, 2),
            ];
        });

        // Top pickup points by package throughput today
        $topPickupPoints = Business::with(['pickupPoints'])
            ->withCount(['packages as today_packages' => fn ($q) => $q->whereDate('created_at', today())])
            ->withCount(['packages as active_waiting' => fn ($q) => $q->where('status', 'WAITING')])
            ->orderByDesc('today_packages')
            ->limit(5)
            ->get()
            ->map(function ($b) {
                $point = $b->pickupPoints->first();
                return [
                    'id' => $b->id,
                    'name' => $b->name,
                    'park' => $point?->park_name ?? '—',
                    'today' => $b->today_packages,
                    'waiting' => $b->active_waiting,
                ];
            });

        $recentActivity = Package::with(['business.pickupPoints', 'customer', 'creator'])
            ->latest('created_at')
            ->limit(10)
            ->get()
            ->map(fn ($p) => [
                'type' => match ($p->status) {
                    'COLLECTED' => 'collected',
                    'WAITING' => 'received',
                    'RETURNED' => 'returned',
                    'CANCELLED' => 'cancelled',
                    default => 'package',
                },
                'code' => $p->public_package_id,
                'parkName' => $p->business?->pickupPoints?->first()?->park_name ?? $p->business?->name ?? 'Park',
                'customerName' => $p->customer?->name ?? 'Walk-in customer',
                'amountFormatted' => '₦' . number_format($p->amount_due_minor / 100, 2),
                'description' => match ($p->status) {
                    'COLLECTED' => "Package {$p->public_package_id} collected by {$p->customer?->name} at {$p->business?->name}",
                    'WAITING' => "New package received for {$p->customer?->name} at {$p->business?->name}",
                    'RETURNED' => "Package {$p->public_package_id} returned to sender",
                    'CANCELLED' => "Package {$p->public_package_id} cancelled",
                    default => "Activity on package {$p->public_package_id}",
                },
                'timestamp' => $p->created_at->diffForHumans(),
            ]);

        $needsAttention = Package::where('status', 'WAITING')
            ->where('created_at', '<', now()->subHours(24))
            ->orderBy('created_at')
            ->limit(5)
            ->get(['id', 'public_package_id as code', 'created_at']);

        return inertia('Admin/Dashboard', [
            'kpi' => [
                [
                    'value' => $pickupPoints,
                    'label' => 'Total Pickup Points',
                    'sub' => "{$activePickupPoints} active, " . ($pickupPoints - $activePickupPoints) . " inactive",
                    'icon' => 'Building2',
                    'trend' => null,
                    'hasWarning' => false,
                ],
                [
                    'value' => $packagesToday,
                    'label' => 'Packages Today',
                    'sub' => "{$collectedToday} collected today",
                    'icon' => 'Package',
                    'trend' => $trend > 0 ? ['value' => "+{$trend}% vs last week", 'up' => true] : ($trend < 0 ? ['value' => "{$trend}% vs last week", 'up' => false] : null),
                    'hasWarning' => false,
                ],
                [
                    'value' => '₦' . number_format($revenueToday / 100, 2),
                    'label' => 'Revenue Today',
                    'sub' => 'Collected at pickup',
                    'icon' => 'Banknote',
                    'trend' => $revenueTrend > 0 ? ['value' => "+{$revenueTrend}%", 'up' => true] : ($revenueTrend < 0 ? ['value' => "{$revenueTrend}%", 'up' => false] : null),
                    'hasWarning' => false,
                ],
                [
                    'value' => number_format($totalSmsBalance),
                    'label' => 'SMS Credits Balance',
                    'sub' => $hasLowSms ? '⚠️ Low balance on some parks' : 'Across all active wallets',
                    'icon' => 'MessageSquare',
                    'trend' => null,
                    'hasWarning' => $hasLowSms,
                ],
            ],
            'quickStats' => [
                'thisWeek' => [
                    'label' => 'This Week',
                    'value' => "{$thisWeek} received · {$collectedToday} collected today",
                    'isWarning' => false,
                    'link' => '/admin/packages',
                ],
                'overdue' => [
                    'label' => 'Overdue (>24h)',
                    'value' => "{$overdue} packages overdue",
                    'isWarning' => $overdue > 0,
                    'link' => '/admin/packages?age=overdue',
                ],
                'activePoints' => [
                    'label' => 'Active Parks',
                    'value' => "{$activePickupPoints} operational locations",
                    'isWarning' => false,
                    'link' => '/admin/pickup-points?status=active',
                ],
                'activeStaff' => [
                    'label' => 'Active Attendants',
                    'value' => "{$activeStaff} registered staff",
                    'isWarning' => false,
                    'link' => '/admin/users?status=active',
                ],
            ],
            'chartData' => $past7Days,
            'topPickupPoints' => $topPickupPoints,
            'recentActivity' => $recentActivity,
            'needsAttention' => $needsAttention,
        ]);
    }
}
