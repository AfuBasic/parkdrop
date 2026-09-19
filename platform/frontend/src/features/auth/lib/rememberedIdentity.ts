import { db, type RememberedIdentity } from '@/lib/db';

/**
 * Save or update a remembered identity after successful authentication.
 */
export async function saveRememberedIdentity(identity: {
  email: string;
  name?: string;
  business_name?: string;
}): Promise<void> {
  const normalizedEmail = identity.email.toLowerCase().trim();
  const existing = await db.rememberedIdentities.where('email').equals(normalizedEmail).first();

  if (existing && existing.id) {
    await db.rememberedIdentities.update(existing.id, {
      name: identity.name ?? existing.name,
      business_name: identity.business_name ?? existing.business_name,
      last_used_at: Date.now(),
    });
  } else {
    await db.rememberedIdentities.add({
      email: normalizedEmail,
      name: identity.name,
      business_name: identity.business_name,
      last_used_at: Date.now(),
    });
  }
}

/**
 * Retrieve the most recently used remembered identity, if any exists.
 */
export async function getMostRecentRememberedIdentity(): Promise<RememberedIdentity | null> {
  const list = await db.rememberedIdentities.orderBy('last_used_at').reverse().toArray();
  return list.length > 0 ? list[0] : null;
}

/**
 * Clear a specific remembered identity by email.
 */
export async function clearRememberedIdentity(email: string): Promise<void> {
  const normalizedEmail = email.toLowerCase().trim();
  await db.rememberedIdentities.where('email').equals(normalizedEmail).delete();
}

/**
 * Clear all remembered identities (e.g. factory reset or switch device).
 */
export async function clearAllRememberedIdentities(): Promise<void> {
  await db.rememberedIdentities.clear();
}
