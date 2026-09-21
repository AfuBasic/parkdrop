export interface StorageEstimateInfo {
  usageMb: number;
  quotaMb: number;
  percentUsed: number;
  isNearQuota: boolean;
}

export class StorageGuard {
  /**
   * Estimates current browser storage usage and quota.
   */
  static async getStorageEstimate(): Promise<StorageEstimateInfo | null> {
    if (typeof navigator === 'undefined' || !navigator.storage || !navigator.storage.estimate) {
      return null;
    }

    try {
      const estimate = await navigator.storage.estimate();
      const usageMb = estimate.usage ? Math.round(estimate.usage / (1024 * 1024)) : 0;
      const quotaMb = estimate.quota ? Math.round(estimate.quota / (1024 * 1024)) : 0;
      const percentUsed = quotaMb > 0 ? Math.round((usageMb / quotaMb) * 100) : 0;
      const isNearQuota = percentUsed >= 90;

      return {
        usageMb,
        quotaMb,
        percentUsed,
        isNearQuota,
      };
    } catch {
      return null;
    }
  }

  /**
   * Requests persistent storage if available to prevent browser eviction under disk pressure.
   */
  static async requestPersistentStorage(): Promise<boolean> {
    if (typeof navigator === 'undefined' || !navigator.storage || !navigator.storage.persist) {
      return false;
    }

    try {
      const isPersisted = await navigator.storage.persisted();
      if (isPersisted) return true;
      return await navigator.storage.persist();
    } catch {
      return false;
    }
  }

  /**
   * Determines whether an error is a QuotaExceededError.
   */
  static isQuotaError(error: any): boolean {
    if (!error) return false;
    const name = error.name || '';
    const message = error.message || '';
    return (
      name === 'QuotaExceededError' ||
      name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      message.toLowerCase().includes('quota') ||
      message.toLowerCase().includes('storage full')
    );
  }
}
