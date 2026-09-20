<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureRateLimiting();
    }

    /**
     * Configure the rate limiters for the application.
     */
    protected function configureRateLimiting(): void
    {
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
        });

        RateLimiter::for('auth-code-global', function (Request $request) {
            return Limit::perMinutes(
                config('otp.limits.global_daily.minutes', 1440),
                config('otp.limits.global_daily.attempts', 1000)
            )->by('global-otp-send');
        });

        RateLimiter::for('auth-code-ip', function (Request $request) {
            return Limit::perMinutes(
                config('otp.limits.ip.minutes', 15),
                config('otp.limits.ip.attempts', 20)
            )->by($request->ip());
        });

        RateLimiter::for('auth-code-daily', function (Request $request) {
            $email = strtolower(trim($request->input('email', '')));
            $hash = hash('sha256', $email);

            return Limit::perMinutes(
                config('otp.limits.send_daily.minutes', 1440),
                config('otp.limits.send_daily.attempts', 25)
            )->by($hash);
        });

        RateLimiter::for('auth-code-window', function (Request $request) {
            $email = strtolower(trim($request->input('email', '')));
            $hash = hash('sha256', $email);

            return Limit::perMinutes(
                config('otp.limits.send_short_window.minutes', 15),
                config('otp.limits.send_short_window.attempts', 3)
            )->by($hash);
        });

        RateLimiter::for('auth-code-cooldown', function (Request $request) {
            $email = strtolower(trim($request->input('email', '')));
            $hash = hash('sha256', $email);

            // Using perMinute as a close proxy if cooldown is 60s,
            // but for exact seconds we can use an integer division or a cache block in the controller.
            // Actually, we can use RateLimiter directly in the controller for strict second-based checks,
            // or use Limit::perMinute(1)->by($hash).
            // But if they want exact configurable seconds, we can define a generic rate limiter or handle it manually.
            // Since `Limit::perMinutes()` only accepts minutes (it multiplies by 60),
            // `Limit::none()` can be used to bypass and handle manually if we need seconds,
            // but there's no `Limit::perSeconds()`.
            // Wait, there is no perSeconds natively that accepts a customizable number of seconds in Limit builder.
            // Wait! `RateLimiter::attempt()` takes `$decaySeconds`. So we don't strictly need a `Limit` object for the cooldown if we use `RateLimiter::attempt()` directly in the controller!
            // But let's just stick to configuring it in the controller using `RateLimiter` facade.

            // To match Laravel convention, we will define them here. If the cooldown is strictly configured in seconds, we can just use `Limit::none()` here and manage it in controller, or just skip it here and do it in controller.
            // Let's just manage the cooldown in the controller via `RateLimiter::attempt(..., $decaySeconds)`

            return Limit::none();
        });
    }
}
