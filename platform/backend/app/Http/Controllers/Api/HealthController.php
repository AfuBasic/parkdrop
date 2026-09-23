<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;
use Throwable;

class HealthController extends Controller
{
    /**
     * Liveness probe: Process level check.
     * Verifies that the PHP/Laravel application process is responsive.
     * Avoids heavy external dependencies.
     */
    public function live(): JsonResponse
    {
        return response()->json([
            'status' => 'healthy',
            'timestamp' => now()->toIso8601String(),
            'version' => config('app.version', '1.0.0'),
        ]);
    }

    /**
     * Readiness probe: Can this instance serve real traffic?
     * Verifies MySQL and Redis connectivity without leaking infrastructure details.
     */
    public function ready(): JsonResponse
    {
        $errors = [];

        // Check MySQL
        try {
            DB::connection()->getPdo();
        } catch (Throwable $e) {
            $errors['database'] = 'Database connection unavailable';
        }

        // Check Redis (where configured/required)
        try {
            if (config('database.redis.client')) {
                Redis::ping();
            }
        } catch (Throwable $e) {
            $errors['redis'] = 'Redis service unavailable';
        }

        if (! empty($errors)) {
            return response()->json([
                'status' => 'degraded',
                'timestamp' => now()->toIso8601String(),
                'checks' => $errors,
            ], 503);
        }

        return response()->json([
            'status' => 'ready',
            'timestamp' => now()->toIso8601String(),
            'version' => config('app.version', '1.0.0'),
        ]);
    }

    /**
     * Authenticated / Internal operational dependency health check.
     * Reports subsystem availability and scheduler heartbeat status.
     */
    public function dependencies(Request $request): JsonResponse
    {
        $dbStatus = 'healthy';
        try {
            DB::connection()->getPdo();
        } catch (Throwable $e) {
            $dbStatus = 'unavailable';
        }

        $redisStatus = 'healthy';
        try {
            Redis::ping();
        } catch (Throwable $e) {
            $redisStatus = 'unavailable';
        }

        $lastHeartbeat = Cache::get('scheduler_last_heartbeat_at');
        $schedulerStatus = 'unknown';

        if ($lastHeartbeat) {
            $secondsAgo = now()->diffInSeconds($lastHeartbeat);
            $schedulerStatus = $secondsAgo <= 180 ? 'active' : 'stale';
        }

        // Check undispatched outbox depth safely
        $pendingOutboxCount = 0;
        try {
            $pendingOutboxCount = DB::table('outbox_events')->count();
        } catch (Throwable) {
            // non-fatal
        }

        return response()->json([
            'status' => ($dbStatus === 'healthy' && $redisStatus === 'healthy') ? 'healthy' : 'degraded',
            'timestamp' => now()->toIso8601String(),
            'database' => $dbStatus,
            'redis' => $redisStatus,
            'scheduler' => [
                'status' => $schedulerStatus,
                'last_heartbeat_at' => $lastHeartbeat,
            ],
            'outbox' => [
                'pending_count' => $pendingOutboxCount,
            ],
        ]);
    }
}
