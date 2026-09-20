import type { Meta, StoryObj } from '@storybook/react';
import { AddPackageScreen } from './AddPackageScreen';
import { AuthContext } from '@/features/auth/AuthContext';
import { db } from '@/offline/db/database';
import { createMemoryHistory, createRootRoute, createRoute, createRouter, RouterProvider } from '@tanstack/react-router';

const rootRoute = createRootRoute();
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: AddPackageScreen,
});
const routeTree = rootRoute.addChildren([indexRoute]);

const router = createRouter({
  routeTree,
  history: createMemoryHistory({ initialEntries: ['/'] }),
});

const meta = {
  title: 'Features/Packages/AddPackageScreen',
  component: AddPackageScreen,
  parameters: {
    layout: 'fullscreen',
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  decorators: [
    () => {
      // Mock Auth Context
      return (
        <AuthContext.Provider value={{
          state: 'authenticated',
          user: { id: 1, email: 'ada@example.com', first_name: 'Ada', status: 'ACTIVE' },
          business: { id: 1, public_id: 'BUS-1234', name: 'Chima Parcel Services' },
          deviceMeta: null,
          rememberedIdentity: null,
          unlock: () => {},
          setAuthenticatedUser: async () => {},
          logout: async () => {},
          forgetRememberedIdentity: async () => {},
          refreshSession: async () => {}
        }}>
          <div className="bg-surface-page min-h-screen">
            <RouterProvider router={router} />
          </div>
        </AuthContext.Provider>
      );
    }
  ]
} satisfies Meta<typeof AddPackageScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

// Helper to clear DB
const clearDB = async () => {
  await db.packages.clear();
  await db.customers.clear();
};

export const Default: Story = {
  play: async () => {
    await clearDB();
    await db.customers.put({
      id: 'cust_mock_1',
      business_id: 1,
      name: 'Chinedu Okafor',
      phone_display: '0803 123 4567',
      phone_normalized: '+2348031234567',
      version: 1,
      sync_status: 'SYNCED'
    });
  }
};
