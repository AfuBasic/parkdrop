<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class AdminProfileController extends Controller
{
    public function show(Request $request)
    {
        $admin = auth('admin')->user();

        return inertia('Admin/Profile', [
            'admin' => [
                'id' => $admin?->id,
                'email' => $admin?->email,
                'emailVerifiedAt' => $admin?->email_verified_at?->toIso8601String(),
                'lastLoginAt' => $admin?->last_login_at ? \Carbon\Carbon::parse($admin->last_login_at)->diffForHumans() : 'Never',
                'lastLoginIp' => $admin?->last_login_ip ?? '—',
                'createdAt' => $admin?->created_at?->format('M d, Y'),
            ],
            'system' => [
                'laravelVersion' => app()->version(),
                'phpVersion' => PHP_VERSION,
                'environment' => config('app.env'),
                'timezone' => config('app.timezone'),
            ],
        ]);
    }
}
