import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    '@storybook/addon-onboarding',
    '@storybook/addon-links',
    '@chromatic-com/storybook',
    '@storybook/addon-docs'
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  viteFinal: (config) => {
    const alias = config.resolve?.alias;

    return {
      ...config,
      resolve: {
        ...config.resolve,
        alias: Array.isArray(alias)
          ? [
              ...alias,
              {
                find: 'web-worker:./lib/wordcloud.worker.js',
                replacement: './lib/wordcloud.worker.js?worker',
              },
            ]
          : {
              ...(alias ?? {}),
              'web-worker:./lib/wordcloud.worker.js': './lib/wordcloud.worker.js?worker',
            },
      },
    };
  },
};
export default config;
