import * as React from 'react';
import {
  createRouter,
  createRootRoute,
  createRoute,
  Outlet,
  useParams,
  useSearch,
} from '@tanstack/react-router';
import { AppShell } from '@/design-system/shell/AppShell';
import { NavDirectionProvider } from '@/lib/nav-direction';
import { useAuth } from '@/features/auth/AuthContext';
import { useBackgroundSync } from '@/offline/sync/useBackgroundSync';
import { HomeScreen } from '@/features/home/HomeScreen';
import { PackagesScreen } from '@/features/packages/list/PackagesScreen';
import { AddPackageScreen } from '@/features/packages/add/AddPackageScreen';
import { PackageSearchScreen } from '@/features/packages/search/PackageSearchScreen';
import { PackageDetailScreen } from '@/features/packages/detail/PackageDetailScreen';
import { CustomersScreen } from '@/features/customers/list/CustomersScreen';
import { CustomerDetailScreen } from '@/features/customers/detail/CustomerDetailScreen';
import { MoreScreen } from '@/features/more/MoreScreen';
import { AttentionScreen } from '@/features/attention/AttentionScreen';
import { ReportsScreen } from '@/features/reports/ReportsScreen';
import { SmsCreditsScreen } from '@/features/sms-credits/screens/SmsCreditsScreen';
import { BuySmsCreditsScreen } from '@/features/sms-credits/purchase/screens/BuySmsCreditsScreen';
import { PurchaseReturnScreen } from '@/features/sms-credits/purchase/screens/PurchaseReturnScreen';
import { StaffScreen } from '@/features/business/staff/StaffScreen';
import { BusinessDetailsScreen } from '@/features/business/details/BusinessDetailsScreen';
import { AccountSecurityScreen } from '@/features/account/AccountSecurityScreen';
import { HelpScreen } from '@/features/help/HelpScreen';
import { AboutScreen } from '@/features/about/AboutScreen';
import { ThemeDemo } from '@/routes/theme-demo';

// Gated dev-only HomePreview route
const HomePreview = import.meta.env.DEV
  ? React.lazy(() => import('@/routes/home-preview'))
  : null;

/**
 * Keeps this device's local changes moving to the server for as long as
 * anyone is signed in, regardless of which screen they are looking at. See
 * useBackgroundSync for why this exists — without it, sync only happened as
 * a side effect of two unrelated screens.
 */
function BackgroundSync() {
  const { business } = useAuth();
  useBackgroundSync(business?.id);
  return null;
}

// 1. Root Layout Route
const rootRoute = createRootRoute({
  component: () => (
    <NavDirectionProvider>
      <BackgroundSync />
      <Outlet />
    </NavDirectionProvider>
  ),
});

// App Layout with standard AppShell (for bottom nav tabs)
const mainShellRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'main-shell',
  component: () => (
    <AppShell variant="default">
      <Outlet />
    </AppShell>
  ),
});

// Bleed App Layout (for Home screen)
const bleedShellRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'bleed-shell',
  component: () => (
    <AppShell variant="default" bleed>
      <Outlet />
    </AppShell>
  ),
});

// Task Layout using AppShell variant="default" so bottom nav is accessible on all screens
const taskShellRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'task-shell',
  component: () => (
    <AppShell variant="default">
      <Outlet />
    </AppShell>
  ),
});

// 2. Route Definitions
// Home
const indexRoute = createRoute({
  getParentRoute: () => bleedShellRoute,
  path: '/',
  component: HomeScreen,
});

// Packages List (supports ?status=WAITING&pay=unpaid&age=3d)
interface PackagesSearch {
  status?: 'WAITING' | 'COLLECTED' | 'OTHER';
  pay?: string;
  age?: string;
}

const packagesRoute = createRoute({
  getParentRoute: () => mainShellRoute,
  path: '/packages',
  validateSearch: (search: Record<string, unknown>): PackagesSearch => ({
    status: (search.status as PackagesSearch['status']) || undefined,
    pay: (search.pay as string) || undefined,
    age: (search.age as string) || undefined,
  }),
  component: () => {
    const search = useSearch({ from: packagesRoute.id });
    return (
      <PackagesScreen
        initialStatus={search.status}
        initialPayFilter={search.pay}
        initialAgeFilter={search.age}
      />
    );
  },
});

// Add Package (supports ?customerId=123&phone=...)
interface AddPackageSearch {
  customerId?: string;
  phone?: string;
}

const addPackageRoute = createRoute({
  getParentRoute: () => taskShellRoute,
  path: '/packages/new',
  validateSearch: (search: Record<string, unknown>): AddPackageSearch => ({
    customerId: (search.customerId as string) || undefined,
    phone: (search.phone as string) || undefined,
  }),
  component: () => {
    const search = useSearch({ from: addPackageRoute.id });
    return (
      <AddPackageScreen
        initialCustomerId={search.customerId}
        initialPhone={search.phone}
      />
    );
  },
});

// Package Search
const packageSearchRoute = createRoute({
  getParentRoute: () => taskShellRoute,
  path: '/packages/search',
  component: PackageSearchScreen,
});

// Package Detail
const packageDetailRoute = createRoute({
  getParentRoute: () => taskShellRoute,
  path: '/packages/$packageId',
  component: () => {
    const params = useParams({ from: packageDetailRoute.id });
    return <PackageDetailScreen packageId={params.packageId} />;
  },
});

// Customers List
const customersRoute = createRoute({
  getParentRoute: () => mainShellRoute,
  path: '/customers',
  component: CustomersScreen,
});

// Customer Detail
const customerDetailRoute = createRoute({
  getParentRoute: () => taskShellRoute,
  path: '/customers/$customerId',
  component: () => {
    const params = useParams({ from: customerDetailRoute.id });
    return <CustomerDetailScreen customerId={params.customerId} />;
  },
});

// More (Settings)
const moreRoute = createRoute({
  getParentRoute: () => mainShellRoute,
  path: '/more',
  component: MoreScreen,
});

// Attention
const attentionRoute = createRoute({
  getParentRoute: () => taskShellRoute,
  path: '/more/attention',
  component: AttentionScreen,
});

// Daily Operations Reports
const reportsRoute = createRoute({
  getParentRoute: () => taskShellRoute,
  path: '/more/reports',
  component: ReportsScreen,
});

// SMS Credits
const smsCreditsRoute = createRoute({
  getParentRoute: () => taskShellRoute,
  path: '/more/sms-credits',
  component: SmsCreditsScreen,
});

// Buy SMS Credits
const buySmsCreditsRoute = createRoute({
  getParentRoute: () => taskShellRoute,
  path: '/more/sms-credits/buy',
  component: BuySmsCreditsScreen,
});

// SMS Credit Purchase Return (Payment Gateway Callback)
const purchaseReturnRoute = createRoute({
  getParentRoute: () => taskShellRoute,
  path: '/sms-credits/purchase/return',
  component: PurchaseReturnScreen,
});

const morePurchaseReturnRoute = createRoute({
  getParentRoute: () => taskShellRoute,
  path: '/more/sms-credits/return',
  component: PurchaseReturnScreen,
});

// Staff
const staffRoute = createRoute({
  getParentRoute: () => taskShellRoute,
  path: '/more/staff',
  component: StaffScreen,
});

// Business Details
const businessDetailsRoute = createRoute({
  getParentRoute: () => taskShellRoute,
  path: '/more/business',
  component: BusinessDetailsScreen,
});

// Account & Security
const accountSecurityRoute = createRoute({
  getParentRoute: () => taskShellRoute,
  path: '/more/account',
  component: AccountSecurityScreen,
});

// Help & Support
const helpRoute = createRoute({
  getParentRoute: () => taskShellRoute,
  path: '/more/help',
  component: HelpScreen,
});

// About ParkDrop
const aboutRoute = createRoute({
  getParentRoute: () => taskShellRoute,
  path: '/more/about',
  component: AboutScreen,
});

// Dev Home Preview
const homePreviewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/home-preview',
  component: () =>
    HomePreview ? (
      <React.Suspense fallback={null}>
        <HomePreview />
      </React.Suspense>
    ) : null,
});

// Theme Demo
const themeDemoRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/theme',
  component: ThemeDemo,
});

// 3. Route Tree
const routeTree = rootRoute.addChildren([
  bleedShellRoute.addChildren([indexRoute]),
  mainShellRoute.addChildren([packagesRoute, customersRoute, moreRoute]),
  taskShellRoute.addChildren([
    addPackageRoute,
    packageSearchRoute,
    packageDetailRoute,
    customerDetailRoute,
    attentionRoute,
    reportsRoute,
    smsCreditsRoute,
    buySmsCreditsRoute,
    purchaseReturnRoute,
    morePurchaseReturnRoute,
    staffRoute,
    businessDetailsRoute,
    accountSecurityRoute,
    helpRoute,
    aboutRoute,
  ]),
  homePreviewRoute,
  themeDemoRoute,
]);

// 4. Create Router Instance with native View Transitions
export const router = createRouter({
  routeTree,
  defaultViewTransition: true,
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
