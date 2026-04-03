import { type Meta, type StoryObj } from '@storybook/react';

import StackLineChart from '../src/components/chart/StackLineChart';

const meta = {
  title: 'chart/StackLineChart',
  component: StackLineChart,
  tags: ['autodocs'],
} satisfies Meta<typeof StackLineChart>;

export default meta;

type Story = StoryObj<typeof StackLineChart>;

export const 스택라인차트: Story = {
  args: {
    data: [
      { x: 'A', y: 10, y2: 20 },
      { x: 'B', y: 20, y2: 30 },
      { x: 'C', y: 30, y2: 40 },
      { x: 'D', y: 40, y2: 50 },
      { x: 'E', y: 50, y2: 60 },
    ],
    height: 400,
    children: ({ tooltipData }) => (
      <div>
        {tooltipData.x}: {tooltipData.y}
      </div>
    ),
  },
};
