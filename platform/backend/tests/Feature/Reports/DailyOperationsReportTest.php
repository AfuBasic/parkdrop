<?php

use App\Actions\Packages\CancelPackageAction;
use App\Actions\Packages\ReturnPackageAction;
use App\Actions\Payments\RecordPaymentAction;
use App\Actions\Payments\ReversePaymentAction;
use App\Actions\Reports\ExportDailyOperationsReportAction;
use App\Enums\PaymentMethod;
use App\Models\Business;
use App\Models\BusinessMembership;
use App\Models\Customer;
use App\Models\Package;
use App\Models\PackageLifecycleEvent;
use App\Models\Payment;
use App\Models\PickupPoint;
use App\Models\User;
use App\Support\BusinessDayBounds;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

beforeEach(function () {
    $this->owner = User::factory()->create(['first_name' => 'Ada', 'email' => 'ada@example.com']);
    $this->manager = User::factory()->create(['first_name' => 'Tunde', 'email' => 'tunde@example.com']);
    $this->attendant = User::factory()->create(['first_name' => 'Chinedu', 'email' => 'chinedu@example.com']);

    $this->business = Business::create([
        'name' => 'Lagos Central Logistics',
        'public_id' => (string) Str::uuid(),
    ]);

    $this->otherBusiness = Business::create([
        'name' => 'Abuja Express',
        'public_id' => (string) Str::uuid(),
    ]);

    BusinessMembership::create([
        'business_id' => $this->business->id,
        'user_id' => $this->owner->id,
        'role' => 'owner',
        'status' => 'active',
    ]);

    BusinessMembership::create([
        'business_id' => $this->business->id,
        'user_id' => $this->manager->id,
        'role' => 'manager',
        'status' => 'active',
    ]);

    BusinessMembership::create([
        'business_id' => $this->business->id,
        'user_id' => $this->attendant->id,
        'role' => 'attendant',
        'status' => 'active',
    ]);

    $this->pickupPoint1 = PickupPoint::create([
        'business_id' => $this->business->id,
        'name' => 'Counter 1',
        'status' => 'active',
    ]);

    $this->pickupPoint2 = PickupPoint::create([
        'business_id' => $this->business->id,
        'name' => 'Counter 2',
        'status' => 'active',
    ]);

    $this->customer = Customer::create([
        'id' => (string) Str::uuid(),
        'business_id' => $this->business->id,
        'name' => 'Emeka Obi',
        'phone' => '+2348031234567',
        'phone_display' => '0803 123 4567',
        'phone_normalized' => '+2348031234567',
    ]);
});

test('BusinessDayBounds calculates Africa/Lagos boundaries correctly and blocks future dates', function () {
    $bounds = BusinessDayBounds::forDate('2026-09-20');
    expect($bounds['timezone'])->toBe('Africa/Lagos')
        ->and($bounds['start']->toIso8601String())->toBe('2026-09-19T23:00:00+00:00') // WAT is UTC+1
        ->and($bounds['end']->toIso8601String())->toBe('2026-09-20T23:00:00+00:00');

    // Future date throws exception
    $futureDate = Carbon::now('Africa/Lagos')->addDays(2)->format('Y-m-d');
    expect(fn () => BusinessDayBounds::forDate($futureDate))->toThrow(InvalidArgumentException::class);
});

test('owner and manager can view daily operational summary but attendant is forbidden', function () {
    $today = BusinessDayBounds::todayLocal();

    // Owner allowed
    $response = $this->actingAs($this->owner)
        ->getJson("/api/v1/reports/daily-operations?date={$today}");
    $response->assertStatus(200)
        ->assertJsonStructure(['date', 'packages', 'payments', 'scope']);

    // Manager allowed
    $response = $this->actingAs($this->manager)
        ->getJson("/api/v1/reports/daily-operations?date={$today}");
    $response->assertStatus(200);

    // Attendant forbidden (403)
    $response = $this->actingAs($this->attendant)
        ->getJson("/api/v1/reports/daily-operations?date={$today}");
    $response->assertStatus(403);
});

test('it accurately aggregates received, collected, returned, and cancelled package metrics', function () {
    $today = BusinessDayBounds::todayLocal();
    $bounds = BusinessDayBounds::forDate($today);
    $midday = $bounds['start']->addHours(12);

    // 1. Package Received and still WAITING
    Package::create([
        'id' => (string) Str::uuid(),
        'business_id' => $this->business->id,
        'pickup_point_id' => $this->pickupPoint1->id,
        'customer_id' => $this->customer->id,
        'public_package_id' => 'PD-RCV1',
        'pickup_code' => 'CODE1',
        'status' => 'WAITING',
        'client_created_at' => $midday,
        'created_at' => $midday,
    ]);

    // 2. Package Received today AND Collected today (must count in BOTH)
    $collectedPkg = Package::create([
        'id' => (string) Str::uuid(),
        'business_id' => $this->business->id,
        'pickup_point_id' => $this->pickupPoint1->id,
        'customer_id' => $this->customer->id,
        'public_package_id' => 'PD-RCVCOL',
        'pickup_code' => 'CODE2',
        'status' => 'COLLECTED',
        'client_created_at' => $midday,
        'created_at' => $midday,
        'updated_at' => $midday->addHours(2),
    ]);

    // 3. Package Returned today
    $returnedPkg = Package::create([
        'id' => (string) Str::uuid(),
        'business_id' => $this->business->id,
        'pickup_point_id' => $this->pickupPoint1->id,
        'customer_id' => $this->customer->id,
        'public_package_id' => 'PD-RET1',
        'pickup_code' => 'CODE3',
        'status' => 'RETURNED',
        'client_created_at' => $midday->subDays(1),
        'created_at' => $midday->subDays(1),
    ]);
    PackageLifecycleEvent::create([
        'id' => (string) Str::uuid(),
        'business_id' => $this->business->id,
        'package_id' => $returnedPkg->id,
        'type' => 'RETURN',
        'reason' => 'CUSTOMER_DID_NOT_COLLECT',
        'client_event_at' => $midday,
    ]);

    // 4. Package Cancelled today
    $cancelledPkg = Package::create([
        'id' => (string) Str::uuid(),
        'business_id' => $this->business->id,
        'pickup_point_id' => $this->pickupPoint2->id,
        'customer_id' => $this->customer->id,
        'public_package_id' => 'PD-CAN1',
        'pickup_code' => 'CODE4',
        'status' => 'CANCELLED',
        'client_created_at' => $midday->subDays(2),
        'created_at' => $midday->subDays(2),
    ]);
    PackageLifecycleEvent::create([
        'id' => (string) Str::uuid(),
        'business_id' => $this->business->id,
        'package_id' => $cancelledPkg->id,
        'type' => 'CANCEL',
        'reason' => 'DAMAGED_BEFORE_DISPATCH',
        'client_event_at' => $midday,
    ]);

    // Test Business-wide summary
    $response = $this->actingAs($this->owner)
        ->getJson("/api/v1/reports/daily-operations?date={$today}&scope=all");

    $response->assertStatus(200)
        ->assertJson([
            'packages' => [
                'received_count' => 2,
                'collected_count' => 1,
                'returned_count' => 1,
                'cancelled_count' => 1,
                'waiting_now_count' => 1,
            ],
        ]);

    // Test Scoped to Counter 1
    $responsePoint1 = $this->actingAs($this->owner)
        ->getJson("/api/v1/reports/daily-operations?date={$today}&scope={$this->pickupPoint1->id}");

    $responsePoint1->assertStatus(200)
        ->assertJson([
            'packages' => [
                'received_count' => 2,
                'collected_count' => 1,
                'returned_count' => 1,
                'cancelled_count' => 0, // was Counter 2
                'waiting_now_count' => 1,
            ],
        ]);
});

test('it accurately calculates positive payments, method breakdown, and reversals in minor units', function () {
    $today = BusinessDayBounds::todayLocal();
    $bounds = BusinessDayBounds::forDate($today);
    $midday = $bounds['start']->addHours(12);

    $pkg = Package::create([
        'id' => (string) Str::uuid(),
        'business_id' => $this->business->id,
        'pickup_point_id' => $this->pickupPoint1->id,
        'customer_id' => $this->customer->id,
        'public_package_id' => 'PD-PAY1',
        'pickup_code' => 'PCODE',
        'amount_due_minor' => 1000000,
        'status' => 'WAITING',
    ]);

    // Cash payment ₦2,000 (200,000 kobo)
    Payment::create([
        'id' => (string) Str::uuid(),
        'business_id' => $this->business->id,
        'package_id' => $pkg->id,
        'amount_minor' => 200000,
        'method' => 'CASH',
        'recorded_at' => $midday,
        'status' => 'COMPLETED',
    ]);

    // Transfer payment ₦3,500 (350,000 kobo)
    $transferPayment = Payment::create([
        'id' => (string) Str::uuid(),
        'business_id' => $this->business->id,
        'package_id' => $pkg->id,
        'amount_minor' => 350000,
        'method' => 'TRANSFER',
        'recorded_at' => $midday->addHour(),
        'status' => 'COMPLETED',
    ]);

    // POS payment ₦1,500 (150,000 kobo)
    Payment::create([
        'id' => (string) Str::uuid(),
        'business_id' => $this->business->id,
        'package_id' => $pkg->id,
        'amount_minor' => 150000,
        'method' => 'POS',
        'recorded_at' => $midday->addHours(2),
        'status' => 'COMPLETED',
    ]);

    // Reversal of ₦500 (50,000 kobo) occurring today
    Payment::create([
        'id' => (string) Str::uuid(),
        'business_id' => $this->business->id,
        'package_id' => $pkg->id,
        'amount_minor' => -50000,
        'method' => 'TRANSFER',
        'recorded_at' => $midday->addHours(3),
        'reverses_payment_id' => $transferPayment->id,
        'reversal_reason' => 'Customer overpaid',
        'status' => 'REVERSED',
    ]);

    $response = $this->actingAs($this->owner)
        ->getJson("/api/v1/reports/daily-operations?date={$today}&scope=all");

    $response->assertStatus(200)
        ->assertJson([
            'payments' => [
                'recorded_count' => 3,
                'recorded_minor' => 700000, // 200k + 350k + 150k
                'reversed_count' => 1,
                'reversed_minor' => 50000,
                'net_minor' => 650000, // 700k - 50k
                'by_method' => [
                    'cash_minor' => 200000,
                    'transfer_minor' => 350000,
                    'pos_minor' => 150000,
                    'other_minor' => 0,
                ],
            ],
        ]);
});

test('it prevents CSV formula injection and formats currency accurately in streaming export', function () {
    $today = BusinessDayBounds::todayLocal();
    $bounds = BusinessDayBounds::forDate($today);
    $midday = $bounds['start']->addHours(12);

    // Malicious customer name beginning with =
    $maliciousCustomer = Customer::create([
        'id' => (string) Str::uuid(),
        'business_id' => $this->business->id,
        'name' => '=SUM(A1:A10)',
        'phone' => '+2348039999999',
        'phone_display' => '0803 999 9999',
        'phone_normalized' => '+2348039999999',
    ]);

    $pkg = Package::create([
        'id' => (string) Str::uuid(),
        'business_id' => $this->business->id,
        'pickup_point_id' => $this->pickupPoint1->id,
        'customer_id' => $maliciousCustomer->id,
        'public_package_id' => 'PD-FORMULA',
        'pickup_code' => 'FORMULA',
        'amount_due_minor' => 250000,
        'status' => 'WAITING',
        'client_created_at' => $midday,
        'created_at' => $midday,
    ]);

    Payment::create([
        'id' => (string) Str::uuid(),
        'business_id' => $this->business->id,
        'package_id' => $pkg->id,
        'amount_minor' => 250000,
        'method' => 'CASH',
        'recorded_at' => $midday->addHour(),
        'status' => 'COMPLETED',
    ]);

    $response = $this->actingAs($this->owner)
        ->get("/api/v1/reports/daily-operations/export?date={$today}&scope=all");

    $response->assertStatus(200);
    $content = $response->streamedContent();

    // Verify CSV headers
    expect($content)->toContain('Date,"Time (WAT)",Event,"Package ID",Customer,"Pickup Point","Amount (NGN)","Payment Method",Staff,"Details / Reason"');

    // Verify sanitization of =SUM(A1:A10) to '=SUM(A1:A10)
    expect($content)->toContain("'=SUM(A1:A10)");

    // Verify exact decimal conversion 250000 kobo -> 2500.00
    expect($content)->toContain('2500.00');

    // Verify UTF-8 BOM
    expect(substr($content, 0, 3))->toBe("\xEF\xBB\xBF");
});
