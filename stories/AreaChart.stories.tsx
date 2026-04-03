import { type Meta, type StoryObj } from '@storybook/react-vite';

import AreaChart from '../src/components/chart/AreaChart';

const meta = {
  title: 'chart/AreaChart',
  component: AreaChart,
  tags: ['autodocs'],
} satisfies Meta<typeof AreaChart>;

export default meta;

type Story = StoryObj<typeof AreaChart>;

const data = [
  { x: 'A', y: 10 },
  { x: 'B', y: 20 },
  { x: 'C', y: 30 },
  { x: 'D', y: 40 },
  { x: 'E', y: 50 },
];

const negativeData = [
  { x: 'A', y: -10 },
  { x: 'B', y: 12 },
  { x: 'C', y: -4 },
  { x: 'D', y: 16 },
  { x: 'E', y: 6 },
];

const renderTooltip = ({ tooltipData }: { tooltipData: { x: string; y: number } }) => (
  <div style={{ background: 'black', color: 'white', padding: '4px' }}>
    {tooltipData.x}: {tooltipData.y}
  </div>
);

export const 기본: Story = {
  args: {
    data,
    height: 400,
    tooltipPosition: 'point',
    children: renderTooltip,
  },
  argTypes: {
    color: {
      control: {
        type: 'color',
      },
    },
  },
};

export const 커서툴팁: Story = {
  args: {
    data,
    height: 400,
    tooltipPosition: 'cursor',
    children: renderTooltip,
  },
};

export const 음수값: Story = {
  args: {
    data: negativeData,
    height: 400,
    minY: -20,
    maxY: 20,
    tooltipPosition: 'point',
    children: renderTooltip,
  },
};

export const 액티브마커: Story = {
  args: {
    data,
    height: 400,
    tooltipPosition: 'point',
    showActiveMarker: true,
    children: renderTooltip,
  },
};

export const 크로스헤어: Story = {
  args: {
    data,
    height: 400,
    tooltipPosition: 'point',
    showActiveMarker: true,
    showCrosshair: true,
    children: renderTooltip,
  },
};
