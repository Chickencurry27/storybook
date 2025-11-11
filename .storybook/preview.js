import './preview-styles.scss';

/** @type { import('storybook').Preview } */
const preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      options: {
        light: { name: 'light', value: '#ffffff' },
        dark: { name: 'dark', value: '#333333' },
        gray: { name: 'gray', value: '#f5f5f5' }
      }
    },
  },

  initialGlobals: {
    backgrounds: {
      value: 'light'
    }
  }
};

export default preview;
