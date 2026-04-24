import type { Meta, StoryObj } from '@storybook/react-vite';

import StackBarChart from '../src/components/chart/StackBarChart';

const meta = {
  title: 'chart/StackBarChart',
  component: StackBarChart,
  tags: ['autodocs'],
} satisfies Meta<typeof StackBarChart>;

export default meta;

type Story = StoryObj<typeof StackBarChart>;

const data = [
  { x: 'A', y: 10, y2: 20 },
  { x: 'B', y: 20, y2: 30 },
  { x: 'C', y: 30, y2: 40 },
  { x: 'D', y: 40, y2: 50 },
  { x: 'E', y: 50, y2: 60 },
];

const negativeData = [
  { x: 'A', y: 12, y2: -8 },
  { x: 'B', y: -16, y2: 20 },
  { x: 'C', y: 24, y2: -12 },
];

const renderTooltip = ({ tooltipData }: { tooltipData: { x: string; y: number } }) => (
  <div>
    {tooltipData.x}: {tooltipData.y}
  </div>
);

export const 스택라인차트: Story = {
  args: {
    data,
    height: 400,
    children: renderTooltip,
  },
};

export const 음수값: Story = {
  args: {
    data: negativeData,
    height: 400,
    children: renderTooltip,
  },
};

export const 빈데이터: Story = {
  args: {
    data: [],
    height: 400,
    children: renderTooltip,
  },
};
