export function getDeviceUuid(): string {
  let uuid = localStorage.getItem('pd_device_uuid');

  if (!uuid) {
    uuid = crypto.randomUUID();
    localStorage.setItem('pd_device_uuid', uuid);
  }

  return uuid;
}

export function removeDeviceUuid(): void {
  localStorage.removeItem('pd_device_uuid');
}

/**
 * Monotonic per-device mutation sequence, persisted independently of the
 * local mutation queue. The queue itself deletes rows once a mutation is
 * APPLIED (see MutationQueue.resolveResult), so deriving "next sequence" by
 * scanning it regresses to a lower number the moment the queue fully
 * drains — colliding with a sequence the server already has a receipt for
 * under this same device_uuid.
 */
export function getNextDeviceSequence(): number {
  const KEY = 'pd_device_sequence';
  const current = parseInt(localStorage.getItem(KEY) || '0', 10);
  const next = current + 1;
  localStorage.setItem(KEY, String(next));
  return next;
}

import { db } from '@/offline/db/database';
import type { LocalAuthorization } from '@/offline/db/schema';

export async function saveOfflineAuthorization(userId: number, businessId: number, businessName: string, pickupPointId: number | null): Promise<void> {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour lease

  const auth: LocalAuthorization = {
    id: 'current',
    user_id: userId,
    business_id: businessId,
    business_name: businessName,
    pickup_point_id: pickupPointId,
    authorized_at: new Date().toISOString(),
    expires_at: expiresAt.toISOString(),
  };

  await db.authorization.put(auth);
}

export async function getValidOfflineAuthorization(): Promise<LocalAuthorization | null> {
  const auth = await db.authorization.get('current');
  if (!auth) return null;

  if (new Date(auth.expires_at) < new Date()) {
    return null; // Expired
  }

  return auth;
}

export async function getLocalAuthorization(): Promise<LocalAuthorization | null> {
  const auth = await db.authorization.get('current');
  return auth || null;
}

export async function clearOfflineAuthorization(): Promise<void> {
  await db.authorization.delete('current');
}
