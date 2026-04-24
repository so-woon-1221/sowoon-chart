import { type Meta, type StoryObj } from '@storybook/react-vite';

import GroupBarChart from '../src/components/chart/GroupBarChart';

const meta = {
  title: 'chart/GroupBarChart',
  component: GroupBarChart,
  tags: ['autodocs'],
} satisfies Meta<typeof GroupBarChart>;

export default meta;

type Story = StoryObj<typeof GroupBarChart>;

const data = [
  { x: 'A', y: 10, y2: 20, y3: 30 },
  { x: 'B', y: 20, y2: 30, y3: 40 },
  { x: 'C', y: 30, y2: 40, y3: 50 },
  { x: 'D', y: 40, y2: 50, y3: 60 },
  { x: 'E', y: 50, y2: 60, y3: 70 },
];

const negativeData = [
  { x: 'A', y: 12, y2: -8, y3: 18 },
  { x: 'B', y: -16, y2: 20, y3: -10 },
  { x: 'C', y: 24, y2: -12, y3: 14 },
];

const renderTooltip = ({ tooltipData }: { tooltipData: { x: string; y: number } }) => (
  <div>
    {tooltipData.x}: {tooltipData.y}
  </div>
);

export const 그룹바차트: Story = {
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
