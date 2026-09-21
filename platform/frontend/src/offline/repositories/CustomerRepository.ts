import { db } from '@/offline/db/database';
import type { LocalCustomer } from '@/offline/db/schema';
import { MutationQueue } from '@/offline/mutations/mutation-queue';
import { normalizePhone } from '@/offline/helpers/phoneNormalizer';

export class CustomerRepository {
  /**
   * Find a customer by normalized phone within a business.
   */
  static async findByNormalizedPhone(businessId: number, rawPhone: string): Promise<LocalCustomer | undefined> {
    const normalized = normalizePhone(rawPhone);
    if (!normalized) return undefined;

    return await db.customers
      .where('[business_id+phone_normalized]')
      .equals([businessId, normalized])
      .first();
  }

  /**
   * Create a customer locally and queue the mutation.
   */
  static async createLocal(
    businessId: number,
    name: string,
    phoneDisplay: string,
    pickupPointId: number | null
  ): Promise<LocalCustomer> {
    const normalizedPhone = normalizePhone(phoneDisplay);
    if (!normalizedPhone) {
      throw new Error('Invalid phone number format');
    }

    // Double-check existence inside transaction
    return await db.transaction('rw', db.customers, db.mutations, async () => {
      const existing = await db.customers
        .where('[business_id+phone_normalized]')
        .equals([businessId, normalizedPhone])
        .first();

      if (existing) {
        return existing;
      }

      const customerId = crypto.randomUUID();

      const localCustomer: LocalCustomer = {
        id: customerId,
        business_id: businessId,
        name,
        phone_display: phoneDisplay,
        phone_normalized: normalizedPhone,
        version: 1,
        sync_status: 'PENDING_CREATE',
      };

      await db.customers.add(localCustomer);

      await MutationQueue.enqueue(
        businessId,
        'CREATE_CUSTOMER',
        {
          customer_id: customerId,
          name,
          phone_display: phoneDisplay,
        },
        pickupPointId,
        customerId,
        null
      );

      return localCustomer;
    });
  }
}
