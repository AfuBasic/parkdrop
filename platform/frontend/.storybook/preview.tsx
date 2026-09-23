import type { Preview } from '@storybook/tanstack-react'
import '../src/index.css'

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'light',
      values: [
        {
          name: 'light',
          value: '#F8FAFC',
        },
        {
          name: 'white',
          value: '#FFFFFF',
        },
      ],
    },
    a11y: {
      test: 'todo'
    }
  },
};

export default preview;