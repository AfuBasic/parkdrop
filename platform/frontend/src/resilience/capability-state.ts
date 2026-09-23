/**
 * Operational Capabilities Derivation
 *
 * Centralizes the logic for determining what ParkDrop can do right now,
 * given the current connectivity state, offline auth lease, and user role.
 *
 * Rules:
 * - canSavePackageLocally: only depends on Dexie being healthy and auth lease valid.
 *   This must NEVER be gated on connectivity — the entire value of offline mode.
 * - All other capabilities that require server contact require connectivity REACHABLE.
 * - Admin operations (manage staff) require REACHABLE + role authorization.
 * - Photo uploads and SMS require REACHABLE (they call external providers).
 * - Payment-related operations (buy credits) require REACHABLE + role.
 *
 * Usage:
 *   const caps = deriveCapabilities(connectivityState, authLease, userRole);
 *   if (!caps.canSync) { show offline badge }
 *   if (!caps.canBuySmsCredits) { disable buy button with explanation }
 */

import type { ConnectivityState } from '@/offline/sync/connectivity-manager';

export type UserRole = 'owner' | 'manager' | 'attendant' | null;

export interface OperationalCapabilities {
  /** True if packages can be saved to local Dexie store (offline-capable). */
  canSavePackageLocally: boolean;

  /** True if the sync engine can push/pull with the server. */
  canSync: boolean;

  /** True if photos can be uploaded to cloud storage. Requires connectivity. */
  canUploadPhoto: boolean;

  /**
   * True if the system can send arrival SMS to customers.
   * Requires connectivity (SMS is async via server, not fired from client directly).
   */
  canSendSms: boolean;

  /**
   * True if the user can initiate an SMS credit purchase.
   * Requires connectivity AND owner/manager role.
   */
  canBuySmsCredits: boolean;

  /**
   * True if staff can be managed (invites, role changes, removals).
   * Strict online-only admin operation. Requires REACHABLE + owner/manager.
   */
  canManageStaff: boolean;

  /**
   * True if server-side historical data (older reports, full package history)
   * can be loaded. Does not affect today's locally saved records.
   */
  canLoadServerHistory: boolean;

  /**
   * True if the offline auth lease is still valid.
   * When false and offline, user must reconnect to continue working.
   */
  hasValidOfflineLease: boolean;
}

/**
 * Derive current operational capabilities from system state.
 *
 * @param connectivity  - current ConnectivityState
 * @param leaseExpiresAt - ISO string of auth lease expiry, or null if none
 * @param userRole      - current user's role, or null if not authenticated
 */
export function deriveCapabilities(
  connectivity: ConnectivityState,
  leaseExpiresAt: string | null,
  userRole: UserRole
): OperationalCapabilities {
  const isReachable = connectivity === 'REACHABLE';
  const isDegraded = connectivity === 'DEGRADED';
  const canConnect = isReachable; // degraded is not good enough for provider-dependent operations

  const leaseValid = leaseIsValid(leaseExpiresAt);
  const isOwnerOrManager = userRole === 'owner' || userRole === 'manager';

  return {
    // Local save works offline if auth lease is valid — the most important capability
    canSavePackageLocally: leaseValid,

    canSync: isReachable,

    // Photos call cloud storage — requires reliable connectivity
    canUploadPhoto: canConnect,

    // SMS goes via server which calls Termii — requires reliable connectivity
    canSendSms: canConnect,

    // Buying credits requires payment provider + role — owner/manager only
    canBuySmsCredits: canConnect && isOwnerOrManager,

    // Staff management is strictly online-only admin
    canManageStaff: isReachable && isOwnerOrManager,

    // Historical data requires the server to query beyond local retention
    canLoadServerHistory: isReachable || isDegraded,

    hasValidOfflineLease: leaseValid,
  };
}

/**
 * Check if an offline auth lease ISO string is still valid at the current time.
 */
export function leaseIsValid(leaseExpiresAt: string | null): boolean {
  if (!leaseExpiresAt) return false;
  try {
    return new Date(leaseExpiresAt).getTime() > Date.now();
  } catch {
    return false;
  }
}
