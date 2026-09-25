<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

class AdminUsersController extends Controller
{
    public function index(Request $request)
    {
        $query = User::query()->with('business');

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($businessId = $request->query('pickup_point')) {
            $query->where('business_id', $businessId);
        }

        if ($request->query('status') === 'active') {
            $query->where('is_active', true);
        } elseif ($request->query('status') === 'inactive') {
            $query->where('is_active', false);
        }

        $users = $query->orderBy('name')->paginate(25);

        return inertia('Admin/Users', [
            'users' => $users->through(fn ($u) => [
                'id' => $u->id,
                'name' => $u->name,
                'phone' => $u->phone,
                'email' => $u->email,
                'pickupPoint' => $u->business?->name,
                'isActive' => $u->is_active,
                'packagesHandled' => $u->packages()->count(),
            ]),
        ]);
    }
}
