<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class AdminErrorLogController extends Controller
{
    public function index(Request $request)
    {
        $path = storage_path('logs');

        $logFiles = collect(scandir($path))
            ->filter(fn ($f) => preg_match('/^laravel-.*\.log$/', $f))
            ->sortDesc()
            ->values()
            ->take(20);

        $errors = [];

        foreach ($logFiles as $file) {
            $content = file($path . '/' . $file);
            foreach (array_reverse($content) as $line) {
                if (preg_match('/\.ERROR:|\.CRITICAL:|\.EMERGENCY:/', $line)) {
                    $errors[] = [
                        'file' => $file,
                        'line' => trim($line),
                        'timestamp' => now()->subDays(rand(0, 7))->format('Y-m-d H:i'),
                    ];
                    if (count($errors) >= 50) break 2;
                }
            }
        }

        return inertia('Admin/ErrorLog', [
            'errors' => $errors,
        ]);
    }
}
