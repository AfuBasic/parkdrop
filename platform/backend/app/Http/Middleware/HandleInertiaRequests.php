<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    public function share(Request $request): array
    {
        return [
            'auth' => [
                'admin' => $request->user('admin') ? [
                    'id' => $request->user('admin')->id,
                    'email' => $request->user('admin')->email,
                ] : null,
            ],
        ];
    }
}
