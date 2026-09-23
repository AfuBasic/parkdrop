import * as React from 'react';
import { RouterProvider } from '@tanstack/react-router';
import { router } from '@/router';
import { AuthContext, type AuthContextValue } from '@/features/auth/AuthContext';
import type { AuthBusiness } from '@/features/auth/types';
import { db } from '@/offline/db/database';
import { seedHomeData } from '@/features/home/dev/seedHomeData';

/**
 * A development-only harness for looking at any signed-in screen.
 *
 * `/home-preview` does this for Home alone, by rendering the component
 * outside the router with a fabricated AuthContext. That is not enough for
 * the settings-area screens, which call `useNavigate()` and would throw
 * without router context.
 *
 * So this harness mounts the **real** router inside a fabricated
 * authenticated AuthContext. Every real path therefore works and real
 * navigation between them works, without a server, a network or an account:
 *
 *     http://localhost:5174/more?preview=1
 *     http://localhost:5174/more/help?preview=1
 *
 * It is reachable only in a development build. `App.tsx` gates it on
 * `import.meta.env.DEV`, so this module and the seeder it imports are
 * dropped from the production bundle entirely.
 */

const BUSINESS_ID = 1;

/**
 * A real-looking business. Deliberately never "Default Park" or any other
 * placeholder the SMS setup screen would refuse — a preview that shows
 * placeholder business data teaches the wrong thing about the product.
 */
const PREVIEW_BUSINESS: AuthBusiness = {
  id: BUSINESS_ID,
  public_id: 'BUS-1',
  name: 'Chima Parcel Services',
  pickup_points: [
    {
      id: 1,
      public_id: 'PP-1',
      name: 'Chima Parcel Services',
      park_name: 'Peace Park',
      status: 'active',
    },
  ],
};

const PREVIEW_AUTH: AuthContextValue = {
  state: 'authenticated',
  user: { id: 1, email: 'george@example.com', first_name: 'George', status: 'ACTIVE' },
  business: PREVIEW_BUSINESS,
  role: 'owner',
  deviceMeta: null,
  rememberedIdentity: null,
  unlock: () => {},
  setAuthenticatedUser: async () => {},
  logout: async () => {},
  forgetRememberedIdentity: async () => {},
  refreshSession: async () => {},
};

function assertDevOnly(): void {
  if (import.meta.env.PROD) {
    throw new Error(
      'screen-preview is a development harness and must never run in a production build.'
    );
  }
}

/** Packages and customers, plus the SMS wallet the credits screens read. */
async function seedPreviewData(): Promise<void> {
  assertDevOnly();
  await seedHomeData('five');

  await db.transaction('rw', db.smsWallets, db.smsCreditTransactions, async () => {
    await db.smsWallets.clear();
    await db.smsCreditTransactions.clear();

    await db.smsWallets.put({
      id: 1,
      business_id: BUSINESS_ID,
      balance: 42,
      updated_at: new Date().toISOString(),
    });

    const hoursAgo = (h: number) =>
      new Date(Date.now() - h * 60 * 60 * 1000).toISOString();

    await db.smsCreditTransactions.bulkAdd([
      {
        id: 1,
        sms_wallet_id: 1,
        amount: 50,
        type: 'CREDIT',
        reference_type: 'welcome_grant',
        reference_id: null,
        created_at: hoursAgo(72),
      },
      {
        id: 2,
        sms_wallet_id: 1,
        amount: 1,
        type: 'DEBIT',
        reference_type: 'package_arrival',
        reference_id: null,
        created_at: hoursAgo(5),
      },
      {
        id: 3,
        sms_wallet_id: 1,
        amount: 1,
        type: 'DEBIT',
        reference_type: 'package_arrival',
        reference_id: null,
        created_at: hoursAgo(2),
      },
    ]);
  });
}

export function ScreenPreview() {
  const [seeded, setSeeded] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    seedPreviewData()
      .catch((err) => {
        console.error('[screen-preview] seeding failed', err);
      })
      .finally(() => {
        if (!cancelled) setSeeded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!seeded) return null;

  return (
    <AuthContext.Provider value={PREVIEW_AUTH}>
      <RouterProvider router={router} />
    </AuthContext.Provider>
  );
}

export default ScreenPreview;
