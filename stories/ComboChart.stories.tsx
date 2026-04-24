import { type Meta, type StoryObj } from '@storybook/react-vite';

import ComboChart, { type ComboChartTooltipDatum } from '../src/components/chart/ComboChart';

const meta = {
  title: 'chart/ComboChart',
  component: ComboChart,
  tags: ['autodocs'],
} satisfies Meta<typeof ComboChart>;

export default meta;

type Story = StoryObj<typeof ComboChart>;

const data = [
  { x: '1월', sales: 120, profit: 38, target: 110 },
  { x: '2월', sales: 160, profit: 52, target: 145 },
  { x: '3월', sales: 135, profit: 44, target: 150 },
  { x: '4월', sales: 180, profit: 63, target: 170 },
  { x: '5월', sales: 210, profit: 78, target: 190 },
];

const negativeData = [
  { x: '1월', sales: 120, profit: 32, target: 100 },
  { x: '2월', sales: -40, profit: -16, target: 80 },
  { x: '3월', sales: 150, profit: 44, target: 120 },
  { x: '4월', sales: -20, profit: 8, target: 110 },
];

const renderTooltip = ({ tooltipData }: { tooltipData: ComboChartTooltipDatum }) => (
  <div style={{ background: '#111827', color: 'white', padding: '6px 8px', borderRadius: 6 }}>
    {tooltipData.key} ({tooltipData.type}): {tooltipData.value}
  </div>
);

export const 기본: Story = {
  args: {
    data,
    barKeys: ['sales', 'profit'],
    lineKeys: ['target'],
    height: 400,
    showLegend: true,
    children: renderTooltip,
  },
};

export const 크로스헤어: Story = {
  args: {
    data,
    barKeys: ['sales', 'profit'],
    lineKeys: ['target'],
    height: 400,
    showLegend: true,
    showActiveMarker: true,
    showCrosshair: true,
    tooltipPosition: 'auto',
    children: renderTooltip,
  },
};

export const 값라벨과축옵션: Story = {
  args: {
    data,
    barKeys: ['sales'],
    lineKeys: ['target'],
    height: 400,
    showLegend: true,
    showValueLabels: true,
    yAxisLabel: 'amount',
    valueLabelFormatter: (value) => `${value}`,
    children: renderTooltip,
  },
};

export const 음수값: Story = {
  args: {
    data: negativeData,
    barKeys: ['sales', 'profit'],
    lineKeys: ['target'],
    height: 400,
    showLegend: true,
    showActiveMarker: true,
    children: renderTooltip,
  },
};

export const 빈데이터: Story = {
  args: {
    data: [],
    barKeys: ['sales'],
    lineKeys: ['target'],
    height: 400,
    showLegend: true,
    children: renderTooltip,
  },
};
