<?php

use App\Models\ActivityLog;
use App\Models\Business;
use App\Models\BusinessMembership;
use App\Models\Customer;
use App\Models\Package;
use App\Models\PackageLifecycleEvent;
use App\Models\Payment;
use App\Models\User;
use App\Services\Sync\Handlers\CancelPackageMutationHandler;
use App\Services\Sync\Handlers\ReturnPackageMutationHandler;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

beforeEach(function () {
    $this->user = User::factory()->create(['first_name' => 'Ada']);
    $this->business = Business::create([
        'name' => 'Lagos Central Hub',
        'slug' => 'lagos-hub-'.Str::random(5),
    ]);

    BusinessMembership::create([
        'business_id' => $this->business->id,
        'user_id' => $this->user->id,
        'role' => 'owner',
    ]);

    $this->customer = Customer::create([
        'id' => (string) Str::uuid(),
        'business_id' => $this->business->id,
        'name' => 'Chinedu Okafor',
        'phone' => '+2348031234567',
        'phone_display' => '0803 123 4567',
        'phone_normalized' => '+2348031234567',
    ]);

    $this->package = Package::create([
        'id' => (string) Str::uuid(),
        'business_id' => $this->business->id,
        'customer_id' => $this->customer->id,
        'public_package_id' => 'PD-8K42Q',
        'pickup_code' => '7K4P2MX',
        'amount_due_minor' => 350000,
        'status' => 'WAITING',
    ]);
});

test('it returns a waiting package authoritatively with reason and audit log', function () {
    $handler = app(ReturnPackageMutationHandler::class);
    $eventId = (string) Str::uuid();

    $result = $handler->handle([
        'event_id' => $eventId,
        'package_id' => $this->package->id,
        'reason' => 'CUSTOMER_DID_NOT_COLLECT',
        'reason_note' => null,
        'client_event_at' => now()->toISOString(),
    ], $this->business->id, $this->user->id, 'device-uuid-1', null);

    expect($result['status'])->toBe('APPLIED')
        ->and($result['metadata']['event_id'])->toBe($eventId)
        ->and($result['metadata']['type'])->toBe('RETURN')
        ->and($result['metadata']['reason'])->toBe('CUSTOMER_DID_NOT_COLLECT');

    $this->package->refresh();
    expect($this->package->status)->toBe('RETURNED')
        ->and($this->package->terminal_reason)->toBe('CUSTOMER_DID_NOT_COLLECT')
        ->and($this->package->returned_at)->not->toBeNull()
        ->and($this->package->terminal_actor_name)->toBe('Ada');

    $this->assertDatabaseHas('package_lifecycle_events', [
        'id' => $eventId,
        'package_id' => $this->package->id,
        'type' => 'RETURN',
        'reason' => 'CUSTOMER_DID_NOT_COLLECT',
    ]);

    $this->assertDatabaseHas('activity_logs', [
        'package_id' => $this->package->id,
        'type' => 'PACKAGE_RETURNED',
    ]);

    $this->assertDatabaseHas('sync_changes', [
        'entity_id' => $this->package->id,
        'entity_type' => 'package',
        'operation' => 'UPDATED',
    ]);
});

test('it cancels a waiting package authoritatively with reason and audit log', function () {
    $handler = app(CancelPackageMutationHandler::class);
    $eventId = (string) Str::uuid();

    $result = $handler->handle([
        'event_id' => $eventId,
        'package_id' => $this->package->id,
        'reason' => 'DUPLICATE_RECORD',
        'reason_note' => 'Accidentally recorded twice',
        'client_event_at' => now()->toISOString(),
    ], $this->business->id, $this->user->id, 'device-uuid-1', null);

    expect($result['status'])->toBe('APPLIED')
        ->and($result['metadata']['event_id'])->toBe($eventId)
        ->and($result['metadata']['type'])->toBe('CANCEL')
        ->and($result['metadata']['reason'])->toBe('DUPLICATE_RECORD');

    $this->package->refresh();
    expect($this->package->status)->toBe('CANCELLED')
        ->and($this->package->terminal_reason)->toBe('DUPLICATE_RECORD')
        ->and($this->package->terminal_reason_note)->toBe('Accidentally recorded twice')
        ->and($this->package->cancelled_at)->not->toBeNull()
        ->and($this->package->terminal_actor_name)->toBe('Ada');

    $this->assertDatabaseHas('package_lifecycle_events', [
        'id' => $eventId,
        'package_id' => $this->package->id,
        'type' => 'CANCEL',
        'reason' => 'DUPLICATE_RECORD',
    ]);

    $this->assertDatabaseHas('activity_logs', [
        'package_id' => $this->package->id,
        'type' => 'PACKAGE_CANCELLED',
    ]);
});

test('it requires reason note when reason is OTHER', function () {
    $handler = app(ReturnPackageMutationHandler::class);
    $eventId = (string) Str::uuid();

    $result = $handler->handle([
        'event_id' => $eventId,
        'package_id' => $this->package->id,
        'reason' => 'OTHER',
        'reason_note' => null, // empty note
    ], $this->business->id, $this->user->id, 'device-uuid-1', null);

    expect($result['status'])->toBe('REJECTED')
        ->and($result['metadata']['error'])->toBe('REASON_NOTE_REQUIRED_FOR_OTHER');
});

test('it handles duplicate mutation replay idempotently', function () {
    $handler = app(ReturnPackageMutationHandler::class);
    $eventId = (string) Str::uuid();

    $payload = [
        'event_id' => $eventId,
        'package_id' => $this->package->id,
        'reason' => 'RETURNED_TO_SENDER',
        'reason_note' => 'Sender requested recall',
    ];

    $res1 = $handler->handle($payload, $this->business->id, $this->user->id, 'device-uuid-1', null);
    expect($res1['status'])->toBe('APPLIED');

    // Replay 5 times
    for ($i = 0; $i < 5; $i++) {
        $resReplay = $handler->handle($payload, $this->business->id, $this->user->id, 'device-uuid-1', null);
        expect($resReplay['status'])->toBe('APPLIED');
    }

    expect(PackageLifecycleEvent::where('package_id', $this->package->id)->count())->toBe(1);
    expect(ActivityLog::where('package_id', $this->package->id)->where('type', 'PACKAGE_RETURNED')->count())->toBe(1);
});

test('it preserves payment history when package is returned or cancelled', function () {
    // Record payment first
    $payment = Payment::create([
        'id' => (string) Str::uuid(),
        'business_id' => $this->business->id,
        'package_id' => $this->package->id,
        'amount_minor' => 150000,
        'method' => 'CASH',
        'recorded_by_user_id' => $this->user->id,
        'recorded_at' => now(),
        'client_recorded_at' => now(),
        'status' => 'COMPLETED',
        'version' => 1,
    ]);

    $handler = app(ReturnPackageMutationHandler::class);
    $result = $handler->handle([
        'event_id' => (string) Str::uuid(),
        'package_id' => $this->package->id,
        'reason' => 'DAMAGED',
        'reason_note' => 'Water damage during transport',
    ], $this->business->id, $this->user->id, 'device-uuid-1', null);

    expect($result['status'])->toBe('APPLIED');

    // Payment still intact in database with COMPLETED status and exact amount
    $this->assertDatabaseHas('payments', [
        'id' => $payment->id,
        'package_id' => $this->package->id,
        'amount_minor' => 150000,
        'status' => 'COMPLETED',
    ]);
});

test('it isolates cross-tenant terminal actions', function () {
    $otherBusiness = Business::create([
        'name' => 'Foreign Hub',
        'slug' => 'foreign-hub-'.Str::random(5),
    ]);

    $handler = app(ReturnPackageMutationHandler::class);
    $result = $handler->handle([
        'event_id' => (string) Str::uuid(),
        'package_id' => $this->package->id,
        'reason' => 'WRONG_DESTINATION',
    ], $otherBusiness->id, $this->user->id, 'device-uuid-1', null);

    expect($result['status'])->toBe('REJECTED')
        ->and($result['metadata']['error'])->toBe('PACKAGE_NOT_FOUND');
});

test('it enforces terminal transition races where first terminal event wins', function () {
    $returnHandler = app(ReturnPackageMutationHandler::class);
    $cancelHandler = app(CancelPackageMutationHandler::class);

    // 1. First device returns package
    $res1 = $returnHandler->handle([
        'event_id' => (string) Str::uuid(),
        'package_id' => $this->package->id,
        'reason' => 'RETURNED_TO_SENDER',
    ], $this->business->id, $this->user->id, 'device-uuid-1', null);

    expect($res1['status'])->toBe('APPLIED');

    // 2. Second device attempts to cancel the same package
    $res2 = $cancelHandler->handle([
        'event_id' => (string) Str::uuid(),
        'package_id' => $this->package->id,
        'reason' => 'DUPLICATE_RECORD',
    ], $this->business->id, $this->user->id, 'device-uuid-2', null);

    expect($res2['status'])->toBe('CONFLICT')
        ->and($res2['metadata']['error'])->toBe('PACKAGE_ALREADY_RETURNED');

    // 3. Third device attempts a different return event
    $res3 = $returnHandler->handle([
        'event_id' => (string) Str::uuid(),
        'package_id' => $this->package->id,
        'reason' => 'CUSTOMER_DID_NOT_COLLECT',
    ], $this->business->id, $this->user->id, 'device-uuid-3', null);

    expect($res3['status'])->toBe('CONFLICT')
        ->and($res3['metadata']['error'])->toBe('PACKAGE_ALREADY_RETURNED');

    // Package status remains RETURNED
    $this->package->refresh();
    expect($this->package->status)->toBe('RETURNED');
});

test('it rejects return or cancel if package is COLLECTED', function () {
    $this->package->update(['status' => 'COLLECTED']);

    $returnHandler = app(ReturnPackageMutationHandler::class);
    $resReturn = $returnHandler->handle([
        'event_id' => (string) Str::uuid(),
        'package_id' => $this->package->id,
        'reason' => 'RETURNED_TO_SENDER',
    ], $this->business->id, $this->user->id, 'device-uuid-1', null);

    expect($resReturn['status'])->toBe('CONFLICT')
        ->and($resReturn['metadata']['error'])->toBe('PACKAGE_ALREADY_COLLECTED');

    $cancelHandler = app(CancelPackageMutationHandler::class);
    $resCancel = $cancelHandler->handle([
        'event_id' => (string) Str::uuid(),
        'package_id' => $this->package->id,
        'reason' => 'CREATED_BY_MISTAKE',
    ], $this->business->id, $this->user->id, 'device-uuid-1', null);

    expect($resCancel['status'])->toBe('CONFLICT')
        ->and($resCancel['metadata']['error'])->toBe('PACKAGE_ALREADY_COLLECTED');
});
