/** @type { import('storybook').StorybookConfig } */
const config = {
  stories: ['../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: ['@storybook/addon-a11y'],

  framework: {
    name: '@storybook/react-vite',
    options: {},
  }
};

export default config;
