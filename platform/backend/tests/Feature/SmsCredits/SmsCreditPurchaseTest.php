<?php

namespace Tests\Feature\SmsCredits;

use App\Contracts\Payments\PaymentGateway;
use App\Models\Business;
use App\Models\BusinessMembership;
use App\Models\SmsCreditPurchase;
use App\Models\SmsCreditTransaction;
use App\Models\SmsWallet;
use App\Models\User;
use App\Services\Payments\FakePaymentGateway;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Tests\TestCase;

class SmsCreditPurchaseTest extends TestCase
{
    use RefreshDatabase;

    protected FakePaymentGateway $fakeGateway;

    protected function setUp(): void
    {
        parent::setUp();
        $this->fakeGateway = new FakePaymentGateway;
        $this->app->instance(PaymentGateway::class, $this->fakeGateway);
    }

    protected function createBusinessAndUser(string $role = 'OWNER'): array
    {
        $user = User::create([
            'email' => 'user_'.Str::random(5).'@example.com',
            'phone' => '+23480'.rand(10000000, 99999999),
            'email_normalized' => 'user_'.Str::random(5).'@example.com',
        ]);

        $business = Business::create([
            'public_id' => (string) Str::uuid(),
            'name' => 'Test Business',
            'status' => 'active',
        ]);

        BusinessMembership::create([
            'business_id' => $business->id,
            'user_id' => $user->id,
            'role' => $role,
            'status' => 'active',
            'joined_at' => now(),
        ]);

        $wallet = SmsWallet::create([
            'business_id' => $business->id,
            'balance' => 10,
        ]);

        return [$business, $user, $wallet];
    }

    public function test_can_fetch_flat_pricing(): void
    {
        [$business, $user] = $this->createBusinessAndUser('OWNER');

        $response = $this->actingAs($user)
            ->withHeader('X-Business-Id', (string) $business->id)
            ->getJson('/api/v1/sms-credit-purchases/pricing');

        $response->assertStatus(200);
        $response->assertJsonPath('price_per_credit_minor', 700);
        $response->assertJsonPath('currency', 'NGN');
        $response->assertJsonPath('min_credits', 50);
        $response->assertJsonPath('max_credits', 5000);
    }

    public function test_authorized_owner_can_initialize_purchase(): void
    {
        [$business, $user] = $this->createBusinessAndUser('OWNER');

        $response = $this->actingAs($user)
            ->withHeader('X-Business-Id', (string) $business->id)
            ->postJson('/api/v1/sms-credit-purchases', [
                'credits' => 100,
            ]);

        $response->assertStatus(201);
        $response->assertJsonPath('purchase.credits', 100);
        $response->assertJsonPath('purchase.amount_minor', 70000); // 100 * ₦7.00
        $response->assertJsonPath('purchase.currency', 'NGN');
        $response->assertJsonPath('purchase.status', 'PENDING');
        $this->assertNotNull($response->json('purchase.checkout_url'));

        $this->assertDatabaseHas('sms_credit_purchases', [
            'business_id' => $business->id,
            'initiated_by_user_id' => $user->id,
            'credits' => 100,
            'amount_minor' => 70000,
            'status' => 'PENDING',
        ]);
    }

    public function test_attendant_role_is_forbidden_from_initializing_purchase(): void
    {
        [$business, $user] = $this->createBusinessAndUser('ATTENDANT');

        $response = $this->actingAs($user)
            ->withHeader('X-Business-Id', (string) $business->id)
            ->postJson('/api/v1/sms-credit-purchases', [
                'credits' => 100,
            ]);

        $response->assertStatus(403);
    }

    public function test_server_rejects_a_quantity_below_the_minimum(): void
    {
        [$business, $user] = $this->createBusinessAndUser('OWNER');

        $response = $this->actingAs($user)
            ->withHeader('X-Business-Id', (string) $business->id)
            ->postJson('/api/v1/sms-credit-purchases', [
                'credits' => 10,
            ]);

        $response->assertStatus(422);
    }

    public function test_server_rejects_a_quantity_above_the_maximum(): void
    {
        [$business, $user] = $this->createBusinessAndUser('OWNER');

        $response = $this->actingAs($user)
            ->withHeader('X-Business-Id', (string) $business->id)
            ->postJson('/api/v1/sms-credit-purchases', [
                'credits' => 10001,
            ]);

        $response->assertStatus(422);
    }

    public function test_a_paystack_purchase_is_grossed_up_to_cover_paystacks_fee(): void
    {
        [$business, $user] = $this->createBusinessAndUser('OWNER');

        Http::fake([
            'api.paystack.co/*' => Http::response([
                'status' => true,
                'data' => ['authorization_url' => 'https://checkout.paystack.com/xyz', 'reference' => 'PDR-X'],
            ]),
        ]);

        // 50 credits at ₦7 = ₦350 net (35000 kobo). Paystack: 1.5%, no fixed
        // fee since the gross stays under the ₦2,500 waiver threshold.
        $response = $this->actingAs($user)
            ->withHeader('X-Business-Id', (string) $business->id)
            ->postJson('/api/v1/sms-credit-purchases', [
                'credits' => 50,
                'provider' => 'paystack',
            ]);

        $response->assertStatus(201);
        $response->assertJsonPath('purchase.credits', 50);
        $amountMinor = $response->json('purchase.amount_minor');
        $feeMinor = $response->json('purchase.fee_minor');

        $this->assertGreaterThan(35000, $amountMinor, 'The customer should be charged more than the flat 50 * ₦7 to cover the fee.');
        $this->assertSame($amountMinor, 35000 + $feeMinor);
        // ParkDrop must never net less than intended after Paystack's cut.
        $this->assertGreaterThanOrEqual(35000, $amountMinor - (int) round($amountMinor * 0.015));
    }

    public function test_a_flutterwave_purchase_is_grossed_up_to_cover_flutterwaves_fee(): void
    {
        [$business, $user] = $this->createBusinessAndUser('OWNER');

        Http::fake([
            'api.flutterwave.com/*' => Http::response([
                'status' => 'success',
                'data' => ['link' => 'https://checkout.flutterwave.com/xyz'],
            ]),
        ]);

        $response = $this->actingAs($user)
            ->withHeader('X-Business-Id', (string) $business->id)
            ->postJson('/api/v1/sms-credit-purchases', [
                'credits' => 50,
                'provider' => 'flutterwave',
            ]);

        $response->assertStatus(201);
        $amountMinor = $response->json('purchase.amount_minor');
        $feeMinor = $response->json('purchase.fee_minor');

        $this->assertGreaterThan(35000, $amountMinor);
        $this->assertSame($amountMinor, 35000 + $feeMinor);
        $this->assertGreaterThanOrEqual(35000, $amountMinor - (int) round($amountMinor * 0.02));
    }

    public function test_the_client_cannot_influence_the_charged_amount(): void
    {
        [$business, $user] = $this->createBusinessAndUser('OWNER');

        // Only "credits" is an accepted field — any attempt to also send an
        // amount is silently ignored, since the server always derives
        // amount_minor itself from its own configured price.
        $response = $this->actingAs($user)
            ->withHeader('X-Business-Id', (string) $business->id)
            ->postJson('/api/v1/sms-credit-purchases', [
                'credits' => 100,
                'amount_minor' => 1,
            ]);

        $response->assertStatus(201);
        $response->assertJsonPath('purchase.amount_minor', 70000);
    }

    public function test_server_verification_marks_paid_credits_wallet_and_records_ledger(): void
    {
        [$business, $user, $wallet] = $this->createBusinessAndUser('OWNER');

        $purchase = SmsCreditPurchase::create([
            'business_id' => $business->id,
            'initiated_by_user_id' => $user->id,
            'bundle_key' => 'bundle_100',
            'credits' => 100,
            'amount_minor' => 280000,
            'currency' => 'NGN',
            'status' => 'PENDING',
            'reference' => 'PDR-TESTREF1',
            'provider' => 'fake',
        ]);

        $this->fakeGateway
            ->simulateStatus('PAID')
            ->simulateAmount(280000)
            ->simulateCurrency('NGN')
            ->simulateTxId('TX-VERIFY-100');

        $response = $this->actingAs($user)
            ->withHeader('X-Business-Id', (string) $business->id)
            ->postJson("/api/v1/sms-credit-purchases/{$purchase->id}/verify");

        $response->assertStatus(200);
        $response->assertJsonPath('purchase.status', 'PAID');
        $response->assertJsonPath('wallet_balance', 110);

        // Assert database updates
        $this->assertDatabaseHas('sms_credit_purchases', [
            'id' => $purchase->id,
            'status' => 'PAID',
            'provider_transaction_id' => 'TX-VERIFY-100',
        ]);

        $this->assertDatabaseHas('sms_wallets', [
            'id' => $wallet->id,
            'balance' => 110,
        ]);

        $this->assertDatabaseHas('sms_credit_transactions', [
            'sms_wallet_id' => $wallet->id,
            'amount' => 100,
            'type' => 'credit',
            'reference_type' => 'PURCHASE',
            'reference_id' => "purchase:{$purchase->id}",
        ]);

        $this->assertDatabaseHas('sync_changes', [
            'business_id' => $business->id,
            'entity_type' => 'sms_wallet',
            'operation' => 'UPDATED',
        ]);

        $this->assertDatabaseHas('sync_changes', [
            'business_id' => $business->id,
            'entity_type' => 'sms_credit_transaction',
            'operation' => 'CREATED',
        ]);

        $this->assertDatabaseHas('sync_changes', [
            'business_id' => $business->id,
            'entity_type' => 'sms_credit_purchase',
            'entity_id' => (string) $purchase->id,
        ]);
    }

    public function test_a_paid_purchase_reaches_the_device_via_pull_sync(): void
    {
        [$business, $user] = $this->createBusinessAndUser('OWNER');

        $purchase = SmsCreditPurchase::create([
            'business_id' => $business->id,
            'initiated_by_user_id' => $user->id,
            'bundle_key' => 'custom_100',
            'credits' => 100,
            'amount_minor' => 70000,
            'currency' => 'NGN',
            'status' => 'PENDING',
            'reference' => 'PDR-PULLTEST',
            'provider' => 'paystack',
        ]);

        $this->fakeGateway
            ->simulateStatus('PAID')
            ->simulateAmount(70000)
            ->simulateCurrency('NGN')
            ->simulateTxId('TX-PULLTEST');

        $this->actingAs($user)
            ->withHeader('X-Business-Id', (string) $business->id)
            ->postJson("/api/v1/sms-credit-purchases/{$purchase->id}/verify")
            ->assertStatus(200);

        $pullResponse = $this->actingAs($user)
            ->withHeader('X-Business-Id', (string) $business->id)
            ->getJson('/api/v1/sync/pull?cursor=0');

        $pullResponse->assertStatus(200);

        $purchaseChange = collect($pullResponse->json('changes'))
            ->first(fn ($change) => $change['entity_type'] === 'sms_credit_purchase');

        $this->assertNotNull($purchaseChange, 'Expected a sms_credit_purchase change in the pull response.');
        $this->assertSame($purchase->id, $purchaseChange['payload']['id']);
        $this->assertSame(100, $purchaseChange['payload']['credits']);
        $this->assertSame(70000, $purchaseChange['payload']['amount_minor']);
        $this->assertSame('paystack', $purchaseChange['payload']['provider']);
        $this->assertSame('PAID', $purchaseChange['payload']['status']);
        $this->assertNotNull($purchaseChange['payload']['paid_at']);
    }

    public function test_calling_verify_repeatedly_is_strictly_idempotent(): void
    {
        [$business, $user, $wallet] = $this->createBusinessAndUser('OWNER');

        $purchase = SmsCreditPurchase::create([
            'business_id' => $business->id,
            'initiated_by_user_id' => $user->id,
            'bundle_key' => 'bundle_50',
            'credits' => 50,
            'amount_minor' => 150000,
            'currency' => 'NGN',
            'status' => 'PENDING',
            'reference' => 'PDR-IDEMPOTENT',
            'provider' => 'fake',
        ]);

        $this->fakeGateway
            ->simulateStatus('PAID')
            ->simulateAmount(150000)
            ->simulateCurrency('NGN')
            ->simulateTxId('TX-IDEMPOTENT-50');

        // First verification
        $this->actingAs($user)
            ->withHeader('X-Business-Id', (string) $business->id)
            ->postJson("/api/v1/sms-credit-purchases/{$purchase->id}/verify")
            ->assertStatus(200);

        // Second verification
        $this->actingAs($user)
            ->withHeader('X-Business-Id', (string) $business->id)
            ->postJson("/api/v1/sms-credit-purchases/{$purchase->id}/verify")
            ->assertStatus(200);

        // Wallet balance must be exactly 10 + 50 = 60, not 110
        $this->assertEquals(60, $wallet->fresh()->balance);

        // Exactly one ledger transaction
        $txCount = SmsCreditTransaction::where('reference_id', "purchase:{$purchase->id}")->count();
        $this->assertEquals(1, $txCount);
    }

    public function test_amount_mismatch_prevents_crediting_and_leaves_purchase_pending(): void
    {
        [$business, $user, $wallet] = $this->createBusinessAndUser('OWNER');

        $purchase = SmsCreditPurchase::create([
            'business_id' => $business->id,
            'initiated_by_user_id' => $user->id,
            'bundle_key' => 'bundle_100',
            'credits' => 100,
            'amount_minor' => 280000,
            'currency' => 'NGN',
            'status' => 'PENDING',
            'reference' => 'PDR-AMOUNTMISMATCH',
            'provider' => 'fake',
        ]);

        // Attacker paid ₦150 instead of ₦2,800
        $this->fakeGateway
            ->simulateStatus('PAID')
            ->simulateAmount(15000)
            ->simulateCurrency('NGN');

        $response = $this->actingAs($user)
            ->withHeader('X-Business-Id', (string) $business->id)
            ->postJson("/api/v1/sms-credit-purchases/{$purchase->id}/verify");

        $response->assertStatus(422);

        // No credits issued
        $this->assertEquals(10, $wallet->fresh()->balance);
        $this->assertEquals('PENDING', $purchase->fresh()->status);
        $this->assertDatabaseMissing('sms_credit_transactions', [
            'reference_id' => "purchase:{$purchase->id}",
        ]);
    }

    public function test_currency_mismatch_prevents_crediting(): void
    {
        [$business, $user, $wallet] = $this->createBusinessAndUser('OWNER');

        $purchase = SmsCreditPurchase::create([
            'business_id' => $business->id,
            'initiated_by_user_id' => $user->id,
            'bundle_key' => 'bundle_50',
            'credits' => 50,
            'amount_minor' => 150000,
            'currency' => 'NGN',
            'status' => 'PENDING',
            'reference' => 'PDR-CURRENCYMISMATCH',
            'provider' => 'fake',
        ]);

        // Currency is USD instead of NGN
        $this->fakeGateway
            ->simulateStatus('PAID')
            ->simulateAmount(150000)
            ->simulateCurrency('USD');

        $response = $this->actingAs($user)
            ->withHeader('X-Business-Id', (string) $business->id)
            ->postJson("/api/v1/sms-credit-purchases/{$purchase->id}/verify");

        $response->assertStatus(422);
        $this->assertEquals(10, $wallet->fresh()->balance);
        $this->assertEquals('PENDING', $purchase->fresh()->status);
    }

    public function test_cross_tenant_access_is_blocked(): void
    {
        [$businessA, $userA] = $this->createBusinessAndUser('OWNER');
        [$businessB, $userB] = $this->createBusinessAndUser('OWNER');

        $purchaseB = SmsCreditPurchase::create([
            'business_id' => $businessB->id,
            'initiated_by_user_id' => $userB->id,
            'bundle_key' => 'bundle_50',
            'credits' => 50,
            'amount_minor' => 150000,
            'currency' => 'NGN',
            'status' => 'PENDING',
            'reference' => 'PDR-BUSINESSTWO',
            'provider' => 'fake',
        ]);

        // User A tries to view or verify Business B's purchase
        $this->actingAs($userA)
            ->withHeader('X-Business-Id', (string) $businessA->id)
            ->getJson("/api/v1/sms-credit-purchases/{$purchaseB->id}")
            ->assertStatus(403);

        $this->actingAs($userA)
            ->withHeader('X-Business-Id', (string) $businessA->id)
            ->postJson("/api/v1/sms-credit-purchases/{$purchaseB->id}/verify")
            ->assertStatus(403);
    }

    public function test_webhook_with_valid_signature_credits_wallet(): void
    {
        [$business, $user, $wallet] = $this->createBusinessAndUser('OWNER');

        $purchase = SmsCreditPurchase::create([
            'business_id' => $business->id,
            'initiated_by_user_id' => $user->id,
            'bundle_key' => 'bundle_50',
            'credits' => 50,
            'amount_minor' => 150000,
            'currency' => 'NGN',
            'status' => 'PENDING',
            'reference' => 'PDR-WEBHOOK1',
            'provider' => 'fake',
        ]);

        $webhookPayload = [
            'event' => 'charge.success',
            'data' => [
                'reference' => 'PDR-WEBHOOK1',
                'id' => 99912345,
                'amount' => 150000,
                'currency' => 'NGN',
                'status' => 'success',
            ],
        ];

        // Send with valid fake signature
        $response = $this->withHeader('x-paystack-signature', 'valid_fake_signature')
            ->postJson('/api/webhooks/payments/paystack', $webhookPayload);

        $response->assertStatus(200);

        // Wallet should be credited
        $this->assertEquals(60, $wallet->fresh()->balance);
        $this->assertEquals('PAID', $purchase->fresh()->status);
        $this->assertEquals('99912345', $purchase->fresh()->provider_transaction_id);
    }

    public function test_webhook_with_invalid_signature_is_rejected(): void
    {
        [$business, $user, $wallet] = $this->createBusinessAndUser('OWNER');

        $purchase = SmsCreditPurchase::create([
            'business_id' => $business->id,
            'initiated_by_user_id' => $user->id,
            'bundle_key' => 'bundle_50',
            'credits' => 50,
            'amount_minor' => 150000,
            'currency' => 'NGN',
            'status' => 'PENDING',
            'reference' => 'PDR-INVALIDHOOK',
            'provider' => 'fake',
        ]);

        $webhookPayload = [
            'event' => 'charge.success',
            'data' => [
                'reference' => 'PDR-INVALIDHOOK',
                'amount' => 150000,
                'currency' => 'NGN',
            ],
        ];

        $response = $this->withHeader('x-paystack-signature', 'forged_signature_xyz')
            ->postJson('/api/webhooks/payments/paystack', $webhookPayload);

        $response->assertStatus(400);
        $this->assertEquals(10, $wallet->fresh()->balance);
        $this->assertEquals('PENDING', $purchase->fresh()->status);
    }

    public function test_duplicate_webhook_does_not_double_credit(): void
    {
        [$business, $user, $wallet] = $this->createBusinessAndUser('OWNER');

        $purchase = SmsCreditPurchase::create([
            'business_id' => $business->id,
            'initiated_by_user_id' => $user->id,
            'bundle_key' => 'bundle_50',
            'credits' => 50,
            'amount_minor' => 150000,
            'currency' => 'NGN',
            'status' => 'PENDING',
            'reference' => 'PDR-DUPHOOK',
            'provider' => 'fake',
        ]);

        $webhookPayload = [
            'event' => 'charge.success',
            'data' => [
                'reference' => 'PDR-DUPHOOK',
                'id' => 888777,
                'amount' => 150000,
                'currency' => 'NGN',
            ],
        ];

        // Fire 3 times
        for ($i = 0; $i < 3; $i++) {
            $this->withHeader('x-paystack-signature', 'valid_fake_signature')
                ->postJson('/api/webhooks/payments/paystack', $webhookPayload)
                ->assertStatus(200);
        }

        $this->assertEquals(60, $wallet->fresh()->balance);
        $this->assertEquals(1, SmsCreditTransaction::where('reference_id', "purchase:{$purchase->id}")->count());
    }
}
