import React from 'react';
import { ComponentStory, Meta } from '@storybook/react';
import WordCloudChart from '../lib/chart/WordCloud';

export default {
  title: 'WordCloud',
  component: WordCloudChart,
  argTypes: {
    data: {
      control: {
        type: 'object',
      },
    },
    type: {
      control: {
        type: 'select',
      },
      options: ['rectangular', 'archimedean'],
    },
  },
} as Meta;

const Template: ComponentStory<typeof WordCloudChart> = args => (
  <WordCloudChart {...args} />
);

export const WordCloud = Template.bind({});
const data = Array.from({ length: 100 }, () => ({
  text: Math.random().toString(36).substring(2),
  value: Math.random() * 100,
}));
WordCloud.args = {
  data,
  id: 'word-cloud-chart',
  type: 'rectangular',
  height: 500,
  // spinner: '워드클라우드',
};
