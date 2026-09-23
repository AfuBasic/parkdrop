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
    | SMS Credit Pricing
    |--------------------------------------------------------------------------
    |
    | Flat, server-controlled price per credit — no volume tiers, no margin.
    | Amounts in integer minor units (kobo for NGN). The frontend sends a
    | quantity (credits) and the server is always the one that computes the
    | amount; it never trusts a client-supplied price.
    |
    */
    'price_per_credit_minor' => (int) env('SMS_CREDIT_PRICE_MINOR', 700), // ₦7.00
    'min_credits_per_purchase' => (int) env('SMS_CREDIT_MIN_PER_PURCHASE', 50),
    'max_credits_per_purchase' => (int) env('SMS_CREDIT_MAX_PER_PURCHASE', 5000),
];
