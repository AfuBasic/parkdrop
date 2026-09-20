<?php

namespace Tests\Feature\Sync\Handlers;

use App\Models\Business;
use App\Models\Customer;
use App\Services\Sync\Handlers\CreateCustomerMutationHandler;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class CreateCustomerMutationHandlerTest extends TestCase
{
    use RefreshDatabase;

    protected CreateCustomerMutationHandler $handler;
    protected Business $business;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->handler = new CreateCustomerMutationHandler();
        
        // Since BusinessFactory doesn't exist, we'll manually create a Business.
        $this->business = Business::create([
            'name' => 'Test Business',
            'slug' => 'test-business-' . Str::random(6),
        ]);
    }

    public function test_it_creates_a_new_customer_and_sync_change(): void
    {
        $customerId = Str::uuid()->toString();
        
        $payload = [
            'customer_id' => $customerId,
            'name' => 'Chinedu Okafor',
            'phone_display' => '0803 123 4567',
        ];

        $result = $this->handler->handle($payload, $this->business->id, null, 'device-1', null);

        $this->assertEquals('APPLIED', $result['status']);
        $this->assertEquals($customerId, $result['metadata']['canonical_id']);
        $this->assertFalse($result['metadata']['reconciled']);

        $this->assertDatabaseHas('customers', [
            'id' => $customerId,
            'business_id' => $this->business->id,
            'name' => 'Chinedu Okafor',
            'phone_display' => '0803 123 4567',
            'phone_normalized' => '+2348031234567',
        ]);

        $this->assertDatabaseHas('sync_changes', [
            'business_id' => $this->business->id,
            'entity_type' => 'customer',
            'entity_id' => $customerId,
            'operation' => 'CREATED',
        ]);
    }

    public function test_it_reconciles_a_duplicate_customer_on_same_business(): void
    {
        $existingCustomerId = Str::uuid()->toString();
        Customer::create([
            'id' => $existingCustomerId,
            'business_id' => $this->business->id,
            'name' => 'Existing Name',
            'phone_display' => '08031234567',
            'phone_normalized' => '+2348031234567',
            'version' => 1,
        ]);

        $newCustomerId = Str::uuid()->toString();
        $payload = [
            'customer_id' => $newCustomerId,
            'name' => 'New Name attempt',
            'phone_display' => '08031234567',
        ];

        $result = $this->handler->handle($payload, $this->business->id, null, 'device-1', null);

        $this->assertEquals('APPLIED', $result['status']);
        $this->assertEquals($existingCustomerId, $result['metadata']['canonical_id']);
        $this->assertTrue($result['metadata']['reconciled']);

        $this->assertDatabaseMissing('customers', [
            'id' => $newCustomerId,
        ]);
    }

    public function test_it_allows_same_phone_on_different_business(): void
    {
        $businessB = Business::create([
            'name' => 'Test Business B',
            'slug' => 'test-business-b-' . Str::random(6),
        ]);

        $existingCustomerId = Str::uuid()->toString();
        Customer::create([
            'id' => $existingCustomerId,
            'business_id' => $this->business->id,
            'name' => 'Existing',
            'phone_display' => '08031234567',
            'phone_normalized' => '+2348031234567',
            'version' => 1,
        ]);

        $newCustomerId = Str::uuid()->toString();
        $payload = [
            'customer_id' => $newCustomerId,
            'name' => 'Customer on Business B',
            'phone_display' => '08031234567',
        ];

        $result = $this->handler->handle($payload, $businessB->id, null, 'device-1', null);

        $this->assertEquals('APPLIED', $result['status']);
        $this->assertEquals($newCustomerId, $result['metadata']['canonical_id']);
        $this->assertFalse($result['metadata']['reconciled']);

        $this->assertDatabaseHas('customers', [
            'id' => $newCustomerId,
            'business_id' => $businessB->id,
        ]);
    }

    public function test_it_rejects_invalid_payload(): void
    {
        $result = $this->handler->handle([], $this->business->id, null, 'device-1', null);
        
        $this->assertEquals('REJECTED', $result['status']);
        $this->assertArrayHasKey('customer_id', $result['metadata']['errors']);
        $this->assertArrayHasKey('name', $result['metadata']['errors']);
        $this->assertArrayHasKey('phone_display', $result['metadata']['errors']);
    }

    public function test_it_rejects_invalid_phone_number(): void
    {
        $payload = [
            'customer_id' => Str::uuid()->toString(),
            'name' => 'Chinedu',
            'phone_display' => '123',
        ];

        $result = $this->handler->handle($payload, $this->business->id, null, 'device-1', null);
        
        $this->assertEquals('REJECTED', $result['status']);
        $this->assertEquals('INVALID_PHONE', $result['metadata']['error']);
    }
}
