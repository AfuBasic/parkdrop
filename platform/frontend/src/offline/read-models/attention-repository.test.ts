import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/offline/db/database';
import { AttentionRepository } from '@/offline/read-models/attention-repository';

describe('AttentionRepository', () => {
  const businessIdA = 101;
  const businessIdB = 202;

  beforeEach(async () => {
    await db.packageMedia.clear();
    await db.payments.clear();
    await db.conflicts.clear();
    await db.smsWallets.clear();
    await db.packages.clear();
    await db.customers.clear();
  });

  it('returns empty array when all domain operations are normal and successful', async () => {
    const items = await AttentionRepository.getAttentionItems({ businessId: businessIdA });
    expect(items).toEqual([]);

    const count = await AttentionRepository.getUnresolvedCount({ businessId: businessIdA });
    expect(count).toBe(0);
  });

  it('projects failed package media upload and excludes pending uploads', async () => {
    // 1. Pending media - must NOT appear in attention
    await db.packageMedia.add({
      id: 'media-pending-1',
      business_id: businessIdA,
      package_id: 'pkg-1',
      status: 'PENDING_UPLOAD',
      attempt_count: 0,
      created_at: new Date().toISOString(),
    });

    let items = await AttentionRepository.getAttentionItems({ businessId: businessIdA });
    expect(items.length).toBe(0);

    // 2. Failed media - MUST appear in attention
    await db.packages.add({
      id: 'pkg-1',
      business_id: businessIdA,
      pickup_point_id: 1,
      customer_id: 'cust-1',
      public_package_id: 'PD-8K42Q',
      pickup_code: '1234',
      amount_due_minor: 0,
      status: 'WAITING',
      client_created_at: new Date().toISOString(),
      server_received_at: null,
      version: 1,
      sync_status: 'SYNCED',
    });

    await db.customers.add({
      id: 'cust-1',
      business_id: businessIdA,
      name: 'Chinedu Okafor',
      phone_display: '08012345678',
      phone_normalized: '+2348012345678',
      version: 1,
      sync_status: 'SYNCED',
    });

    await db.packageMedia.add({
      id: 'media-failed-1',
      business_id: businessIdA,
      package_id: 'pkg-1',
      status: 'FAILED_RETRYABLE',
      attempt_count: 3,
      created_at: new Date().toISOString(),
      last_error_safe: 'Connection timed out during cloud upload',
    });

    items = await AttentionRepository.getAttentionItems({ businessId: businessIdA });
    expect(items.length).toBe(1);
    expect(items[0].id).toBe('photo-upload:media-failed-1');
    expect(items[0].type).toBe('PHOTO_UPLOAD_FAILED');
    expect(items[0].severity).toBe('ERROR');
    expect(items[0].action?.type).toBe('RETRY_PHOTO');
    expect(items[0].metadata?.publicPackageId).toBe('PD-8K42Q');
    expect(items[0].metadata?.customerName).toBe('Chinedu Okafor');

    // 3. Resolving media to SYNCED automatically removes it
    await db.packageMedia.update('media-failed-1', { status: 'SYNCED' });
    const resolvedItems = await AttentionRepository.getAttentionItems({ businessId: businessIdA });
    expect(resolvedItems.length).toBe(0);
  });

  it('projects rejected offline payment with safe message', async () => {
    await db.payments.add({
      id: 'pay-rejected-1',
      business_id: businessIdA,
      package_id: 'pkg-1',
      amount_minor: 150000,
      method: 'CASH',
      recorded_by_user_id: 1,
      recorded_at: new Date().toISOString(),
      client_recorded_at: new Date().toISOString(),
      status: 'COMPLETED',
      sync_status: 'NEEDS_ATTENTION',
      sync_error: 'Package is already fully paid.',
      version: 1,
    });

    const items = await AttentionRepository.getAttentionItems({ businessId: businessIdA });
    expect(items.length).toBe(1);
    expect(items[0].id).toBe('payment-rejected:pay-rejected-1');
    expect(items[0].type).toBe('PAYMENT_SYNC_REJECTED');
    expect(items[0].severity).toBe('ERROR');
    expect(items[0].action?.type).toBe('VIEW_PACKAGE');
  });

  it('projects sync conflicts with human readable summary', async () => {
    await db.conflicts.add({
      conflict_id: 'conflict-col-1',
      mutation_id: 'mut-1',
      business_id: businessIdA,
      entity_type: 'package',
      entity_id: 'pkg-1',
      type: 'PACKAGE_ALREADY_COLLECTED',
      local_summary: { action: 'COLLECT' },
      server_summary: { message: 'Another device collected this package first.' },
      created_at: new Date().toISOString(),
      resolved_at: null,
      status: 'UNRESOLVED',
    });

    const items = await AttentionRepository.getAttentionItems({ businessId: businessIdA });
    expect(items.length).toBe(1);
    expect(items[0].id).toBe('sync-conflict:conflict-col-1');
    expect(items[0].type).toBe('COLLECTION_SYNC_CONFLICT');
    expect(items[0].title).toBe('Package was already collected');
    expect(items[0].action?.type).toBe('VIEW_PACKAGE');

    // Resolving conflict status to RESOLVED removes it
    await db.conflicts.where('conflict_id').equals('conflict-col-1').modify({ status: 'RESOLVED' });
    const resolvedItems = await AttentionRepository.getAttentionItems({ businessId: businessIdA });
    expect(resolvedItems.length).toBe(0);
  });

  it('enforces exclusivity between ZERO_SMS_CREDITS and LOW_SMS_CREDITS', async () => {
    // 1. Balance = 0 -> only ZERO_SMS_CREDITS
    await db.smsWallets.add({
      id: 1,
      business_id: businessIdA,
      balance: 0,
      updated_at: new Date().toISOString(),
    });

    let items = await AttentionRepository.getAttentionItems({ businessId: businessIdA, userRole: 'owner' });
    expect(items.length).toBe(1);
    expect(items[0].type).toBe('ZERO_SMS_CREDITS');
    expect(items[0].severity).toBe('ERROR');
    expect(items[0].action?.type).toBe('BUY_SMS_CREDITS');

    // Attendant role gets VIEW_SMS_CREDITS instead of BUY_SMS_CREDITS
    const attendantItems = await AttentionRepository.getAttentionItems({ businessId: businessIdA, userRole: 'attendant' });
    expect(attendantItems[0].action?.type).toBe('VIEW_SMS_CREDITS');

    // 2. Balance = 3 -> only LOW_SMS_CREDITS
    await db.smsWallets.update(1, { balance: 3 });
    items = await AttentionRepository.getAttentionItems({ businessId: businessIdA, userRole: 'owner' });
    expect(items.length).toBe(1);
    expect(items[0].type).toBe('LOW_SMS_CREDITS');
    expect(items[0].severity).toBe('WARNING');

    // 3. Balance = 10 -> No attention items
    await db.smsWallets.update(1, { balance: 10 });
    items = await AttentionRepository.getAttentionItems({ businessId: businessIdA });
    expect(items.length).toBe(0);
  });

  it('handles active SMS credit purchase pending and failed states', async () => {
    // Pending purchase
    let items = await AttentionRepository.getAttentionItems({
      businessId: businessIdA,
      activePurchase: {
        id: 'purch-1',
        credits: 100,
        amount_minor: 500000,
        status: 'PENDING',
        created_at: new Date().toISOString(),
      },
    });

    expect(items.length).toBe(1);
    expect(items[0].type).toBe('SMS_CREDIT_PURCHASE_PENDING');
    expect(items[0].severity).toBe('INFO');
    expect(items[0].action?.type).toBe('CHECK_PURCHASE');

    // Paid purchase -> resolves
    items = await AttentionRepository.getAttentionItems({
      businessId: businessIdA,
      activePurchase: {
        id: 'purch-1',
        credits: 100,
        amount_minor: 500000,
        status: 'PAID',
        created_at: new Date().toISOString(),
      },
    });
    expect(items.length).toBe(0);
  });

  it('strictly isolates attention items across different businesses (multi-tenant)', async () => {
    // Add media failure for business A
    await db.packageMedia.add({
      id: 'media-A',
      business_id: businessIdA,
      package_id: 'pkg-A',
      status: 'FAILED_RETRYABLE',
      attempt_count: 2,
      created_at: new Date().toISOString(),
    });

    // Add media failure for business B
    await db.packageMedia.add({
      id: 'media-B',
      business_id: businessIdB,
      package_id: 'pkg-B',
      status: 'FAILED_RETRYABLE',
      attempt_count: 2,
      created_at: new Date().toISOString(),
    });

    const itemsA = await AttentionRepository.getAttentionItems({ businessId: businessIdA });
    expect(itemsA.length).toBe(1);
    expect(itemsA[0].id).toBe('photo-upload:media-A');

    const itemsB = await AttentionRepository.getAttentionItems({ businessId: businessIdB });
    expect(itemsB.length).toBe(1);
    expect(itemsB[0].id).toBe('photo-upload:media-B');
  });
});
