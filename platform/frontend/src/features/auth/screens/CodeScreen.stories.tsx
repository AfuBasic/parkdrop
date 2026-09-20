import type { Meta, StoryObj } from '@storybook/react';
import { CodeScreen } from './CodeScreen';

const meta = {
  title: 'Features/Auth/CodeScreen',
  component: CodeScreen,
  parameters: {
    layout: 'fullscreen',
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof CodeScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

const defaultArgs = {
  email: 'afutunde@gmail.com',
  onVerify: (code: string) => alert(`Verified with code: ${code}`),
  onResend: () => alert('Resend clicked'),
  onProblemLoggingIn: () => alert('Problem logging in clicked'),
  onChangeEmail: () => alert('Edit email clicked'),
};

export const Empty: Story = {
  args: {
    ...defaultArgs,
  },
};

export const Loading: Story = {
  args: {
    ...defaultArgs,
    isLoading: true,
  },
};

export const WrongCode: Story = {
  args: {
    ...defaultArgs,
    error: "The code you entered is incorrect or has expired.",
  },
};

export const ResendAvailable: Story = {
  args: {
    ...defaultArgs,
  },
  play: async () => {
    // We would need to manipulate state or pass a prop to force this in a real story
    // For now, this is just to document the state exists
  }
};
