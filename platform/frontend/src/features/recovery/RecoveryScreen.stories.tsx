import type { Meta, StoryObj } from '@storybook/react';
import { RecoveryScreen } from './RecoveryScreen';

const meta: Meta<typeof RecoveryScreen> = {
  title: 'Features/Recovery/RecoveryScreen',
  component: RecoveryScreen,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof RecoveryScreen>;

export const NeedsRepair: Story = {
  args: {
    initialHealthState: 'RECOVERY_REQUIRED',
    businessId: 101,
  },
};

export const DegradedState: Story = {
  args: {
    initialHealthState: 'DEGRADED',
    businessId: 101,
  },
};

export const BlockedState: Story = {
  args: {
    initialHealthState: 'BLOCKED',
    businessId: 101,
  },
};
