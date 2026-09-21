<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class AssignRequestId
{
    /**
     * Handle an incoming request and bind or propagate X-Request-ID.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $incomingRequestId = $request->header('X-Request-ID');

        // Only accept safe alphanumeric/hyphen IDs, otherwise generate clean UUID v4
        $requestId = ($incomingRequestId && preg_match('/^[a-zA-Z0-9\-]{10,64}$/', $incomingRequestId))
            ? $incomingRequestId
            : (string) Str::uuid();

        $request->headers->set('X-Request-ID', $requestId);

        // Bind request_id to Monolog context
        Log::withContext(['request_id' => $requestId]);

        $response = $next($request);

        // Append to response headers
        $response->headers->set('X-Request-ID', $requestId);

        return $response;
    }
}
