<?php

return [

    /*
    |--------------------------------------------------------------------------
    | OTP Generation Settings
    |--------------------------------------------------------------------------
    |
    */

    'length' => env('OTP_LENGTH', 6),

    'expiry' => env('OTP_EXPIRY_MINUTES', 10),

    'max_verify_attempts' => env('OTP_MAX_VERIFY_ATTEMPTS', 5),

    /*
    |--------------------------------------------------------------------------
    | OTP Rate Limiting
    |--------------------------------------------------------------------------
    |
    | A layered rate-limiting strategy for sending OTPs.
    |
    */

    'limits' => [
        // Minimum time between requests for the same email
        'send_cooldown_seconds' => env('OTP_SEND_COOLDOWN_SECONDS', 60),

        // Short window limit for the same email
        'send_short_window' => [
            'attempts' => env('OTP_SEND_SHORT_WINDOW_ATTEMPTS', 3),
            'minutes' => env('OTP_SEND_SHORT_WINDOW_MINUTES', 15),
        ],

        // Daily limit for the same email
        'send_daily' => [
            'attempts' => env('OTP_SEND_DAILY_ATTEMPTS', 25),
            'minutes' => 24 * 60,
        ],

        // Limit per IP address
        'ip' => [
            'attempts' => env('OTP_IP_ATTEMPTS', 20),
            'minutes' => env('OTP_IP_MINUTES', 15),
        ],

        // Global safety limit for the entire platform
        'global_daily' => [
            'attempts' => env('OTP_GLOBAL_DAILY_ATTEMPTS', 1000),
            'minutes' => 24 * 60,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Delivery Queue
    |--------------------------------------------------------------------------
    |
    */

    'queue' => env('OTP_QUEUE', 'auth'),

];
