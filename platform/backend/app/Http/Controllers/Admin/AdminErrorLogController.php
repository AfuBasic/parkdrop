<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;

class AdminErrorLogController extends Controller
{
    public function index(Request $request)
    {
        $logPath = storage_path('logs/laravel.log');
        $errors = $this->parseLogFile($logPath, 50);

        return inertia('Admin/ErrorLog', [
            'errors' => $errors,
        ]);
    }

    public function stream(Request $request)
    {
        $logPath = storage_path('logs/laravel.log');
        $errors = $this->parseLogFile($logPath, 50);

        return response()->json([
            'errors' => $errors,
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    public function clear(Request $request)
    {
        $logPath = storage_path('logs/laravel.log');
        if (File::exists($logPath)) {
            File::put($logPath, '');
        }

        return redirect()->back()->with('success', 'Error log cleared.');
    }

    private function parseLogFile(string $logPath, int $limit = 50): array
    {
        if (!File::exists($logPath)) {
            return [];
        }

        $lines = file($logPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        if (empty($lines)) {
            return [];
        }

        $parsed = [];
        $current = null;

        foreach (array_reverse($lines) as $line) {
            if (preg_match('/^\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\] (\w+)\.(\w+): (.*)/', $line, $matches)) {
                if ($current) {
                    $parsed[] = $current;
                    if (count($parsed) >= $limit) {
                        return $parsed;
                    }
                }

                $level = strtoupper($matches[3]);
                $current = [
                    'id' => md5($matches[1] . $matches[4]),
                    'timestamp' => $matches[1],
                    'environment' => $matches[2],
                    'level' => $level,
                    'message' => $matches[4],
                    'stackTrace' => '',
                ];
            } else {
                if ($current) {
                    $current['stackTrace'] = $line . "\n" . $current['stackTrace'];
                }
            }
        }

        if ($current && count($parsed) < $limit) {
            $parsed[] = $current;
        }

        return $parsed;
    }
}
