import { db } from '@/offline/db/database';
import { classifyQuery } from '@/features/packages/search/package-search-classifier';
import { calculateScore, compareSearchResults } from '@/features/packages/search/package-search-ranking';
import type { PackageSearchOptions, PackageSearchResult, MatchQuality } from '@/features/packages/search/package-search-types';
import type { LocalPackage, LocalCustomer } from '@/offline/db/schema';

export class PackageSearchRepository {
  /**
   * Search packages within the active business tenant.
   * Leverages Dexie composite indexes for exact codes/IDs/phones,
   * joins customer details, ranks results deterministically, and limits output.
   */
  static async search(options: PackageSearchOptions): Promise<PackageSearchResult[]> {
    const { businessId, activePickupPointId = null, query, limit = 20 } = options;

    const classified = classifyQuery(query);
    if (classified.type === 'EMPTY') {
      return [];
    }

    const candidateMap = new Map<string, { pkg: LocalPackage; matchedBy: MatchQuality }>();

    switch (classified.type) {
      case 'PUBLIC_PACKAGE_ID': {
        const publicId = classified.normalized;
        // 1. Exact match via [business_id+public_package_id]
        const exact = await db.packages
          .where('[business_id+public_package_id]')
          .equals([businessId, publicId])
          .first();

        if (exact) {
          candidateMap.set(exact.id, { pkg: exact, matchedBy: 'EXACT_PUBLIC_ID' });
        } else {
          // Fallback: prefix match in case the user typed partial ID like "PD-8K"
          const prefixMatches = await db.packages
            .where('[business_id+public_package_id]')
            .between([businessId, publicId], [businessId, `${publicId}\uffff`], true, true)
            .limit(limit)
            .toArray();

          for (const pkg of prefixMatches) {
            candidateMap.set(pkg.id, { pkg, matchedBy: 'PARTIAL_IDENTIFIER' });
          }
        }
        break;
      }

      case 'PICKUP_CODE': {
        const pickupCode = classified.normalized;
        // Exact match via [business_id+pickup_code]
        const exact = await db.packages
          .where('[business_id+pickup_code]')
          .equals([businessId, pickupCode])
          .first();

        if (exact) {
          candidateMap.set(exact.id, { pkg: exact, matchedBy: 'EXACT_PICKUP_CODE' });
        } else {
          // Prefix/partial pickup code fallback if query is 6-7 characters
          const partialMatches = await db.packages
            .where('[business_id+pickup_code]')
            .between([businessId, pickupCode], [businessId, `${pickupCode}\uffff`], true, true)
            .limit(limit)
            .toArray();

          for (const pkg of partialMatches) {
            candidateMap.set(pkg.id, { pkg, matchedBy: 'PARTIAL_IDENTIFIER' });
          }
        }
        break;
      }

      case 'PHONE': {
        const phoneNorm = classified.phoneNormalized;
        if (phoneNorm) {
          // Find customers with exact normalized phone in this business
          const matchedCustomers = await db.customers
            .where('[business_id+phone_normalized]')
            .equals([businessId, phoneNorm])
            .toArray();

          for (const customer of matchedCustomers) {
            const customerPackages = await db.packages
              .where('customer_id')
              .equals(customer.id)
              .filter(p => p.business_id === businessId)
              .toArray();

            for (const pkg of customerPackages) {
              candidateMap.set(pkg.id, { pkg, matchedBy: 'EXACT_PHONE' });
            }
          }
        }
        break;
      }

      case 'NAME_OR_TEXT': {
        const searchTokens = classified.tokens;
        const normalizedQuery = classified.normalized;

        // Broad query guard: require at least 2 characters for name scanning
        if (normalizedQuery.length < 2) {
          return [];
        }

        // 1. Check if public_package_id or pickup_code contains or matches this string
        const upper = normalizedQuery.toUpperCase();
        const codeMatches = await db.packages
          .where('business_id')
          .equals(businessId)
          .filter(p => p.pickup_code.toUpperCase().includes(upper) || p.public_package_id.toUpperCase().includes(upper))
          .limit(limit)
          .toArray();

        for (const pkg of codeMatches) {
          candidateMap.set(pkg.id, { pkg, matchedBy: 'PARTIAL_IDENTIFIER' });
        }

        // 2. Customer name matching within this business
        const businessCustomers = await db.customers
          .where('business_id')
          .equals(businessId)
          .toArray();

        for (const cust of businessCustomers) {
          const custNameLower = cust.name.toLowerCase();
          let matchQuality: MatchQuality | null = null;

          if (custNameLower === normalizedQuery) {
            matchQuality = 'NAME_EXACT';
          } else if (custNameLower.startsWith(normalizedQuery)) {
            matchQuality = 'NAME_PREFIX';
          } else if (searchTokens.every(tok => custNameLower.includes(tok))) {
            // Check if any token starts with the query or matches words
            const nameWords = custNameLower.split(/\s+/);
            const isWordPrefix = nameWords.some(w => searchTokens.some(tok => w.startsWith(tok)));
            matchQuality = isWordPrefix ? 'NAME_TOKEN' : 'NAME_SUBSTRING';
          } else if (custNameLower.includes(normalizedQuery)) {
            matchQuality = 'NAME_SUBSTRING';
          }

          if (matchQuality) {
            const custPackages = await db.packages
              .where('customer_id')
              .equals(cust.id)
              .filter(p => p.business_id === businessId)
              .toArray();

            for (const pkg of custPackages) {
              const existing = candidateMap.get(pkg.id);
              if (!existing || existing.matchedBy === 'PARTIAL_IDENTIFIER') {
                candidateMap.set(pkg.id, { pkg, matchedBy: matchQuality });
              }
            }
          }
        }
        break;
      }
    }

    if (candidateMap.size === 0) {
      return [];
    }

    // Load customer data for all candidate packages
    const customerIds = Array.from(new Set(Array.from(candidateMap.values()).map(c => c.pkg.customer_id)));
    const customers = await db.customers.where('id').anyOf(customerIds).toArray();
    const customerLookup = new Map<string, LocalCustomer>(customers.map(c => [c.id, c]));

    const results: PackageSearchResult[] = [];

    for (const { pkg, matchedBy } of candidateMap.values()) {
      const customer = customerLookup.get(pkg.customer_id);
      const score = calculateScore(matchedBy, pkg.status, pkg.pickup_point_id, activePickupPointId);

      results.push({
        packageId: pkg.id,
        publicPackageId: pkg.public_package_id,
        pickupCode: pkg.pickup_code,
        customerId: pkg.customer_id,
        customerName: customer?.name || 'Unknown Customer',
        phoneDisplay: customer?.phone_display || 'Unknown Phone',
        phoneNormalized: customer?.phone_normalized || '',
        amountDueMinor: pkg.amount_due_minor,
        status: pkg.status,
        clientCreatedAt: pkg.client_created_at,
        pickupPointId: pkg.pickup_point_id,
        syncStatus: pkg.sync_status,
        matchedBy,
        score,
      });
    }

    // Sort deterministically and limit
    results.sort(compareSearchResults);

    return results.slice(0, limit);
  }
}
