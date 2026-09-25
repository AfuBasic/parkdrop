<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\PickupPoint;
use App\Models\SmsWallet;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminPickupPointsController extends Controller
{
    public function index(Request $request)
    {
        $query = Business::query()
            ->with(['pickupPoints', 'smsWallet'])
            ->withCount([
                'packages as today_count' => fn ($q) => $q->whereDate('created_at', today()),
                'packages as total_count',
            ]);

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhereHas('pickupPoints', fn ($pp) =>
                      $pp->where('park_name', 'like', "%{$search}%")
                         ->orWhere('contact_phone', 'like', "%{$search}%")
                  );
            });
        }

        if ($status = $request->query('status')) {
            if (in_array($status, ['active', 'inactive'])) {
                $query->where('status', $status);
            }
        }

        $pickupPoints = $query->orderBy('name')
            ->paginate(15)
            ->withQueryString()
            ->through(function ($biz) {
                $firstPoint = $biz->pickupPoints->first();
                return [
                    'id' => $biz->id,
                    'publicId' => $biz->public_id,
                    'name' => $biz->name,
                    'park' => $firstPoint?->park_name ?? '—',
                    'contactPhone' => $firstPoint?->contact_phone ?? '—',
                    'today' => (int) $biz->today_count,
                    'total' => (int) $biz->total_count,
                    'isActive' => $biz->status === 'active',
                    'smsBalance' => (int) ($biz->smsWallet?->balance ?? 0),
                    'dailyStorageFee' => (int) $biz->daily_storage_fee_minor,
                ];
            });

        return inertia('Admin/PickupPoints/Index', [
            'pickupPoints' => $pickupPoints,
            'filters' => [
                'search' => $request->query('search', ''),
                'status' => $request->query('status', 'all'),
            ],
        ]);
    }

    public function show($id)
    {
        $business = Business::with(['pickupPoints', 'smsWallet'])->findOrFail($id);
        $firstPoint = $business->pickupPoints->first();

        $packages = $business->packages();

        $totalReceived = (clone $packages)->count();
        $totalCollected = (clone $packages)->where('status', 'COLLECTED')->count();
        $totalRevenueMinor = (clone $packages)->where('status', 'COLLECTED')->sum('amount_due_minor');
        $waiting = (clone $packages)->where('status', 'WAITING')->count();
        $overdue = (clone $packages)->where('status', 'WAITING')
            ->where('created_at', '<', now()->subHours(24))
            ->count();

        $recentPackages = $business->packages()
            ->with('customer')
            ->latest('created_at')
            ->limit(20)
            ->get()
            ->map(fn ($p) => [
                'id' => $p->id,
                'code' => $p->public_package_id,
                'status' => $p->status,
                'customerName' => $p->customer?->name ?? 'Walk-in',
                'customerPhone' => $p->customer?->phone_display ?? '—',
                'amountMinor' => (int) $p->amount_due_minor,
                'createdAt' => $p->created_at->toISOString(),
            ]);

        return inertia('Admin/PickupPoints/Detail', [
            'pickupPoint' => [
                'id' => $business->id,
                'publicId' => $business->public_id,
                'name' => $business->name,
                'park' => $firstPoint?->park_name ?? '—',
                'contactPhone' => $firstPoint?->contact_phone ?? '—',
                'isActive' => $business->status === 'active',
                'dailyStorageFeeMinor' => (int) $business->daily_storage_fee_minor,
                'smsBalance' => (int) ($business->smsWallet?->balance ?? 0),
                'stats' => [
                    'totalReceived' => $totalReceived,
                    'totalCollected' => $totalCollected,
                    'totalRevenueMinor' => (int) $totalRevenueMinor,
                    'waiting' => $waiting,
                    'overdue' => $overdue,
                ],
                'recentPackages' => $recentPackages,
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'park_name' => 'required|string|max:255',
            'contact_phone' => 'required|string|max:30',
            'daily_storage_fee' => 'nullable|numeric|min:0',
        ]);

        $feeMinor = isset($validated['daily_storage_fee'])
            ? (int) round($validated['daily_storage_fee'] * 100)
            : 0;

        $business = Business::create([
            'name' => $validated['name'],
            'status' => 'active',
            'daily_storage_fee_minor' => $feeMinor,
        ]);

        PickupPoint::create([
            'business_id' => $business->id,
            'name' => $validated['name'],
            'park_name' => $validated['park_name'],
            'contact_phone' => $validated['contact_phone'],
            'status' => 'active',
        ]);

        SmsWallet::firstOrCreate(
            ['business_id' => $business->id],
            ['balance' => 0]
        );

        return redirect()->back()->with('success', 'Pickup point created successfully.');
    }

    public function update(Request $request, $id)
    {
        $business = Business::with('pickupPoints')->findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'park_name' => 'required|string|max:255',
            'contact_phone' => 'required|string|max:30',
            'daily_storage_fee' => 'nullable|numeric|min:0',
        ]);

        $feeMinor = isset($validated['daily_storage_fee'])
            ? (int) round($validated['daily_storage_fee'] * 100)
            : $business->daily_storage_fee_minor;

        $business->update([
            'name' => $validated['name'],
            'daily_storage_fee_minor' => $feeMinor,
        ]);

        $point = $business->pickupPoints->first();
        if ($point) {
            $point->update([
                'name' => $validated['name'],
                'park_name' => $validated['park_name'],
                'contact_phone' => $validated['contact_phone'],
            ]);
        } else {
            PickupPoint::create([
                'business_id' => $business->id,
                'name' => $validated['name'],
                'park_name' => $validated['park_name'],
                'contact_phone' => $validated['contact_phone'],
                'status' => 'active',
            ]);
        }

        return redirect()->back()->with('success', 'Pickup point updated successfully.');
    }

    public function toggle($id)
    {
        $business = Business::findOrFail($id);
        $newStatus = $business->status === 'active' ? 'inactive' : 'active';
        $business->update(['status' => $newStatus]);

        PickupPoint::where('business_id', $business->id)->update(['status' => $newStatus]);

        return redirect()->back()->with('success', "Pickup point is now {$newStatus}.");
    }
}
