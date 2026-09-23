import type { Meta, StoryObj } from '@storybook/react';
import { SmsCreditBundleOption } from './SmsCreditBundleOption';

const meta: Meta<typeof SmsCreditBundleOption> = {
  title: 'Features/SMS Credits/Bundle Option',
  component: SmsCreditBundleOption,
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof SmsCreditBundleOption>;

export const Default: Story = {
  args: {
    bundle: {
      key: 'bundle_100',
      credits: 100,
      amount_minor: 280000,
      currency: 'NGN',
      label: '100 SMS credits',
      description: 'Popular for active pickup points',
    },
    selected: false,
    disabled: false,
    onSelect: () => {},
    enoughForLabel: 'Enough for about 100 packages',
  },
};

export const Selected: Story = {
  args: {
    bundle: {
      key: 'bundle_100',
      credits: 100,
      amount_minor: 280000,
      currency: 'NGN',
      label: '100 SMS credits',
      description: 'Popular for active pickup points',
    },
    selected: true,
    disabled: false,
    onSelect: () => {},
    enoughForLabel: 'Enough for about 100 packages',
  },
};

export const Disabled: Story = {
  args: {
    bundle: {
      key: 'bundle_250',
      credits: 250,
      amount_minor: 650000,
      currency: 'NGN',
      label: '250 SMS credits',
      description: 'Best value for high-volume hubs',
    },
    selected: false,
    disabled: true,
    onSelect: () => {},
    enoughForLabel: 'Enough for about 250 packages',
  },
};
