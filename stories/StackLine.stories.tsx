import { type Meta, type StoryObj } from '@storybook/react-vite';

import StackLineChart from '../src/components/chart/StackLineChart';

const meta = {
  title: 'chart/StackLineChart',
  component: StackLineChart,
  tags: ['autodocs'],
} satisfies Meta<typeof StackLineChart>;

export default meta;

type Story = StoryObj<typeof StackLineChart>;

const data = [
  { x: 'A', y: 10, y2: 20 },
  { x: 'B', y: 20, y2: 30 },
  { x: 'C', y: 30, y2: 40 },
  { x: 'D', y: 40, y2: 50 },
  { x: 'E', y: 50, y2: 60 },
];

const renderTooltip = ({ tooltipData }: { tooltipData: { x: string; y: number } }) => (
  <div style={{ background: 'black', color: 'white', padding: '4px' }}>
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
