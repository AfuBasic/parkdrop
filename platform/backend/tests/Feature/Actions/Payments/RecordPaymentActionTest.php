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

    // Ledger must strictly remain NGN 5,000 total
    $totalPaid = Payment::where('package_id', $package->id)->where('status', 'COMPLETED')->sum('amount_minor');
    expect((int) $totalPaid)->toBe(500000);
});

test('payment on long-waiting package validates against accrued total with demurrage', function () {
    $business = Business::create([
        'name' => 'Demurrage Hub',
        'slug' => 'demurrage-hub',
        'daily_storage_fee_minor' => 50_000, // NGN 500/day
    ]);
    $user = User::factory()->create();
    $customer = Customer::create([
        'id' => (string) Str::uuid(),
        'business_id' => $business->id,
        'name' => 'Demurrage Customer',
        'phone' => '+2348031111111',
        'phone_display' => '0803 111 1111',
        'phone_normalized' => '+2348031111111',
    ]);

    // Package created 5 days ago: 4 extra nights
    $createdAt = now()->subDays(5);
    $package = Package::create([
        'id' => (string) Str::uuid(),
        'business_id' => $business->id,
        'customer_id' => $customer->id,
        'public_package_id' => 'PD-DEM1',
        'pickup_code' => 'D3M1',
        'amount_due_minor' => 100_000, // NGN 1,000 base
        'status' => 'WAITING',
        'client_created_at' => $createdAt,
    ]);

    $action = app(RecordPaymentAction::class);

    // Base is 100,000 + 4 extra days × 50,000 = 300,000 total
    // Paying only the base amount (100,000) should succeed — partial payment allowed
    $payment = $action->execute($business, $package, [
        'payment_id' => (string) Str::uuid(),
        'amount_minor' => 100_000,
        'method' => PaymentMethod::CASH,
    ], $user->id, 'device-1');

    expect($payment->status)->toBe('COMPLETED');

    // Remaining balance is now 200,000 (accrued total 300,000 - paid 100,000)
    // Trying to pay 300,000 more should fail
    expect(fn () => $action->execute($business, $package, [
        'payment_id' => (string) Str::uuid(),
        'amount_minor' => 300_000,
        'method' => PaymentMethod::CASH,
    ], $user->id, 'device-2'))->toThrow(DomainException::class, 'OVERPAYMENT_FORBIDDEN');
});

test('payment rejects overpayment when demurrage pushes balance above base amount', function () {
    $business = Business::create([
        'name' => 'Overpay Hub',
        'slug' => 'overpay-hub',
        'daily_storage_fee_minor' => 100_000, // NGN 1,000/day
    ]);
    $user = User::factory()->create();
    $customer = Customer::create([
        'id' => (string) Str::uuid(),
        'business_id' => $business->id,
        'name' => 'Overpay Customer',
        'phone' => '+2348032222222',
        'phone_display' => '0803 222 2222',
        'phone_normalized' => '+2348032222222',
    ]);

    // Package created 10 days ago: 9 extra nights
    $createdAt = now()->subDays(10);
    $package = Package::create([
        'id' => (string) Str::uuid(),
        'business_id' => $business->id,
        'customer_id' => $customer->id,
        'public_package_id' => 'PD-OVP1',
        'pickup_code' => '0VP1',
        'amount_due_minor' => 50_000, // NGN 500 base
        'status' => 'WAITING',
        'client_created_at' => $createdAt,
    ]);

    $action = app(RecordPaymentAction::class);

    // Accrued total: 50,000 base + 9 × 100,000 = 950,000 (NGN 9,500)
    // Paying only the base (50,000) is allowed — partial payment
    $payment = $action->execute($business, $package, [
        'payment_id' => (string) Str::uuid(),
        'amount_minor' => 50_000,
        'method' => PaymentMethod::CASH,
    ], $user->id, 'device-1');

    expect($payment->status)->toBe('COMPLETED');

    // Remaining balance is now 900,000
    // Attempting the base amount again (50,000) succeeds
    $payment2 = $action->execute($business, $package, [
        'payment_id' => (string) Str::uuid(),
        'amount_minor' => 50_000,
        'method' => PaymentMethod::TRANSFER,
    ], $user->id, 'device-2');
    expect($payment2->status)->toBe('COMPLETED');

    // But paying even 1 kobo more than remaining 850,000 must fail
    expect(fn () => $action->execute($business, $package, [
        'payment_id' => (string) Str::uuid(),
        'amount_minor' => 850_001,
        'method' => PaymentMethod::CASH,
    ], $user->id, 'device-3'))->toThrow(DomainException::class, 'OVERPAYMENT_FORBIDDEN');
});
