import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/offline/db/database';
import { MutationQueue } from './mutation-queue';

describe('MutationQueue device_sequence', () => {
  beforeEach(async () => {
    await db.mutations.clear();
    localStorage.removeItem('pd_device_sequence');
  });

  it('never reuses a device_sequence after the local queue fully drains', async () => {
    const first = await MutationQueue.enqueue(1, 'CREATE_CUSTOMER', { name: 'A' });
    const second = await MutationQueue.enqueue(1, 'CREATE_PACKAGE', { customer_id: 'a' });

    expect(second.device_sequence).toBe(first.device_sequence + 1);

    // Simulate both mutations being applied — resolveResult deletes APPLIED
    // rows, which previously caused the next enqueue's sequence lookup
    // (a scan of db.mutations) to regress and collide with an already-used
    // number on the server.
    await MutationQueue.resolveResult(first.mutation_id, 'APPLIED');
    await MutationQueue.resolveResult(second.mutation_id, 'APPLIED');

    expect(await db.mutations.count()).toBe(0);

    const third = await MutationQueue.enqueue(1, 'CREATE_PACKAGE', { customer_id: 'b' });

    expect(third.device_sequence).toBe(second.device_sequence + 1);
  });
});
