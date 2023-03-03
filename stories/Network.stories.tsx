import React from 'react';
import { ComponentStory, Meta } from '@storybook/react';
import NetworkChart from '../lib/chart/NetworkChart';

export default {
  title: 'Network',
  component: NetworkChart,
  argTypes: {
    data: {
      control: {
        type: 'object',
      },
    },
  },
} as Meta;

const Template: ComponentStory<typeof NetworkChart> = args => (
  <NetworkChart {...args} />
);

export const Network = Template.bind({});
Network.args = {
  data: {
    nodes: [
      { id: 'A', group: '1', value: 10 },
      { id: 'B', group: '1', value: 10 },
      { id: 'C', group: '1', value: 20 },
      { id: 'D', group: '1', value: 30 },
    ],
    links: [
      { source: 'A', target: 'B', value: 20 },
      { source: 'A', target: 'C', value: 30 },
      { source: 'A', target: 'D', value: 10 },
      { source: 'B', target: 'C', value: 14 },
      { source: 'B', target: 'D', value: 24 },
      { source: 'C', target: 'D', value: 18 },
    ],
  },
  id: 'network-chart',
  height: 500,
};
