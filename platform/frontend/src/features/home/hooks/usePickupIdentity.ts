import { useAuth } from '@/features/auth/AuthContext';
import { realNameOrNull } from '../lib/placeholderNames';

export interface PickupIdentity {
  /** The trading name customers see. Null when nobody has chosen one. */
  pointName: string | null;
  /** The park it sits in. Null when nobody has chosen one. */
  parkName: string | null;
  /** True while either name is still missing, so the header can ask for it. */
  needsSetup: boolean;
  /** Which one to ask for first. */
  missing: 'point' | 'park' | null;
}

/**
 * The two names that appear in every customer SMS.
 *
 * Both come from the pickup point the user set up at first run. The business
 * name is a fallback for the trading name only — and only when a human
 * actually typed it, which the placeholder check decides. Nothing here ever
 * invents a stand-in: a missing name stays missing, and the header asks for
 * it, because a stand-in would be texted to a real customer.
 */
export function usePickupIdentity(): PickupIdentity {
  const { business } = useAuth();

  const point = business?.pickup_points?.find((p) => p.status === 'active')
    ?? business?.pickup_points?.[0];

  const pointName = realNameOrNull(point?.name) ?? realNameOrNull(business?.name);
  const parkName = realNameOrNull(point?.park_name);

  const missing: PickupIdentity['missing'] = !pointName
    ? 'point'
    : !parkName
      ? 'park'
      : null;

  return { pointName, parkName, needsSetup: missing !== null, missing };
}
