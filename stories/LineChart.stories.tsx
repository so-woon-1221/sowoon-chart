import { type Meta, type StoryObj } from '@storybook/react-vite';

import LineChart from '../src/components/chart/LineChart';

const meta = {
  title: 'chart/LineChart',
  component: LineChart,
  tags: ['autodocs'],
} satisfies Meta<typeof LineChart>;

export default meta;

type Story = StoryObj<typeof LineChart>;

const data = [
  { x: 'A', y: 10 },
  { x: 'B', y: 20 },
  { x: 'C', y: 30 },
  { x: 'D', y: 40 },
  { x: 'E', y: 50 },
];

const singleDatumData = [{ x: 'A', y: 24 }];

const negativeData = [
  { x: 'A', y: -10 },
  { x: 'B', y: 5 },
  { x: 'C', y: -4 },
  { x: 'D', y: 14 },
  { x: 'E', y: 8 },
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
    tooltipPosition: 'cursor',
    children: renderTooltip,
  },
};

export const 포인트툴팁: Story = {
  args: {
    data,
    height: 400,
    tooltipPosition: 'point',
    children: renderTooltip,
  },
};

export const 축옵션과값라벨: Story = {
  args: {
    data,
    height: 400,
    margin: { top: 20, right: 24, bottom: 72, left: 64 },
    tooltipPosition: 'point',
    xTickAngle: -35,
    xAxisLabel: 'Category',
    yAxisLabel: 'Value',
    yTickCount: 5,
    yTickFormat: (value) => `${value}`,
    showValueLabels: true,
    valueLabelFormatter: (value) => `${value}건`,
    children: renderTooltip,
  },
};

export const 단일데이터: Story = {
  args: {
    data: singleDatumData,
    height: 400,
    tooltipPosition: 'point',
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
