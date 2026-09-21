import type { Meta, StoryObj } from '@storybook/react';
import { CodeScreen } from './CodeScreen';

/**
 * The code screen is where most sign-ups are lost, so each of the states it
 * can land in gets its own story — including the ones that only show up on a
 * bad connection, which are the hardest to reach by hand.
 */
const meta: Meta<typeof CodeScreen> = {
  title: 'Auth/CodeScreen',
  component: CodeScreen,
  parameters: {
    layout: 'fullscreen',
    viewport: { defaultViewport: 'mobile1' },
  },
  args: {
    identifier: 'chinedu@gmail.com',
    onVerify: () => {},
    onResend: () => {},
    onChangeIdentifier: () => {},
    onBack: () => {},
    onHelp: () => {},
  },
};

export default meta;

type Story = StoryObj<typeof CodeScreen>;

/** Fresh arrival: empty boxes, countdown running. */
export const Default: Story = {};

/** Waiting on the server after the sixth digit. */
export const Checking: Story = {
  args: { busy: true },
};

/** The server rejected the code. Boxes clear and turn red. */
export const WrongCode: Story = {
  args: { error: 'That code is not right. Check your email and try again.' },
};

/** Eight seconds in on a slow connection. */
export const SlowNetwork: Story = {
  args: { busy: true, slowNetwork: true },
};

/** Fifteen seconds in — we stop pretending and offer a retry. */
export const TimedOut: Story = {
  args: { timedOut: true },
};

/** Phone mode, where the copy talks about SMS rather than email. */
export const PhoneMode: Story = {
  args: { mode: 'phone', identifier: '+2348031234567' },
};
