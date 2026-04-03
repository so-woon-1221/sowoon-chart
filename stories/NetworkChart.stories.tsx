import { type Meta, type StoryObj } from '@storybook/react';

import NetworkChart from '../src/components/chart/NetworkChart';

const meta = {
  title: 'chart/NetworkChart',
  component: NetworkChart,
  tags: ['autodocs'],
} satisfies Meta<typeof NetworkChart>;

export default meta;

type Story = StoryObj<typeof NetworkChart>;

export const 네트워크차트: Story = {
  args: {
    data: {
      links: [
        { source: 'A', target: 'B', value: 10 },
        { source: 'B', target: 'C', value: 20 },
        { source: 'C', target: 'D', value: 30 },
        { source: 'D', target: 'E', value: 40 },
        { source: 'E', target: 'A', value: 50 },
      ],
      nodes: [
        { group: '', id: 'A', value: 10 },
        { group: '', id: 'B', value: 20 },
        { group: '', id: 'C', value: 30 },
        { group: '', id: 'D', value: 40 },
        { group: '', id: 'E', value: 50 },
      ],
    },
    height: 600,
  },
};
