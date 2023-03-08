import React from 'react';
import { ComponentStory, Meta } from '@storybook/react';
import CanvasWordCloudChart from '../lib/chart/CanvasWordCloud';

export default {
  title: 'Canvas Word Cloud',
  component: CanvasWordCloudChart,
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

const Template: ComponentStory<typeof CanvasWordCloudChart> = args => (
  <CanvasWordCloudChart {...args} />
);

export const CanvasWordCloud = Template.bind({});
const data = Array.from({ length: 200 }, () => ({
  text: Math.random().toString(36).substring(2),
  value: Math.random() * 100,
}));
CanvasWordCloud.args = {
  data,
  id: 'word-cloud-chart',
  type: 'rectangular',
  height: 500,
  // spinner: '워드클라우드 로딩중',
};
