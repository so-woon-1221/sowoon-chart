import { type Meta, type StoryObj } from '@storybook/react-vite';

import GroupLineChart from '../src/components/chart/GroupLineChart';

const meta = {
  title: 'chart/GroupLineChart',
  component: GroupLineChart,
  tags: ['autodocs'],
} satisfies Meta<typeof GroupLineChart>;

export default meta;

type Story = StoryObj<typeof GroupLineChart>;

const data = [
  { x: 'A', y: 10, y2: 20, y3: 30 },
  { x: 'B', y: 20, y2: 30, y3: 40 },
  { x: 'C', y: 30, y2: 40, y3: 50 },
  { x: 'D', y: 40, y2: 50, y3: 60 },
  { x: 'E', y: 50, y2: 60, y3: 70 },
];

const renderTooltip = ({ tooltipData }: { tooltipData: { x: string; y: number; value: number } }) => (
  <div style={{ background: 'black', color: 'white', padding: '4px' }}>
    {tooltipData.x}: {tooltipData.y}
  </div>
);

export const 그룹라인차트: Story = {
  args: {
    data,
    height: 400,
    children: renderTooltip,
  },
};

export const 액티브마커: Story = {
  args: {
    data,
    height: 400,
    showActiveMarker: true,
    children: renderTooltip,
  },
};

export const 크로스헤어: Story = {
  args: {
    data,
    height: 400,
    showActiveMarker: true,
    showCrosshair: true,
    children: renderTooltip,
  },
};
