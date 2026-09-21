import type { Meta, StoryObj } from '@storybook/react';
import { HelpScreen } from './HelpScreen';

const meta: Meta<typeof HelpScreen> = {
  title: 'Features/Help/HelpScreen',
  component: HelpScreen,
  parameters: {
    layout: 'fullscreen',
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

export default meta;
type Story = StoryObj<typeof HelpScreen>;

export const TopicList: Story = {
  args: {
    onBack: () => {},
  },
};

export const SingleArticleView: Story = {
  args: {
    onBack: () => {},
    initialTopicId: 'pickup-codes',
  },
};

export const OfflineArticleView: Story = {
  args: {
    onBack: () => {},
    initialTopicId: 'working-offline',
  },
};
