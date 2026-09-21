<?php

use App\Models\Business;
use App\Models\Customer;
use App\Models\Package;
use App\Models\User;
use App\Services\Sync\Handlers\CreatePackageMutationHandler;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

it('creates a package successfully', function () {
    $business = Business::create([
        'public_id' => (string) Str::uuid(),
        'name' => 'Test Business',
    ]);
    $user = User::factory()->create();
    $customer = Customer::create([
        'business_id' => $business->id,
        'name' => 'John Doe',
        'phone_display' => '0800000000',
        'phone_normalized' => '+234800000000',
        'version' => 1,
    ]);

    $handler = new CreatePackageMutationHandler;

    $payload = [
        'package_id' => Str::uuid()->toString(),
        'customer_id' => $customer->id,
        'public_package_id' => 'PD-ABCDE',
        'pickup_code' => '1234567',
        'amount_due_minor' => 150000,
        'arrival_sms_requested' => true,
    ];

    $result = $handler->handle(
        $payload,
        $business->id,
        $user->id,
        'device-123',
        null
    );

    expect($result['status'])->toBe('APPLIED');

    $package = Package::find($payload['package_id']);
    expect($package)->not->toBeNull();
    expect($package->business_id)->toBe($business->id);
    expect($package->customer_id)->toBe($customer->id);
    expect($package->amount_due_minor)->toBe(150000);
    expect($package->public_package_id)->toBe('PD-ABCDE');
    expect($package->pickup_code)->toBe('1234567');
});

it('rejects if public package id already exists', function () {
    $business = Business::create([
        'public_id' => (string) Str::uuid(),
        'name' => 'Test Business 2',
    ]);
    $user = User::factory()->create();
    $customer = Customer::create([
        'business_id' => $business->id,
        'name' => 'John Doe',
        'phone_display' => '0800000000',
        'phone_normalized' => '+234800000000',
        'version' => 1,
    ]);

    // Create existing package
    Package::create([
        'id' => Str::uuid()->toString(),
        'business_id' => $business->id,
        'customer_id' => $customer->id,
        'public_package_id' => 'PD-ABCDE',
        'pickup_code' => '7654321',
        'amount_due_minor' => 0,
        'status' => 'WAITING',
        'created_by_user_id' => $user->id,
        'created_by_device_uuid' => 'dev1',
        'version' => 1,
    ]);

    $handler = new CreatePackageMutationHandler;

    $payload = [
        'package_id' => Str::uuid()->toString(),
        'customer_id' => $customer->id,
        'public_package_id' => 'PD-ABCDE', // conflict
        'pickup_code' => '1234567',
        'amount_due_minor' => 150000,
    ];

    $result = $handler->handle(
        $payload,
        $business->id,
        $user->id,
        'device-123',
        null
    );

    expect($result['status'])->toBe('CONFLICT');
    expect($result['metadata']['error'])->toBe('PUBLIC_PACKAGE_ID_COLLISION');
});
