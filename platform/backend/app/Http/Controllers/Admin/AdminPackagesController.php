<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\Package;
use Illuminate\Http\Request;

class AdminPackagesController extends Controller
{
    public function index(Request $request)
    {
        $query = Package::query()
            ->with(['business.pickupPoints', 'customer', 'creator']);

        if ($search = $request->query('search')) {
            $escaped = str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $search);
            $query->where(function ($q) use ($escaped) {
                $q->where('public_package_id', 'like', "%{$escaped}%")
                  ->orWhere('pickup_code', 'like', "%{$escaped}%")
                  ->orWhereHas('customer', fn ($c) => $c->where('name', 'like', "%{$escaped}%"))
                  ->orWhereHas('customer', fn ($c) => $c->where('phone_display', 'like', "%{$escaped}%")->orWhere('phone_normalized', 'like', "%{$escaped}%"));
            });
        }

        if ($status = $request->query('status')) {
            if ($status !== 'all') {
                $query->where('status', strtoupper($status));
            }
        }

        if ($businessId = $request->query('pickup_point')) {
            $query->where('business_id', $businessId);
        }

        if ($age = $request->query('age')) {
            $validAges = ['overdue', '3d', '7d'];
            if (!in_array($age, $validAges, true)) {
                abort(422, 'Invalid age filter. Use: overdue, 3d, 7d');
            }
            if ($age === 'overdue') {
                $query->where('status', 'WAITING')->where('created_at', '<', now()->subHours(24));
            } elseif ($age === '3d') {
                $query->where('created_at', '<', now()->subDays(3));
            } elseif ($age === '7d') {
                $query->where('created_at', '<', now()->subDays(7));
            }
        }

        $packages = $query->latest('created_at')->paginate(20)->withQueryString();

        $pickupPoints = Business::query()->orderBy('name')->get(['id', 'name']);

        return inertia('Admin/Packages/Index', [
            'packages' => $packages->through(function ($p) {
                $firstPoint = $p->business?->pickupPoints?->first();
                return [
                    'id' => $p->id,
                    'code' => $p->public_package_id,
                    'pickupCode' => $p->pickup_code,
                    'customer' => $p->customer ? [
                        'name' => $p->customer->name,
                        'phone' => $p->customer->phone_display ?? $p->customer->phone_normalized ?? '—',
                    ] : null,
                    'pickupPoint' => [
                        'id' => $p->business_id,
                        'name' => $p->business?->name ?? '—',
                        'park' => $firstPoint?->park_name ?? '—',
                    ],
                    'amountMinor' => (int) $p->amount_due_minor,
                    'status' => $p->status,
                    'createdAt' => $p->created_at->toISOString(),
                    'collectedAt' => $p->collected_at?->toISOString(),
                    'ageHours' => round($p->created_at->diffInMinutes(now()) / 60, 1),
                    'receivedBy' => $p->creator?->first_name ?? $p->terminal_actor_name ?? '—',
                ];
            }),
            'filters' => [
                'search' => $request->query('search', ''),
                'status' => $request->query('status', 'all'),
                'pickup_point' => $request->query('pickup_point', ''),
                'age' => $request->query('age', ''),
            ],
            'pickupPoints' => $pickupPoints,
        ]);
    }

    public function show($id)
    {
        $package = Package::with([
            'business.pickupPoints',
            'customer',
            'creator',
            'packageMedia',
            'payments',
            'lifecycleEvent',
        ])->findOrFail($id);

        $firstPoint = $package->business?->pickupPoints?->first();

        return inertia('Admin/Packages/Detail', [
            'package' => [
                'id' => $package->id,
                'code' => $package->public_package_id,
                'pickupCode' => $package->pickup_code,
                'status' => $package->status,
                'customer' => $package->customer ? [
                    'name' => $package->customer->name,
                    'phone' => $package->customer->phone_display ?? $package->customer->phone_normalized,
                ] : null,
                'pickupPoint' => [
                    'id' => $package->business_id,
                    'name' => $package->business?->name,
                    'park' => $firstPoint?->park_name ?? '—',
                    'contactPhone' => $firstPoint?->contact_phone ?? '—',
                ],
                'amountDueMinor' => (int) $package->amount_due_minor,
                'amountPaidMinor' => (int) $package->payments->where('status', 'COMPLETED')->sum('amount_minor'),
                'createdAt' => $package->created_at->toISOString(),
                'collectedAt' => $package->collected_at?->toISOString(),
                'returnedAt' => $package->returned_at?->toISOString(),
                'cancelledAt' => $package->cancelled_at?->toISOString(),
                'terminalReason' => $package->terminal_reason,
                'terminalReasonNote' => $package->terminal_reason_note,
                'terminalActorName' => $package->terminal_actor_name ?? $package->creator?->first_name ?? '—',
                'receivedBy' => $package->creator?->first_name ?? '—',
                'media' => $package->packageMedia->map(fn ($m) => [
                    'id' => $m->id,
                    'url' => $m->storage_path ? url('/storage/' . $m->storage_path) : null,
                    'width' => $m->width,
                    'height' => $m->height,
                ]),
                'payments' => $package->payments->map(fn ($pm) => [
                    'id' => $pm->id,
                    'amountMinor' => (int) $pm->amount_minor,
                    'method' => $pm->payment_method ?? 'CASH',
                    'status' => $pm->status,
                    'createdAt' => $pm->created_at->toISOString(),
                ]),
            ],
        ]);
    }
}
