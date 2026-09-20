<?php

use App\Models\Business;
use App\Models\BusinessMembership;
use App\Models\Customer;
use App\Models\Package;
use App\Models\Payment;
use App\Models\User;
use App\Services\Sync\Handlers\RecordPaymentMutationHandler;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->business = Business::create([
        'name' => 'Test Hub',
        'slug' => 'test-hub-'.Str::random(5),
    ]);

    BusinessMembership::create([
        'business_id' => $this->business->id,
        'user_id' => $this->user->id,
        'role' => 'owner',
    ]);

    $this->customer = Customer::create([
        'id' => (string) Str::uuid(),
        'business_id' => $this->business->id,
        'name' => 'Emeka Obi',
        'phone' => '+2348031234567',
        'phone_display' => '0803 123 4567',
        'phone_normalized' => '+2348031234567',
    ]);

    $this->package = Package::create([
        'id' => (string) Str::uuid(),
        'business_id' => $this->business->id,
        'customer_id' => $this->customer->id,
        'public_package_id' => 'PD-99999',
        'pickup_code' => '8K3P9QA',
        'amount_due_minor' => 350000, // ₦3,500
        'status' => 'WAITING',
    ]);
});

test('it records valid payment against package authoritatively', function () {
    $handler = app(RecordPaymentMutationHandler::class);

    $paymentId = (string) Str::uuid();
    $result = $handler->handle([
        'payment_id' => $paymentId,
        'package_id' => $this->package->id,
        'amount_minor' => 100000, // ₦1,000
        'method' => 'CASH',
        'client_recorded_at' => now()->toIso8601String(),
    ], $this->business->id, $this->user->id, 'device-uuid-1', null);

    expect($result['status'])->toBe('APPLIED')
        ->and($result['metadata']['payment_id'])->toBe($paymentId)
        ->and($result['metadata']['amount_minor'])->toBe(100000)
        ->and($result['metadata']['status'])->toBe('COMPLETED');

    $this->assertDatabaseHas('payments', [
        'id' => $paymentId,
        'business_id' => $this->business->id,
        'package_id' => $this->package->id,
        'amount_minor' => 100000,
        'method' => 'CASH',
        'status' => 'COMPLETED',
    ]);

    $this->assertDatabaseHas('sync_changes', [
        'business_id' => $this->business->id,
        'entity_type' => 'payment',
        'entity_id' => $paymentId,
        'operation' => 'CREATED',
    ]);

    $this->assertDatabaseHas('activity_logs', [
        'business_id' => $this->business->id,
        'package_id' => $this->package->id,
        'type' => 'PAYMENT_RECORDED',
    ]);
});

test('it rejects overpayment exceeding remaining balance', function () {
    $handler = app(RecordPaymentMutationHandler::class);

    // Initial payment of ₦3,000
    $payment1Id = (string) Str::uuid();
    $handler->handle([
        'payment_id' => $payment1Id,
        'package_id' => $this->package->id,
        'amount_minor' => 300000,
        'method' => 'TRANSFER',
    ], $this->business->id, $this->user->id, 'device-uuid-1', null);

    // Remaining balance is now ₦500 (50000 minor)
    // Attempting to pay ₦600 (60000 minor) should be rejected
    $payment2Id = (string) Str::uuid();
    $result = $handler->handle([
        'payment_id' => $payment2Id,
        'package_id' => $this->package->id,
        'amount_minor' => 60000,
        'method' => 'CASH',
    ], $this->business->id, $this->user->id, 'device-uuid-1', null);

    expect($result['status'])->toBe('REJECTED')
        ->and($result['metadata']['error'])->toBe('OVERPAYMENT_FORBIDDEN');

    $this->assertDatabaseMissing('payments', [
        'id' => $payment2Id,
    ]);
});

test('it allows exact remaining balance payment to fully pay package', function () {
    $handler = app(RecordPaymentMutationHandler::class);

    // Pay full ₦3,500
    $paymentId = (string) Str::uuid();
    $result = $handler->handle([
        'payment_id' => $paymentId,
        'package_id' => $this->package->id,
        'amount_minor' => 350000,
        'method' => 'POS',
    ], $this->business->id, $this->user->id, 'device-uuid-1', null);

    expect($result['status'])->toBe('APPLIED');

    // Attempting any further payment should now fail because remaining balance is 0
    $result2 = $handler->handle([
        'payment_id' => (string) Str::uuid(),
        'package_id' => $this->package->id,
        'amount_minor' => 1000,
        'method' => 'CASH',
    ], $this->business->id, $this->user->id, 'device-uuid-1', null);

    expect($result2['status'])->toBe('REJECTED')
        ->and($result2['metadata']['error'])->toBe('OVERPAYMENT_FORBIDDEN');
});

test('it handles duplicate mutation replay idempotently without double recording', function () {
    $handler = app(RecordPaymentMutationHandler::class);

    $paymentId = (string) Str::uuid();
    $payload = [
        'payment_id' => $paymentId,
        'package_id' => $this->package->id,
        'amount_minor' => 150000,
        'method' => 'CASH',
    ];

    $result1 = $handler->handle($payload, $this->business->id, $this->user->id, 'device-uuid-1', null);
    expect($result1['status'])->toBe('APPLIED');

    // Replay 5 times
    for ($i = 0; $i < 5; $i++) {
        $resultReplay = $handler->handle($payload, $this->business->id, $this->user->id, 'device-uuid-1', null);
        expect($resultReplay['status'])->toBe('APPLIED');
    }

    // Still exactly 1 payment record in database
    expect(Payment::where('package_id', $this->package->id)->count())->toBe(1);
});

test('it isolates cross-tenant payments and rejects foreign business', function () {
    $otherBusiness = Business::create([
        'name' => 'Foreign Business',
        'slug' => 'foreign-biz',
    ]);

    $handler = app(RecordPaymentMutationHandler::class);
    $result = $handler->handle([
        'payment_id' => (string) Str::uuid(),
        'package_id' => $this->package->id,
        'amount_minor' => 50000,
        'method' => 'CASH',
    ], $otherBusiness->id, $this->user->id, 'device-uuid-1', null);

    expect($result['status'])->toBe('REJECTED')
        ->and($result['metadata']['error'])->toBe('PACKAGE_NOT_FOUND');
});

test('it rejects payment if package status is not WAITING', function () {
    $this->package->update(['status' => 'CANCELLED']);

    $handler = app(RecordPaymentMutationHandler::class);
    $result = $handler->handle([
        'payment_id' => (string) Str::uuid(),
        'package_id' => $this->package->id,
        'amount_minor' => 50000,
        'method' => 'CASH',
    ], $this->business->id, $this->user->id, 'device-uuid-1', null);

    expect($result['status'])->toBe('REJECTED')
        ->and($result['metadata']['error'])->toBe('PACKAGE_STATUS_FORBIDS_PAYMENT');
});
