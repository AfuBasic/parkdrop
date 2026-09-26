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
            $user = $request->user('admin') ?? $request->user();

            return Gate::forUser($user)->check('viewHorizon') || app()->environment('local');
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
                explode(',', (string) env('HORIZON_ALLOWED_EMAILS', env('ADMIN_EMAIL', 'afutunde@gmail.com')))
            ));

            $email = optional($user)->email;

            return !empty($email) && in_array(strtolower($email), array_map('strtolower', $allowedEmails), true);
        });
    }
}
