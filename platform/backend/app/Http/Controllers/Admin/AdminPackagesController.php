<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Business;
use Illuminate\Http\Request;

class AdminPackagesController extends Controller
{
    public function index(Request $request)
    {
        $query = \App\Models\Package::query()
            ->with(['business', 'user']);

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                  ->orWhereHas('user', fn ($u) => $u->where('name', 'like', "%{$search}%")
                      ->orWhere('phone', 'like', "%{$search}%"));
            });
        }

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        if ($businessId = $request->query('pickup_point')) {
            $query->where('business_id', $businessId);
        }

        if ($age = $request->query('age')) {
            if ($age === 'overdue') {
                $query->where('status', 'waiting')->where('created_at', '<', now()->subHours(24));
            } elseif ($age === '3d') {
                $query->where('created_at', '<', now()->subDays(3));
            } elseif ($age === '7d') {
                $query->where('created_at', '<', now()->subDays(7));
            }
        }

        $packages = $query->latest()->paginate(25);

        return inertia('Admin/Packages', [
            'packages' => $packages->through(fn ($p) => [
                'id' => $p->id,
                'code' => $p->code,
                'customer' => $p->user ? ['name' => $p->user->name, 'phone' => $p->user->phone] : 'Walk-in',
                'pickupPoint' => ['name' => $p->business?->name, 'park' => $p->business?->park],
                'amount' => $p->amount,
                'status' => $p->status,
                'age' => $p->created_at->diffForHumans(now(), true),
                'receivedBy' => $p->received_by ? $p->receivedByUser?->name : '—',
            ]),
        ]);
    }

    public function show($id)
    {
        $package = \App\Models\Package::with(['business', 'user', 'receivedByUser', 'collectedByUser'])->findOrFail($id);

        return inertia('Admin/Packages/Detail', [
            'package' => [
                'id' => $package->id,
                'code' => $package->code,
                'status' => $package->status,
                'customer' => ['name' => $package->user?->name, 'phone' => $package->user?->phone],
                'pickupPoint' => ['name' => $package->business?->name, 'park' => $package->business?->park],
                'amount' => $package->amount,
                'amountPaid' => $package->amount_paid,
                'age' => $package->created_at->diffForHumans(now(), true),
                'smsStatus' => $package->sms_delivery_status,
                'photo' => $package->photo_url,
                'activity' => $package->activity_logs()->latest()->limit(20)->get(),
            ],
        ]);
    }
}
