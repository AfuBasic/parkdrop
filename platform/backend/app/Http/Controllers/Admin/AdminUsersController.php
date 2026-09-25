<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\BusinessMembership;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminUsersController extends Controller
{
    public function index(Request $request)
    {
        $query = User::query()->with(['businessMemberships.business.pickupPoints']);

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($businessId = $request->query('pickup_point')) {
            $query->whereHas('businessMemberships', fn ($bm) => $bm->where('business_id', $businessId));
        }

        if ($status = $request->query('status')) {
            if (in_array($status, ['active', 'inactive'])) {
                $query->where('status', $status);
            }
        }

        $users = $query->orderBy('first_name')->paginate(20)->withQueryString();

        $pickupPoints = Business::query()->orderBy('name')->get(['id', 'name']);

        return inertia('Admin/Users/Index', [
            'users' => $users->through(function ($u) {
                $membership = $u->businessMemberships->first();
                $business = $membership?->business;
                $point = $business?->pickupPoints?->first();

                return [
                    'id' => $u->id,
                    'firstName' => $u->first_name,
                    'email' => $u->email,
                    'role' => $membership?->role ?? 'Staff',
                    'pickupPoint' => $business ? [
                        'id' => $business->id,
                        'name' => $business->name,
                        'park' => $point?->park_name ?? '—',
                    ] : null,
                    'isActive' => $u->status === 'active',
                    'createdAt' => $u->created_at->toISOString(),
                ];
            }),
            'filters' => [
                'search' => $request->query('search', ''),
                'status' => $request->query('status', 'all'),
                'pickup_point' => $request->query('pickup_point', ''),
            ],
            'pickupPoints' => $pickupPoints,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'first_name' => 'required|string|max:100',
            'email' => 'required|email|max:255|unique:users,email',
            'business_id' => 'required|exists:businesses,id',
            'role' => ['required', Rule::in(['owner', 'manager', 'staff'])],
        ]);

        $user = User::create([
            'first_name' => $validated['first_name'],
            'email' => $validated['email'],
            'email_normalized' => strtolower(trim($validated['email'])),
            'status' => 'active',
        ]);

        BusinessMembership::create([
            'business_id' => $validated['business_id'],
            'user_id' => $user->id,
            'role' => $validated['role'],
            'status' => 'active',
            'joined_at' => now(),
        ]);

        return redirect()->back()->with('success', 'User added successfully.');
    }

    public function update(Request $request, $id)
    {
        $user = User::with('businessMemberships')->findOrFail($id);

        $validated = $request->validate([
            'first_name' => 'required|string|max:100',
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'business_id' => 'nullable|exists:businesses,id',
            'role' => ['nullable', Rule::in(['owner', 'manager', 'staff'])],
        ]);

        $user->update([
            'first_name' => $validated['first_name'],
            'email' => $validated['email'],
            'email_normalized' => strtolower(trim($validated['email'])),
        ]);

        if (!empty($validated['business_id'])) {
            $membership = $user->businessMemberships->first();
            if ($membership) {
                $membership->update([
                    'business_id' => $validated['business_id'],
                    'role' => $validated['role'] ?? $membership->role,
                ]);
            } else {
                BusinessMembership::create([
                    'business_id' => $validated['business_id'],
                    'user_id' => $user->id,
                    'role' => $validated['role'] ?? 'staff',
                    'status' => 'active',
                    'joined_at' => now(),
                ]);
            }
        }

        return redirect()->back()->with('success', 'User updated successfully.');
    }

    public function toggle($id)
    {
        $user = User::findOrFail($id);
        $newStatus = $user->status === 'active' ? 'inactive' : 'active';
        $user->update(['status' => $newStatus]);

        BusinessMembership::where('user_id', $user->id)->update(['status' => $newStatus]);

        return redirect()->back()->with('success', "User is now {$newStatus}.");
    }
}
