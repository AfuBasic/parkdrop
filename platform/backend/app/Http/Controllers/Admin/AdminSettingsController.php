<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminSetting;
use Illuminate\Http\Request;

class AdminSettingsController extends Controller
{
    public function show()
    {
        $settings = AdminSetting::all()->pluck('value', 'key')->all();
        return inertia('Admin/Settings', [
            'admin' => [
                'email' => $settings['app_email'] ?? 'noreply@parkdrop.com.ng',
                'displayName' => $settings['app_name'] ?? 'ParkDrop',
                'lastLoginAt' => null,
                'emailVerified' => true,
            ],
            'settings' => $settings,
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'settings' => 'array',
            'settings.*' => 'string',
        ]);

        foreach ($validated['settings'] ?? [] as $key => $value) {
            AdminSetting::updateOrCreate(['key' => $key], ['value' => $value]);
        }

        return back()->with('success', 'Settings saved.');
    }
}
