<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Default Payment Provider
    |--------------------------------------------------------------------------
    |
    | Supported: "flutterwave", "paystack", "fake"
    |
    */
    'default_provider' => env('PAYMENT_PROVIDER', 'flutterwave'),

    /*
    |--------------------------------------------------------------------------
    | Default Currency
    |--------------------------------------------------------------------------
    |
    | Canonical currency for ParkDrop SMS credit purchases in Nigeria (NGN).
    |
    */
    'currency' => env('PAYMENT_CURRENCY', 'NGN'),

    /*
    |--------------------------------------------------------------------------
    | Provider Configurations
    |--------------------------------------------------------------------------
    */
    'providers' => [
        'flutterwave' => [
            'public_key' => env('FLW_PUBLIC_KEY', env('FLUTTERWAVE_PUBLIC_KEY')),
            'secret_key' => env('FLW_SECRET_KEY', env('FLUTTERWAVE_SECRET_KEY')),
            'secret_hash' => env('FLW_SECRET_HASH', env('FLUTTERWAVE_SECRET_HASH')),
            'base_url' => env('FLW_BASE_URL', 'https://api.flutterwave.com/v3'),
        ],

        'paystack' => [
            'public_key' => env('PAYSTACK_PUBLIC_KEY'),
            'secret_key' => env('PAYSTACK_SECRET_KEY'),
            'webhook_secret' => env('PAYSTACK_SECRET_KEY'), // Paystack signs webhooks with secret key
            'base_url' => env('PAYSTACK_BASE_URL', 'https://api.paystack.co'),
        ],

        'fake' => [
            'should_succeed' => env('PAYMENT_FAKE_SHOULD_SUCCEED', true),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Server-Controlled SMS Credit Bundles
    |--------------------------------------------------------------------------
    |
    | Authoritative commercial packages. Amounts are stored in integer minor
    | units (kobo for NGN). The frontend sends bundle_key ONLY.
    |
    */
    'bundles' => [
        'bundle_50' => [
            'key' => 'bundle_50',
            'credits' => 50,
            'amount_minor' => 150000, // ₦1,500
            'currency' => 'NGN',
            'label' => '50 SMS credits',
            'description' => 'For smaller parcel volumes',
        ],
        'bundle_100' => [
            'key' => 'bundle_100',
            'credits' => 100,
            'amount_minor' => 280000, // ₦2,800
            'currency' => 'NGN',
            'label' => '100 SMS credits',
            'description' => 'Popular for active pickup points',
        ],
        'bundle_250' => [
            'key' => 'bundle_250',
            'credits' => 250,
            'amount_minor' => 650000, // ₦6,500
            'currency' => 'NGN',
            'label' => '250 SMS credits',
            'description' => 'Best value for high-volume hubs',
        ],
    ],
];
