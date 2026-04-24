import type { Meta, StoryObj } from '@storybook/react-vite';

import HeatmapChart from '../src/components/chart/HeatmapChart';

const meta = {
  title: 'chart/HeatmapChart',
  component: HeatmapChart,
  tags: ['autodocs'],
} satisfies Meta<typeof HeatmapChart>;

export default meta;

type Story = StoryObj<typeof HeatmapChart>;

const data = [
  { x: 'Mon', y: 'Backend', value: 12 },
  { x: 'Tue', y: 'Backend', value: 18 },
  { x: 'Wed', y: 'Backend', value: 7 },
  { x: 'Thu', y: 'Backend', value: 20 },
  { x: 'Fri', y: 'Backend', value: 15 },
  { x: 'Mon', y: 'Frontend', value: 9 },
  { x: 'Tue', y: 'Frontend', value: 14 },
  { x: 'Wed', y: 'Frontend', value: 19 },
  { x: 'Thu', y: 'Frontend', value: 11 },
  { x: 'Fri', y: 'Frontend', value: 17 },
  { x: 'Mon', y: 'Design', value: 4 },
  { x: 'Tue', y: 'Design', value: 8 },
  { x: 'Wed', y: 'Design', value: 13 },
  { x: 'Thu', y: 'Design', value: 6 },
  { x: 'Fri', y: 'Design', value: 10 },
  { x: 'Mon', y: 'QA', value: 16 },
  { x: 'Tue', y: 'QA', value: 5 },
  { x: 'Wed', y: 'QA', value: 9 },
  { x: 'Thu', y: 'QA', value: 14 },
  { x: 'Fri', y: 'QA', value: 21 },
];

const renderTooltip = ({
  tooltipData,
}: {
  tooltipData: { x: string; y: string; value: number };
}) => (
  <div>
    {tooltipData.y} / {tooltipData.x}: {tooltipData.value}
  </div>
);

export const 기본: Story = {
  args: {
    data,
    height: 400,
    tooltipPosition: 'point',
    children: renderTooltip,
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

export const 멀티컬러: Story = {
  args: {
    data,
    height: 400,
    colorList: ['#fef3c7', '#f97316', '#7c2d12'],
    tooltipPosition: 'point',
    children: renderTooltip,
  },
};

export const 축옵션과값라벨: Story = {
  args: {
    data,
    height: 400,
    margin: { top: 20, right: 20, bottom: 64, left: 72 },
    tooltipPosition: 'point',
    xAxisLabel: 'Day',
    yAxisLabel: 'Team',
    showValueLabels: true,
    valueLabelFormatter: (value) => `${value}`,
    children: renderTooltip,
  },
};
