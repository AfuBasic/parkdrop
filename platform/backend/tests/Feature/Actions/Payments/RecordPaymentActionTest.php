<?php

use App\Actions\Payments\RecordPaymentAction;
use App\Enums\PaymentMethod;
use App\Models\Business;
use App\Models\Customer;
use App\Models\Package;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

test('two concurrent payments within balance limit both succeed', function () {
    $business = Business::create(['name' => 'Concurrent Hub', 'slug' => 'concurrent-hub']);
    $user = User::factory()->create();
    $customer = Customer::create([
        'id' => (string) Str::uuid(),
        'business_id' => $business->id,
        'name' => 'Chioma Ade',
        'phone' => '+2348039999999',
        'phone_display' => '0803 999 9999',
        'phone_normalized' => '+2348039999999',
    ]);

    $package = Package::create([
        'id' => (string) Str::uuid(),
        'business_id' => $business->id,
        'customer_id' => $customer->id,
        'public_package_id' => 'PD-CONC1',
        'pickup_code' => '9X2P1QA',
        'amount_due_minor' => 500000, // ₦5,000
        'status' => 'WAITING',
    ]);

    $action = app(RecordPaymentAction::class);

    // Device A pays ₦2,000
    $paymentA = $action->execute($business, $package, [
        'payment_id' => (string) Str::uuid(),
        'amount_minor' => 200000,
        'method' => PaymentMethod::CASH,
    ], $user->id, 'device-a');

    // Device B pays ₦3,000
    $paymentB = $action->execute($business, $package, [
        'payment_id' => (string) Str::uuid(),
        'amount_minor' => 300000,
        'method' => PaymentMethod::TRANSFER,
    ], $user->id, 'device-b');

    expect($paymentA->status)->toBe('COMPLETED');
    expect($paymentB->status)->toBe('COMPLETED');

    $totalPaid = Payment::where('package_id', $package->id)->where('status', 'COMPLETED')->sum('amount_minor');
    expect((int) $totalPaid)->toBe(500000);
});

test('concurrent payment causing overpayment throws domain exception and rolls back', function () {
    $business = Business::create(['name' => 'Race Hub', 'slug' => 'race-hub']);
    $user = User::factory()->create();
    $customer = Customer::create([
        'id' => (string) Str::uuid(),
        'business_id' => $business->id,
        'name' => 'Chioma Ade',
        'phone' => '+2348039999999',
        'phone_display' => '0803 999 9999',
        'phone_normalized' => '+2348039999999',
    ]);

    $package = Package::create([
        'id' => (string) Str::uuid(),
        'business_id' => $business->id,
        'customer_id' => $customer->id,
        'public_package_id' => 'PD-CONC2',
        'pickup_code' => '9X2P2QA',
        'amount_due_minor' => 500000, // ₦5,000
        'status' => 'WAITING',
    ]);

    $action = app(RecordPaymentAction::class);

    // Prior payment of ₦4,000 (Remaining balance = ₦1,000)
    $action->execute($business, $package, [
        'payment_id' => (string) Str::uuid(),
        'amount_minor' => 400000,
        'method' => PaymentMethod::CASH,
    ], $user->id, 'device-seed');

    // Device A pays ₦1,000 (Succeeds)
    $paymentA = $action->execute($business, $package, [
        'payment_id' => (string) Str::uuid(),
        'amount_minor' => 100000,
        'method' => PaymentMethod::POS,
    ], $user->id, 'device-a');

    expect($paymentA->status)->toBe('COMPLETED');

    // Device B also tries to pay ₦1,000 (Must throw OVERPAYMENT_FORBIDDEN)
    expect(fn () => $action->execute($business, $package, [
        'payment_id' => (string) Str::uuid(),
        'amount_minor' => 100000,
        'method' => PaymentMethod::CASH,
    ], $user->id, 'device-b'))->toThrow(DomainException::class, 'OVERPAYMENT_FORBIDDEN');

    // Ledger must strictly remain ₦5,000 total
    $totalPaid = Payment::where('package_id', $package->id)->where('status', 'COMPLETED')->sum('amount_minor');
    expect((int) $totalPaid)->toBe(500000);
});
