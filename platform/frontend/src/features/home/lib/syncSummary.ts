import type { SyncUIState } from '@/offline/hooks/useSyncState';
import { HomeStrings } from '../strings';

export type SyncTone = 'saved' | 'sending' | 'offline' | 'attention';

export interface SyncSummary {
  tone: SyncTone;
  label: string;
  /** How many packages are still on this phone only. */
  pending: number;
}

/**
 * Turn the raw sync state into the one thing the user wants to know: is my
 * work safe, is it going, or is it stuck.
 *
 * Order matters. Something that needs a decision beats a connection problem,
 * and a connection problem beats "still sending" — because when the phone is
 * offline, "Sending…" would be a lie.
 */
export function summariseSync(state: SyncUIState): SyncSummary {
  const pending = state.pendingCount;

  if (state.conflictCount > 0) {
    return { tone: 'attention', label: HomeStrings.syncAttention, pending };
  }
  if (state.connectivity === 'UNREACHABLE' || state.connectivity === 'DEGRADED') {
    return { tone: 'offline', label: HomeStrings.syncOffline, pending };
  }
  if (state.isSyncing || pending > 0) {
    return { tone: 'sending', label: HomeStrings.syncSending, pending };
  }
  return { tone: 'saved', label: HomeStrings.syncSaved, pending };
}
