import { describe, it, expect } from 'vitest';
import { calculateScore, compareSearchResults } from './package-search-ranking';
import type { PackageSearchResult } from './package-search-types';

describe('package-search-ranking', () => {
  it('prioritizes exact pickup code over public ID, phone, and name', () => {
    const pickupScore = calculateScore('EXACT_PICKUP_CODE', 'WAITING', 1, 1);
    const publicIdScore = calculateScore('EXACT_PUBLIC_ID', 'WAITING', 1, 1);
    const phoneScore = calculateScore('EXACT_PHONE', 'WAITING', 1, 1);
    const nameScore = calculateScore('NAME_EXACT', 'WAITING', 1, 1);
    const tokenScore = calculateScore('NAME_TOKEN', 'WAITING', 1, 1);

    expect(pickupScore).toBeGreaterThan(publicIdScore);
    expect(publicIdScore).toBeGreaterThan(phoneScore);
    expect(phoneScore).toBeGreaterThan(nameScore);
    expect(nameScore).toBeGreaterThan(tokenScore);
  });

  it('ranks WAITING status higher than COLLECTED when match quality is identical', () => {
    const waitingScore = calculateScore('NAME_TOKEN', 'WAITING', 1, 1);
    const collectedScore = calculateScore('NAME_TOKEN', 'COLLECTED', 1, 1);
    const cancelledScore = calculateScore('NAME_TOKEN', 'CANCELLED', 1, 1);

    expect(waitingScore).toBeGreaterThan(collectedScore);
    expect(collectedScore).toBeGreaterThan(cancelledScore);
  });

  it('sorts higher score first in compareSearchResults', () => {
    const resA: PackageSearchResult = {
      packageId: 'pkg-1',
      publicPackageId: 'PD-8K42Q',
      pickupCode: '7K4P2MX',
      customerId: 'cust-1',
      customerName: 'Chinedu Okafor',
      phoneDisplay: '0803 123 4567',
      phoneNormalized: '+2348031234567',
      amountDueMinor: 350000,
      status: 'WAITING',
      clientCreatedAt: '2026-09-20T10:00:00Z',
      pickupPointId: 1,
      syncStatus: 'SYNCED',
      matchedBy: 'EXACT_PICKUP_CODE',
      score: 1050,
    };

    const resB: PackageSearchResult = {
      ...resA,
      packageId: 'pkg-2',
      matchedBy: 'NAME_TOKEN',
      score: 650,
    };

    const list = [resB, resA];
    list.sort(compareSearchResults);

    expect(list[0].packageId).toBe('pkg-1');
    expect(list[1].packageId).toBe('pkg-2');
  });

  it('sorts newer package before older package when scores and statuses are equal', () => {
    const older: PackageSearchResult = {
      packageId: 'pkg-older',
      publicPackageId: 'PD-11111',
      pickupCode: '2222222',
      customerId: 'cust-1',
      customerName: 'Chinedu Okafor',
      phoneDisplay: '0803 123 4567',
      phoneNormalized: '+2348031234567',
      amountDueMinor: 350000,
      status: 'WAITING',
      clientCreatedAt: '2026-09-19T10:00:00Z',
      pickupPointId: 1,
      syncStatus: 'SYNCED',
      matchedBy: 'EXACT_PHONE',
      score: 950,
    };

    const newer: PackageSearchResult = {
      ...older,
      packageId: 'pkg-newer',
      publicPackageId: 'PD-22222',
      clientCreatedAt: '2026-09-20T10:00:00Z',
    };

    const list = [older, newer];
    list.sort(compareSearchResults);

    expect(list[0].packageId).toBe('pkg-newer');
    expect(list[1].packageId).toBe('pkg-older');
  });
});
