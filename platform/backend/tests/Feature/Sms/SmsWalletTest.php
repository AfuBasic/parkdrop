<?php

namespace Tests\Feature\Sms;

use App\Actions\Sms\ChargeForSmsAction;
use App\Actions\Sms\RefundSmsAction;
use App\Models\Business;
use App\Models\SmsCreditTransaction;
use App\Models\SmsWallet;
use App\Models\SyncChange;
use Exception;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class SmsWalletTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_charge_sms_credits_and_record_sync_changes()
    {
        $business = Business::create([
            'public_id' => (string) Str::uuid(),
            'name' => 'Test Business',
            'status' => 'active',
        ]);

        $wallet = SmsWallet::create([
            'business_id' => $business->id,
            'balance' => 10,
        ]);

        $action = new ChargeForSmsAction();
        $result = $action->execute($business, 2, 'ARRIVAL_SMS', 'pkg-123');

        $this->assertEquals(8, $result['wallet']->balance);
        $this->assertEquals(2, $result['transaction']->amount);
        $this->assertEquals('DEBIT', $result['transaction']->type);

        $this->assertDatabaseHas('sms_wallets', [
            'id' => $wallet->id,
            'balance' => 8,
        ]);

        $this->assertDatabaseHas('sms_credit_transactions', [
            'sms_wallet_id' => $wallet->id,
            'amount' => 2,
            'type' => 'DEBIT',
            'reference_type' => 'ARRIVAL_SMS',
            'reference_id' => 'pkg-123',
        ]);

        $this->assertDatabaseHas('sync_changes', [
            'business_id' => $business->id,
            'entity_type' => 'sms_wallet',
            'entity_id' => (string) $wallet->id,
            'operation' => 'UPDATED',
        ]);

        $this->assertDatabaseHas('sync_changes', [
            'business_id' => $business->id,
            'entity_type' => 'sms_credit_transaction',
            'entity_id' => (string) $result['transaction']->id,
            'operation' => 'CREATED',
        ]);
    }

    public function test_cannot_charge_when_credits_are_insufficient()
    {
        $business = Business::create([
            'public_id' => (string) Str::uuid(),
            'name' => 'Test Business',
            'status' => 'active',
        ]);

        SmsWallet::create([
            'business_id' => $business->id,
            'balance' => 1,
        ]);

        $action = new ChargeForSmsAction();

        $this->expectException(Exception::class);
        $this->expectExceptionMessage('INSUFFICIENT_CREDITS');

        $action->execute($business, 5, 'ARRIVAL_SMS', 'pkg-456');
    }

    public function test_can_refund_sms_credits_and_record_sync_changes()
    {
        $business = Business::create([
            'public_id' => (string) Str::uuid(),
            'name' => 'Test Business',
            'status' => 'active',
        ]);

        $wallet = SmsWallet::create([
            'business_id' => $business->id,
            'balance' => 2,
        ]);

        $action = new RefundSmsAction();
        $result = $action->execute($business, 1, 'SMS_REFUND', 'pkg-failed');

        $this->assertEquals(3, $result['wallet']->balance);
        $this->assertEquals(1, $result['transaction']->amount);
        $this->assertEquals('CREDIT', $result['transaction']->type);

        $this->assertDatabaseHas('sms_wallets', [
            'id' => $wallet->id,
            'balance' => 3,
        ]);

        $this->assertDatabaseHas('sync_changes', [
            'business_id' => $business->id,
            'entity_type' => 'sms_wallet',
            'entity_id' => (string) $wallet->id,
            'operation' => 'UPDATED',
        ]);
    }
}
