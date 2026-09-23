import type { Meta, StoryObj } from '@storybook/react';
import { HomeScreen } from './HomeScreen';
import { AuthContext, type AuthContextValue } from '@/features/auth/AuthContext';
import type { AuthBusiness } from '@/features/auth/types';
import { seedHomeData, type HomeScenario } from './dev/seedHomeData';

/**
 * Every state the Home screen has to survive.
 *
 * Each story seeds the local database and then renders the real screen —
 * the same hooks, the same queries — rather than a mocked-up copy, so a
 * story passing means the screen works.
 */

const FULL_POINT: AuthBusiness = {
  id: 1,
  public_id: 'BUS-1234',
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

/** A 40-character trading name, to prove the header truncates rather than wraps. */
const LONG_POINT: AuthBusiness = {
  id: 1,
  public_id: 'BUS-1234',
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
};

/** The state that used to render "George's Business" and "Default Park". */
const UNNAMED_POINT: AuthBusiness = {
  id: 1,
  public_id: 'BUS-1234',
  name: "George's Business",
  pickup_points: [
    { id: 1, public_id: 'PP-1', name: "George's Business", park_name: null, status: 'active' },
  ],
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

const meta = {
  title: 'Features/Home/HomeScreen',
  component: HomeScreen,
  parameters: {
    layout: 'fullscreen',
    viewport: { defaultViewport: 'mobile1' },
  },
} satisfies Meta<typeof HomeScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

function story(scenario: HomeScenario, business: AuthBusiness = FULL_POINT): Story {
  return {
    decorators: [
      (Story) => (
        <AuthContext.Provider value={authValue(business)}>
          <Story />
        </AuthContext.Provider>
      ),
    ],
    play: async () => {
      await seedHomeData(scenario);
    },
  };
}

/** Day one: no packages, no stat strip, the three steps instead. */
export const FirstDay: Story = story('empty');

export const OnePackage: Story = story('one');

export const FivePackages: Story = story('five');

/** More than Home shows, so "See all 25 packages" appears. */
export const TwentyFivePackages: Story = story('twentyFive');

/** Amber at three days, red at seven, and one abandoned for three weeks. */
export const OverdueMix: Story = story('overdueMix');

/** Long trading name, long park name, long customer names with accents. */
export const LongNames: Story = story('longNames', LONG_POINT);

/** Setup unfinished: no park name, so the header asks for the real one. */
export const SetupIncomplete: Story = story('five', UNNAMED_POINT);
