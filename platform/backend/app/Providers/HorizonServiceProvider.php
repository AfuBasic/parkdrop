<?php

namespace App\Providers;

use Illuminate\Support\Facades\Gate;
use Laravel\Horizon\Horizon;
use Laravel\Horizon\HorizonApplicationServiceProvider;

class HorizonServiceProvider extends HorizonApplicationServiceProvider
{
    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        parent::boot();

        // Horizon::routeSmsNotificationsTo('15556667777');
        // Horizon::routeMailNotificationsTo('example@example.com');
        // Horizon::routeSlackNotificationsTo('slack-webhook-url', '#channel');
    }

    /**
     * Configure the Horizon authorization services.
     */
    protected function authorization(): void
    {
        $this->gate();

        Horizon::auth(function ($request) {
            // 1. Local environment always permitted
            if (app()->environment('local')) {
                return true;
            }

            // 2. Secret query token / header bypass (e.g. /horizon?token=your_secret)
            $configuredSecret = config('horizon.secret');
            if (!empty($configuredSecret) && ($request->query('token') === $configuredSecret || $request->header('X-Horizon-Secret') === $configuredSecret)) {
                return true;
            }

            // 3. HTTP Basic Auth bypass (prompt in browser if configured in .env)
            $basicUser = config('horizon.basic_auth_user', 'admin');
            $basicPass = config('horizon.basic_auth_password');
            if (!empty($basicPass)) {
                if ($request->getUser() === $basicUser && $request->getPassword() === $basicPass) {
                    return true;
                }
            }

            // 4. Logged-in admin with whitelisted email
            $user = $request->user('admin') ?? $request->user();
            if (Gate::forUser($user)->check('viewHorizon')) {
                return true;
            }

            // If basic auth password is configured and user isn't logged in, trigger browser login prompt
            if (!empty($basicPass) && !$user) {
                header('WWW-Authenticate: Basic realm="Horizon Dashboard"');
                header('HTTP/1.0 401 Unauthorized');
                echo 'Unauthorized';
                exit;
            }

            return false;
        });
    }

    /**
     * Register the Horizon gate.
     *
     * This gate determines who can access Horizon in non-local environments.
     */
    protected function gate(): void
    {
        Gate::define('viewHorizon', function ($user = null) {
            $allowedEmails = array_filter(array_map(
                'trim',
                explode(',', (string) config('horizon.allowed_emails', 'afutunde@gmail.com'))
            ));

            $email = optional($user)->email;

            return !empty($email) && in_array(strtolower($email), array_map('strtolower', $allowedEmails), true);
        });
    }
}
