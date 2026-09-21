<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SecurityHeadersMiddleware
{
    /**
     * Injects production security headers into outgoing HTTP responses.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Prevent MIME type sniffing
        $response->headers->set('X-Content-Type-Options', 'nosniff');

        // Prevent clickjacking / unwanted framing
        $response->headers->set('X-Frame-Options', 'DENY');

        // Privacy preserving referrer policy
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');

        // Limit hardware permissions (permit camera for direct photo capture)
        $response->headers->set('Permissions-Policy', 'camera=(self), microphone=(), geolocation=()');

        // HSTS (Strict-Transport-Security) only active when serving HTTPS in production
        if ($request->isSecure() && app()->environment('production')) {
            $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        }

        return $response;
    }
}
