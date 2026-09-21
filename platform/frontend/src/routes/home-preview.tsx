import * as React from 'react';
import { RouterProvider } from '@tanstack/react-router';
import { router } from '@/router';
import { AppShell } from '@/design-system/shell/AppShell';
import { AuthContext, type AuthContextValue } from '@/features/auth/AuthContext';
import type { AuthBusiness } from '@/features/auth/types';
import { HomeScreen } from '@/features/home/HomeScreen';
import { seedHomeData, type HomeScenario } from '@/features/home/dev/seedHomeData';

/**
 * A development-only harness for looking at the Home screen.
 *
 * Storybook cannot currently render any screen in this project — its router
 * integration throws before the story mounts, for the sign-in screens as
 * well as this one — so this is how the redesign is checked against the real
 * component, inside the real app shell, with the real local database.
 *
 * It is reachable at /home-preview and only in a development build: App.tsx
 * gates it on import.meta.env.DEV, so the whole module is dropped from the
 * production bundle along with the seeder it imports.
 */

const SCENARIOS: Array<{ id: HomeScenario; label: string }> = [
  { id: 'empty', label: 'First day' },
  { id: 'one', label: '1 package' },
  { id: 'five', label: '5' },
  { id: 'twentyFive', label: '25' },
  { id: 'overdueMix', label: 'Overdue mix' },
  { id: 'longNames', label: 'Long names' },
];

type Naming = 'full' | 'noPark' | 'placeholder' | 'long';

const BUSINESSES: Record<Naming, AuthBusiness> = {
  full: {
    id: 1,
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
  },
  noPark: {
    id: 1,
    public_id: 'BUS-1',
    name: 'Chima Parcel Services',
    pickup_points: [
      {
        id: 1,
        public_id: 'PP-1',
        name: 'Chima Parcel Services',
        park_name: null,
        status: 'active',
      },
    ],
  },
  placeholder: {
    id: 1,
    public_id: 'BUS-1',
    name: "George's Business",
    pickup_points: [
      {
        id: 1,
        public_id: 'PP-1',
        name: "George's Business",
        park_name: 'Default Park',
        status: 'active',
      },
    ],
  },
  long: {
    id: 1,
    public_id: 'BUS-1',
    name: 'Chima Brothers Parcel & Courier Servic',
    pickup_points: [
      {
        id: 1,
        public_id: 'PP-1',
        name: 'Chima Brothers Parcel & Courier Servic',
        park_name: 'Ojota New Garage Motor Park',
        status: 'active',
      },
    ],
  },
};

function authValue(business: AuthBusiness): AuthContextValue {
  return {
    state: 'authenticated',
    user: { id: 1, email: 'george@example.com', first_name: 'George', status: 'ACTIVE' },
    business,
    role: 'owner',
    deviceMeta: null,
    rememberedIdentity: null,
    unlock: () => {},
    setAuthenticatedUser: async () => {},
    logout: async () => {},
    forgetRememberedIdentity: async () => {},
    refreshSession: async () => {},
  };
}

const CONTROL =
  'min-h-[36px] px-3 rounded-lg border border-slate-300 bg-white text-[13px] font-semibold text-slate-700';

export function HomePreview() {
  const params = new URLSearchParams(window.location.search);
  const initialScenario = (params.get('scenario') as HomeScenario) || 'five';
  const initialNaming = (params.get('naming') as Naming) || 'full';
  const chrome = params.get('chrome') !== 'off';

  const [scenario, setScenario] = React.useState<HomeScenario>(initialScenario);
  const [naming, setNaming] = React.useState<Naming>(initialNaming);
  const [seeded, setSeeded] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    setSeeded(false);
    seedHomeData(scenario).then(() => {
      if (!cancelled) setSeeded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [scenario]);

  return (
    <RouterProvider router={router}>
      <AuthContext.Provider value={authValue(BUSINESSES[naming])}>
        {chrome && (
          <div className="fixed top-0 left-0 right-0 z-[100] flex flex-wrap gap-1.5 bg-slate-900/90 p-2">
            <select
              aria-label="Scenario"
              className={CONTROL}
              value={scenario}
              onChange={(e) => setScenario(e.target.value as HomeScenario)}
            >
              {SCENARIOS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
            <select
              aria-label="Naming"
              className={CONTROL}
              value={naming}
              onChange={(e) => setNaming(e.target.value as Naming)}
            >
              <option value="full">Named</option>
              <option value="noPark">No park</option>
              <option value="placeholder">Placeholder</option>
              <option value="long">Long names</option>
            </select>
          </div>
        )}

        <div className={chrome ? 'pt-[52px]' : undefined}>
          <AppShell currentPath="/" bleed onNavigate={() => {}}>
            {seeded && (
              <HomeScreen
                key={`${scenario}-${naming}`}
                onNavigateToSearch={() => {}}
                onNavigateToAdd={() => {}}
                onNavigateToPackages={() => {}}
                onNavigateToSetup={() => {}}
                onNavigateToAttention={() => {}}
                onSelectPackage={() => {}}
              />
            )}
          </AppShell>
        </div>
      </AuthContext.Provider>
    </RouterProvider>
  );
}

export default HomePreview;
