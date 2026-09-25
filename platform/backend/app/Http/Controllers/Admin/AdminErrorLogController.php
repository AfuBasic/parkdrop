<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

class AdminErrorLogController extends Controller
{
    private const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
    private const MAX_ENTRIES = 200;

    public function index(Request $request)
    {
        $errors = $this->parseLogFile(storage_path('logs/laravel.log'));

        return inertia('Admin/ErrorLog', [
            'errors' => $errors,
        ]);
    }

    public function stream(Request $request)
    {
        $errors = $this->parseLogFile(storage_path('logs/laravel.log'));

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

    private function parseLogFile(string $logPath): array
    {
        if (!File::exists($logPath)) {
            return [];
        }

        $size = File::size($logPath);
        if ($size > self::MAX_BYTES) {
            $offset = $size - self::MAX_BYTES;
            $handle = File::open($logPath, 'r');
            $handle->fseek($offset);
            // discard partial line
            $handle->fgets();
            $lines = $handle->readAll();
            $handle->close();
        } else {
            $lines = File::get($logPath);
        }

        $lineArray = preg_split('/\r\n|\r|\n/', $lines) ?: [];
        $lineArray = array_filter($lineArray, fn ($l) => trim($l) !== '');

        if (empty($lineArray)) {
            return [];
        }

        $parsed = [];
        $current = null;

        foreach (array_reverse($lineArray, true) as $line) {
            // Laravel log entry header: [2025-09-23 01:02:03] local.INFO: Message
            // or Monolog JSON format
            if (preg_match('/^\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\] (\S+)\.(\w+): (.*)/', $line, $matches)) {
                if ($current) {
                    $parsed[] = $current;
                    if (count($parsed) >= self::MAX_ENTRIES) {
                        return $parsed;
                    }
                }

                $level = strtoupper($matches[3]);
                $current = [
                    'id' => Str::substr(md5($matches[1] . $matches[4]), 0, 12),
                    'timestamp' => $matches[1],
                    'environment' => $matches[2],
                    'level' => $level,
                    'message' => $this->sanitize($matches[4]),
                    'stackTrace' => '',
                ];
            } elseif ($line[0] === '#' || preg_match('/^\s+at\s+/', $line)) {
                if ($current) {
                    $current['stackTrace'] .= $this->sanitize($line) . "\n";
                }
            } elseif (preg_match('/^\{/', $line)) {
                // JSON log line — skip, not parseable in this format
                $current = null;
            }
        }

        if ($current && count($parsed) < self::MAX_ENTRIES) {
            $parsed[] = $current;
        }

        return $parsed;
    }

    private function sanitize(string $text): string
    {
        // Strip absolute file paths
        $text = preg_replace('/\/[A-Za-z0-9_\.\/\-]+\.[a-z]+/', '[redacted]', $text);
        // Strip SQL queries (between quotes after "SQL:")
        $text = preg_replace('/SQL: .*/', 'SQL: [redacted]', $text);
        // Strip email addresses
        $text = preg_replace('/[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}/', '[redacted]', $text);
        return $text;
    }
}
