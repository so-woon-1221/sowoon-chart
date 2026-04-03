import { type Meta, type StoryObj } from '@storybook/react-vite';

import BubbleChart from '../src/components/chart/BubbleChart';

const meta = {
  title: 'chart/BubbleChart',
  component: BubbleChart,
  tags: ['autodocs'],
} satisfies Meta<typeof BubbleChart>;

export default meta;

type Story = StoryObj<typeof BubbleChart>;

export const 버블차트: Story = {
  args: {
    data: [
      { x: 'A', y: 10 },
      { x: 'B', y: 20 },
      { x: 'C', y: 30 },
      { x: 'D', y: 40 },
      { x: 'E', y: 50 },
    ],
    height: 400,
  },
};
