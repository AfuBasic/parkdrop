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

        $collectedToday = Package::where('status', 'COLLECTED')->whereDate('collected_at', $today)->count();
        $overdue = Package::where('status', 'WAITING')->where('created_at', '<', now()->subHours(24))->count();
        $activeStaff = User::where('status', 'active')->count();

        $recentActivity = Package::with(['business', 'customer'])
            ->latest('created_at')
            ->limit(10)
            ->get()
            ->map(fn ($p) => [
                'type' => match ($p->status) {
                    'COLLECTED' => 'package_collected',
                    'WAITING' => 'package_received',
                    'RETURNED' => 'package_returned',
                    'CANCELLED' => 'package_cancelled',
                    default => 'package',
                },
                'description' => $p->customer
                    ? "Package {$p->public_package_id} for {$p->customer->name} at {$p->business?->name}"
                    : "Package {$p->public_package_id} at {$p->business?->name}",
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
                ],
                [
                    'value' => $packagesToday,
                    'label' => 'Packages Today',
                    'sub' => null,
                    'icon' => 'Package',
                    'trend' => $trend > 0 ? ['value' => "+{$trend}%", 'up' => true] : ($trend < 0 ? ['value' => "{$trend}%", 'up' => false] : null),
                ],
                [
                    'value' => '₦' . number_format($revenueToday / 100, 2),
                    'label' => 'Revenue Today',
                    'sub' => null,
                    'icon' => 'Banknote',
                    'trend' => $revenueTrend > 0 ? ['value' => "+{$revenueTrend}%", 'up' => true] : ($revenueTrend < 0 ? ['value' => "{$revenueTrend}%", 'up' => false] : null),
                ],
                [
                    'value' => number_format($totalSmsBalance),
                    'label' => 'SMS Credits Balance',
                    'sub' => 'Across all active wallets',
                    'icon' => 'MessageSquare',
                    'trend' => null,
                ],
            ],
            'quickStats' => [
                'thisWeek' => "This week: {$thisWeek} received · {$collectedToday} collected today",
                'overdue' => "Overdue: {$overdue} packages >24h",
                'activePoints' => "Active pickup points: {$activePickupPoints}",
                'activeStaff' => "Active staff: {$activeStaff}",
            ],
            'recentActivity' => $recentActivity,
            'needsAttention' => $needsAttention,
        ]);
    }
}
