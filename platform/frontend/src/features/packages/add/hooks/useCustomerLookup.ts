import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/offline/db/database';
import { normalizePhone } from '@/offline/helpers/phoneNormalizer';
import { toNationalDigits, toE164, isCompletePhone } from '@/features/auth/lib/phone';
import type { LocalCustomer } from '@/offline/db/schema';
import { MAX_PHONE_SUGGESTIONS } from '../config';

export interface CustomerSuggestion {
  customer: LocalCustomer;
  collectedCount: number;
  waitingCount: number;
}

export interface CustomerMatchState {
  suggestions: CustomerSuggestion[];
  exactMatch: CustomerSuggestion | null;
  waitingPackagesCount: number;
}

/**
 * Handles phone suggestions (< 11 digits) and exact matching (at 11 digits)
 * against local Dexie customers and packages.
 */
export function useCustomerLookup(
  businessId: number,
  rawPhone: string
): CustomerMatchState {
  const digits = toNationalDigits(rawPhone);
  const complete = isCompletePhone(rawPhone);

  const queryResult = useLiveQuery(async () => {
    if (!businessId || digits.length < 3) {
      return { suggestions: [], exactMatch: null, waitingPackagesCount: 0 };
    }

    const customers = await db.customers
      .where('business_id')
      .equals(businessId)
      .toArray();

    const packages = await db.packages
      .where('business_id')
      .equals(businessId)
      .toArray();

    // Exact Match check
    if (complete) {
      const e164 = toE164(rawPhone) || normalizePhone(rawPhone);
      const exact = customers.find(
        (c) => c.phone_normalized === e164 || toNationalDigits(c.phone_display) === digits
      );

      if (exact) {
        const custPackages = packages.filter((p) => p.customer_id === exact.id);
        const collected = custPackages.filter((p) => p.status === 'COLLECTED').length;
        const waiting = custPackages.filter((p) => p.status === 'WAITING').length;

        return {
          suggestions: [],
          exactMatch: {
            customer: exact,
            collectedCount: collected,
            waitingCount: waiting,
          },
          waitingPackagesCount: waiting,
        };
      }

      return { suggestions: [], exactMatch: null, waitingPackagesCount: 0 };
    }

    // Partial matching (suggestions) for 3 to 9 digits
    const matchingCustomers = customers.filter((c) => {
      const custDigits = toNationalDigits(c.phone_display);
      return custDigits.startsWith(digits);
    }).slice(0, MAX_PHONE_SUGGESTIONS);

    const suggestions: CustomerSuggestion[] = matchingCustomers.map((cust) => {
      const custPackages = packages.filter((p) => p.customer_id === cust.id);
      const collected = custPackages.filter((p) => p.status === 'COLLECTED').length;
      const waiting = custPackages.filter((p) => p.status === 'WAITING').length;
      return {
        customer: cust,
        collectedCount: collected,
        waitingCount: waiting,
      };
    });

    return {
      suggestions,
      exactMatch: null,
      waitingPackagesCount: 0,
    };
  }, [businessId, digits, complete, rawPhone]);

  return queryResult || { suggestions: [], exactMatch: null, waitingPackagesCount: 0 };
}
