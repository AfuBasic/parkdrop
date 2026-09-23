import { db } from '@/offline/db/database';
import type { LocalCustomer } from '@/offline/db/schema';
import { normalizePhone } from '@/offline/helpers/phoneNormalizer';
import type { CustomerDirectoryItem, CustomerDetailRecord, EnrichedCustomerPackage } from '../domain/customer-types';

export class CustomerDirectoryRepository {
  /**
   * Resolves a potentially local/aliased customer ID to its canonical customer ID.
   */
  static async resolveCanonicalCustomerId(idOrAlias: string): Promise<string> {
    const alias = await db.entityAliases.get(idOrAlias);
    if (alias && alias.canonical_id) {
      // Handle nested alias if any
      return alias.canonical_id;
    }
    return idOrAlias;
  }

  /**
   * Builds an in-memory map of all aliases for fast mapping of foreign keys.
   */
  static async getAliasMap(): Promise<Map<string, string>> {
    const aliases = await db.entityAliases.toArray();
    const map = new Map<string, string>();
    for (const a of aliases) {
      if (a.local_id && a.canonical_id) {
        map.set(a.local_id, a.canonical_id);
      }
    }
    return map;
  }

  /**
   * Retrieves the customer directory items for a business, with deterministic sorting and optional search query.
   *
   * Search matching:
   * - Phone search: Normalizes query if valid phone pattern or matches clean digits against phone_normalized.
   * - Name search: Case-insensitive partial, prefix, or token matching.
   *
   * Deterministic sort order:
   * 1. Customers with waiting packages first (waitingPackageCount > 0)
   * 2. Most recently active customer (newest package client_created_at)
   * 3. Customer name ascending
   * 4. Customer ID tie-breaker
   */
  static async getDirectoryItems(
    businessId: number,
    query = '',
    limit = 50,
    offset = 0
  ): Promise<{ items: CustomerDirectoryItem[]; totalCount: number }> {
    const [rawCustomers, rawPackages, aliasMap] = await Promise.all([
      db.customers.where('business_id').equals(businessId).toArray(),
      db.packages.where('business_id').equals(businessId).toArray(),
      this.getAliasMap(),
    ]);

    // 1. Group / deduplicate customers by canonical ID
    // In case both local record and canonical record co-exist temporarily before sync cleanup
    const customerMap = new Map<string, LocalCustomer>();
    for (const c of rawCustomers) {
      const canonicalId = aliasMap.get(c.id) || c.id;
      // If we haven't stored it yet, or if this one is SYNCED over PENDING, prefer it
      const existing = customerMap.get(canonicalId);
      if (!existing || (existing.sync_status === 'PENDING_CREATE' && c.sync_status === 'SYNCED')) {
        customerMap.set(canonicalId, { ...c, id: canonicalId });
      }
    }

    // 2. Aggregate packages per canonical customer ID
    const waitingCounts = new Map<string, number>();
    const totalCounts = new Map<string, number>();
    const mostRecentTimes = new Map<string, string>();

    for (const pkg of rawPackages) {
      const canonicalCustId = aliasMap.get(pkg.customer_id) || pkg.customer_id;
      
      // Total count
      totalCounts.set(canonicalCustId, (totalCounts.get(canonicalCustId) || 0) + 1);

      // Waiting count
      if (pkg.status === 'WAITING') {
        waitingCounts.set(canonicalCustId, (waitingCounts.get(canonicalCustId) || 0) + 1);
      }

      // Most recent package time
      const currentRecent = mostRecentTimes.get(canonicalCustId);
      if (!currentRecent || new Date(pkg.client_created_at).getTime() > new Date(currentRecent).getTime()) {
        mostRecentTimes.set(canonicalCustId, pkg.client_created_at);
      }
    }

    // 3. Build Directory Items
    const items: CustomerDirectoryItem[] = Array.from(customerMap.values()).map(c => ({
      id: c.id,
      businessId: c.business_id,
      name: c.name,
      phoneDisplay: c.phone_display,
      phoneNormalized: c.phone_normalized,
      waitingPackageCount: waitingCounts.get(c.id) || 0,
      totalPackageCount: totalCounts.get(c.id) || 0,
      mostRecentPackageAt: mostRecentTimes.get(c.id) || null,
      syncStatus: c.sync_status,
    }));

    // 4. Filter by search query if present
    const trimmed = query.trim();
    let filtered = items;

    if (trimmed.length > 0) {
      const normalizedQueryPhone = normalizePhone(trimmed);
      const digitsOnly = trimmed.replace(/[^\d+]/g, '');
      const lowerQuery = trimmed.toLowerCase();
      const queryTokens = lowerQuery.split(/\s+/).filter(t => t.length > 0);

      filtered = items.filter(item => {
        // Phone match: exact normalized phone or contains digits
        if (normalizedQueryPhone && item.phoneNormalized === normalizedQueryPhone) {
          return true;
        }
        if (digitsOnly.length >= 3 && item.phoneNormalized.includes(digitsOnly)) {
          return true;
        }
        if (item.phoneDisplay.replace(/[^\d]/g, '').includes(digitsOnly) && digitsOnly.length >= 3) {
          return true;
        }

        // Name match: case-insensitive
        const lowerName = item.name.toLowerCase();
        if (lowerName.includes(lowerQuery)) {
          return true;
        }
        if (queryTokens.length > 0 && queryTokens.every(tok => lowerName.includes(tok))) {
          return true;
        }

        return false;
      });
    }

    // 5. Deterministic sort
    filtered.sort((a, b) => {
      // Priority 1: Has waiting packages first
      const hasWaitingA = a.waitingPackageCount > 0 ? 1 : 0;
      const hasWaitingB = b.waitingPackageCount > 0 ? 1 : 0;
      if (hasWaitingA !== hasWaitingB) {
        return hasWaitingB - hasWaitingA;
      }

      // Priority 2: Most recent activity timestamp descending
      const timeA = a.mostRecentPackageAt ? new Date(a.mostRecentPackageAt).getTime() : 0;
      const timeB = b.mostRecentPackageAt ? new Date(b.mostRecentPackageAt).getTime() : 0;
      if (timeA !== timeB) {
        return timeB - timeA;
      }

      // Priority 3: Name ascending
      const nameCompare = a.name.localeCompare(b.name);
      if (nameCompare !== 0) {
        return nameCompare;
      }

      // Priority 4: ID tie-breaker
      return a.id.localeCompare(b.id);
    });

    const totalCount = filtered.length;
    const paged = filtered.slice(offset, offset + limit);

    return { items: paged, totalCount };
  }

  /**
   * Retrieves full details for a single customer, including waiting and historical packages.
   */
  static async getCustomerDetail(
    businessId: number,
    customerIdOrAlias: string
  ): Promise<CustomerDetailRecord | null> {
    const canonicalId = await this.resolveCanonicalCustomerId(customerIdOrAlias);

    // Fetch customer in this business
    let customer = await db.customers.get(canonicalId);
    if (!customer || customer.business_id !== businessId) {
      // Check if original ID exists in case alias resolution isn't registered yet
      customer = await db.customers.get(customerIdOrAlias);
      if (!customer || customer.business_id !== businessId) {
        return null;
      }
    }

    const aliasMap = await this.getAliasMap();

    // Fetch all packages for this business
    const allBusinessPackages = await db.packages
      .where('business_id')
      .equals(businessId)
      .toArray();

    // Filter packages matching this customer (direct or via alias)
    const customerPackages = allBusinessPackages.filter(p => {
      const pCanonical = aliasMap.get(p.customer_id) || p.customer_id;
      return pCanonical === customer.id || p.customer_id === customer.id;
    });

    // Map to EnrichedCustomerPackage
    const enriched: EnrichedCustomerPackage[] = customerPackages.map(p => ({
      id: p.id,
      publicPackageId: p.public_package_id,
      pickupCode: p.pickup_code,
      amountDueMinor: p.amount_due_minor,
      status: p.status,
      clientCreatedAt: p.client_created_at,
      pickupPointName: p.pickup_point_name || null,
      pickupPointId: p.pickup_point_id,
      syncStatus: p.sync_status,
    }));

    // Partition into WAITING and RECENT
    const waitingPackages = enriched
      .filter(p => p.status === 'WAITING')
      .sort((a, b) => new Date(b.clientCreatedAt).getTime() - new Date(a.clientCreatedAt).getTime());

    const recentPackages = enriched
      .filter(p => p.status !== 'WAITING')
      .sort((a, b) => new Date(b.clientCreatedAt).getTime() - new Date(a.clientCreatedAt).getTime())
      .slice(0, 20);

    return {
      customer,
      canonicalId: customer.id,
      waitingPackages,
      recentPackages,
      waitingCount: waitingPackages.length,
      totalCount: enriched.length,
    };
  }
}
